<script setup lang="ts">
import {ArrowRight, Calendar, CaretBottom, CaretTop, Male, Warning} from "@element-plus/icons-vue";
import {useTransition} from "@vueuse/core";
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
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
//图表数据
const chartConfigs = ref<ChartConfig[]>([
  {
    title: '每日成交单数',
    tagType: 'success',
    tagText: '成功结单',
    type:'bar',
    data: adminStore.chartData.dailyDealCount?.data ?? [0],
    categories: adminStore.chartData.dailyDealCount?.categories ?? [''],
    footerItems:[
      { label:'峰值',value:`${adminStore.chartData.dailyDealCount?.max}单` },
      { label: '环比', value: '+12.5%', isPositive: true }
    ]
  },
  {
    title:'每日用户活跃度',
    tagType: 'warning',
    tagText: '日活用户',
    type:'line',
    data: adminStore.chartData.dailyActive?.data ?? [0],
    categories: adminStore.chartData.dailyActive?.categories ?? [''],
    footerItems:[
      { label:'今日',value:`${adminStore.chartData.dailyActive?.today}人` },
      { label: '峰值', value: `${adminStore.chartData.dailyActive?.max}人` }
    ]
  },
  {
    title:'每日成交金额',
    tagType: 'danger',
    tagText: '月成交额',
    type:'bar',
    data: adminStore.chartData.dailyGMV?.data ?? [0],
    categories: adminStore.chartData.dailyGMV?.categories ?? [''],
    formatter: (value:number) => `¥${(value).toFixed(1)}元`,
    footerItems:[
      {label:'峰值',value: `${adminStore.chartData.dailyGMV?.max}元`},
      { label: '环比', value: '+15.2%', isPositive: true }
    ]
  },
])
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
            <el-statistic title="Total users" :value="adminStore.outputValue"></el-statistic>
          </el-col>
          <!--男女分布-->
          <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
            <el-statistic :value="adminStore.female">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  Ratio of men to women
                  <el-icon style="margin-left: 4px" :size="12">
                    <Male/>
                  </el-icon>
                </div>
              </template>
              <template #suffix>/{{adminStore.male}}</template>
            </el-statistic>
          </el-col>
          <!--总贸易数-->
          <el-col :xs="24" :sm="12" :md="6" class="text-center mb-4">
            <el-statistic title="Total Transactions" :value="adminStore.chartData?.dailyDealCount?.total"></el-statistic>
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
              <el-statistic :value="adminStore.chartData?.dailyActive?.today">
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
                  <span class="green">
                    24%
                    <el-icon>
                      <CaretTop/>
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
              <el-statistic :value="adminStore.chartData.dailyDealCount?.today" title="New transactions today">
                <template #title>
                  <div style="display: inline-flex; align-items: center">
                    New transactions today
                  </div>
                </template>
              </el-statistic>
              <div class="statistic-footer">
                <div class="footer-item">
                  <span>than yesterday</span>
                  <span class="green">
              16%
              <el-icon>
                <CaretTop />
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
