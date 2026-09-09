// ============================================================
// ECharts 按需引入封装：仅注册本系统用到的图表与组件，
// 控制构建体积；后续模块如需更多图表，在 echarts.use 中追加即可。
// ============================================================
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer,
])

export default echarts
export type { EChartsOption }
/** 图表实例类型：由 init 返回值推导，避免跨模块类型不一致 */
export type EChartsInstance = ReturnType<typeof echarts.init>
