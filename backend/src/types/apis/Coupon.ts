//优惠券类型
//优惠券实体类型
export interface UserCoupon {
    id:bigint
    user_id:bigint
    batch_id:bigint
    status:'unused' | 'used' | 'expired' | 'frozen'
    order_id:bigint | null
    received_at:Date
    used_at:Date | null
    expired_at:Date
}
//优惠券-商家实体类型
export interface BatchCoupon {
    id:bigint
    merchant_id:bigint
    title:string
    type: 'amount' | 'percent' | 'free_shipping'
    full_amount:number
    total_cnt:number
    per_limit:number
    receive_start:Date
    receive_end:Date
    use_start:Date
    use_end:Date
    scope_type: 0 | 1 | 2
    status: 1 | 2
    created_at:Date
    updated_at:Date
}
//优惠券业务枚举-前端暂存
//优惠券分类
export enum CouponType {
    AMOUNT = 'amount', //满减券
    PERCENT = 'percent', //折扣券
    FREE_SHIPPING = 'free_shipping' //免邮券
}
//优惠券状态
export enum CouponStatus {
    UNUSED = 'unused', //未使用
    USED = 'used', //已使用
    EXPIRED = 'expired', //已过期
    FROZEN = 'frozen' //已删除
}
//优惠券批次状态
export enum BatchStatus {
    ACTIVE = 1,
    INACTIVE = 2
}
//优惠券适用范围
export enum ScopeType {
    ALL = 0,
    CATEGORY = 1,
    PRODUCT = 2
}
//优惠券列表项
export interface CouponListItem {
    id:number,
    batch_id:number,
    title: string
    type: CouponType
    full_amount: number
    discount: number
    status: CouponStatus
    received_at: Date
    expired_at: Date
    used_at: Date | null
    use_start: Date
    use_end: Date
    merchant_id: bigint
    merchant_name?: string
    is_expired: boolean
    is_available: boolean
    time_remaining?:string
}
//可用优惠券项
export interface AvailableCouponItem {
    id:bigint
    batch_id:bigint
    title: string
    type: CouponType
    full_amount: number
    discount: number
    estimated_save:number
    is_best_choice:boolean
    condition_text:string
    benefit_text:string
    scope_text:string
}

//请求类型
export interface GetUserCouponsRequest {
    user_id: bigint
    status?: CouponStatus
    page?: number
    page_size?: number
}
//响应类型
export interface GetUserCouponsResponse {
    coupons: CouponListItem[]
    total: number
    page:number
    page_size:number
}