//用户信息请求
import service from '@/apis/http.ts'
//获取用户信息
export const getUserInfo = (userId: number):Promise<any> => {
  return service.get(`/user/profile/${userId}`)
}
//修改用户信息
export const changeUserInfo = (userId:number,data: any):Promise<any> => {
  return service.put(`/user/profile/${userId}/change`, data)
}
