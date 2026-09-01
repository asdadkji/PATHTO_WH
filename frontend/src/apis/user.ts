// 用户相关接口封装
import http from '@/apis/http'
import type { UserProfile } from '@/types'

/** 获取当前用户资料 */
export function getProfile() {
  return http.get('/user/profile') as unknown as Promise<UserProfile>
}

/**
 * 更新用户资料（作业/游戏目标、每日提醒）
 * 说明：后端该接口尚未最终定义，此处预留；调用方需对 401/404 容错。
 */
export function updateProfile(
  data: Partial<
    Pick<
      UserProfile,
      'homeworkTargetMinutes' | 'gameTargetMinutes' | 'dailyTaskReminder'
    >
  >,
) {
  return http.put('/user/profile', data) as unknown as Promise<UserProfile>
}
