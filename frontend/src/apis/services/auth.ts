//认证相关请求
import service from '@/apis/http.ts'
import type { LoginParams,RegisterParams,ResetPwdParams,AuthToken } from '@/types/api/auth.ts'

//登录
export const login = (data:LoginParams):Promise<AuthToken> => {
  return service.post('/auth/login', data)
};
//注册
export const register = (data: RegisterParams) => {
  return service.post<AuthToken>('/auth/register', data)
}
//重置前置验证
export const beforeResetPwd = (username:string,phone:number) => {
  return service.post('/auth/beforeResetPwd', {username,phone})
}
//找回重置
export const resetPwd = (data: ResetPwdParams) => {
  return service.post<AuthToken>('/auth/resetPwd', data)
}
//商家认证
export const applyForMerchant = (userId:number, realUserName:string) => {
  return service.post('/auth/seller', {userId, realUserName})
}
//商家判定
export const isMerchant2 = (userId:number) => {
  return service.get('/auth/isMerchant', {params: {userId}})
}
