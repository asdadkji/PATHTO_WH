<script setup lang="ts">
import { onMounted, ref, shallowRef, computed } from 'vue'
import { ElMessage } from 'element-plus'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart, GaugeChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import type { EChartsOption } from 'echarts'
import type {
  DashboardKpi,
  WeeklyTrend,
  TimeTrend,
  TaskTypeDistItem,
  TimeDistItem,
  MonthlyTimeComparison,
  HomeworkRate,
  PointsSourceItem,
  ProductCategoryDistItem,
} from '@/types'
import {
  getDashboardKpi,
  getWeeklyTrend,
  getTimeTrend,
  getTaskTypeDistribution,
  getTimeDistribution,
  getMonthlyTimeComparison,
  getHomeworkRate,
  getPointsSource,
  getProductCategoryDistribution,
} from '@/apis/admin'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const PALETTE = ['#ff7043', '#42a5f5', '#ffca28', '#66bb6a', '#ab47bc', '#ec407a', '#26c6da', '#ffa726']

const ACTIVITY_LABEL: Record<string, string> = {
  homework: '作业',
  game: '游戏',
  reading: '阅读',
  exercise: '运动',
  other: '其他',
}
const TASK_TYPE_LABEL: Record<string, string> = {
  fixed_daily: '固定每日',
  self_selected: '自选',
  challenge: '挑战',
}
const SOURCE_LABEL: Record<string, string> = {
  task: '任务完成',
  bonus: '连续打卡奖励',
  admin: '管理员调整',
  redemption: '兑换扣除',
}

// ─── KPI ─────────────────────────────────────────────────────
const kpi = ref<DashboardKpi | null>(null)
const kpiLoading = ref(true)

async function loadKpi() {
  kpiLoading.value = true
  try {
    kpi.value = await getDashboardKpi()
  } catch {
    ElMessage.error('KPI 数据加载失败')
  } finally {
    kpiLoading.value = false
  }
}

const kpiCards = computed(() => {
  const d = kpi.value
  if (!d) return []
  return [
    { label: '累计获得积分', value: d.totalPointsEarned, unit: '分', color: '#ff7043' },
    { label: '当前积分余额', value: d.currentBalance, unit: '分', color: '#42a5f5' },
    { label: '今日完成任务', value: d.todayCompletedTasks, unit: '个', color: '#66bb6a' },
    { label: '待审核兑换', value: d.pendingRedemptions, unit: '单', color: '#ffca28' },
    { label: '今日完成率', value: Math.round(d.todayCompletionRate * 100), unit: '%', color: '#ab47bc' },
    { label: '本月积分流通', value: d.monthlyPointFlow, unit: '分', color: '#ec407a' },
  ]
})

// ─── #7 近7天积分与任务趋势（柱状+折线混合） ──────────────────
const weeklyTrendOption = shallowRef<EChartsOption>({})
const weeklyTrendLoading = ref(true)

async function loadWeeklyTrend() {
  weeklyTrendLoading.value = true
  try {
    const d: WeeklyTrend = await getWeeklyTrend()
    weeklyTrendOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['完成任务数', '获得积分'], bottom: 0 },
      grid: { top: 20, left: 50, right: 50, bottom: 40 },
      xAxis: { type: 'category', data: d.labels },
      yAxis: [
        { type: 'value', name: '任务数', position: 'left' },
        { type: 'value', name: '积分', position: 'right' },
      ],
      series: [
        {
          name: '完成任务数',
          type: 'bar',
          data: d.taskCounts,
          itemStyle: { color: '#42a5f5', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '获得积分',
          type: 'line',
          yAxisIndex: 1,
          data: d.pointsEarned,
          smooth: true,
          itemStyle: { color: '#ff7043' },
          areaStyle: { color: 'rgba(255,112,67,0.1)' },
        },
      ],
    }
  } catch {
    weeklyTrendOption.value = {}
  } finally {
    weeklyTrendLoading.value = false
  }
}

// ─── #8 近7天时间分配趋势（堆叠面积图） ─────────────────────
const timeTrendOption = shallowRef<EChartsOption>({})
const timeTrendLoading = ref(true)

async function loadTimeTrend() {
  timeTrendLoading.value = true
  try {
    const d: TimeTrend = await getTimeTrend()
    const types = Object.keys(d.series)
    timeTrendOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { data: types.map((t) => ACTIVITY_LABEL[t] || t), bottom: 0 },
      grid: { top: 20, left: 50, right: 20, bottom: 40 },
      xAxis: { type: 'category', data: d.labels, boundaryGap: false },
      yAxis: { type: 'value', name: '分钟' },
      series: types.map((t, i) => ({
        name: ACTIVITY_LABEL[t] || t,
        type: 'line',
        stack: 'total',
        smooth: true,
        data: d.series[t],
        areaStyle: { opacity: 0.4 },
        itemStyle: { color: PALETTE[i % PALETTE.length] },
      })),
    }
  } catch {
    timeTrendOption.value = {}
  } finally {
    timeTrendLoading.value = false
  }
}

// ─── #9 任务类型分布（环形图） ─────────────────────────────
const taskTypeOption = shallowRef<EChartsOption>({})
const taskTypeLoading = ref(true)

async function loadTaskType() {
  taskTypeLoading.value = true
  try {
    const d: TaskTypeDistItem[] = await getTaskTypeDistribution()
    taskTypeOption.value = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          data: d.map((item, i) => ({
            name: TASK_TYPE_LABEL[item.taskType] || item.taskType,
            value: item.count,
            itemStyle: { color: PALETTE[i % PALETTE.length] },
          })),
        },
      ],
    }
  } catch {
    taskTypeOption.value = {}
  } finally {
    taskTypeLoading.value = false
  }
}

// ─── #10 活动类型时间占比（南丁格尔玫瑰图） ──────────────────
const timeDistOption = shallowRef<EChartsOption>({})
const timeDistLoading = ref(true)

async function loadTimeDist() {
  timeDistLoading.value = true
  try {
    const d: TimeDistItem[] = await getTimeDistribution()
    timeDistOption.value = {
      tooltip: { trigger: 'item', formatter: '{b}: {c}分钟 ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          roseType: 'radius',
          radius: ['20%', '70%'],
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{c}分钟' },
          data: d.map((item, i) => ({
            name: ACTIVITY_LABEL[item.activityType] || item.activityType,
            value: item.minutes,
            itemStyle: { color: PALETTE[i % PALETTE.length] },
          })),
        },
      ],
    }
  } catch {
    timeDistOption.value = {}
  } finally {
    timeDistLoading.value = false
  }
}

// ─── #11 本月 vs 上月时间对比（分组柱状图） ──────────────────
const monthlyTimeOption = shallowRef<EChartsOption>({})
const monthlyTimeLoading = ref(true)

async function loadMonthlyTime() {
  monthlyTimeLoading.value = true
  try {
    const d: MonthlyTimeComparison = await getMonthlyTimeComparison()
    const cats = d.categories
    monthlyTimeOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['本月', '上月'], bottom: 0 },
      grid: { top: 20, left: 50, right: 20, bottom: 40 },
      xAxis: { type: 'category', data: cats.map((c) => ACTIVITY_LABEL[c] || c) },
      yAxis: { type: 'value', name: '分钟' },
      series: [
        {
          name: '本月',
          type: 'bar',
          data: cats.map((c) => d.thisMonth[c] || 0),
          itemStyle: { color: '#ff7043', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '上月',
          type: 'bar',
          data: cats.map((c) => d.lastMonth[c] || 0),
          itemStyle: { color: '#42a5f5', borderRadius: [4, 4, 0, 0] },
        },
      ],
    }
  } catch {
    monthlyTimeOption.value = {}
  } finally {
    monthlyTimeLoading.value = false
  }
}

// ─── #12 作业达标率（仪表盘） ──────────────────────────────
const homeworkRateOption = shallowRef<EChartsOption>({})
const homeworkRateLoading = ref(true)

async function loadHomeworkRate() {
  homeworkRateLoading.value = true
  try {
    const d: HomeworkRate = await getHomeworkRate()
    const pct = Math.round(d.rate * 100)
    homeworkRateOption.value = {
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          radius: '90%',
          progress: { show: true, width: 16, roundCap: true },
          pointer: { show: false },
          axisLine: { lineStyle: { width: 16, color: [[1, '#eee']] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            fontSize: 28,
            fontWeight: 700,
            offsetCenter: [0, 0],
            color: pct >= 80 ? '#66bb6a' : pct >= 50 ? '#ffca28' : '#ef5350',
          },
          title: {
            offsetCenter: [0, '30%'],
            fontSize: 14,
            color: '#8d6e63',
          },
          data: [{ value: pct, name: `达标 ${d.targetDays}/${d.totalDays} 天` }],
        },
      ],
    }
  } catch {
    homeworkRateOption.value = {}
  } finally {
    homeworkRateLoading.value = false
  }
}

// ─── #13 积分来源构成（环形图） ─────────────────────────────
const pointsSourceOption = shallowRef<EChartsOption>({})
const pointsSourceLoading = ref(true)

async function loadPointsSource() {
  pointsSourceLoading.value = true
  try {
    const d: PointsSourceItem[] = await getPointsSource()
    pointsSourceOption.value = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          data: d.map((item, i) => ({
            name: SOURCE_LABEL[item.sourceType] || item.sourceType,
            value: item.total,
            itemStyle: { color: PALETTE[i % PALETTE.length] },
          })),
        },
      ],
    }
  } catch {
    pointsSourceOption.value = {}
  } finally {
    pointsSourceLoading.value = false
  }
}

// ─── #14 商品分类分布（饼图） ──────────────────────────────
const productCatOption = shallowRef<EChartsOption>({})
const productCatLoading = ref(true)

const PRODUCT_CAT_LABEL: Record<string, string> = {
  toy: '玩具',
  game_time: '游戏时间',
  activity: '活动',
  food: '食物',
  book: '书籍',
  other: '其他',
}

async function loadProductCat() {
  productCatLoading.value = true
  try {
    const d: ProductCategoryDistItem[] = await getProductCategoryDistribution()
    productCatOption.value = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: '70%',
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          data: d.map((item, i) => ({
            name: PRODUCT_CAT_LABEL[item.category] || item.category,
            value: item.count,
            itemStyle: { color: PALETTE[i % PALETTE.length] },
          })),
        },
      ],
    }
  } catch {
    productCatOption.value = {}
  } finally {
    productCatLoading.value = false
  }
}

// ─── 初始化 ─────────────────────────────────────────────────
const anyLoading = computed(
  () =>
    kpiLoading.value ||
    weeklyTrendLoading.value ||
    timeTrendLoading.value ||
    taskTypeLoading.value ||
    timeDistLoading.value ||
    monthlyTimeLoading.value ||
    homeworkRateLoading.value ||
    pointsSourceLoading.value ||
    productCatLoading.value,
)

onMounted(() => {
  loadKpi()
  loadWeeklyTrend()
  loadTimeTrend()
  loadTaskType()
  loadTimeDist()
  loadMonthlyTime()
  loadHomeworkRate()
  loadPointsSource()
  loadProductCat()
})
</script>

<template>
  <div v-loading="anyLoading" class="dashboard-page">
    <div class="page-head">
      <h2 class="page-title">管理概览</h2>
      <p class="page-sub">全方位查看孩子的任务完成、时间分配与积分数据。</p>
    </div>

    <!-- KPI 卡片 -->
    <section class="kpi-grid">
      <div v-for="(card, idx) in kpiCards" :key="idx" class="kpi-card" :style="{ borderTopColor: card.color }">
        <div class="kpi-value" :style="{ color: card.color }">{{ card.value }}<span class="kpi-unit">{{ card.unit }}</span></div>
        <div class="kpi-label">{{ card.label }}</div>
      </div>
    </section>

    <!-- 趋势分析 -->
    <h3 class="section-title">趋势分析</h3>
    <section class="chart-grid">
      <div class="chart-card">
        <div class="chart-title">近7天积分与任务趋势</div>
        <v-chart v-if="Object.keys(weeklyTrendOption).length" :option="weeklyTrendOption" autoresize class="chart" />
        <div v-else class="chart-empty">暂无数据</div>
      </div>
      <div class="chart-card">
        <div class="chart-title">近7天时间分配趋势</div>
        <v-chart v-if="Object.keys(timeTrendOption).length" :option="timeTrendOption" autoresize class="chart" />
        <div v-else class="chart-empty">暂无数据</div>
      </div>
    </section>

    <!-- 任务分析 -->
    <h3 class="section-title">任务分析</h3>
    <section class="chart-grid">
      <div class="chart-card">
        <div class="chart-title">任务类型分布</div>
        <v-chart v-if="Object.keys(taskTypeOption).length" :option="taskTypeOption" autoresize class="chart" />
        <div v-else class="chart-empty">暂无数据</div>
      </div>
      <div class="chart-card chart-placeholder" />
    </section>

    <!-- 时间分析 -->
    <h3 class="section-title">时间分析</h3>
    <section class="chart-grid">
      <div class="chart-card">
        <div class="chart-title">活动类型时间占比</div>
        <v-chart v-if="Object.keys(timeDistOption).length" :option="timeDistOption" autoresize class="chart" />
        <div v-else class="chart-empty">暂无数据</div>
      </div>
      <div class="chart-card">
        <div class="chart-title">本月 vs 上月时间对比</div>
        <v-chart v-if="Object.keys(monthlyTimeOption).length" :option="monthlyTimeOption" autoresize class="chart" />
        <div v-else class="chart-empty">暂无数据</div>
      </div>
      <div class="chart-card">
        <div class="chart-title">作业达标率</div>
        <v-chart v-if="Object.keys(homeworkRateOption).length" :option="homeworkRateOption" autoresize class="chart" />
        <div v-else class="chart-empty">暂无数据</div>
      </div>
      <div class="chart-card chart-placeholder" />
    </section>

    <!-- 积分分析 -->
    <h3 class="section-title">积分分析</h3>
    <section class="chart-grid">
      <div class="chart-card">
        <div class="chart-title">积分来源构成</div>
        <v-chart v-if="Object.keys(pointsSourceOption).length" :option="pointsSourceOption" autoresize class="chart" />
        <div v-else class="chart-empty">暂无数据</div>
      </div>
      <div class="chart-card chart-placeholder" />
    </section>

    <!-- 商品分析 -->
    <h3 class="section-title">商品分析</h3>
    <section class="chart-grid">
      <div class="chart-card">
        <div class="chart-title">商品分类分布</div>
        <v-chart v-if="Object.keys(productCatOption).length" :option="productCatOption" autoresize class="chart" />
        <div v-else class="chart-empty">暂无数据</div>
      </div>
      <div class="chart-card chart-placeholder" />
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

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: $kid-text;
  margin: 8px 0 -4px;
  padding-left: 4px;
}

/* ─── KPI 卡片 ─────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.kpi-card {
  background: $kid-card-bg;
  border-radius: $kid-radius;
  padding: 20px 16px;
  box-shadow: $kid-shadow;
  border-top: 3px solid transparent;
  text-align: center;

  .kpi-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }
  .kpi-unit {
    font-size: 14px;
    font-weight: 400;
    margin-left: 2px;
  }
  .kpi-label {
    margin-top: 6px;
    font-size: 13px;
    color: $kid-text-light;
  }
}

/* ─── 图表网格 ─────────────────────────────────────────── */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: $kid-card-bg;
  border-radius: $kid-radius;
  box-shadow: $kid-shadow;
  padding: 20px;
  display: flex;
  flex-direction: column;

  .chart-title {
    font-size: 15px;
    font-weight: 700;
    color: $kid-text;
    margin-bottom: 12px;
  }

  .chart {
    width: 100%;
    height: 320px;
  }

  .chart-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $kid-text-light;
    font-size: 14px;
    min-height: 200px;
  }
}

.chart-placeholder {
  visibility: hidden;
}
</style>
