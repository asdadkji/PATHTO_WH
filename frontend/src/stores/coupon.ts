//优惠券仓库
import { defineStore } from 'pinia';
import { getCouponInfo,getMerchantCoupon,updateCoupon,createCoupon,disableCoupon,enableCoupon,getMerchantCouponInfo } from '@/apis/services/coupon';
import {reactive, type Ref, ref} from "vue";
import type {GetUserCouponsRequest, Coupon, MerchantCoupon } from '@/types/store/coupon.ts';
import storage from '@/utils/localstorage'
//ts
interface Merchant extends MerchantCoupon{
  isReceived:boolean
}
export const useCouponStore = defineStore('coupon', () => {
  const coupon = ref<Coupon[]>([])
  const pagination = reactive({
    page:1,
    pageSize:20,
    total:0
  })
  const merchantCoupon = ref<Merchant[]>([])
  const sellerCoupon:Ref<any[]> = ref([])

  //获取用户优惠券列表
  const getUserCoupon = async (params:GetUserCouponsRequest) => {
    try {
      const res = await getCouponInfo(params)
      if (res) {
        coupon.value = res.coupons
        pagination.page = res.page
        pagination.pageSize = res.page_size
        pagination.total = res.total
      } else {
        throw new Error('获取优惠券失败')
      }
    } catch (e) {
      console.log('获取优惠券失败', e)
    }
  }
  //获取商家优惠券列表
  const getMerchantCoupons = async (merchantId:number) => {
    try {
      const res = await getMerchantCoupon(merchantId)
      if (res) {
        const claimedCoupons = storage.get('claimedCoupons') || []
        merchantCoupon.value = res.map(coupon=>({
          ...coupon,
          isReceived: claimedCoupons.includes(coupon.id)
        }))
      } else {
        throw new Error('获取优惠券失败')
      }
    } catch (e) {
      console.log('获取优惠券失败', e)
    }
  }
  //更新商家、用户优惠券列表
  const updateAllCoupon = async (userId:number,batchId:number) => {
    try {
      const res = await updateCoupon(userId,batchId)
      const claimedCoupons = storage.get('claimedCoupons') || []
      if(!claimedCoupons.includes(batchId)) {
        claimedCoupons.push(batchId)
        storage.set('claimedCoupons',claimedCoupons)
      }
      const coupon = merchantCoupon.value.find(c => c.id === batchId);
      if (coupon) {
        coupon.isReceived = true;
      }
    } catch (e) {
      console.log('更新优惠券失败', e)
    }
  }
  //商家创建优惠券
  const addCoupon = async (couponData:any) => {
    try {
      if(sellerCoupon.value.length >= 5) {
        throw new Error('商家优惠券数量已达上限')
      }
      const res = await createCoupon(couponData)
    } catch (e) {
      console.log('创建优惠券失败', e)
    }
  }
  //商家启用优惠券
  const onCoupon = async (batchId:number,couponId:number) => {
    try {
      const res = await enableCoupon(batchId,couponId)
    } catch (e) {
      console.log('启用优惠券失败', e)
    }
  }
  //商家停用优惠券
  const stopCoupon = async (batchId:number,couponId:number) => {
    try {
      const res = await disableCoupon(batchId,couponId)
    } catch (e) {
      console.log('停用优惠券失败', e)
    }
  }
  //商家查看优惠券
  const getSellerCoupons = async (merchantId:number,params?:{title:string,status:number}) => {
    try {
      const res = await getMerchantCouponInfo(merchantId,params)
      sellerCoupon.value = res
    } catch (e) {
      console.log('获取优惠券失败', e)
    }
  }

  return {
    coupon,
    pagination,
    getUserCoupon,
    merchantCoupon,
    getMerchantCoupons,
    updateAllCoupon,
    addCoupon,
    onCoupon,
    stopCoupon,
    getSellerCoupons,
    sellerCoupon
  }
})
