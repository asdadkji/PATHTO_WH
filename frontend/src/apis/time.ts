// 时间模块-时间统计相关接口封装（模块3：target-status / summary/today）
// 统一响应 { code, data, message } 由 http.ts 拆包，业务层直接拿 data；
// 401 由 http.ts 自动跳登录，业务错误以 { code, message } 形式 reject。
// 注：baseURL 已含 /api，故路径不重复写 /api 前缀，与 task.ts 保持一致。
import http from '@/apis/http'
import type { TargetStatus, TodaySummary } from '@/types'

/**
 * 今日达标状态：GET /api/time/target-status
 * → 成功 { homeworkReached, gameReached }
 * 失败：401 未登录（由 http.ts 统一处理）
 */
export function getTargetStatus() {
  return http.get('/time/target-status') as unknown as Promise<TargetStatus>
}

/**
 * 今日时长汇总：GET /api/time/summary/today
 * → 成功 { homeworkMinutes, gameMinutes }
 * 失败：401 未登录（由 http.ts 统一处理）
 */
export function getTodaySummary() {
  return http.get('/time/summary/today') as unknown as Promise<TodaySummary>
}
