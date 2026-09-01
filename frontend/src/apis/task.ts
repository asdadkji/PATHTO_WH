// 任务相关接口封装（模块2）
// 统一响应 { code, data, message } 由 http.ts 拆包，业务层直接拿 data；
// 401 由 http.ts 自动跳登录，业务错误以 { code, message } 形式 reject。
import http from '@/apis/http'
import type {
  CompleteTaskResult,
  CreateTaskPayload,
  CreateTaskResult,
  DeleteTaskResult,
  Task,
  TaskWeeklyStats,
} from '@/types'

/** 今日任务列表：GET /api/task/today → Task[] */
export function getTodayTasks() {
  return http.get('/task/today') as unknown as Promise<Task[]>
}

/** 创建任务：POST /api/task，body { title, points, description? } */
export function createTask(data: CreateTaskPayload) {
  return http.post('/task', data) as unknown as Promise<CreateTaskResult>
}

/** 打卡完成任务：PUT /api/task/:id/complete → { taskId, status, pointsEarned } */
export function completeTask(taskId: string) {
  return http.put(`/task/${encodeURIComponent(taskId)}/complete`) as unknown as Promise<CompleteTaskResult>
}

/** 删除任务：DELETE /api/task/:id → { success: true } */
export function deleteTask(taskId: string) {
  return http.delete(`/task/${encodeURIComponent(taskId)}`) as unknown as Promise<DeleteTaskResult>
}

/** 任务周统计：GET /api/task/stats/weekly → { totalCompleted, totalPoints, dailyData } */
export function getWeeklyStats() {
  return http.get('/task/stats/weekly') as unknown as Promise<TaskWeeklyStats>
}
