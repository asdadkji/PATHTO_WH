<script setup lang="ts">
// 兑换记录（用户端）：状态筛选 chips + 兑换记录列表 + 取消待审核订单
// 容错：getRedemptions 失败回退空数组；cancel 失败由 http.ts 归一化后 ElMessage 降级提示，
// 取消成功后乐观更新 auth.userInfo.totalPoints（退还 refundPoints 积分）并刷新列表。
// 当前积分取自 auth store 的 userInfo.totalPoints，页头展示。
import { computed, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { CircleClose, Goods, Refresh, Star, Tickets } from '@element-plus/icons-vue'
import { cancelRedemption, getRedemptions } from '@/apis'
import { useAuthStore } from '@/stores/auth'
import type { RedemptionListItem, RedemptionStatus } from '@/types'

const auth = useAuthStore()
const router = useRouter()

/** 当前积分（来自 auth store） */
const totalPoints = computed(() => auth.userInfo?.totalPoints ?? 0)

/** 状态筛选项：标签 / 配色，覆盖"全部"与 5 种状态 */
interface StatusOption {
  status: RedemptionStatus | 'all'
  label: string
  color: string
  bg: string
}

// 全部(橙) / 待审核(橙) / 已批准(绿) / 已拒绝(红) / 已完成(蓝) / 已取消(灰)
const STATUS_LIST: StatusOption[] = [
  { status: 'all', label: '全部', color: '#ff7043', bg: '#ffe0b2' },
  { status: 'pending', label: '待审核', color: '#fb8c00', bg: '#ffe0b2' },
  { status: 'approved', label: '已批准', color: '#43a047', bg: '#c8e6c9' },
  { status: 'rejected', label: '已拒绝', color: '#e53935', bg: '#ffcdd2' },
  { status: 'completed', label: '已完成', color: '#1e88e5', bg: '#bbdefb' },
  { status: 'cancelled', label: '已取消', color: '#757575', bg: '#e0e0e0' },
]
const STATUS_MAP: Record<RedemptionStatus, StatusOption> = STATUS_LIST.reduce(
  (acc, item) => {
    if (item.status !== 'all') acc[item.status as RedemptionStatus] = item
    return acc
  },
  {} as Record<RedemptionStatus, StatusOption>,
)

/** 取状态配置；未知状态回退到"全部" */
function statusOf(s: RedemptionStatus): StatusOption {
  return STATUS_MAP[s] ?? STATUS_LIST[0]
}

/** chip / 状态标签内联样式：选中态用主色填充，未选用浅底色 */
function chipStyle(s: StatusOption, active: boolean): CSSProperties {
  return active
    ? { background: s.color, color: '#ffffff', borderColor: s.color }
    : { background: s.bg, color: s.color, borderColor: 'transparent' }
}

// ====== 状态 ======
const selectedStatus = ref<RedemptionStatus | 'all'>('all')
const records = ref<RedemptionListItem[]>([])
const loading = ref(false)
const error = ref(false)
// 正在取消的订单 id，用于按钮 loading 与禁用
const cancellingId = ref<string>('')

/** 从 http 拒绝对象中提取提示文案 */
function pickMsg(e: unknown, fallback = '操作失败，请稍后重试') {
  return (e as { message?: string } | null)?.message || fallback
}

/** 加载兑换记录：失败回退空数组 */
async function loadRedemptions() {
  loading.value = true
  try {
    const data = await getRedemptions(
      selectedStatus.value === 'all' ? undefined : selectedStatus.value,
    )
    records.value = Array.isArray(data) ? data : []
  } catch {
    records.value = []
    error.value = true
  } finally {
    loading.value = false
  }
}

/** 切换状态筛选：重新拉取列表 */
function selectStatus(s: StatusOption) {
  if (selectedStatus.value === s.status) return
  selectedStatus.value = s.status
  loadRedemptions()
}

/** 取消兑换订单：仅待审核可取消；成功退还 refundPoints 积分 */
async function handleCancel(item: RedemptionListItem) {
  try {
    await ElMessageBox.confirm(
      `确定取消兑换「${item.productName}」吗？取消后将退还 ${item.pointsUsed} 积分。`,
      '取消兑换',
      { confirmButtonText: '确定取消', cancelButtonText: '再想想', type: 'warning' },
    )
  } catch {
    // 用户放弃取消
    return
  }
  cancellingId.value = item.redemptionId
  try {
    const res = await cancelRedemption(item.redemptionId)
    // 退还积分：本地乐观更新 totalPoints（与页头积分徽标联动）
    const refund = res?.refundPoints ?? item.pointsUsed
    if (auth.userInfo) {
      auth.userInfo.totalPoints = (auth.userInfo.totalPoints ?? 0) + refund
    }
    ElMessage.success(`已取消，退还 ${refund} 积分`)
    await loadRedemptions()
  } catch (e) {
    // 400 不可取消 / 404 订单不存在 → http.ts 归一化后补充提示
    const code = (e as { code?: number | string })?.code
    if (code === 404) {
      ElMessage.info('该兑换订单不存在，已刷新列表')
      await loadRedemptions()
    } else {
      ElMessage.error(pickMsg(e, '取消失败，请稍后重试'))
    }
  } finally {
    cancellingId.value = ''
  }
}

function goShop() {
  router.push('/shop')
}

onMounted(() => {
  loadRedemptions()
})
</script>

<template>
  <div class="exchange-page">
    <!-- 页头：标题 + 当前积分 -->
    <div class="page-head">
      <div class="head-text">
        <h2 class="page-title">兑换记录</h2>
        <p class="page-sub">看看你的积分都换了什么好东西吧！</p>
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
      description="兑换记录可能未能加载（后端尚未就绪），请稍后再试。"
    />

    <!-- 状态筛选 chips -->
    <section class="card filter-card">
      <div class="status-chips">
        <button
          v-for="s in STATUS_LIST"
          :key="s.status"
          type="button"
          class="status-chip"
          :class="{ active: selectedStatus === s.status }"
          :style="chipStyle(s, selectedStatus === s.status)"
          @click="selectStatus(s)"
        >
          {{ s.label }}
        </button>
      </div>
    </section>

    <!-- 兑换记录列表 -->
    <section v-loading="loading" class="card list-card">
      <div class="card-head list-head">
        <span>兑换记录（{{ records.length }} 条）</span>
        <el-button
          type="primary"
          :icon="Refresh"
          size="small"
          round
          @click="loadRedemptions"
        >
          刷新
        </el-button>
      </div>

      <!-- 空态 -->
      <el-empty
        v-if="!loading && !records.length"
        description="还没有兑换记录，去商城换点好东西吧"
      >
        <el-button type="primary" :icon="Goods" round @click="goShop">
          去商城
        </el-button>
      </el-empty>

      <!-- 记录列表 -->
      <div v-else class="record-list">
        <div
          v-for="item in records"
          :key="item.redemptionId"
          class="record-item"
          :class="{ 'is-pending': item.status === 'pending' }"
        >
          <div class="ri-thumb" :style="{ background: statusOf(item.status).bg }">
            <el-icon class="ri-ico" :style="{ color: statusOf(item.status).color }">
              <Tickets />
            </el-icon>
          </div>

          <div class="ri-main">
            <div class="ri-name">{{ item.productName }}</div>
            <div class="ri-meta">
              <span
                class="status-tag"
                :style="chipStyle(statusOf(item.status), false)"
              >
                {{ statusOf(item.status).label }}
              </span>
              <span class="ri-id">订单号 {{ item.redemptionId }}</span>
            </div>
          </div>

          <div class="ri-points">
            <span class="pts-num">{{ item.pointsUsed }}</span>
            <span class="pts-unit">积分</span>
          </div>

          <div class="ri-actions">
            <el-button
              v-if="item.status === 'pending'"
              type="danger"
              :icon="CircleClose"
              size="small"
              round
              :loading="cancellingId === item.redemptionId"
              @click="handleCancel(item)"
            >
              取消
            </el-button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.exchange-page {
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
.filter-card {
  padding: 16px 20px;
}
.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: 2px solid transparent;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $kid-shadow;
  }
  &.active {
    box-shadow: $kid-shadow-hover;
  }
}
.list-head {
  @include flex-row-sb;
  gap: 12px;
}
.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 80px;
}
.record-item {
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
  &.is-pending {
    background: #fff3e0;
  }

  .ri-thumb {
    @include flex-center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    flex-shrink: 0;

    .ri-ico {
      font-size: 22px;
    }
  }
  .ri-main {
    flex: 1;
    min-width: 0;

    .ri-name {
      font-size: 16px;
      font-weight: 700;
      color: $kid-text;
      @include text-ellipsis;
    }
    .ri-meta {
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      .status-tag {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
      }
      .ri-id {
        font-size: 12px;
        color: $kid-text-light;
        @include text-ellipsis;
      }
    }
  }
  .ri-points {
    @include flex-center;
    gap: 2px;
    min-width: 64px;

    .pts-num {
      font-size: 20px;
      font-weight: 800;
      color: $kid-primary-dark;
      font-variant-numeric: tabular-nums;
    }
    .pts-unit {
      font-size: 12px;
      color: $kid-text-light;
    }
  }
  .ri-actions {
    display: flex;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .record-item {
    flex-wrap: wrap;

    .ri-points {
      order: 2;
    }
    .ri-actions {
      order: 3;
    }
  }
}
</style>
