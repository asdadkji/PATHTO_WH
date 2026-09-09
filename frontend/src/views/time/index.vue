<script setup lang="ts">
// 时间管理：计时器(start/stop) + 手动录入(manual) + 今日达标(target-status) + 今日时长汇总(summary/today)
// 容错：target-status / summary/today 使用 Promise.allSettled，失败回退 false / 0；
// 进行中会话存 localStorage 以支持刷新恢复；所有接口错误由 http.ts 拦截器统一处理，组件内 catch 做降级。
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import type { Component, CSSProperties } from 'vue'
import echarts from '@/utils/echarts'
import type { EChartsInstance } from '@/utils/echarts'
import {
  Bicycle,
  CircleCheck,
  More,
  Notebook,
  Plus,
  Reading,
  Soccer,
  VideoPause,
  VideoPlay,
} from '@element-plus/icons-vue'
import { manualRecord, startTimer, stopTimer } from '@/apis/timer'
import { getTargetStatus, getTodaySummary } from '@/apis/time'
import { useAuthStore } from '@/stores/auth'
import type { ActivityType, TargetStatus, TimerSession, TodaySummary } from '@/types'

const auth = useAuthStore()

// 进行中计时会话在 localStorage 的存储键（用于刷新后恢复）
const ACTIVE_SESSION_KEY = 'timerActiveSession'

/** 活动类型配置：标签 / 图标 / 配色，覆盖 5 种活动 */
interface ActivityOption {
  type: ActivityType
  label: string
  icon: Component
  color: string
  bg: string
}

// 活动列表：作业(蓝) / 游戏(橙) / 阅读(紫) / 运动(绿) / 其他(棕)
const ACTIVITY_LIST: ActivityOption[] = [
  { type: 'homework', label: '作业', icon: Notebook, color: '#42a5f5', bg: '#e3f2fd' },
  { type: 'game', label: '游戏', icon: Soccer, color: '#ff7043', bg: '#ffe0b2' },
  { type: 'reading', label: '阅读', icon: Reading, color: '#ab47bc', bg: '#f3e5f5' },
  { type: 'exercise', label: '运动', icon: Bicycle, color: '#66bb6a', bg: '#e8f5e9' },
  { type: 'other', label: '其他', icon: More, color: '#8d6e63', bg: '#efebe9' },
]
const ACTIVITY_MAP: Record<ActivityType, ActivityOption> = ACTIVITY_LIST.reduce(
  (acc, item) => {
    acc[item.type] = item
    return acc
  },
  {} as Record<ActivityType, ActivityOption>,
)

/** 取活动配置；未知类型回退到"其他" */
function activityOf(type: ActivityType): ActivityOption {
  return ACTIVITY_MAP[type] ?? ACTIVITY_LIST[ACTIVITY_LIST.length - 1]
}

/** 计算 chip 内联样式：选中态用主色填充，未选用浅底色 */
function chipStyle(a: ActivityOption, active: boolean): CSSProperties {
  return active
    ? { background: a.color, color: '#ffffff', borderColor: a.color }
    : { background: a.bg, color: a.color, borderColor: 'transparent' }
}

// ====== 状态 ======
const activeSession = ref<TimerSession | null>(loadActiveSession())
const selectedActivity = ref<ActivityType>('homework')
const manualForm = reactive<{ activityType: ActivityType; durationMinutes: number }>({
  activityType: 'homework',
  durationMinutes: 10,
})
const targetStatus = reactive<TargetStatus>({ homeworkReached: false, gameReached: false })
const todaySummary = reactive<TodaySummary>({ homeworkMinutes: 0, gameMinutes: 0 })
const loading = ref(false)
const error = ref(false)
const submittingStart = ref(false)
const submittingStop = ref(false)
const submittingManual = ref(false)

// 计时器实时刷新用：每秒更新 now，触发 elapsed 计算属性重算
const now = ref(Date.now())
let tickHandle: number | undefined

// ECharts 实例
const chartRef = ref<HTMLDivElement>()
const chart = shallowRef<EChartsInstance | null>(null)

const username = computed(() => auth.userInfo?.username ?? '小朋友')

// ====== 进行中会话：本地持久化（刷新可恢复） ======
/** 从 localStorage 安全读取进行中会话 */
function loadActiveSession(): TimerSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY)
    return raw ? (JSON.parse(raw) as TimerSession) : null
  } catch {
    return null
  }
}

/** 写入 / 清除本地进行中会话 */
function saveActiveSession(s: TimerSession | null) {
  try {
    if (s) localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(ACTIVE_SESSION_KEY)
  } catch {
    /* 忽略 localStorage 异常 */
  }
}

// ====== 实时计时计算 ======
/** 会话开始时间戳（ms）；无效则返回 0 */
const startedAtMs = computed(() => {
  if (!activeSession.value?.startedAt) return 0
  const t = new Date(activeSession.value.startedAt).getTime()
  return Number.isNaN(t) ? 0 : t
})

/** 已计时秒数 */
const elapsedSec = computed(() => {
  if (!startedAtMs.value) return 0
  return Math.max(0, Math.floor((now.value - startedAtMs.value) / 1000))
})

/** 已计时展示文本 mm:ss 或 hh:mm:ss */
const elapsedDisplay = computed(() => {
  const s = elapsedSec.value
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
})

/** 格式化会话开始时刻为 HH:MM */
function formatStartedAt(s: string): string {
  const t = new Date(s).getTime()
  if (Number.isNaN(t)) return s || ''
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 从 http 拒绝对象中提取提示文案 */
function pickMsg(e: unknown, fallback = '操作失败，请稍后重试') {
  return (e as { message?: string } | null)?.message || fallback
}

// ====== 数据加载（失败回退默认值） ======
/** 今日达标状态：失败回退 false */
async function loadStatus() {
  try {
    const data = await getTargetStatus()
    targetStatus.homeworkReached = !!data?.homeworkReached
    targetStatus.gameReached = !!data?.gameReached
  } catch {
    targetStatus.homeworkReached = false
    targetStatus.gameReached = false
    error.value = true
  }
}

/** 今日时长汇总：失败回退 0 */
async function loadSummary() {
  try {
    const data = await getTodaySummary()
    todaySummary.homeworkMinutes = data?.homeworkMinutes ?? 0
    todaySummary.gameMinutes = data?.gameMinutes ?? 0
  } catch {
    todaySummary.homeworkMinutes = 0
    todaySummary.gameMinutes = 0
    error.value = true
  }
}

// ====== 图表渲染（今日作业 / 游戏分钟柱状图） ======
function renderChart() {
  if (!chartRef.value) return
  // 使用局部变量收窄 null，便于 TS 推断
  let inst = chart.value
  if (!inst) {
    inst = echarts.init(chartRef.value)
    chart.value = inst
  }
  const option = {
    grid: { left: 48, right: 24, top: 40, bottom: 36 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['作业', '游戏'],
      axisLine: { lineStyle: { color: '#ccc' } },
      axisLabel: { color: '#8d6e63' },
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      nameTextStyle: { color: '#8d6e63' },
      axisLabel: { color: '#8d6e63' },
      splitLine: { lineStyle: { color: '#eee' } },
    },
    series: [
      {
        type: 'bar',
        barWidth: 38,
        itemStyle: { borderRadius: [8, 8, 0, 0] },
        label: { show: true, position: 'top', color: '#4e342e', fontWeight: 700 },
        data: [
          { value: todaySummary.homeworkMinutes, itemStyle: { color: '#42a5f5' } },
          { value: todaySummary.gameMinutes, itemStyle: { color: '#ff7043' } },
        ],
      },
    ],
  }
  inst.setOption(option, true)
}

function handleResize() {
  chart.value?.resize()
}

/** 刷新达标状态 + 今日汇总 + 图表 */
async function refresh() {
  loading.value = true
  await Promise.allSettled([loadStatus(), loadSummary()])
  renderChart()
  loading.value = false
}

// ====== 计时操作 ======
/** 开始计时：成功则记录会话到内存与 localStorage */
async function startSession() {
  if (activeSession.value) return
  submittingStart.value = true
  try {
    const data = await startTimer(selectedActivity.value)
    activeSession.value = data
    saveActiveSession(data)
    now.value = Date.now()
    ElMessage.success(`开始计时：${activityOf(data.activityType).label}`)
  } catch (e) {
    // 409 已有进行中的计时 / 400 活动类型无效 → http.ts 归一化，此处补充提示
    ElMessage.error(pickMsg(e, '已有进行中的计时，请先结束'))
  } finally {
    submittingStart.value = false
  }
}

/** 结束计时：成功则清除本地会话并刷新统计；404 视为服务端已清理，同步本地 */
async function stopSession() {
  const s = activeSession.value
  if (!s) return
  submittingStop.value = true
  try {
    const res = await stopTimer(s.sessionId)
    ElMessage.success(`已结束：本次 ${res?.durationMinutes ?? 0} 分钟`)
    activeSession.value = null
    saveActiveSession(null)
    await refresh()
  } catch (e) {
    const code = (e as { code?: number | string })?.code
    // 404 会话不存在 → 服务端已无此会话，同步清除本地，避免一直占用
    if (code === 404) {
      activeSession.value = null
      saveActiveSession(null)
      ElMessage.info('该计时已失效，已自动清除')
    } else {
      // 400 已结束 / 其他 → 统一提示
      ElMessage.error(pickMsg(e, '结束失败，请稍后重试'))
    }
  } finally {
    submittingStop.value = false
  }
}

// ====== 手动录入 ======
/** 手动录入时长：时长必须 > 0，成功后刷新统计 */
async function submitManual() {
  if (!manualForm.durationMinutes || manualForm.durationMinutes <= 0) {
    ElMessage.warning('请填写大于 0 的时长')
    return
  }
  submittingManual.value = true
  try {
    await manualRecord({
      activityType: manualForm.activityType,
      durationMinutes: manualForm.durationMinutes,
    })
    ElMessage.success('已录入时长')
    await refresh()
  } catch (e) {
    // 400 时长不能为 0 → http.ts 归一化，此处补充提示
    ElMessage.error(pickMsg(e, '录入失败，请稍后重试'))
  } finally {
    submittingManual.value = false
  }
}

// ====== 生命周期 ======
onMounted(async () => {
  // 恢复进行中会话（已在 ref 初始化时读取），刷新当前时间并启动每秒计时
  now.value = Date.now()
  tickHandle = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
  await Promise.allSettled([loadStatus(), loadSummary()])
  renderChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (tickHandle) window.clearInterval(tickHandle)
  window.removeEventListener('resize', handleResize)
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div class="time-page">
    <!-- 页头 -->
    <div class="page-head">
      <div class="head-text">
        <h2 class="page-title">时间管理</h2>
        <p class="page-sub">{{ username }}，记录每一刻，养成专注好习惯！</p>
      </div>
    </div>

    <el-alert
      v-if="error"
      class="load-tip"
      type="info"
      :closable="false"
      show-icon
      title="数据加载提示"
      description="部分数据可能未能加载（后端尚未就绪），当前展示默认值。"
    />

    <!-- 计时器区 -->
    <section class="card timer-card">
      <div class="card-head">计时器</div>

      <!-- 无进行中会话：选择活动 + 开始（已有运行会话时此区域隐藏，等同于禁用 start） -->
      <div v-if="!activeSession" class="timer-idle">
        <div class="pick-row">
          <span class="pick-label">选择活动</span>
          <div class="activity-chips">
            <button
              v-for="a in ACTIVITY_LIST"
              :key="a.type"
              type="button"
              class="activity-chip"
              :class="{ active: selectedActivity === a.type }"
              :style="chipStyle(a, selectedActivity === a.type)"
              @click="selectedActivity = a.type"
            >
              <el-icon class="chip-ico"><component :is="a.icon" /></el-icon>
              <span>{{ a.label }}</span>
            </button>
          </div>
        </div>
        <el-button
          type="primary"
          :icon="VideoPlay"
          round
          :loading="submittingStart"
          @click="startSession"
        >
          开始计时
        </el-button>
        <p class="tip-text">同一时间只能进行一个计时哦～</p>
      </div>

      <!-- 进行中会话：展示活动 + 实时计时 + 结束（用 v-if="activeSession" 获得非空窄化） -->
      <div v-if="activeSession" class="timer-running">
        <div class="run-left">
          <div class="run-chip" :style="chipStyle(activityOf(activeSession.activityType), true)">
            <el-icon class="chip-ico"><component :is="activityOf(activeSession.activityType).icon" /></el-icon>
            <span>{{ activityOf(activeSession.activityType).label }}</span>
          </div>
          <div class="run-time">{{ elapsedDisplay }}</div>
          <div class="run-sub">从 {{ formatStartedAt(activeSession.startedAt) }} 开始</div>
        </div>
        <el-button
          type="danger"
          :icon="VideoPause"
          round
          :loading="submittingStop"
          @click="stopSession"
        >
          结束计时
        </el-button>
      </div>
    </section>

    <!-- 手动录入区 -->
    <section class="card manual-card">
      <div class="card-head">手动录入</div>
      <div class="manual-form">
        <div class="pick-row">
          <span class="pick-label">活动类型</span>
          <div class="activity-chips">
            <button
              v-for="a in ACTIVITY_LIST"
              :key="a.type"
              type="button"
              class="activity-chip"
              :class="{ active: manualForm.activityType === a.type }"
              :style="chipStyle(a, manualForm.activityType === a.type)"
              @click="manualForm.activityType = a.type"
            >
              <el-icon class="chip-ico"><component :is="a.icon" /></el-icon>
              <span>{{ a.label }}</span>
            </button>
          </div>
        </div>
        <div class="manual-row">
          <span class="pick-label">时长</span>
          <el-input-number
            v-model="manualForm.durationMinutes"
            :min="1"
            :max="600"
            :step="5"
          />
          <span class="unit-text">分钟</span>
          <el-button
            type="primary"
            :icon="Plus"
            round
            :loading="submittingManual"
            @click="submitManual"
          >
            录入
          </el-button>
        </div>
      </div>
    </section>

    <!-- 今日达标状态区 -->
    <section v-loading="loading" class="card target-card">
      <div class="card-head">今日达标</div>
      <div class="target-grid">
        <div class="target-item hw" :class="{ reached: targetStatus.homeworkReached }">
          <el-icon class="t-ico"><Notebook /></el-icon>
          <div class="t-label">作业</div>
          <div class="t-status">
            <el-icon v-if="targetStatus.homeworkReached" class="t-check"><CircleCheck /></el-icon>
            <span>{{ targetStatus.homeworkReached ? '已达标' : '未达标' }}</span>
          </div>
        </div>
        <div class="target-item gm" :class="{ reached: targetStatus.gameReached }">
          <el-icon class="t-ico"><Soccer /></el-icon>
          <div class="t-label">游戏</div>
          <div class="t-status">
            <el-icon v-if="targetStatus.gameReached" class="t-check"><CircleCheck /></el-icon>
            <span>{{ targetStatus.gameReached ? '已达标' : '未达标' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 今日汇总区（柱状图 + 数值） -->
    <section class="card summary-card">
      <div class="card-head">今日时长</div>
      <div v-loading="loading" class="summary-body">
        <div ref="chartRef" class="chart-box"></div>
        <div class="summary-stats">
          <div class="sum-item hw">
            <span class="sum-num">{{ todaySummary.homeworkMinutes }}</span>
            <span class="sum-unit">作业分钟</span>
          </div>
          <div class="sum-item gm">
            <span class="sum-num">{{ todaySummary.gameMinutes }}</span>
            <span class="sum-unit">游戏分钟</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.time-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.page-head {
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
.pick-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .pick-label {
    font-size: 14px;
    color: $kid-text-light;
    flex-shrink: 0;
  }
}
.activity-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.activity-chip {
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
.tip-text {
  margin-top: 10px;
  font-size: 12px;
  color: $kid-text-light;
}

// 计时器：空闲态
.timer-idle {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// 计时器：运行态
.timer-running {
  @include flex-row-sb;
  gap: 16px;
  flex-wrap: wrap;

  .run-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .run-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 700;
    width: fit-content;

    .chip-ico {
      font-size: 16px;
    }
  }
  .run-time {
    font-size: 40px;
    font-weight: 800;
    color: $kid-primary-dark;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .run-sub {
    font-size: 13px;
    color: $kid-text-light;
  }
}

// 手动录入
.manual-form {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .manual-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    .unit-text {
      font-size: 14px;
      color: $kid-text-light;
    }
  }
}

// 今日达标
.target-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}
.target-item {
  @include flex-center;
  flex-direction: column;
  gap: 6px;
  padding: 20px 16px;
  border-radius: $kid-radius-sm;
  background: #f5f5f5;
  text-align: center;
  transition: background 0.2s, transform 0.2s;

  .t-ico {
    font-size: 30px;
    color: $kid-text-light;
  }
  .t-label {
    font-size: 15px;
    font-weight: 700;
    color: $kid-text;
  }
  .t-status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: $kid-text-light;

    .t-check {
      color: $kid-success;
      font-size: 16px;
    }
  }
  // 作业卡 / 游戏卡基础配色（未达标偏中性）
  &.hw {
    background: #e3f2fd;
  }
  &.gm {
    background: #ffe0b2;
  }
  // 达标态：高亮主色 + 缩放
  &.reached {
    transform: translateY(-2px);
    box-shadow: $kid-shadow-hover;

    &.hw {
      background: linear-gradient(135deg, $kid-secondary, #1976d2);
    }
    &.gm {
      background: linear-gradient(135deg, $kid-primary, $kid-primary-dark);
    }
    .t-ico,
    .t-label,
    .t-status {
      color: #fff;
    }
    .t-status .t-check {
      color: #fff;
    }
  }
}

// 今日汇总
.summary-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chart-box {
  width: 100%;
  height: 300px;
}
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.sum-item {
  @include flex-center;
  flex-direction: column;
  gap: 4px;
  padding: 18px 14px;
  border-radius: $kid-radius-sm;
  color: #fff;

  .sum-num {
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .sum-unit {
    font-size: 13px;
    opacity: 0.92;
  }
  &.hw {
    background: linear-gradient(135deg, $kid-secondary, #1976d2);
  }
  &.gm {
    background: linear-gradient(135deg, $kid-accent, #ffa000);

    .sum-num {
      color: $kid-text;
    }
    .sum-unit {
      color: $kid-text;
      opacity: 1;
    }
  }
}

@media (max-width: 768px) {
  .timer-running {
    flex-direction: column;
    align-items: flex-start;

    .run-time {
      font-size: 34px;
    }
  }
}
</style>
