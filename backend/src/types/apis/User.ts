// 前端发起请求的参数类型
export interface UpdateUserRequest {
    username?: string;
    avatarUrl?: string;
    gender?: string;
    qq?: string;
    college?: string;
    bio?: string;
    signature?: string;
}

//后端返回的完整用户信息
export interface UserInfo {
    id:number
    username:string
    phone:string
    student_id:string
    avatar_url:string | null
    college:string | null
    bio:string | null
    gender:string | null
    signature:string | null
    is_active:boolean | null
    is_banned:boolean | null
    ban_reason?:string | null
    total_transactions:number | null
    rating:number | null
    qq:string | null
}