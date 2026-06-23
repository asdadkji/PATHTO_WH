<script setup lang="ts">
import {ArrowRight, Calendar, CaretBottom, CaretTop, Male, Warning} from "@element-plus/icons-vue";
import {useTransition} from "@vueuse/core";
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import dayjs from "dayjs";
import * as echarts from "echarts";
//引入后台仓库
import {useAdminStore} from "@/stores/admin";
const adminStore = useAdminStore()
//ts
interface ChartConfig {
  title: string
  tagType: 'success' | 'warning' | 'danger' | 'info'
  tagText: string
  type: 'bar' | 'line'
  data: number[]
  categories: string[]
  formatter?: (value: number) => string
  footerItems?: Array<{
    label: string
    value: string
    isPositive?: boolean
    isNegative?: boolean
  }>
}

// 生成默认图表数据
const generateDefaultCategories = () => {
  const categories: string[] = []
  const today = dayjs()
  for (let i = 6; i >= 0; i--) {
    categories.push(today.subtract(i, 'day').format('MM-DD'))
  }
  return categories
}

// 默认数据
const defaultDailyDealCount = {
  data: [120, 150, 180, 145, 200, 165, 190],
  categories: generateDefaultCategories(),
  total: 1150,
  max: 200,
  today: 190
}

const defaultDailyActive = {
  data: [850, 920, 1050, 880, 1100, 980, 1020],
  categories: generateDefaultCategories(),
  total: 6800,
  max: 1100,
  today: 1020
}

const defaultDailyGMV = {
  data: [12500, 15200, 18800, 14500, 22000, 16800, 19500],
  categories: generateDefaultCategories(),
  total: 119300,
  max: 22000,
  today: 19500
}

// 计算环比增长率
const calculateGrowthRate = (current: number | undefined, previous: number | undefined): string => {
  if (!current || !previous || previous === 0) {
    return '0%'
  }
  const rate = ((current - previous) / previous) * 100
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

// 检查数据是否有实际值（不全为0）
const hasRealData = (data: number[] | undefined): boolean => {
  if (!data || data.length === 0) return false
  return data.some(value => value > 0)
}

// 获取数据或使用默认值
const getChartDataWithDefault = () => {
  const dealCount = adminStore.chartData.dailyDealCount
  const active = adminStore.chartData.dailyActive
  const gmv = adminStore.chartData.dailyGMV

  return {
    dailyDealCount: dealCount && hasRealData(dealCount.data) ? dealCount : defaultDailyDealCount,
    dailyActive: active && hasRealData(active.data) ? active : defaultDailyActive,
    dailyGMV: gmv && hasRealData(gmv.data) ? gmv : defaultDailyGMV
  }
}

//日期倒计时
const getMonthEndTime = () => {
  const now = dayjs()
  const nextMonth = now.add(1, 'month').startOf('month')
  const monthEnd = nextMonth.subtract(1, 'second')
  return monthEnd
}
const monthEndTime = computed(() => getMonthEndTime())
const formattedMonthEnd = computed(() => monthEndTime.value.format('YYYY-MM-DD HH:mm:ss'))
//图表配置
const chartRefs = ref<(HTMLElement | null)[]>([])
const chartInstances = ref<(echarts.ECharts | null)[]>([])

// 计算图表配置（响应式）
const chartConfigs = computed<ChartConfig[]>(() => {
  const data = getChartDataWithDefault()
  
  // 获取今日和昨日数据用于计算环比
  const dealToday = data.dailyDealCount.data[data.dailyDealCount.data.length - 1] || 0
  const dealYesterday = data.dailyDealCount.data[data.dailyDealCount.data.length - 2] || 0
  const dealGrowth = calculateGrowthRate(dealToday, dealYesterday)
  
  const activeToday = data.dailyActive.data[data.dailyActive.data.length - 1] || 0
  const activeYesterday = data.dailyActive.data[data.dailyActive.data.length - 2] || 0
  const activeGrowth = calculateGrowthRate(activeToday, activeYesterday)
  
  const gmvToday = data.dailyGMV.data[data.dailyGMV.data.length - 1] || 0
  const gmvYesterday = data.dailyGMV.data[data.dailyGMV.data.length - 2] || 0
  const gmvGrowth = calculateGrowthRate(gmvToday, gmvYesterday)

  return [
    {
      title: '每日成交单数',
      tagType: 'success',
      tagText: '成功结单',
      type:'bar',
      data: data.dailyDealCount.data,
      categories: data.dailyDealCount.categories,
      footerItems:[
        { label:'峰值',value:`${data.dailyDealCount.max}单` },
        { label: '环比', value: dealGrowth, isPositive: !dealGrowth.startsWith('-') }
      ]
    },
    {
      title:'每日用户活跃度',
      tagType: 'warning',
      tagText: '日活用户',
      type:'line',
      data: data.dailyActive.data,
      categories: data.dailyActive.categories,
      footerItems:[
        { label:'今日',value:`${data.dailyActive.today}人` },
        { label: '峰值', value: `${data.dailyActive.max}人` }
      ]
    },
    {
      title:'每日成交金额',
      tagType: 'danger',
      tagText: '月成交额',
      type:'bar',
      data: data.dailyGMV.data,
      categories: data.dailyGMV.categories,
      formatter: (value:number) => `¥${(value).toFixed(1)}元`,
      footerItems:[
        {label:'峰值',value: `${data.dailyGMV.max}元`},
        { label: '环比', value: gmvGrowth, isPositive: !gmvGrowth.startsWith('-') }
      ]
    },
  ]
})

// 计算统计卡片的环比数据
const activeGrowthRate = computed(() => {
  const data = getChartDataWithDefault().dailyActive
  const today = data.data[data.data.length - 1] || 0
  const yesterday = data.data[data.data.length - 2] || 0
  return calculateGrowthRate(today, yesterday)
})

const dealGrowthRate = computed(() => {
  const data = getChartDataWithDefault().dailyDealCount
  const today = data.data[data.data.length - 1] || 0
  const yesterday = data.data[data.data.length - 2] || 0
  return calculateGrowthRate(today, yesterday)
})

// 默认统计数据
const defaultStats = {
  totalUsers: 5236,
  female: 2856,
  male: 2380,
  totalTransactions: 1150,
  todayActive: 1020,
  todayDeals: 190
}

// 获取带默认值的统计数据
const totalUsers = computed(() => {
  return adminStore.outputValue || defaultStats.totalUsers
})

const femaleCount = computed(() => {
  return adminStore.female || defaultStats.female
})

const maleCount = computed(() => {
  return adminStore.male || defaultStats.male
})

const totalTransactions = computed(() => {
  const data = getChartDataWithDefault()
  return data.dailyDealCount.total || defaultStats.totalTransactions
})

const todayActive = computed(() => {
  const data = getChartDataWithDefault()
  return data.dailyActive.today || defaultStats.todayActive
})

const todayDeals = computed(() => {
  const data = getChartDataWithDefault()
  return data.dailyDealCount.today || defaultStats.todayDeals
})

// 图表实例需要在数据变化时重新渲染
const reinitCharts = () => {
  // 先销毁旧实例
  chartInstances.value.forEach(chart => chart?.dispose())
  chartInstances.value = []
  
  // 延迟初始化确保DOM更新
  setTimeout(() => {
    initCharts()
  }, 100)
}

// 监听数据变化重新渲染图表
watch(() => adminStore.chartData, () => {
  reinitCharts()
}, { deep: true })
//收集图表ref
const setChartRef = (el:any | null,index:number) => {
  if(el && el.tagName) {
    chartRefs.value[index] = el
  }
}
// 生成ECharts配置
const getChartOption = (config:ChartConfig, index:number) => {
  const colorPalette = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
  ]

  const baseOption = {
    color: colorPalette,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis' as const,
      formatter: config.formatter ?
        (params: any) => {
          return `${params.name}<br/>${params.marker} ${params.seriesName}: ${config.formatter!(params.value)}`
        } :
        undefined
    }
  }

  return {
    ...baseOption,
    title: {
      text: '',
      left: 'center'
    },
    xAxis: {
      type: 'category' as const,
      data: config.categories,
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: config.formatter || '{value}'
      }
    },
    series: [{
      name: config.title,
      type: config.type,
      data: config.data,
      smooth: config.type === 'line',
      showSymbol: config.type === 'line',
      symbolSize: 6,
      lineStyle: {
        width: 3
      },
      areaStyle: config.type === 'line' ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(145, 204, 117, 0.4)' },
          { offset: 1, color: 'rgba(145, 204, 117, 0.1)' }
        ])
      } : undefined,
      itemStyle: {
        color: colorPalette[index],
        borderRadius: config.type === 'bar' ? [4, 4, 0, 0] : undefined
      },
      barWidth: '60%'
    }]
  }
}
//初始化图表
const initCharts = () => {
  chartConfigs.value.forEach((config, index) => {
    if (chartRefs.value[index]) {
      const chart = echarts.init(chartRefs.value[index])
      chart.setOption(getChartOption(config, index))
      chartInstances.value[index] = chart
    }
  })
}
//响应式窗口
const handleResize = () => {
  chartInstances.value.forEach(chart => {
    chart?.resize()
  })
}
//初始化
onMounted(() => {
  // 确保DOM渲染完成
  setTimeout(() => {
    initCharts()
  }, 100)

  window.addEventListener('resize', handleResize)
  //图表初始化
  adminStore.fetchUsers()
  adminStore.fetchUserSex()
  adminStore.fetchChartData()
})
//善后工作
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.value.forEach(chart => {
    chart?.dispose()
  })
})
</script>

<template>
  <div class="dashboard__container">
    <!--基础数据-->
    <div class="dashboard__statistic">
      <div class="statistic__basic">
        <el-row :gutter="16">
          <!--平台总用户-->
          <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
            <el-statistic title="Total users" :value="totalUsers"></el-statistic>
          </el-col>
          <!--男女分布-->
          <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
            <el-statistic :value="femaleCount">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  Ratio of men to women
                  <el-icon style="margin-left: 4px" :size="12">
                    <Male/>
                  </el-icon>
                </div>
              </template>
              <template #suffix>/{{maleCount}}</template>
            </el-statistic>
          </el-col>
          <!--总贸易数-->
          <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
            <el-statistic title="Total Transactions" :value="totalTransactions"></el-statistic>
          </el-col>
          <!--倒计时-->
          <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
            <el-countdown format="DD [days] HH:mm:ss" :value="monthEndTime">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  <el-icon style="margin-right: 4px" :size="12">
                    <Calendar/>
                  </el-icon>
                  Countdown to the end of the month
                </div>
              </template>
            </el-countdown>
            <div class="countdown-footer">{{ formattedMonthEnd }}</div>
          </el-col>
        </el-row>
      </div>
      <div class="statistic__compare">
        <el-row :gutter="20">
          <!--今日用户活跃度-->
          <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
            <div class="statistic-card">
              <el-statistic :value="todayActive">
                <template #title>
                  <div style="display: inline-flex;align-items: center">
                    Today active users
                    <el-tooltip effect="dark" content="Number of users who logged into the product in one day" placement="top">
                      <el-icon style="margin-left: 4px" :size="12">
                        <Warning/>
                      </el-icon>
                    </el-tooltip>
                  </div>
                </template>
              </el-statistic>
              <div class="statistic-footer">
                <div class="footer-item">
                  <span>than yesterday</span>
                  <span :class="activeGrowthRate.startsWith('-') ? 'red' : 'green'">
                    {{ activeGrowthRate }}
                    <el-icon>
                      <CaretTop v-if="!activeGrowthRate.startsWith('-')"/>
                      <CaretBottom v-else/>
                    </el-icon>
                  </span>
                </div>
              </div>
            </div>
          </el-col>
<!--          <el-col :xs="24" :sm="12" :md="8" class="mb-4">
            <div class="statistic-card">
              <el-statistic :value="693700">
                <template #title>
                  <div style="display: inline-flex; align-items: center">
                    Monthly Active Users
                    <el-tooltip
                      effect="dark"
                      content="Number of users who logged into the product in one month"
                      placement="top"
                    >
                      <el-icon style="margin-left: 4px" :size="12">
                        <Warning />
                      </el-icon>
                    </el-tooltip>
                  </div>
                </template>
              </el-statistic>
              <div class="statistic-footer">
                <div class="footer-item">
                  <span>month on month</span>
                  <span class="red">
              12%
              <el-icon>
                <CaretBottom />
              </el-icon>
            </span>
                </div>
              </div>
            </div>
          </el-col>-->
          <!--今日成交单数-->
          <el-col :xs="24" :sm="12" :md="8" class="mb-4">
            <div class="statistic-card">
              <el-statistic :value="todayDeals" title="New transactions today">
                <template #title>
                  <div style="display: inline-flex; align-items: center">
                    New transactions today
                  </div>
                </template>
              </el-statistic>
              <div class="statistic-footer">
                <div class="footer-item">
                  <span>than yesterday</span>
                  <span :class="dealGrowthRate.startsWith('-') ? 'red' : 'green'">
                    {{ dealGrowthRate }}
                    <el-icon>
                      <CaretTop v-if="!dealGrowthRate.startsWith('-')"/>
                      <CaretBottom v-else/>
                    </el-icon>
                  </span>
                </div>
                <div class="footer-item">
                  <el-icon :size="14">
                    <ArrowRight />
                  </el-icon>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
    <!--图表数据-->
    <div class="dashboard__dataCard">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="12" :lg="6" v-for="(chart, index) in chartConfigs" :key="index">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="chart-title">{{ chart.title }}</span>
                <el-tag :type="chart.tagType">{{ chart.tagText }}</el-tag>
              </div>
            </template>
            <div :ref="(el) => setChartRef(el, index)" class="chart-content"/>
            <div class="chart-footer">
              <div class="footer-item" v-for="(item, i) in chart.footerItems" :key="i">
                <span class="label">{{ item.label }}:</span>
                <span :class="['value',item.isPositive ? 'positive' : item.isNegative ? 'negative' : '']">
                    {{ item.value }}
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard__container {
  display: flex;
  flex-direction: column;
  .dashboard__statistic {
    display: flex;
    flex-direction: column;
    .statistic__basic {
      padding: 8px;
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .statistic__compare {
      padding: 8px;
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      margin-bottom: 16px;
    }
  }
  .dashboard__dataCard {
    .chart-card{
      margin-bottom: 20px;
      height: 100%;
      .card-header{
        display: flex;
        align-items: center;
        .chart-title {
          margin-right: 4px;
        }
      }
    }
  }
}
.chart-content {
  width: 100%;
  height: 300px; /* 固定高度给图表 */
}
.chart-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 0 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 12px;
  .footer-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }
}
.footer-item .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.footer-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.footer-item .value.positive {
  color: #67c23a;
}

.footer-item .value.negative {
  color: #f56c6c;
}
//ele配置
:global(h2#card-usage ~ .example .example-showcase) {
  background-color: var(--el-fill-color) !important;
}
.el-statistic {
  --el-statistic-content-font-size: 28px;
}
.statistic-card {
  height: 100%;
  padding: 20px;
  border-radius: 4px;
  background-color: var(--el-bg-color-overlay);
}
.statistic-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 16px;
}
.statistic-footer .footer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.statistic-footer .footer-item span:last-child {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}
.green {
  color: var(--el-color-success);
}
.red {
  color: var(--el-color-error);
}
</style>
