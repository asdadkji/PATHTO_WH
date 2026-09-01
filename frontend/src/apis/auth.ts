// 认证相关接口封装
import http from '@/apis/http'
import type {
  LoginParams,
  LoginResp,
  RegisterParams,
  RegisterResp,
} from '@/types'

/** 登录：返回 { token, userInfo } */
export function login(data: LoginParams) {
  return http.post('/auth/login', data) as unknown as Promise<LoginResp>
}

/** 注册：返回 { userId, username } */
export function register(data: RegisterParams) {
  return http.post('/auth/register', data) as unknown as Promise<RegisterResp>
}
