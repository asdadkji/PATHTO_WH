//后台api
import service from '@/apis/http.ts'
import {OrderStatus, PaymentMethod} from "@/stores/orders.ts";
//ts
interface sex {
  gender:string,
  count:number
}
interface chartBase {
  title:string
  data:number[]
  categories:string[]
  total:number
  max:number
  today:number
}
interface chart {
  dailyDealCount: chartBase,
  dailyGMV:chartBase,
  dailyActive:chartBase
}
interface adminList {
  id:number
  username:string
  phone:string
  bio:string
  role:string
}
interface sellerBase {
  id:number
  user_id:number
  shop_name:string
  status:string
}
interface sellerList {
  data:sellerBase[]
  pagination: {
    total:number
    pageSize:number
    current:number
  }
}
export interface Order {
  id: number
  order_number: string
  book_id: number
  book_snapshot: Record<string, any>
  buyer_id: number
  seller_id: number
  unit_price: number
  quantity: number
  total_price: number
  delivery_fee: number
  final_price: number
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: string
  payment_id?: string
  paid_at?: string
  transaction_method: string
  meeting_location?: string
  meeting_time?: string
  shipping_address?: Record<string, any>
  tracking_company?: string
  tracking_number?: string
  shipped_at?: string
  delivered_at?: string
  buyer_note?: string
  seller_note?: string
  cancel_reason?: string
  cancel_type?: string
  created_at: string
  updated_at: string
  completed_at?: string
  cancelled_at?: string
}

//获取用户总数
export const getUserCountApi = (adminId:number):Promise<number> => {
  return service.get('/admin/userCount',{params:{adminId}})
}
//获取性别占比
export const getUserSexApi = (adminId:number):Promise<sex[]> => {
  return service.get('/admin/userGender',{params:{adminId}})
}
//图表总数据（订单各层级成交量、订单各层级销售额、用户日活）
export const getChartDataApi = (adminId:number):Promise<chart> => {
  return service.get('/admin/chartData',{params:{adminId}})
}
//获取管理员列表
export const getAdminListApi = (adminId:number):Promise<adminList[]> => {
  return service.get('/admin/adminList',{params:{adminId}})
}
//赋予管理权限
export const setAdminApi = (params: {username:string,phone:string}, adminId:number) => {
  return service.patch('/admin/setAdmin', {params}, {params:{adminId}})
}
//取消管理权限
export const cancelAdminApi = (adminId:number,userId:number) => {
  return service.patch('/admin/cancelAdmin', undefined,{params:{adminId,userId}})
}
//获得商家列表
export const getShopListApi = (adminId:number,page:number,pageSize:number):Promise<sellerList> => {
  return service.get('/admin/sellerList',{params:{adminId,page,pageSize}})
}
//冻结商家权限
export const freezeShopApi = (reason: string,adminId:number) => {
  return service.patch('/admin/freezeSeller', {reason},{params:{adminId}})
}
//解冻商家权限
export const unfreezeShopApi = (adminId:number) => {
  return service.patch('/admin/unfreezeSeller',{params:{adminId}})
}
//获取已送达的订单
export const getOrdersToDeliverApi = ():Promise<Order[]> => {
  return service.get('/admin/deliveredBooks')
}
