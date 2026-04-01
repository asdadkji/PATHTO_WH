//优惠券api
import service from '@/apis/http.ts'
import type {GetUserCouponsRequest,MerchantCoupon} from '@/types/store/coupon.ts';
//获取优惠券信息
export const getCouponInfo = (params:GetUserCouponsRequest):Promise<any> => {
  const {userId,status,page = 1,pageSize = 20} = params
  return service.get(`/coupon/mycoupon/${userId}?status=${status}&page=${page}&pageSize=${pageSize}`)
}
//获取商店发放优惠券信息
export const getMerchantCoupon = (merchantId:number):Promise<MerchantCoupon[]> => {
  return service.get(`/coupon/merchantCoupon/${merchantId}`)
}
//更新商家、用户优惠券信息
export const updateCoupon = (userId:number,batchId:number):Promise<any> => {
  return service.post(`/coupon/updateCoupon/${userId}?batchId=${batchId}`)
}
//商家创建优惠券
export const createCoupon = (params:any):Promise<any> => {
  return service.post(`/coupon/createCoupon`,params)
}
//商家停用优惠券
export const disableCoupon = (batchId:number,couponId:number):Promise<any> => {
  return service.patch(`/coupon/deleteCoupon/${batchId}?couponId=${couponId}`)
}
//商家启用优惠券
export const enableCoupon = (batchId:number,couponId:number):Promise<any> => {
  return service.patch(`/coupon/enableCoupon/${batchId}?couponId=${couponId}`)
}
//商家查看优惠券
export const getMerchantCouponInfo = (merchantId:number,params?:{title:string,status?:number}):Promise<any> => {
  return service.get(`/coupon/getCoupon/${merchantId}`,{params})
}
