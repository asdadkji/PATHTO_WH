<script setup lang="ts">
// 购物车：列表 + 改数量(update) + 移除(remove) + 合计积分 + 空态/加载/容错
// 容错：getCart 失败回退空数组；update/remove 失败由 http.ts 归一化后 ElMessage 降级提示，
// 失败时回滚本地数量，保证界面与服务端一致。当前积分取自 auth store 的 userInfo.totalPoints。
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Delete, Goods, Star } from '@element-plus/icons-vue'
import { getCart, removeCartItem, updateCartItem } from '@/apis'
import { useAuthStore } from '@/stores/auth'
import type { CartItem } from '@/types'

const auth = useAuthStore()
const router = useRouter()

/** 当前积分（来自 auth store） */
const totalPoints = computed(() => auth.userInfo?.totalPoints ?? 0)

const items = ref<CartItem[]>([])
const loading = ref(false)
const error = ref(false)
// 正在更新数量 / 正在移除的购物车项 id，用于按钮 loading 与禁用
const updatingId = ref<string>('')
const removingId = ref<string>('')

/** 从 http 拒绝对象中提取提示文案 */
function pickMsg(e: unknown, fallback = '操作失败，请稍后重试') {
  return (e as { message?: string } | null)?.message || fallback
}

/** 合计积分 = Σ price * quantity */
const totalCost = computed(() =>
  items.value.reduce((sum, it) => sum + it.price * it.quantity, 0),
)
/** 总件数 */
const totalCount = computed(() =>
  items.value.reduce((sum, it) => sum + it.quantity, 0),
)
/** 积分是否足够支付合计 */
const enoughPoints = computed(() => totalPoints.value >= totalCost.value)

/** 加载购物车：失败回退空数组 */
async function loadCart() {
  loading.value = true
  try {
    const data = await getCart()
    items.value = Array.isArray(data?.items) ? data.items : []
  } catch {
    items.value = []
    error.value = true
  } finally {
    loading.value = false
  }
}

/** 改数量：失败回滚到旧值；新值 <= 0 视为非法（移除请用删除按钮） */
async function handleQuantityChange(
  item: CartItem,
  cur: number | undefined,
  prev: number | undefined,
) {
  const oldVal = prev ?? 1
  const q = cur ?? 0
  if (q === oldVal) return
  if (q <= 0) {
    item.quantity = oldVal
    ElMessage.warning('数量需大于 0，如需移除请点删除按钮')
    return
  }
  updatingId.value = item.cartItemId
  try {
    await updateCartItem({ cartItemId: item.cartItemId, quantity: q })
    item.quantity = q
    ElMessage.success('数量已更新')
  } catch (e) {
    // 400 数量必须 > 0 → http.ts 归一化，回滚本地数量
    item.quantity = oldVal
    ElMessage.error(pickMsg(e, '更新失败，请稍后重试'))
  } finally {
    updatingId.value = ''
  }
}

/** 移除购物车项 */
async function handleRemove(item: CartItem) {
  removingId.value = item.cartItemId
  try {
    await removeCartItem(item.cartItemId)
    items.value = items.value.filter((it) => it.cartItemId !== item.cartItemId)
    ElMessage.success('已移除')
  } catch (e) {
    // 404 商品不在购物车中 → http.ts 归一化，本地一并移除避免残留
    const code = (e as { code?: number | string })?.code
    if (code === 404) {
      items.value = items.value.filter((it) => it.cartItemId !== item.cartItemId)
      ElMessage.info('该商品已不在购物车中')
    } else {
      ElMessage.error(pickMsg(e, '移除失败，请稍后重试'))
    }
  } finally {
    removingId.value = ''
  }
}

function goShop() {
  router.push('/shop')
}

onMounted(() => {
  loadCart()
})
</script>

<template>
  <div class="cart-page">
    <!-- 页头 -->
    <div class="page-head">
      <div class="head-text">
        <h2 class="page-title">我的购物车</h2>
        <p class="page-sub">挑好了吗？凑够积分就能兑换啦！</p>
      </div>
      <div class="points-pill">
        <el-icon><Star /></el-icon>
        <span class="pp-num">{{ totalPoints }}</span>
        <span class="pp-unit">积分</span>
      </div>
    </div>

    <el-alert
      v-if="error"
      class="load-tip"
      type="info"
      :closable="false"
      show-icon
      title="数据加载提示"
      description="购物车可能未能加载（后端尚未就绪），请稍后再试。"
    />

    <section v-loading="loading" class="card cart-card">
      <div class="card-head">购物车（{{ totalCount }} 件）</div>

      <!-- 空购物车 -->
      <el-empty
        v-if="!loading && !items.length"
        description="购物车空空的，去商城逛逛吧"
      >
        <el-button type="primary" :icon="Goods" round @click="goShop">去商城</el-button>
      </el-empty>

      <!-- 购物车列表 -->
      <div v-else class="cart-list">
        <div
          v-for="item in items"
          :key="item.cartItemId"
          class="cart-item"
        >
          <div class="ci-main">
            <div class="ci-name">{{ item.name }}</div>
            <div class="ci-meta">{{ item.price }} 积分 / 件</div>
          </div>

          <div class="ci-qty">
            <el-input-number
              v-model="item.quantity"
              :min="1"
              :max="99"
              size="small"
              :disabled="updatingId === item.cartItemId"
              @change="(cur: number | undefined, prev: number | undefined) => handleQuantityChange(item, cur, prev)"
            />
          </div>

          <div class="ci-sub">
            <span class="sub-num">{{ item.price * item.quantity }}</span>
            <span class="sub-unit">积分</span>
          </div>

          <div class="ci-actions">
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              circle
              :loading="removingId === item.cartItemId"
              @click="handleRemove(item)"
            />
          </div>
        </div>
      </div>

      <!-- 合计 -->
      <div v-if="items.length" class="cart-foot">
        <div class="foot-left">
          <span class="foot-label">合计</span>
          <span class="foot-num">{{ totalCost }}</span>
          <span class="foot-unit">积分</span>
        </div>
        <div class="foot-right">
          <span v-if="enoughPoints" class="foot-hint ok">积分充足，可以兑换</span>
          <span v-else class="foot-hint no">
            还差 {{ totalCost - totalPoints }} 积分，继续加油
          </span>
          <el-button type="primary" :icon="Goods" round @click="goShop">继续逛逛</el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.cart-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.page-head {
  @include flex-row-sb;
  gap: 12px;

  .head-text {
    flex: 1;
    min-width: 0;

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: $kid-text;
    }
    .page-sub {
      margin-top: 4px;
      font-size: 14px;
      color: $kid-text-light;
    }
  }
}
.points-pill {
  @include flex-center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, $kid-accent, #ffa000);
  color: #fff;
  flex-shrink: 0;

  .el-icon {
    font-size: 20px;
  }
  .pp-num {
    font-size: 22px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .pp-unit {
    font-size: 13px;
    opacity: 0.92;
  }
}
.load-tip {
  margin-bottom: 4px;
}
.card {
  background: $kid-card-bg;
  border-radius: $kid-radius;
  padding: 20px;
  box-shadow: $kid-shadow;

  .card-head {
    font-size: 16px;
    font-weight: 700;
    color: $kid-text;
    margin-bottom: 12px;
  }
}
.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cart-item {
  @include flex-row-sb;
  gap: 12px;
  padding: 14px 16px;
  border-radius: $kid-radius-sm;
  background: #fff8e1;
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: $kid-shadow-hover;
    transform: translateY(-2px);
  }

  .ci-main {
    flex: 1;
    min-width: 0;

    .ci-name {
      font-size: 16px;
      font-weight: 700;
      color: $kid-text;
      @include text-ellipsis;
    }
    .ci-meta {
      margin-top: 4px;
      font-size: 12px;
      color: $kid-text-light;
    }
  }
  .ci-qty {
    flex-shrink: 0;
  }
  .ci-sub {
    @include flex-center;
    gap: 2px;
    min-width: 72px;

    .sub-num {
      font-size: 20px;
      font-weight: 800;
      color: $kid-primary-dark;
      font-variant-numeric: tabular-nums;
    }
    .sub-unit {
      font-size: 12px;
      color: $kid-text-light;
    }
  }
  .ci-actions {
    display: flex;
    align-items: center;
  }
}
.cart-foot {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 2px dashed #ffccbc;
  @include flex-row-sb;
  gap: 12px;
  flex-wrap: wrap;

  .foot-left {
    @include flex-center;
    gap: 4px;

    .foot-label {
      font-size: 14px;
      color: $kid-text-light;
    }
    .foot-num {
      font-size: 28px;
      font-weight: 800;
      color: $kid-primary-dark;
      font-variant-numeric: tabular-nums;
    }
    .foot-unit {
      font-size: 14px;
      color: $kid-text-light;
    }
  }
  .foot-right {
    @include flex-center;
    gap: 12px;
    flex-wrap: wrap;

    .foot-hint {
      font-size: 13px;
      font-weight: 600;

      &.ok {
        color: $kid-success;
      }
      &.no {
        color: $kid-danger;
      }
    }
  }
}

@media (max-width: 768px) {
  .cart-item {
    flex-wrap: wrap;

    .ci-sub {
      order: 2;
    }
    .ci-actions {
      order: 3;
    }
  }
  .cart-foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
