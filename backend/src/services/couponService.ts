//优惠券服务
import { CouponModel} from '../models/Coupon'
import type {GetUserCouponsResponse, CouponListItem} from "@/types/apis/Coupon";

export const CouponService = {
    //获取优惠券列表
    async getCoupons(userId:number,status:string,page:number=1,page_size:number=20):Promise<GetUserCouponsResponse > {
        const validStatuses = ['unused','used','expired','frozen']
        if(!validStatuses.includes(status)){
            throw new Error('Invalid status')
        }
        const coupons = await CouponModel.findCouponByUserId(userId,status)
        const total = await CouponModel.findCouponCountByUserId(userId,status)
        const startIndex = (page-1)*page_size
        const endIndex = startIndex + page_size
        const paginatedCoupons = coupons.slice(startIndex,endIndex)
        return {
            coupons: paginatedCoupons,
            total,
            page,
            page_size
        }
    },
    //获取商家发放的优惠券
    async getMerchantCoupons(merchantId: number,userId = null) {
        const coupons = await CouponModel.findMerchantCoupon(merchantId,userId)
        return coupons
    },
    //用户领取优惠券
    async receiveCoupon(userId: number, batchId: number) {
        const coupon = await CouponModel.receiveCoupon(userId,batchId)
        return coupon
    },
    //商家创建优惠券
    async createCoupon(data:any) {
        try {
            if(!data.merchant_id || !data.title){
                throw new Error('merchantId is required')
            }
            const coupon = await CouponModel.addCoupon(data)
            return coupon
        } catch (e) {
            console.log('createCoupon error',e)
            throw e;
        }

    },
    //商家查看优惠券
    async getMerchantCoupon(merchantId: number,filter?:{title?:string,status?:number}) {
        const coupons = await CouponModel.getBatch(merchantId,filter)
        return coupons
    },
    //商家停用优惠券
    async disableCoupon(id:number,batchId: number) {
        const coupon = await CouponModel.stopBatch(id,batchId)
        return coupon
    },
    //商家启用优惠券
    async enableCoupon(id:number,batchId: number) {
        const coupon = await CouponModel.startBatch(id,batchId)
        return coupon
    }
}
