<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import echarts from '@/utils/echarts'
import type { EChartsInstance } from '@/utils/echarts'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { CircleCheck, Delete, Plus, Star, Trophy, Lightning, Clock } from '@element-plus/icons-vue'
import {
  completeTask,
  createTask,
  deleteTask,
  getTodayTasks,
  getWeeklyStats,
  getAvailableTemplates,
  selectSelfSelectedTask,
  startChallenge,
} from '@/apis/task'
import { useAuthStore } from '@/stores/auth'
import type { Task, TaskStatus, TaskTemplate, TaskWeeklyStats } from '@/types'

const auth = useAuthStore()

const stats = reactive<TaskWeeklyStats>({ totalCompleted: 0, totalPoints: 0, dailyData: [] })
const tasks = ref<Task[]>([])
const templates = ref<TaskTemplate[]>([])
const loading = ref(false)
const error = ref(false)

const chartRef = ref<HTMLDivElement>()
const chart = shallowRef<EChartsInstance | null>(null)

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<{ title: string; points: number; description: string }>({
  title: '',
  points: 1,
  description: '',
})
const rules: FormRules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  points: [{ required: true, type: 'number', min: 1, message: '积分至少为 1', trigger: 'change' }],
}

const username = computed(() => auth.userInfo?.username ?? '小朋友')
const fixedTasks = computed(() => tasks.value.filter((t) => t.taskType === 'fixed_daily'))
const selfSelectedTasks = computed(() => tasks.value.filter((t) => t.taskType === 'self_selected'))
const challengeTasks = computed(() => tasks.value.filter((t) => t.taskType === 'challenge'))
const todayCompleted = computed(() => tasks.value.filter((t) => t.status === 'completed').length)
const todayTotal = computed(() => tasks.value.length)
const todayPercent = computed(() =>
  todayTotal.value > 0 ? Math.round((todayCompleted.value / todayTotal.value) * 100) : 0,
)

const selfSelectedTemplates = computed(() =>
  templates.value.filter((t) => t.taskType === 'self_selected'),
)
const challengeTemplates = computed(() =>
  templates.value.filter((t) => t.taskType === 'challenge'),
)

function pickMsg(e: unknown, fallback = '操作失败，请稍后重试') {
  return (e as { message?: string } | null)?.message || fallback
}

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

async function loadTemplates() {
  try {
    const data = await getAvailableTemplates()
    templates.value = Array.isArray(data) ? data : []
  } catch {
    templates.value = []
  }
}

function renderChart() {
  if (!chartRef.value) return
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
        type: 'value', name: '完成数',
        nameTextStyle: { color: '#42a5f5' },
        axisLabel: { color: '#8d6e63' },
        splitLine: { lineStyle: { color: '#eee' } },
      },
      {
        type: 'value', name: '积分',
        nameTextStyle: { color: '#ff7043' },
        axisLabel: { color: '#8d6e63' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '完成数', type: 'bar',
        data: daily.map((d) => d.completed),
        itemStyle: { color: '#42a5f5', borderRadius: [6, 6, 0, 0] },
        barWidth: 18, yAxisIndex: 0,
      },
      {
        name: '积分', type: 'bar',
        data: daily.map((d) => d.points),
        itemStyle: { color: '#ff7043', borderRadius: [6, 6, 0, 0] },
        barWidth: 18, yAxisIndex: 1,
      },
    ],
  }
  inst.setOption(option, true)
}

function handleResize() { chart.value?.resize() }

async function refresh() {
  await Promise.allSettled([loadTasks(), loadStats()])
  renderChart()
}

function statusType(status: TaskStatus): 'info' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'pending': return 'warning'
    case 'completed': return 'success'
    case 'cancelled': return 'info'
    case 'expired': return 'danger'
    default: return 'info'
  }
}

function statusLabel(status: TaskStatus): string {
  switch (status) {
    case 'pending': return '待完成'
    case 'completed': return '已完成'
    case 'cancelled': return '已取消'
    case 'expired': return '已过期'
    default: return status
  }
}

function streakBadge(streakCount: number): string {
  if (streakCount <= 0) return ''
  return `连续${streakCount}天`
}

function nextMilestone(streakCount: number): string {
  if (streakCount < 7) return `距7天里程碑还差${7 - streakCount}天`
  if (streakCount < 30) return `距30天里程碑还差${30 - streakCount}天`
  return '已达成所有里程碑'
}

function milestoneProgress(streakCount: number): number {
  if (streakCount >= 30) return 100
  if (streakCount >= 7) return Math.round(((streakCount - 7) / (30 - 7)) * 100)
  return Math.round((streakCount / 7) * 100)
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
  try { await inst.validate() } catch { return }
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
    ElMessage.error(pickMsg(e, '创建失败，请稍后重试'))
  } finally {
    submitting.value = false
  }
}

async function handleComplete(task: Task) {
  try {
    const res = await completeTask(task.taskId)
    let msg = `打卡成功 +${res?.pointsEarned ?? task.points} 积分`
    if (res?.bonusEarned && res.bonusEarned > 0) {
      msg += `（含连续打卡奖励 +${res.bonusEarned}）`
    }
    ElMessage.success(msg)
    await Promise.all([refresh(), auth.refreshUserInfo()])
  } catch (e) {
    ElMessage.error(pickMsg(e, '打卡失败，请稍后重试'))
  }
}

async function handleDelete(task: Task) {
  try {
    await deleteTask(task.taskId)
    ElMessage.success('已删除')
    await refresh()
  } catch (e) {
    ElMessage.error(pickMsg(e, '删除失败，请稍后重试'))
  }
}

async function handleSelectTask(templateId: string) {
  try {
    await selectSelfSelectedTask(templateId)
    ElMessage.success('已加入今日任务')
    await refresh()
  } catch (e) {
    ElMessage.error(pickMsg(e, '选择失败'))
  }
}

async function handleStartChallenge(templateId: string) {
  try {
    await startChallenge(templateId)
    ElMessage.success('挑战已接受，加油！')
    await refresh()
  } catch (e) {
    ElMessage.error(pickMsg(e, '接受挑战失败'))
  }
}

onMounted(async () => {
  await Promise.allSettled([loadTasks(), loadStats(), loadTemplates()])
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
      description="部分数据可能未能加载，当前展示默认值。"
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

    <!-- 本周任务趋势 -->
    <section class="card chart-card">
      <div class="card-head"><span>本周任务趋势</span></div>
      <div ref="chartRef" class="chart-box"></div>
      <el-empty v-if="!stats.dailyData.length" description="暂无周数据" />
    </section>

    <!-- 区域1：今日固定任务 -->
    <section class="card section-card">
      <div class="card-head section-head">
        <span><el-icon><Clock /></el-icon> 今日固定任务</span>
        <el-tag size="small" type="info" effect="plain">每天自动出现</el-tag>
      </div>
      <div v-loading="loading" class="task-list">
        <el-empty v-if="!loading && !fixedTasks.length" description="暂无固定任务" :image-size="60" />
        <div
          v-for="task in fixedTasks"
          :key="task.taskId"
          class="task-item"
          :class="{ 'is-completed': task.status === 'completed' }"
        >
          <div class="task-main">
            <div class="task-title">
              {{ task.title }}
              <el-tag v-if="streakBadge(task.streakCount)" size="small" effect="dark" round
                :color="task.streakCount >= 7 ? '#ff7043' : '#42a5f5'"
                style="color: #fff; border: none; margin-left: 8px;">
                {{ streakBadge(task.streakCount) }}
              </el-tag>
            </div>
            <div v-if="task.streakCount > 0" class="streak-progress">
              <el-progress
                :percentage="milestoneProgress(task.streakCount)"
                :stroke-width="6"
                :show-text="false"
                :color="task.streakCount >= 7 ? '#ff7043' : '#42a5f5'"
              />
              <span class="milestone-text">{{ nextMilestone(task.streakCount) }}</span>
            </div>
            <div class="task-meta">
              <el-tag size="small" :type="statusType(task.status)" effect="light">
                {{ statusLabel(task.status) }}
              </el-tag>
              <span v-if="task.completedAt" class="completed-time">完成于 {{ task.completedAt }}</span>
            </div>
          </div>
          <div class="task-points">
            <span class="points-num">{{ task.points }}</span>
            <span class="points-unit">积分</span>
            <span v-if="task.streakBonus7 > 0" class="bonus-hint">7天+{{ task.streakBonus7 }}</span>
          </div>
          <div class="task-actions">
            <el-button
              v-if="task.status === 'pending'"
              type="success" size="small" :icon="CircleCheck" round
              @click="handleComplete(task)"
            >打卡完成</el-button>
            <el-popconfirm title="确认删除这个任务吗？" @confirm="handleDelete(task)">
              <template #reference>
                <el-button size="small" :icon="Delete"
                  :disabled="task.status === 'completed'" circle />
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </section>

    <!-- 区域2：自选任务 -->
    <section class="card section-card">
      <div class="card-head section-head">
        <span><el-icon><Lightning /></el-icon> 自选任务</span>
        <el-tag size="small" type="success" effect="plain">从模板选择</el-tag>
      </div>
      <div v-if="selfSelectedTasks.length" class="task-list" style="margin-bottom: 12px;">
        <div
          v-for="task in selfSelectedTasks"
          :key="task.taskId"
          class="task-item"
          :class="{ 'is-completed': task.status === 'completed' }"
        >
          <div class="task-main">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta">
              <el-tag size="small" :type="statusType(task.status)" effect="light">
                {{ statusLabel(task.status) }}
              </el-tag>
            </div>
          </div>
          <div class="task-points">
            <span class="points-num">{{ task.points }}</span>
            <span class="points-unit">积分</span>
          </div>
          <div class="task-actions">
            <el-button
              v-if="task.status === 'pending'"
              type="success" size="small" :icon="CircleCheck" round
              @click="handleComplete(task)"
            >打卡完成</el-button>
            <el-popconfirm title="确认删除？" @confirm="handleDelete(task)">
              <template #reference>
                <el-button size="small" :icon="Delete"
                  :disabled="task.status === 'completed'" circle />
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
      <div class="template-picker">
        <el-select placeholder="选择自选任务加入今日列表" filterable style="width: 280px;"
          @change="(val: string) => { handleSelectTask(val); }" value="">
          <el-option
            v-for="tpl in selfSelectedTemplates"
            :key="tpl.templateId"
            :label="`${tpl.title}（+${tpl.defaultPoints}积分）`"
            :value="tpl.templateId"
          />
        </el-select>
      </div>
    </section>

    <!-- 区域3：挑战任务 -->
    <section class="card section-card">
      <div class="card-head section-head">
        <span><el-icon><Trophy /></el-icon> 挑战任务</span>
        <el-tag size="small" type="warning" effect="plain">高积分奖励</el-tag>
      </div>
      <div v-if="challengeTasks.length" class="task-list" style="margin-bottom: 12px;">
        <div
          v-for="task in challengeTasks"
          :key="task.taskId"
          class="task-item challenge-item"
          :class="{ 'is-completed': task.status === 'completed' }"
        >
          <div class="task-main">
            <div class="task-title">{{ task.title }}</div>
            <div v-if="task.description" class="task-desc">{{ task.description }}</div>
            <div class="task-meta">
              <el-tag size="small" :type="statusType(task.status)" effect="light">
                {{ statusLabel(task.status) }}
              </el-tag>
            </div>
          </div>
          <div class="task-points">
            <span class="points-num challenge-points">{{ task.points }}</span>
            <span class="points-unit">积分</span>
          </div>
          <div class="task-actions">
            <el-button
              v-if="task.status === 'pending'"
              type="warning" size="small" :icon="Trophy" round
              @click="handleComplete(task)"
            >完成挑战</el-button>
          </div>
        </div>
      </div>
      <div class="template-picker">
        <div class="challenge-grid">
          <div
            v-for="tpl in challengeTemplates"
            :key="tpl.templateId"
            class="challenge-card"
          >
            <div class="challenge-name">{{ tpl.title }}</div>
            <div class="challenge-desc">{{ tpl.description || '接受挑战，证明你自己！' }}</div>
            <div class="challenge-reward">+{{ tpl.defaultPoints }} 积分</div>
            <el-button type="warning" size="small" :icon="Trophy" round plain
              @click="handleStartChallenge(tpl.templateId)">接受挑战</el-button>
          </div>
        </div>
        <el-empty v-if="!challengeTemplates.length" description="暂无挑战任务" :image-size="60" />
      </div>
    </section>

    <!-- 今日进度 -->
    <section class="card progress-card">
      <div class="card-head">今日进度（{{ todayCompleted }}/{{ todayTotal }}）</div>
      <el-progress :percentage="todayPercent" :stroke-width="12" color="#ff7043" />
    </section>

    <!-- 创建任务弹窗 -->
    <el-dialog v-model="dialogVisible" title="创建自定义任务" width="460px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="72px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="40" show-word-limit
            placeholder="例如：完成数学作业" clearable />
        </el-form-item>
        <el-form-item label="积分" prop="points">
          <el-input-number v-model="form.points" :min="1" :max="999" :step="1" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3"
            maxlength="120" show-word-limit placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">确定创建</el-button>
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
    .page-title { font-size: 22px; font-weight: 700; color: $kid-text; }
    .page-sub { margin-top: 4px; font-size: 14px; color: $kid-text-light; }
  }
}
.load-tip { margin-bottom: 4px; }
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
  .ico { font-size: 30px; color: $kid-primary; }
  .num { font-size: 30px; font-weight: 700; color: $kid-text; }
  .lbl { font-size: 13px; color: $kid-text-light; }
  &.total {
    background: linear-gradient(135deg, $kid-secondary, #1976d2);
    .ico, .num, .lbl { color: #fff; }
  }
  &.points {
    background: linear-gradient(135deg, $kid-accent, #ffa000);
    .ico, .num, .lbl { color: #fff; }
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
.chart-box { width: 100%; height: 320px; }

.section-head {
  @include flex-row-sb;
  display: flex;
  align-items: center;
  gap: 8px;
  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 40px;
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
    .task-title { text-decoration: line-through; color: $kid-text-light; }
    .points-num { color: $kid-text-light; }
  }
  &.challenge-item {
    background: linear-gradient(135deg, #fff3e0, #fff8e1);
    border-left: 4px solid $kid-accent;
  }
  .task-main {
    flex: 1;
    min-width: 0;
    .task-title {
      font-size: 16px;
      font-weight: 700;
      color: $kid-text;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
    .task-desc {
      margin-top: 4px;
      font-size: 13px;
      color: $kid-text-light;
    }
    .streak-progress {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      .el-progress { flex: 1; max-width: 200px; }
      .milestone-text { font-size: 12px; color: $kid-text-light; white-space: nowrap; }
    }
    .task-meta {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      .completed-time { font-size: 12px; color: $kid-success; }
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
    .challenge-points { color: #e6a23c; }
    .points-unit { margin-top: 2px; font-size: 12px; color: $kid-text-light; }
    .bonus-hint { margin-top: 4px; font-size: 11px; color: $kid-success; }
  }
  .task-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.template-picker {
  margin-top: 4px;
}
.challenge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.challenge-card {
  padding: 16px;
  border-radius: $kid-radius-sm;
  background: linear-gradient(135deg, #fff3e0, #fffde7);
  border: 1px dashed #ffe0b2;
  text-align: center;
  .challenge-name {
    font-size: 15px;
    font-weight: 700;
    color: $kid-text;
    margin-bottom: 4px;
  }
  .challenge-desc {
    font-size: 12px;
    color: $kid-text-light;
    margin-bottom: 8px;
    min-height: 32px;
  }
  .challenge-reward {
    font-size: 18px;
    font-weight: 700;
    color: #e6a23c;
    margin-bottom: 10px;
  }
}

.progress-card {
  .card-head { margin-bottom: 8px; }
}

@media (max-width: 768px) {
  .task-item {
    flex-wrap: wrap;
    .task-actions { width: 100%; justify-content: flex-end; }
  }
  .challenge-grid { grid-template-columns: 1fr; }
}
</style>
