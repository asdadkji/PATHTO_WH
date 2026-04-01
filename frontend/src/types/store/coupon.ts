//优惠券仓库类型
//优惠券主体
export interface Coupon {
  id: number
  title:string
  user_id:number
  batch_id:number
  status: 'unused' | 'used' | 'expired' | 'frozen'
  order_id:number | null
  received_at: Date
  created_at: Date
  used_at: Date | null
  coupon_title:string
  coupon_type: 'amount' | 'discount' | 'free_shipping'
  full_amount:number
  discount:number
  use_start:Date
  use_end:Date
  merchant_id:number
  merchant_name:string
  shop_logo:string | null
}
//请求类型
export interface GetUserCouponsRequest {
  userId: number
  status: string
  page?: number
  pageSize?: number
}
//返回类型
export interface GetUserCouponsResponse {
  coupons: Coupon[]
  total: number
  page:number
  page_size:number
}
//商家优惠券
export interface MerchantCoupon {
  id:number
  title:string
  type:string
  full_amount:number
  discount:number
  use_start:Date
  use_end:Date
  merchant_id:number
  status:number
  receive_start:Date
  receive_end:Date
  total_cnt:number
  per_limit:number
}
