// 时间模块-计时器相关接口封装（模块3：start / stop / manual）
// 统一响应 { code, data, message } 由 http.ts 拆包，业务层直接拿 data；
// 401 由 http.ts 自动跳登录，业务错误（409/400/404 等）以 { code, message } 形式 reject。
// 注：baseURL 已含 /api，故路径不重复写 /api 前缀，与 task.ts 保持一致。
import http from '@/apis/http'
import type {
  ActivityType,
  ManualRecordPayload,
  TimeRecord,
  TimerSession,
  TimerStopResult,
} from '@/types'

/**
 * 开始计时：POST /api/timer/start
 * body: { activityType } → 成功 { sessionId, activityType, startedAt }
 * 失败：409 已有进行中的计时 / 400 活动类型无效
 */
export function startTimer(activityType: ActivityType) {
  return http.post('/timer/start', { activityType }) as unknown as Promise<TimerSession>
}

/**
 * 停止计时：PUT /api/timer/stop
 * body: { sessionId } → 成功 { sessionId, durationMinutes }
 * 失败：404 会话不存在 / 400 已结束
 */
export function stopTimer(sessionId: string) {
  return http.put('/timer/stop', { sessionId }) as unknown as Promise<TimerStopResult>
}

/**
 * 手动录入时长：POST /api/timer/manual
 * body: { activityType, durationMinutes } → 成功 { recordId, durationMinutes }
 * 失败：400 时长不能为 0
 */
export function manualRecord(data: ManualRecordPayload) {
  return http.post('/timer/manual', data) as unknown as Promise<TimeRecord>
}
