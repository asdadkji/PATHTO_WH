//订单仓库
import { defineStore } from 'pinia';
import { createUserOrder, getUserOrders, updateUserOrderStatus, cancelOrder, processPayment, shipSellerOrder, receiveOrder, getOrdersToDeliver, markAsDelivered, enterPaymentPage } from '../apis/services/order';
import {ref,computed} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
//引入持久化
import storage from '@/utils/localstorage'
//引入地址仓库
import { useAddressStore } from './address';

const addressStore = useAddressStore();
//ts
// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  BANK_TRANSFER = 'bank_transfer'
}

// 订单实体接口
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

// 创建订单请求
export interface CreateOrderParams {
  book_id: number
  book_snapshot: Record<string, any>
  seller_id: number
  quantity: number
  unit_price: number
  delivery_fee?: number
  transaction_method: string
  meeting_location?: string
  meeting_time?: string
  buyer_note?: string
  payment_method?: PaymentMethod
}

// 配送订单查询参数
export interface DeliveryOrderParams {
  page: number
  pageSize: number
  tracking_company?: string
  start_date?: Date
  end_date?: Date
  buyer_name?: string
  buyer_phone?: number
}

// 送达标记参数
export interface MarkDeliveredParams {
  tracking_company: string
  tracking_number: number
  delivered_time: Date
  notes: string
}

export const useOrderStore = defineStore('order', () => {
  //用户订单列表
  const orders = ref<Order[]>([])
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
  })
  // 当前待确认订单ID（用于地址更新）
  const currentPendingOrderId = ref<number | null>(null)
  //配送订单列表
  const deliveryOrders = ref<Order[]>([])
  const deliveryPagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  //按状态分类
  const pendingOrders = computed(() => orders.value.filter(order => order.status === OrderStatus.PENDING))
  const confirmedOrders = computed(() => orders.value.filter(order => order.status === OrderStatus.CONFIRMED))
  const paidOrders = computed(() => orders.value.filter(order => order.status === OrderStatus.PAID))
  const shippedOrders = computed(() => orders.value.filter(order => order.status === OrderStatus.SHIPPED))
  const deliveredOrders = computed(() => orders.value.filter(order => order.status === OrderStatus.DELIVERED))
  const completedOrders = computed(() => orders.value.filter(order => order.status === OrderStatus.COMPLETED))
  const cancelledOrders = computed(() => orders.value.filter(order => order.status === OrderStatus.CANCELLED))

  const allOrdersList = ref<Order[]>([])           // 全部订单的独立副本
  const pendingOrdersList = ref<Order[]>([])       // 待处理订单
  const confirmedOrdersList = ref<Order[]>([])     // 待确认订单
  const paidOrdersList = ref<Order[]>([])          // 已付款订单
  const shippedOrdersList = ref<Order[]>([])       // 待发货订单
  const deliveredOrdersList = ref<Order[]>([])     // 待收货订单
  const completedOrdersList = ref<Order[]>([])     // 已完成订单
  const cancelledOrdersList = ref<Order[]>([])     // 已取消订单

  // 统计信息
  const orderStatistics = computed(() => ({
    total: orders.value.length,
    pending: pendingOrders.value.length,
    confirmed: confirmedOrders.value.length,
    paid: paidOrders.value.length,
    shipped: shippedOrders.value.length,
    delivered: deliveredOrders.value.length,
    completed: completedOrders.value.length,
    cancelled: cancelledOrders.value.length
  }))

  //直接购买进入订单
  //创建订单
  const createOrder = async (userId: number, params: CreateOrderParams) => {
    try {
      const res = await createUserOrder(userId, params)
      if (res) {
        orders.value.unshift(res)
        return res
      }
    } catch (e) {
      console.log('创建订单失败', e)
      throw e
    }
  }
  //获取用户订单列表
  /*const getUserOrdersList = async (userId: number, userRole: string, page: number, pageSize: number, status: string) => {
    const res = await getUserOrders(userId, userRole, page, pageSize, status)
    if (res) {
      orders.value = res.order
      pagination.value = {
        page: res.page,
        pageSize: res.page_size,
        total: res.total,
      }
    }
  }*/
  const getUserOrdersList = async (userId: number, userRole: string, page: number, pageSize: number, status: string, filter?: {
    keyword?: string,
    sortBy?: string,
    sortOrder?: string,
    startDate?: string,
    endDate?: string
  }) => {
    const res = await getUserOrders(userId, userRole, page, pageSize, status, filter)
    if (res) {
      // 更新分页信息
      pagination.value = {
        page: res.page || page,
        pageSize: res.page_size || pageSize,
        total: res.total || 0,
      }
      // 根据状态更新对应的列表
      switch(status) {
        case 'all':
          orders.value = res.order           // 更新原始数据
          allOrdersList.value = res.order     // 同时更新独立列表
          break
        case 'pending':
          pendingOrdersList.value = res.order
          // 不更新 orders.value，保持原始数据不变
          break
        case 'confirmed':
          confirmedOrdersList.value = res.order
          break
        case 'paid':
          paidOrdersList.value = res.order
          break
        case 'shipped':
          shippedOrdersList.value = res.order
          break
        case 'delivered':
          deliveredOrdersList.value = res.order
          break
        case 'completed':
          completedOrdersList.value = res.order
          break
        case 'cancelled':
          cancelledOrdersList.value = res.order
          break
      }

    }
  }
  //更新订单状态
  const updateOrderStatus = async (userId: number, orderId: number, userRole: string, status: string, reason?: string, data?: string) => {
    const res = await updateUserOrderStatus(userId, orderId, userRole, status, reason, data)
    if (res) {
      const index = orders.value.findIndex(item => item.id === orderId)
      if (index !== -1) orders.value[index] = res
    }
    return res
  }
  //取消订单
  const cancelOrderApi = async (userId: number, orderId: number, userRole: string) => {
    const res = await cancelOrder(userId, orderId, userRole)
    if (res) {
      const index = orders.value.findIndex(item => item.id === orderId)
      if (index !== -1) orders.value[index] = res
    }
  }
  //支付订单
  const processPaymentApi = async (userId: number, orderId: number, payment_method: string, payment_id: string) => {
    try {
      const res = await processPayment(userId, orderId, payment_method, payment_id)
      if (res) {
        // 直接返回成功，不需要在本地数组中查找订单
        return res
      }
    } catch (e: any) {
      throw new Error(e.message || '支付失败')
    }
  }
  //进入支付页面
  const enterPaymentPageApi = async (userId: number, orderId: number) => {
    try {
      const res = await enterPaymentPage(userId, orderId)
      if (res) {
        return res
      }
    } catch (e: any) {
      throw new Error(e.message || '进入支付页面失败')
    }
  }
  /**
   * 商品详情页：立即购买
   * 1. 先创建订单
   * 2. 弹出支付确认
   * 3. 支付
   */
/*  const buyNowAndPay = async (userId: number, params: CreateOrderParams): Promise<boolean> => {
    let order: Order | undefined
    /!* ① 创建订单 *!/
    try {
      order = await createUserOrder(userId, params) // 调你已有的接口
      if (!order) throw new Error('订单创建失败')
      orders.value.unshift(order)                   // 本地列表置顶
      await router.push({
        name: 'checkout',
        params: {
          orderId: order.id,
        }
      })
      return true
    } catch (e) {
      ElMessage.error('创建订单失败')
      return false
    }

    /!* ② 支付确认弹窗（复用同一份 DOM）*!/
    const ok = await showPaymentConfirmation([order]) // 单订单数组
    if (!ok) return false                            // 用户取消

     ③ 支付
    try {
      await processPaymentApi(userId, order.id, 'alipay', Date.now()) // 可改微信支付
      ElMessage.success('支付成功')
      return true
    } catch {
      ElMessage.error('支付失败')
      return false
    }
  }*/


  //从购物车进入订单
  let pendingMoreOrders:any[] = []
  //批量创建订单
  const batchCreateUserOrder = async (userId:number,cartItems:any[],commonData?:{ transaction_method?: string,meeting_location?: string,meeting_time?: string,buyer_note?: string }):Promise<any[]> => {
    console.log('========== batchCreateUserOrder 开始 ==========')
    console.log('userId:', userId)
    console.log('cartItems:', cartItems)
    console.log('commonData:', commonData)
    const orders:any[] = []
    pendingMoreOrders = []
    try {
      for(const [index, item] of cartItems.entries()){
        console.log(`batchCreateUserOrder - 处理第 ${index+1} 个 item:`, item)
        const orderData = {
          book_id: item.book_id,
          book_snapshot: {
            id: item.book_snapshot.id,
            title: item.book_snapshot.title,
            cover_img: item.book_snapshot.cover_img,
            price: item.book_snapshot.price,
            condition: item.book_snapshot.condition
          },
          seller_id: item.seller_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          delivery_fee: item.delivery_fee || 0,
          transaction_method: commonData?.transaction_method || 'face_to_face',
          meeting_location: commonData?.meeting_location,
          meeting_time: commonData?.meeting_time,
          buyer_note: commonData?.buyer_note,
          payment_method: 'alipay', // 默认
          shipping_address: item.shipping_address
        }
        console.log('batchCreateUserOrder - 调用 createUserOrder, orderData:', orderData)
        const res = await createUserOrder(userId,orderData)
        console.log('batchCreateUserOrder - createUserOrder 返回:', res)
        if(res) {
          orders.push(res)
          pendingMoreOrders.push(res)
        } else {
          throw new Error('创建订单失败')
        }
      }
      console.log('batchCreateUserOrder - 所有订单创建完成:', orders)
      console.log('========== batchCreateUserOrder 结束 ==========')
      return orders
    } catch (e) {
      console.error('batchCreateUserOrder - 错误:', e)
      throw e;
    }
  }
  //单次支付
  const singlePayment = async (userId:number,orders:any[]) => {
    try {
      const mockPaymentId = `mock_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      for (const order of orders) {
        try {
          await processPayment(userId,order.id,'alipay',mockPaymentId)
          //模拟延迟
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (e) {
          return {success: false,message: '支付失败'}
        }
      }
      return {success: true,message: '支付成功'}
    } catch (e) {
      throw e;
    }
  }
  //显示单次支付确认弹窗
  const showPaymentConfirmation = async (orders: any[]): Promise<boolean> => {
    const totalAmount = orders.reduce((sum, order) => sum + order.final_price, 0)
    const orderCount = orders.length

    try {
      await ElMessageBox.confirm(
        `
      <div style="text-align: left;">
        <h3 style="margin-bottom: 16px;">确认支付</h3>
        <div style="margin-bottom: 8px;">
          <span>订单数量：</span>
          <strong>${orderCount} 个订单</strong>
        </div>
        <div style="margin-bottom: 8px;">
          <span>商品数量：</span>
          <strong>${orders.reduce((sum, order) => sum + order.quantity, 0)} 件</strong>
        </div>
        <div style="margin-bottom: 16px;">
          <span>支付总额：</span>
          <strong style="color: #f56c6c; font-size: 18px;">¥${totalAmount.toFixed(2)}</strong>
        </div>
        <div style="color: #999; font-size: 12px;">
          ⚡ 系统将为您合并处理所有订单
        </div>
      </div>
      `,
        '待支付订单',
        {
          confirmButtonText: `确认支付 ¥${totalAmount.toFixed(2)}`,
          cancelButtonText: '取消',
          dangerouslyUseHTMLString: true,
          customClass: 'batch-payment-modal',
          showClose:false,
        }
      )
      return true
    } catch {
      return false
    }
  }
  //批量更新订单状态
  const batchUpdateOrderStatus = async (orders:any[],userRole:string) => {
    try {
      const updatePromises = orders?.map(order => updateUserOrderStatus(order.buyer_id,order.id,userRole,'paid').catch(e=>{
        console.warn(`订单 ${order.order_number} 状态更新失败:`,e)
        return null
      }))
      await Promise.all(updatePromises)
    } catch (e) {
      console.error('订单状态更新失败:', e)
    }
  }
  //回滚创建的订单-取消订单
  const rollbackOrders = async (userId:number,orders:any[]) => {
    for (const order of orders) {
      try {
        await cancelOrder(userId,order.id,'buyer')
      } catch (e) {
        console.error(`回滚订单 ${order.id} 失败:`, e);
      }
    }
  }
  //取消所有已创建的订单
  const cancelAllOrders = async (userId: number, orders: any[], userRole: string) => {
    for (const order of orders) {
      try {
        await cancelOrder(userId, order.id, userRole)
      } catch (error) {
        console.error(`取消订单 ${order.id} 失败:`, error)
      }
    }
  }
  //完整流程
  const executeSinglePayment = async (userId:number,userRole:string,cartItems:any[],commonData?: { transaction_method?: string, meeting_location?: string, meeting_time?: string, buyer_note?: string }) => {
    let createdOrders:any[] = []
    try {
      createdOrders = await batchCreateUserOrder(userId, cartItems, commonData)
      if (createdOrders.length === 0) {
        return {success: false, message: '没有创建任何订单'}
      }
      const confirmed = await showPaymentConfirmation(createdOrders)
      if (!confirmed) {
        await cancelAllOrders(userId, createdOrders, userRole)
        return {
          success: false,
          error: '用户取消支付'
        }
      }
      const paymentResult = await singlePayment(userId, createdOrders)
      if (!paymentResult.success) {
        await cancelAllOrders(userId, createdOrders, userRole)
        return {success: false, message: '支付失败'}
      }
      await batchUpdateOrderStatus(createdOrders, userRole)
      return {success: true, message: '支付成功'}
    } catch (e) {
      if (createdOrders.length > 0) {
        await cancelAllOrders(userId, createdOrders, userRole)
      }
      return {success: false, message: '支付流程出现问题'}
    }
  }

  //卖家发货
  const shipSellerOrderApi = async (sellerId: number, orderId: number, tracking_company: string, tracking_number: number) => {
    const res = await shipSellerOrder(sellerId, orderId, tracking_company, tracking_number)
    if (res) {
      const index = orders.value.findIndex(item => item.id === orderId)
      if (index !== -1) orders.value[index] = res
    }
    return res
  }
  //买家收货
  const receiveOrderApi = async (userId: number, orderId: number) => {
    const res = await receiveOrder(userId, orderId)
    if (res) {
      const index = orders.value.findIndex(item => item.id === orderId)
      if (index !== -1) orders.value[index] = res
    }
  }
  //待配送订单列表
  const getOrdersToDeliverApi = async (userRole:string,params:DeliveryOrderParams) => {
    const res = await getOrdersToDeliver(userRole,params)
    if(res) {
      console.log('Received orders:', res.orders);
      // 为每个订单添加卖家地址信息
      const ordersWithSellerAddress = res.orders.map(order => {
        console.log('Processing order:', order.id, 'seller_id:', order.seller_id);
        // 获取卖家的地址列表
        const sellerId = order.seller_id || 4;
        console.log('Getting address list for seller:', sellerId);

        if (sellerId === 0) {
          console.log('Seller ID is 0, cannot get address');
          return {
            ...order,
            seller_address: '卖家ID无效'
          };
        }

        // 检查本地存储中是否有该卖家的地址
        const savedAddresses = localStorage.getItem(`addresses_${sellerId}`);
        console.log('Saved addresses in localStorage:', savedAddresses);

        if (!savedAddresses) {
          console.log('No saved addresses for seller:', sellerId);
          return {
            ...order,
            seller_address: '卖家未设置地址'
          };
        }

        try {
          const sellerAddresses = addressStore.getAddressList(sellerId);
          console.log('Seller addresses from store:', sellerAddresses);

          if (sellerAddresses.length === 0) {
            console.log('Seller address list is empty');
            return {
              ...order,
              seller_address: '卖家地址列表为空'
            };
          }

          // 找到默认地址或第一个地址作为卖家地址
          const defaultSellerAddress = sellerAddresses.find(addr => addr.isDefault) || sellerAddresses[0];
          console.log('Default seller address:', defaultSellerAddress);

          if (!defaultSellerAddress) {
            console.log('No default seller address found');
            return {
              ...order,
              seller_address: '未找到卖家地址'
            };
          }

          // 格式化卖家地址
          let sellerAddress = '暂无地址信息';
          if (defaultSellerAddress) {
            sellerAddress = defaultSellerAddress.address || '暂无地址信息';
            console.log('Formatted seller address:', sellerAddress);
          }

          return {
            ...order,
            seller_address: sellerAddress
          };
        } catch (error) {
          console.error('Error getting seller address:', error);
          return {
            ...order,
            seller_address: '获取卖家地址失败'
          };
        }
      });
      // 强制更新数组引用，确保页面刷新
      deliveryOrders.value = [...ordersWithSellerAddress]
      deliveryPagination.value = {
        total: res.total,
        page: res.page,
        pageSize: res.pageSize
      }
    }
  }
  //标记为已送达
  const markAsDeliveredApi = async (adminId:number,orderId:number,markData:MarkDeliveredParams,userRole:string) => {
    const res = await markAsDelivered(adminId,orderId,markData,userRole)
    if(res) {
      const index = deliveryOrders.value.findIndex(item => item.id === orderId)
      if (index !== -1) {
        // 使用splice删除后，强制更新数组引用
        deliveryOrders.value.splice(index,1)
        deliveryOrders.value = [...deliveryOrders.value]
      }
      return res
    }
    await getOrdersToDeliverApi('admin', {page: 1, pageSize: 10})
  }

  return {
    orders,
    currentPendingOrderId,
    deliveryOrders,
    deliveryPagination,
    orderStatistics,
    createOrder,
    getUserOrdersList,
    shipSellerOrderApi,
    receiveOrderApi,
    getOrdersToDeliverApi,
    markAsDeliveredApi,
    pendingOrders,
    confirmedOrders,
    paidOrders,
    shippedOrders,
    deliveredOrders,
    completedOrders,
    cancelledOrders,
    rollbackOrders,
    executeSinglePayment,
    batchCreateUserOrder,
    processPaymentApi,
    enterPaymentPageApi,
    pagination,
    updateOrderStatus,
    cancelOrderApi,
    pendingOrdersList,   // 用于"待处理"tab
    confirmedOrdersList, // 用于"待确认"tab
    paidOrdersList,      // 用于"待付款"tab
    shippedOrdersList,   // 用于"待发货"tab
    deliveredOrdersList, // 用于"待收货"tab
    completedOrdersList, // 用于"待评价"tab
    cancelledOrdersList, // 用于"已取消"tab
    allOrdersList
  }
})
