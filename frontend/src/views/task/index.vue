<script setup lang="ts">
// 我的任务：周统计卡片 + 本周任务趋势(ECharts 柱状图) + 创建任务 + 今日任务列表
// 容错：getTodayTasks / getWeeklyStats 使用 Promise.allSettled，失败回退空数组 / 0
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import echarts from '@/utils/echarts'
import type { EChartsInstance } from '@/utils/echarts'
// el-dialog / el-popconfirm 显式导入，保证 vue-tsc 类型解析
import { ElDialog, ElPopconfirm } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { CircleCheck, Delete, Plus, Star } from '@element-plus/icons-vue'
import {
  completeTask,
  createTask,
  deleteTask,
  getTodayTasks,
  getWeeklyStats,
} from '@/apis/task'
import { useAuthStore } from '@/stores/auth'
import type { Task, TaskStatus, TaskWeeklyStats } from '@/types'

const auth = useAuthStore()

// 周统计（接口失败回退 0 / 空数组）
const stats = reactive<TaskWeeklyStats>({
  totalCompleted: 0,
  totalPoints: 0,
  dailyData: [],
})
// 今日任务列表
const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref(false)

// ECharts 实例
const chartRef = ref<HTMLDivElement>()
const chart = shallowRef<EChartsInstance | null>(null)

// 创建任务弹窗
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
// 表单字段显式声明为 string（避免 description 可选带来的 undefined 不被 el-input 接收）
const form = reactive<{ title: string; points: number; description: string }>({
  title: '',
  points: 1,
  description: '',
})
const rules: FormRules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  points: [
    { required: true, type: 'number', min: 1, message: '积分至少为 1', trigger: 'change' },
  ],
}

const username = computed(() => auth.userInfo?.username ?? '小朋友')
const todayCompleted = computed(
  () => tasks.value.filter((t) => t.status === 'completed').length,
)
const todayTotal = computed(() => tasks.value.length)
const todayPercent = computed(() =>
  todayTotal.value > 0
    ? Math.round((todayCompleted.value / todayTotal.value) * 100)
    : 0,
)

/** 从 http 拒绝对象中提取提示文案 */
function pickMsg(e: unknown, fallback = '操作失败，请稍后重试') {
  return (e as { message?: string } | null)?.message || fallback
}

/** 今日任务列表：失败回退空数组 */
async function loadTasks() {
  loading.value = true
  try {
    const data = await getTodayTasks()
    tasks.value = Array.isArray(data) ? data : []
  } catch {
    tasks.value = []
    error.value = true
  } finally {
    loading.value = false
  }
}

/** 周统计：失败回退默认值 */
async function loadStats() {
  try {
    const data = await getWeeklyStats()
    stats.totalCompleted = data?.totalCompleted ?? 0
    stats.totalPoints = data?.totalPoints ?? 0
    stats.dailyData = Array.isArray(data?.dailyData) ? data.dailyData : []
  } catch {
    stats.totalCompleted = 0
    stats.totalPoints = 0
    stats.dailyData = []
    error.value = true
  }
}

function renderChart() {
  if (!chartRef.value) return
  // 使用局部变量收窄 null，便于 TS 推断
  let inst = chart.value
  if (!inst) {
    inst = echarts.init(chartRef.value)
    chart.value = inst
  }
  const daily = stats.dailyData
  const option = {
    grid: { left: 48, right: 48, top: 44, bottom: 36 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['完成数', '积分'], top: 6, textStyle: { fontSize: 12 } },
    xAxis: {
      type: 'category',
      data: daily.map((d) => d.date),
      axisLine: { lineStyle: { color: '#ccc' } },
      axisLabel: { color: '#8d6e63' },
    },
    yAxis: [
      {
        type: 'value',
        name: '完成数',
        nameTextStyle: { color: '#42a5f5' },
        axisLabel: { color: '#8d6e63' },
        splitLine: { lineStyle: { color: '#eee' } },
      },
      {
        type: 'value',
        name: '积分',
        nameTextStyle: { color: '#ff7043' },
        axisLabel: { color: '#8d6e63' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '完成数',
        type: 'bar',
        data: daily.map((d) => d.completed),
        itemStyle: { color: '#42a5f5', borderRadius: [6, 6, 0, 0] },
        barWidth: 18,
        yAxisIndex: 0,
      },
      {
        name: '积分',
        type: 'bar',
        data: daily.map((d) => d.points),
        itemStyle: { color: '#ff7043', borderRadius: [6, 6, 0, 0] },
        barWidth: 18,
        yAxisIndex: 1,
      },
    ],
  }
  inst.setOption(option, true)
}

function handleResize() {
  chart.value?.resize()
}

/** 刷新列表 + 周统计 + 图表 */
async function refresh() {
  await Promise.allSettled([loadTasks(), loadStats()])
  renderChart()
}

/** 任务状态对应的 tag 颜色：pending=橙色 / completed=绿色 */
function statusType(
  status: TaskStatus,
): 'info' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'info'
    case 'expired':
      return 'danger'
    default:
      return 'info'
  }
}

function statusLabel(status: TaskStatus): string {
  switch (status) {
    case 'pending':
      return '待完成'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    case 'expired':
      return '已过期'
    default:
      return status
  }
}

function openCreate() {
  form.title = ''
  form.points = 1
  form.description = ''
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

async function submitCreate() {
  const inst = formRef.value
  if (!inst) return
  // 提交前校验：标题非空、积分 ≥ 1
  try {
    await inst.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    await createTask({
      title: form.title.trim(),
      points: form.points,
      description: form.description.trim() || undefined,
    })
    ElMessage.success('任务已创建')
    dialogVisible.value = false
    await refresh()
  } catch (e) {
    // 标题空 / 积分≤0 → 400，由 http.ts 归一化，此处补充提示
    ElMessage.error(pickMsg(e, '创建失败，请稍后重试'))
  } finally {
    submitting.value = false
  }
}

async function handleComplete(task: Task) {
  try {
    const res = await completeTask(task.taskId)
    ElMessage.success(`打卡成功 +${res?.pointsEarned ?? task.points} 积分`)
    await refresh()
  } catch (e) {
    // 409 今日已打卡 / 404 不存在 / 403 无权，归一化后补充提示
    ElMessage.error(pickMsg(e, '打卡失败，请稍后重试'))
  }
}

async function handleDelete(task: Task) {
  try {
    await deleteTask(task.taskId)
    ElMessage.success('已删除')
    await refresh()
  } catch (e) {
    // 已完成任务不能删除 → 400，归一化后补充提示
    ElMessage.error(pickMsg(e, '删除失败，请稍后重试'))
  }
}

onMounted(async () => {
  await Promise.allSettled([loadTasks(), loadStats()])
  renderChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div class="task-page">
    <div class="page-head">
      <div class="head-text">
        <h2 class="page-title">我的任务</h2>
        <p class="page-sub">{{ username }}，今天也要加油完成任务攒积分哦！</p>
      </div>
      <el-button type="primary" :icon="Plus" round @click="openCreate">创建任务</el-button>
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

    <!-- 周统计卡片 -->
    <section class="stats-grid">
      <div class="stat-card card total">
        <el-icon class="ico"><CircleCheck /></el-icon>
        <div class="num">{{ stats.totalCompleted }}</div>
        <div class="lbl">本周完成</div>
      </div>
      <div class="stat-card card points">
        <el-icon class="ico"><Star /></el-icon>
        <div class="num">{{ stats.totalPoints }}</div>
        <div class="lbl">本周积分</div>
      </div>
    </section>

    <!-- 本周任务趋势柱状图（完成数 + 积分双系列） -->
    <section class="card chart-card">
      <div class="card-head"><span>本周任务趋势</span></div>
      <div ref="chartRef" class="chart-box"></div>
      <el-empty v-if="!stats.dailyData.length" description="暂无周数据" />
    </section>

    <!-- 今日任务列表 -->
    <section class="card list-card">
      <div class="card-head list-head">
        <span>今日任务（{{ todayCompleted }}/{{ todayTotal }}）</span>
        <el-progress
          class="head-progress"
          :percentage="todayPercent"
          :stroke-width="8"
          color="#ff7043"
        />
      </div>

      <div v-loading="loading" class="task-list">
        <el-empty
          v-if="!loading && !tasks.length"
          description="今天还没有任务，去创建一个吧"
        >
          <el-button type="primary" :icon="Plus" round @click="openCreate">立即创建</el-button>
        </el-empty>

        <div
          v-for="task in tasks"
          :key="task.taskId"
          class="task-item"
          :class="{ 'is-completed': task.status === 'completed' }"
        >
          <div class="task-main">
            <div class="task-title">{{ task.title }}</div>
            <div v-if="task.description" class="task-desc">{{ task.description }}</div>
            <div class="task-meta">
              <el-tag size="small" :type="statusType(task.status)" effect="light">
                {{ statusLabel(task.status) }}
              </el-tag>
              <span v-if="task.completedAt" class="completed-time">
                完成于 {{ task.completedAt }}
              </span>
            </div>
          </div>

          <div class="task-points">
            <span class="points-num">{{ task.points }}</span>
            <span class="points-unit">积分</span>
          </div>

          <div class="task-actions">
            <el-button
              v-if="task.status === 'pending'"
              type="success"
              size="small"
              :icon="CircleCheck"
              round
              @click="handleComplete(task)"
            >
              打卡完成
            </el-button>

            <el-popconfirm
              title="确认删除这个任务吗？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDelete(task)"
            >
              <template #reference>
                <el-button
                  size="small"
                  :icon="Delete"
                  :disabled="task.status === 'completed'"
                  :title="task.status === 'completed' ? '已完成任务不可删除' : ''"
                  circle
                />
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </section>

    <!-- 创建任务弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建任务"
      width="460px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="72px">
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            maxlength="40"
            show-word-limit
            placeholder="例如：完成数学作业"
            clearable
          />
        </el-form-item>
        <el-form-item label="积分" prop="points">
          <el-input-number v-model="form.points" :min="1" :max="999" :step="1" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="120"
            show-word-limit
            placeholder="可选，写点任务说明吧"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">
          确定创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.task-page {
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
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}
.stat-card {
  @include flex-center;
  flex-direction: column;
  gap: 4px;
  padding: 20px 16px;
  text-align: center;

  .ico {
    font-size: 30px;
    color: $kid-primary;
  }
  .num {
    font-size: 30px;
    font-weight: 700;
    color: $kid-text;
  }
  .lbl {
    font-size: 13px;
    color: $kid-text-light;
  }
  &.total {
    background: linear-gradient(135deg, $kid-secondary, #1976d2);

    .ico,
    .num,
    .lbl {
      color: #fff;
    }
  }
  &.points {
    background: linear-gradient(135deg, $kid-accent, #ffa000);

    .ico,
    .num,
    .lbl {
      color: #fff;
    }
  }
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
.chart-box {
  width: 100%;
  height: 320px;
}
.list-head {
  @include flex-row-sb;
  gap: 16px;

  .head-progress {
    flex: 1;
    max-width: 160px;
  }
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 80px;
}
.task-item {
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
  &.is-completed {
    background: #f5f5f5;
    opacity: 0.75;

    .task-title {
      text-decoration: line-through;
      color: $kid-text-light;
    }
    .points-num {
      color: $kid-text-light;
    }
  }

  .task-main {
    flex: 1;
    min-width: 0;

    .task-title {
      font-size: 16px;
      font-weight: 700;
      color: $kid-text;
      @include text-ellipsis;
    }
    .task-desc {
      margin-top: 4px;
      font-size: 13px;
      color: $kid-text-light;
    }
    .task-meta {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 10px;

      .completed-time {
        font-size: 12px;
        color: $kid-success;
      }
    }
  }
  .task-points {
    @include flex-center;
    flex-direction: column;
    min-width: 64px;

    .points-num {
      font-size: 24px;
      font-weight: 700;
      color: $kid-primary-dark;
      line-height: 1;
    }
    .points-unit {
      margin-top: 2px;
      font-size: 12px;
      color: $kid-text-light;
    }
  }
  .task-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .task-item {
    flex-wrap: wrap;

    .task-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
  .list-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    .head-progress {
      max-width: 100%;
    }
  }
}
</style>
