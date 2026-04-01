//用户类型
export interface User {
  id: number
  username: string
  phone:number
  gender:string
  qq:string
  avatar_url: string
  college:string
  bio:string
  signature:string
}

export interface UserForm {
  id:number
  username?: string
  phone?:number
  college?:string
  bio?:string
  signature?:string
}
