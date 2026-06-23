//订单请求
import service from '@/apis/http.ts'
//创建订单
export const createUserOrder = (userId:number,params:any):Promise<any> => {
  console.log('========== createUserOrder API 调用 ==========')
  console.log('URL:', `/order/create/${userId}`)
  console.log('params:', params)
  const promise = service.post(`/order/create/${userId}`,params)
  promise.then(res => {
    console.log('createUserOrder API 返回:', res)
  }).catch(err => {
    console.error('createUserOrder API 错误:', err)
  })
  return promise
}
//更新订单收货地址
export const updateOrderAddress = (userId: number, orderId: number, shippingAddress: any): Promise<any> => {
  console.log('========== updateOrderAddress API 调用 ==========')
  console.log('URL:', `/order/${userId}/${orderId}/address`)
  console.log('shippingAddress:', shippingAddress)
  return service.put(`/order/${userId}/${orderId}/address`, { shipping_address: shippingAddress })
}
//获取用户订单列表
export const getUserOrders = (userId:number,userRole:string,page:number,pageSize:number,status:string,filter?: {
  keyword?: string,
  sortBy?: string,
  sortOrder?: string,
  startDate?: string,
  endDate?: string
}):Promise<any> => {
  return service.get(`/order/list/${userId}`,{params:{userRole,page,pageSize,status,...filter}})
}
//更新订单状态
export const updateUserOrderStatus = (userId:number,orderId:number,userRole:string,status:string,reason?:string,data?:string):Promise<any> => {
  return service.put(`/order/${userId}/${orderId}/status`,{status, reason, data},{params:{userRole}})
}
//取消订单
export const cancelOrder = (userId:number,orderId:number,userRole:string):Promise<any> => {
  return service.post(`/order/${userId}/${orderId}/cancel`,{},{params:{userRole}})
}
//进入支付页面
export const enterPaymentPage = (userId:number, orderId:number):Promise<any> => {
  return service.post(`/order/${userId}/${orderId}/enterPayment`)
}
//支付
export const processPayment = (userId:number,orderId:number,payment_method:string,payment_id:string):Promise<any> => {
  return service.post(`/order/${userId}/${orderId}/pay`,{payment_method,payment_id})
}
//卖家发货
export const shipSellerOrder = (sellerId:number,orderId:number,tracking_company:string,tracking_number:number):Promise<any> => {
  return service.post(`/order/${sellerId}/${orderId}/ship`,{tracking_company, tracking_number})
}
//买家收货
export const receiveOrder = (userId:number,orderId:number):Promise<any> => {
  return service.post(`/order/${userId}/${orderId}/complete`)
}
//查看\搜索配送订单列表
export const getOrdersToDeliver = (userRole:string,orderData:{
  page:number,
  pageSize:number,
  tracking_company?:string,
  start_date?:Date,
  end_date?:Date,
  buyer_name?:string,
  buyer_phone?:number
}):Promise<any> => {
  return service.get(`/order/shipList`,{params:{userRole,...orderData}})
}
//标记为已送达
export const markAsDelivered = (adminId:number,orderId:number,markData:{tracking_company:string,tracking_number:number,delivered_time:Date,notes:string},userRole:string):Promise<any> => {
  return service.post(`/order/${adminId}/${orderId}/delivered`,{...markData},{params:{userRole}})
}
