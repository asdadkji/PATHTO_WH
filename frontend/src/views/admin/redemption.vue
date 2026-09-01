<script setup lang="ts">
// 兑换审核（管理员）：状态筛选 + 兑换申请列表 + 批准/拒绝待审核订单
// 容错：getAdminRedemptions 失败回退空数组；approve/reject 失败由 http.ts 归一化后
// ElMessage 降级提示。拒绝需填写 rejectReason（弹窗输入），批准用二次确认。
// 仅 role='admin' 可访问（路由 meta.requireAdmin 由全局守卫校验）。
import { computed, onMounted, reactive, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { ElDialog } from 'element-plus'
import { Check, Close, Refresh, Tickets } from '@element-plus/icons-vue'
import { approveRedemption, getAdminRedemptions, rejectRedemption } from '@/apis'
import { useAuthStore } from '@/stores/auth'
import type { AdminRedemptionListItem, RedemptionStatus } from '@/types'

const auth = useAuthStore()

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
const records = ref<AdminRedemptionListItem[]>([])
const loading = ref(false)
const error = ref(false)
// 正在批准的订单 id，用于批准按钮 loading 与禁用
const approvingId = ref<string>('')

// 拒绝弹窗
const rejectVisible = ref(false)
const rejectSubmitting = ref(false)
const rejectForm = reactive<{ rejectReason: string }>({ rejectReason: '' })
// 当前正在拒绝的订单（弹窗提交时使用）
const pendingRejectId = ref<string>('')

const adminName = computed(() => auth.userInfo?.username ?? '管理员')

/** 从 http 拒绝对象中提取提示文案 */
function pickMsg(e: unknown, fallback = '操作失败，请稍后重试') {
  return (e as { message?: string } | null)?.message || fallback
}

/** 加载兑换申请列表：失败回退空数组 */
async function loadRedemptions() {
  loading.value = true
  try {
    const data = await getAdminRedemptions(
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

/** 批准兑换：二次确认后调用 approve，成功刷新列表 */
async function handleApprove(item: AdminRedemptionListItem) {
  try {
    await ElMessageBox.confirm(
      `确定批准「${item.userName}」兑换「${item.productName}」吗？将扣除 ${item.pointsUsed} 积分。`,
      '批准兑换',
      { confirmButtonText: '批准', cancelButtonText: '取消', type: 'success' },
    )
  } catch {
    // 管理员放弃批准
    return
  }
  approvingId.value = item.redemptionId
  try {
    await approveRedemption(item.redemptionId)
    ElMessage.success('已批准兑换')
    await loadRedemptions()
  } catch (e) {
    // 400 库存不足 / 403 无权限 → http.ts 归一化后补充提示
    ElMessage.error(pickMsg(e, '批准失败，请稍后重试'))
  } finally {
    approvingId.value = ''
  }
}

/** 打开拒绝弹窗：记录目标订单并清空原因 */
function openReject(item: AdminRedemptionListItem) {
  pendingRejectId.value = item.redemptionId
  rejectForm.rejectReason = ''
  rejectVisible.value = true
}

/** 提交拒绝：原因必填，调用 reject，成功刷新列表 */
async function submitReject() {
  const reason = rejectForm.rejectReason.trim()
  if (!reason) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  rejectSubmitting.value = true
  try {
    await rejectRedemption(pendingRejectId.value, { rejectReason: reason })
    ElMessage.success('已拒绝兑换')
    rejectVisible.value = false
    await loadRedemptions()
  } catch (e) {
    // 403 无权限 → http.ts 归一化后补充提示
    ElMessage.error(pickMsg(e, '拒绝失败，请稍后重试'))
  } finally {
    rejectSubmitting.value = false
  }
}

onMounted(() => {
  loadRedemptions()
})
</script>

<template>
  <div class="redemption-admin-page">
    <!-- 页头 -->
    <div class="page-head">
      <div class="head-text">
        <h2 class="page-title">兑换审核</h2>
        <p class="page-sub">{{ adminName }}，这里有小朋友们提交的兑换申请等你处理。</p>
      </div>
      <el-button
        type="primary"
        :icon="Refresh"
        round
        @click="loadRedemptions"
      >
        刷新
      </el-button>
    </div>

    <el-alert
      v-if="error"
      class="load-tip"
      type="info"
      :closable="false"
      show-icon
      title="数据加载提示"
      description="兑换申请列表可能未能加载（后端尚未就绪），请稍后再试。"
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

    <!-- 兑换申请列表 -->
    <section v-loading="loading" class="card list-card">
      <div class="card-head">
        兑换申请（{{ records.length }} 条）
      </div>

      <!-- 空态 -->
      <el-empty
        v-if="!loading && !records.length"
        description="暂无兑换申请"
      />

      <!-- 列表表头（仅桌面端展示，更专业的表格感） -->
      <div v-if="records.length" class="grid-head">
        <span class="gh-user">申请人</span>
        <span class="gh-product">商品</span>
        <span class="gh-status">状态</span>
        <span class="gh-points">消耗积分</span>
        <span class="gh-actions">操作</span>
      </div>

      <!-- 记录列表 -->
      <div v-if="records.length" class="record-list">
        <div
          v-for="item in records"
          :key="item.redemptionId"
          class="record-item"
          :class="{ 'is-pending': item.status === 'pending' }"
        >
          <div class="cell c-user">
            <el-icon class="cell-ico"><Tickets /></el-icon>
            <span class="cell-text">{{ item.userName }}</span>
          </div>
          <div class="cell c-product">
            <span class="cell-text">{{ item.productName }}</span>
            <span class="cell-id">订单 {{ item.redemptionId }}</span>
          </div>
          <div class="cell c-status">
            <span
              class="status-tag"
              :style="chipStyle(statusOf(item.status), false)"
            >
              {{ statusOf(item.status).label }}
            </span>
          </div>
          <div class="cell c-points">
            <span class="pts-num">{{ item.pointsUsed }}</span>
            <span class="pts-unit">积分</span>
          </div>
          <div class="cell c-actions">
            <template v-if="item.status === 'pending'">
              <el-button
                type="success"
                :icon="Check"
                size="small"
                round
                :loading="approvingId === item.redemptionId"
                @click="handleApprove(item)"
              >
                批准
              </el-button>
              <el-button
                type="danger"
                :icon="Close"
                size="small"
                round
                :disabled="rejectSubmitting"
                @click="openReject(item)"
              >
                拒绝
              </el-button>
            </template>
            <span v-else class="no-action">{{ statusOf(item.status).label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 拒绝原因弹窗 -->
    <el-dialog
      v-model="rejectVisible"
      title="拒绝兑换"
      width="460px"
      :close-on-click-modal="false"
    >
      <div class="reject-body">
        <p class="reject-tip">请填写拒绝原因，小朋友会看到哦～</p>
        <el-input
          v-model="rejectForm.rejectReason"
          type="textarea"
          :rows="4"
          maxlength="120"
          show-word-limit
          placeholder="例如：库存不足，请稍后再来兑换"
        />
      </div>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button
          type="danger"
          :loading="rejectSubmitting"
          @click="submitReject"
        >
          确认拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.redemption-admin-page {
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
.grid-head {
  display: grid;
  grid-template-columns: 1fr 1.6fr 1fr 1fr 1.4fr;
  gap: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  color: $kid-text-light;
  border-bottom: 2px solid #ffe0b2;
}
.record-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}
.record-item {
  display: grid;
  grid-template-columns: 1fr 1.6fr 1fr 1fr 1.4fr;
  gap: 12px;
  align-items: center;
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

  .cell {
    min-width: 0;
  }
  .cell-ico {
    margin-right: 6px;
    color: $kid-primary;
    vertical-align: middle;
  }
  .cell-text {
    font-size: 14px;
    font-weight: 600;
    color: $kid-text;
    @include text-ellipsis;
  }
  .c-user .cell-text {
    font-weight: 700;
  }
  .c-product {
    .cell-id {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: $kid-text-light;
      @include text-ellipsis;
    }
  }
  .c-points {
    @include flex-center;
    gap: 2px;

    .pts-num {
      font-size: 18px;
      font-weight: 800;
      color: $kid-primary-dark;
      font-variant-numeric: tabular-nums;
    }
    .pts-unit {
      font-size: 12px;
      color: $kid-text-light;
    }
  }
  .c-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .no-action {
      font-size: 13px;
      color: $kid-text-light;
    }
  }
  .status-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
}
.reject-body {
  .reject-tip {
    margin: 0 0 10px;
    font-size: 14px;
    color: $kid-text-light;
  }
}

@media (max-width: 768px) {
  // 移动端隐藏表格头，列表项改为纵向堆叠
  .grid-head {
    display: none;
  }
  .record-item {
    grid-template-columns: 1fr;
    gap: 8px;

    .c-points {
      justify-content: flex-start;
    }
    .c-actions {
      justify-content: flex-start;
    }
  }
}
</style>
