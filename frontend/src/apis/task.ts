import http from '@/apis/http'
import type {
  CompleteTaskResult,
  CreateTaskPayload,
  CreateTaskResult,
  DeleteTaskResult,
  Task,
  TaskTemplate,
  TaskWeeklyStats,
} from '@/types'

export function getTodayTasks() {
  return http.get('/task/today') as unknown as Promise<Task[]>
}

export function createTask(data: CreateTaskPayload) {
  return http.post('/task', data) as unknown as Promise<CreateTaskResult>
}

export function completeTask(taskId: string) {
  return http.put(`/task/${encodeURIComponent(taskId)}/complete`) as unknown as Promise<CompleteTaskResult>
}

export function deleteTask(taskId: string) {
  return http.delete(`/task/${encodeURIComponent(taskId)}`) as unknown as Promise<DeleteTaskResult>
}

export function getWeeklyStats() {
  return http.get('/task/stats/weekly') as unknown as Promise<TaskWeeklyStats>
}

export function selectSelfSelectedTask(templateId: string) {
  return http.post('/task/select', { templateId }) as unknown as Promise<CreateTaskResult>
}

export function startChallenge(templateId: string) {
  return http.post(`/task/challenge/${encodeURIComponent(templateId)}`) as unknown as Promise<CreateTaskResult>
}

export function getAvailableTemplates() {
  return http.get('/task/templates') as unknown as Promise<TaskTemplate[]>
}
