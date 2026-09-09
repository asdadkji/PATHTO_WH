// 仪表盘相关接口封装
import http from '@/apis/http'
import type {
  DashboardMonthly,
  DashboardOverview,
  DashboardWeekly,
} from '@/types'

/** 今日概览 */
export function getOverview() {
  return http.get('/dashboard/overview') as unknown as Promise<DashboardOverview>
}

/** 本周趋势（labels + data） */
export function getWeekly() {
  return http.get('/dashboard/weekly') as unknown as Promise<DashboardWeekly>
}

/** 月度报告 */
export function getMonthly() {
  return http.get('/dashboard/monthly') as unknown as Promise<DashboardMonthly>
}
