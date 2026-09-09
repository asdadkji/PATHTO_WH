<script setup lang="ts">
// 积分商城：分类筛选 chip + 商品卡片网格 + 商品详情弹窗 + 加入购物车
// 容错：商品列表失败回退空数组；详情/加购失败由 http.ts 归一化后 ElMessage 降级提示。
// 当前积分取自 auth store 的 userInfo.totalPoints，页头展示。
import { computed, onMounted, ref } from 'vue'
import type { Component, CSSProperties } from 'vue'
import { ElDialog } from 'element-plus'
import {
  Bicycle,
  Burger,
  Coin,
  Collection,
  More,
  Present,
  Reading,
  ShoppingCart,
  Soccer,
} from '@element-plus/icons-vue'
import { addToCart, getProductById, getProducts } from '@/apis'
import { useAuthStore } from '@/stores/auth'
import type { Product, ProductCategory, ProductDetail } from '@/types'

const auth = useAuthStore()

/** 当前积分（来自 auth store） */
const totalPoints = computed(() => auth.userInfo?.totalPoints ?? 0)
const username = computed(() => auth.userInfo?.username ?? '小朋友')

/** 分类配置：标签 / 图标 / 配色，覆盖"全部"与 6 种分类 */
interface CategoryOption {
  category: ProductCategory | 'all'
  label: string
  icon: Component
  color: string
  bg: string
}

// 全部(橙) / 玩具(粉) / 游戏时间(橙) / 活动(绿) / 食物(黄) / 书籍(紫) / 其他(棕)
const CATEGORY_LIST: CategoryOption[] = [
  { category: 'all', label: '全部', icon: Collection, color: '#ff7043', bg: '#ffe0b2' },
  { category: 'toy', label: '玩具', icon: Present, color: '#ec407a', bg: '#f8bbd0' },
  { category: 'game_time', label: '游戏时间', icon: Soccer, color: '#ff7043', bg: '#ffccbc' },
  { category: 'activity', label: '活动', icon: Bicycle, color: '#66bb6a', bg: '#c8e6c9' },
  { category: 'food', label: '食物', icon: Burger, color: '#ffa000', bg: '#ffe0b2' },
  { category: 'book', label: '书籍', icon: Reading, color: '#ab47bc', bg: '#e1bee7' },
  { category: 'other', label: '其他', icon: More, color: '#8d6e63', bg: '#d7ccc8' },
]
const CATEGORY_MAP: Record<ProductCategory, CategoryOption> = CATEGORY_LIST.reduce(
  (acc, item) => {
    if (item.category !== 'all') acc[item.category as ProductCategory] = item
    return acc
  },
  {} as Record<ProductCategory, CategoryOption>,
)

/** 取分类配置；未知分类回退到"其他" */
function categoryOf(c: ProductCategory): CategoryOption {
  return CATEGORY_MAP[c] ?? CATEGORY_LIST[CATEGORY_LIST.length - 1]
}

/** chip / 标签内联样式：选中态用主色填充，未选用浅底色 */
function chipStyle(c: CategoryOption, active: boolean): CSSProperties {
  return active
    ? { background: c.color, color: '#ffffff', borderColor: c.color }
    : { background: c.bg, color: c.color, borderColor: 'transparent' }
}

// ====== 状态 ======
const selectedCategory = ref<ProductCategory | 'all'>('all')
const products = ref<Product[]>([])
const loading = ref(false)
const error = ref(false)

// 商品详情弹窗
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<ProductDetail | null>(null)
const buyQuantity = ref(1)
const submitting = ref(false)

/** 从 http 拒绝对象中提取提示文案 */
function pickMsg(e: unknown, fallback = '操作失败，请稍后重试') {
  return (e as { message?: string } | null)?.message || fallback
}

/** 库存文案：-1 充足 / 0 暂无 / N 件 */
function stockText(stock: number): string {
  if (stock < 0) return '库存充足'
  if (stock === 0) return '暂无库存'
  return `库存 ${stock} 件`
}

/** 是否可加入购物车：库存=0 不可，其余（含 -1 充足）可 */
function canBuy(stock: number): boolean {
  return stock !== 0
}

/** 详情弹窗里数量上限：-1 取 99，0 取 1（实际禁用），>0 取 stock */
const quantityMax = computed(() => {
  const s = detail.value?.stock ?? 0
  if (s < 0) return 99
  if (s === 0) return 1
  return s
})

/** 加载商品列表：失败回退空数组 */
async function loadProducts() {
  loading.value = true
  try {
    const data = await getProducts(
      selectedCategory.value === 'all' ? undefined : selectedCategory.value,
    )
    products.value = Array.isArray(data) ? data : []
  } catch {
    products.value = []
    error.value = true
  } finally {
    loading.value = false
  }
}

/** 切换分类：重新拉取列表 */
function selectCategory(c: CategoryOption) {
  if (selectedCategory.value === c.category) return
  selectedCategory.value = c.category
  loadProducts()
}

/** 打开详情弹窗：先用列表信息占位，再拉取详情补 description */
async function openDetail(p: Product) {
  detail.value = {
    productId: p.productId,
    name: p.name,
    price: p.price,
    stock: p.stock,
    category: p.category,
  }
  buyQuantity.value = 1
  detailVisible.value = true
  detailLoading.value = true
  try {
    const data = await getProductById(p.productId)
    detail.value = {
      productId: data?.productId ?? p.productId,
      name: data?.name ?? p.name,
      price: data?.price ?? p.price,
      description: data?.description,
      stock: data?.stock ?? p.stock,
      category: data?.category ?? p.category,
    }
  } catch (e) {
    // 详情失败：保留列表信息，仅提示，不阻断加购
    ElMessage.warning(pickMsg(e, '详情加载失败，仅展示基础信息'))
  } finally {
    detailLoading.value = false
  }
}

/** 加入购物车 */
async function handleAddToCart() {
  const d = detail.value
  if (!d) return
  if (!canBuy(d.stock)) {
    ElMessage.warning('暂无库存，无法加入')
    return
  }
  submitting.value = true
  try {
    await addToCart({ productId: d.productId, quantity: buyQuantity.value })
    ElMessage.success('已加入购物车')
    detailVisible.value = false
  } catch (e) {
    // 400 库存不足 / 400 商品已下架 → http.ts 归一化，此处补充提示
    ElMessage.error(pickMsg(e, '加入失败，请稍后重试'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div class="shop-page">
    <!-- 页头：标题 + 当前积分 -->
    <div class="page-head">
      <div class="head-text">
        <h2 class="page-title">积分商城</h2>
        <p class="page-sub">{{ username }}，用积分换喜欢的好东西吧！</p>
      </div>
      <div class="points-pill">
        <el-icon><Coin /></el-icon>
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
      description="商品列表可能未能加载（后端尚未就绪），请稍后再试。"
    />

    <!-- 分类筛选 chips -->
    <section class="card filter-card">
      <div class="category-chips">
        <button
          v-for="c in CATEGORY_LIST"
          :key="c.category"
          type="button"
          class="category-chip"
          :class="{ active: selectedCategory === c.category }"
          :style="chipStyle(c, selectedCategory === c.category)"
          @click="selectCategory(c)"
        >
          <el-icon class="chip-ico"><component :is="c.icon" /></el-icon>
          <span>{{ c.label }}</span>
        </button>
      </div>
    </section>

    <!-- 商品卡片网格 -->
    <section v-loading="loading" class="product-grid">
      <el-empty
        v-if="!loading && !products.length"
        description="这里空空的，过来看看别的分类吧"
      />
      <div
        v-for="p in products"
        :key="p.productId"
        class="product-card"
        :class="{ 'is-sold-out': !canBuy(p.stock) }"
        @click="openDetail(p)"
      >
        <div class="card-thumb" :style="{ background: categoryOf(p.category).bg }">
          <el-icon class="thumb-ico" :style="{ color: categoryOf(p.category).color }">
            <component :is="categoryOf(p.category).icon" />
          </el-icon>
        </div>
        <div class="card-body">
          <div class="card-name">{{ p.name }}</div>
          <span class="cat-tag" :style="chipStyle(categoryOf(p.category), false)">
            {{ categoryOf(p.category).label }}
          </span>
          <div class="card-foot">
            <div class="card-price">
              <span class="price-num">{{ p.price }}</span>
              <span class="price-unit">积分</span>
            </div>
            <span class="stock-text" :class="{ out: !canBuy(p.stock) }">
              {{ stockText(p.stock) }}
            </span>
          </div>
        </div>
        <div class="card-cta">
          <el-button
            v-if="canBuy(p.stock)"
            type="primary"
            :icon="ShoppingCart"
            size="small"
            round
            @click.stop="openDetail(p)"
          >
            加入购物车
          </el-button>
          <el-button v-else type="info" size="small" round disabled>
            暂无库存
          </el-button>
        </div>
      </div>
    </section>

    <!-- 商品详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="detail?.name || '商品详情'"
      width="460px"
      :close-on-click-modal="false"
    >
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <div class="detail-price">
            <span class="dp-num">{{ detail.price }}</span>
            <span class="dp-unit">积分</span>
          </div>
          <div class="detail-stock">库存：{{ stockText(detail.stock) }}</div>
          <div class="detail-desc">
            <div class="dd-label">商品介绍</div>
            <p v-if="detail.description">{{ detail.description }}</p>
            <p v-else class="dd-empty">暂无介绍</p>
          </div>
          <div class="detail-qty">
            <span class="dq-label">数量</span>
            <el-input-number
              v-model="buyQuantity"
              :min="1"
              :max="quantityMax"
              :disabled="!canBuy(detail.stock)"
            />
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">取消</el-button>
        <el-button
          type="primary"
          :icon="ShoppingCart"
          :loading="submitting"
          :disabled="!canBuy(detail?.stock ?? 0)"
          @click="handleAddToCart"
        >
          加入购物车
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.shop-page {
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
}
.filter-card {
  padding: 16px 20px;
}
.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.category-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 2px solid transparent;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  .chip-ico {
    font-size: 16px;
  }
  &:hover {
    transform: translateY(-2px);
    box-shadow: $kid-shadow;
  }
  &.active {
    box-shadow: $kid-shadow-hover;
  }
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  min-height: 120px;
}
.product-card {
  display: flex;
  flex-direction: column;
  background: $kid-card-bg;
  border-radius: $kid-radius;
  box-shadow: $kid-shadow;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $kid-shadow-hover;
  }
  &.is-sold-out {
    opacity: 0.7;
  }

  .card-thumb {
    @include flex-center;
    height: 96px;

    .thumb-ico {
      font-size: 44px;
    }
  }
  .card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;

    .card-name {
      font-size: 15px;
      font-weight: 700;
      color: $kid-text;
      @include text-ellipsis;
    }
    .cat-tag {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      width: fit-content;
    }
    .card-foot {
      @include flex-row-sb;
      gap: 8px;

      .card-price {
        .price-num {
          font-size: 20px;
          font-weight: 800;
          color: $kid-primary-dark;
          font-variant-numeric: tabular-nums;
        }
        .price-unit {
          margin-left: 2px;
          font-size: 12px;
          color: $kid-text-light;
        }
      }
      .stock-text {
        font-size: 12px;
        color: $kid-text-light;

        &.out {
          color: $kid-danger;
          font-weight: 700;
        }
      }
    }
  }
  .card-cta {
    padding: 0 14px 14px;
  }
}
.detail-body {
  min-height: 80px;

  .detail-price {
    @include flex-center;
    justify-content: flex-start;
    gap: 4px;
    margin-bottom: 8px;

    .dp-num {
      font-size: 28px;
      font-weight: 800;
      color: $kid-primary-dark;
      font-variant-numeric: tabular-nums;
    }
    .dp-unit {
      font-size: 14px;
      color: $kid-text-light;
    }
  }
  .detail-stock {
    font-size: 13px;
    color: $kid-text-light;
    margin-bottom: 12px;
  }
  .detail-desc {
    background: #fff8e1;
    border-radius: $kid-radius-sm;
    padding: 12px;
    margin-bottom: 14px;

    .dd-label {
      font-size: 13px;
      font-weight: 700;
      color: $kid-text;
      margin-bottom: 6px;
    }
    p {
      margin: 0;
      font-size: 14px;
      color: $kid-text;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .dd-empty {
      color: $kid-text-light;
    }
  }
  .detail-qty {
    @include flex-row-sb;
    gap: 12px;

    .dq-label {
      font-size: 14px;
      color: $kid-text-light;
    }
  }
}
</style>
