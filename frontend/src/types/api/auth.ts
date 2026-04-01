//认证类型
//登录参数类型
export interface LoginParams {
  username: string;
  password: string;
}
//注册参数类型
export interface RegisterParams extends LoginParams{
  phone: number;
}
//重置参数类型
export interface ResetPwdParams {
  username: string;
  newPwd: string;
}
//登录返回数据类型
export interface AuthToken {
  token: string;
  user: {id: number; username: string; phone: number}
}
