<script setup lang="ts">
// 仪表盘首页：今日概览卡片 + 本周积分趋势(ECharts) + 月度报告
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import echarts from '@/utils/echarts'
import type { EChartsInstance } from '@/utils/echarts'
import { getMonthly, getOverview, getWeekly } from '@/apis/dashboard'
import { useAuthStore } from '@/stores/auth'
import { CircleCheck, Clock, List, Star } from '@element-plus/icons-vue'
import type {
  DashboardMonthly,
  DashboardOverview,
  DashboardWeekly,
} from '@/types'

const auth = useAuthStore()

const chartRef = ref<HTMLDivElement>()
const chart = shallowRef<EChartsInstance | null>(null)

const overview = reactive<DashboardOverview>({
  totalPoints: 0,
  todayTasks: 0,
  completed: 0,
  homeworkMinutes: 0,
  gameMinutes: 0,
})
const weekly = reactive<DashboardWeekly>({ labels: [], data: [] })
const monthly = reactive<DashboardMonthly>({
  totalTasks: 0,
  completionRate: 0,
  totalPoints: 0,
  homeWorkMinutes: 0,
})
const error = ref(false)

const taskPercent = computed(() =>
  overview.todayTasks > 0
    ? Math.round((overview.completed / overview.todayTasks) * 100)
    : 0,
)

const username = computed(() => auth.userInfo?.username ?? '小朋友')

async function loadOverview() {
  try {
    Object.assign(overview, await getOverview())
  } catch {
    error.value = true
  }
}
async function loadWeekly() {
  try {
    Object.assign(weekly, await getWeekly())
  } catch {
    error.value = true
  }
}
async function loadMonthly() {
  try {
    Object.assign(monthly, await getMonthly())
  } catch {
    error.value = true
  }
}

function renderChart() {
  if (!chartRef.value) return
  // 使用局部变量，避免通过 getter 访问时 TS 无法收窄 null
  let inst = chart.value
  if (!inst) {
    inst = echarts.init(chartRef.value)
    chart.value = inst
  }
  const option = {
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: weekly.labels,
      axisLine: { lineStyle: { color: '#ccc' } },
    },
    yAxis: { type: 'value', name: '积分' },
    series: [
      {
        name: '每日积分',
        type: 'line',
        smooth: true,
        data: weekly.data,
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#FF7043' },
      },
    ],
  }
  inst.setOption(option, true)
}

function handleResize() {
  chart.value?.resize()
}

onMounted(async () => {
  await Promise.allSettled([loadOverview(), loadWeekly(), loadMonthly()])
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
  <div class="dashboard-page">
    <div class="page-head">
      <h2 class="page-title">嗨，{{ username }}，今天加油哦！</h2>
      <p class="page-sub">完成每日任务，攒取更多积分～</p>
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

    <section class="overview-grid">
      <div class="stat-card card total">
        <el-icon class="ico"><Star /></el-icon>
        <div class="num">{{ overview.totalPoints }}</div>
        <div class="lbl">总积分</div>
      </div>
      <div class="stat-card card">
        <el-icon class="ico"><List /></el-icon>
        <div class="num">{{ overview.todayTasks }}</div>
        <div class="lbl">今日任务</div>
        <el-progress :percentage="taskPercent" :stroke-width="8" color="#FF7043" />
      </div>
      <div class="stat-card card">
        <el-icon class="ico"><CircleCheck /></el-icon>
        <div class="num">{{ overview.completed }} / {{ overview.todayTasks }}</div>
        <div class="lbl">已完成</div>
      </div>
      <div class="stat-card card">
        <el-icon class="ico"><Clock /></el-icon>
        <div class="num">{{ overview.homeworkMinutes }}′</div>
        <div class="lbl">今日作业(分钟)</div>
      </div>
      <div class="stat-card card">
        <el-icon class="ico"><Clock /></el-icon>
        <div class="num">{{ overview.gameMinutes }}′</div>
        <div class="lbl">今日游戏(分钟)</div>
      </div>
    </section>

    <section class="card chart-card">
      <div class="card-head"><span>本周积分趋势</span></div>
      <div ref="chartRef" class="chart-box"></div>
      <el-empty v-if="!weekly.data.length" description="暂无周数据" />
    </section>

    <section class="card monthly-card">
      <div class="card-head"><span>本月报告</span></div>
      <div class="monthly-grid">
        <div class="m-item">
          <div class="m-num">{{ monthly.totalTasks }}</div>
          <div class="m-lbl">任务总数</div>
        </div>
        <div class="m-item">
          <div class="m-num">{{ monthly.completionRate }}%</div>
          <div class="m-lbl">完成率</div>
        </div>
        <div class="m-item">
          <div class="m-num">{{ monthly.totalPoints }}</div>
          <div class="m-lbl">累计积分</div>
        </div>
        <div class="m-item">
          <div class="m-num">{{ monthly.homeWorkMinutes }}′</div>
          <div class="m-lbl">作业时长(分)</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.dashboard-page {
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
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.stat-card {
  @include flex-center;
  flex-direction: column;
  gap: 4px;
  padding: 20px 16px;
  text-align: center;

  .ico {
    font-size: 28px;
    color: $kid-primary;
  }
  .num {
    font-size: 28px;
    font-weight: 700;
    color: $kid-text;
  }
  .lbl {
    font-size: 13px;
    color: $kid-text-light;
  }
  &.total {
    background: linear-gradient(135deg, $kid-primary, $kid-primary-dark);
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
.monthly-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;

  .m-item {
    text-align: center;
    padding: 16px 8px;
    border-radius: $kid-radius-sm;
    background: #fff8e1;

    .m-num {
      font-size: 26px;
      font-weight: 700;
      color: $kid-primary-dark;
    }
    .m-lbl {
      margin-top: 4px;
      font-size: 13px;
      color: $kid-text-light;
    }
  }
}
</style>
