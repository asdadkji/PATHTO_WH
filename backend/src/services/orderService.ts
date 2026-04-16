//订单服务
import {
    CreateOrderRequest,
    IOrder,
    OrderModel,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    UpdateOrderStatusRequest
} from '@/models/Order'
//持久化
import {generateOrderNumber} from "@/utils/orderGenerator";
// 状态转移规则（基于您的数据库状态）
const TRANSITION_RULES: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.PAID],
    [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
    [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED],
    [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],  /*为适配前端订单列表*/
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: []
}
// 检查订单权限
const checkOrderPermission = (
    order: IOrder,
    actorId: number,
    actor: 'buyer' | 'seller' | 'system' | 'admin',
    newStatus: OrderStatus
): boolean => {
    if (actor === 'admin') return true
    if (actor === 'system') return true

    if (actor === 'buyer') {
        // 买家只能操作自己的订单
        if (order.buyer_id !== actorId) return false
        // 买家允许的操作
        const buyerAllowed: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.PENDING]: [OrderStatus.CANCELLED, OrderStatus.PAID],
            [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
            [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
            [OrderStatus.PAID]:       [],
            [OrderStatus.SHIPPED]:    [],
            [OrderStatus.COMPLETED]:  [],
            [OrderStatus.CANCELLED]:  [],
            [OrderStatus.REFUNDED]:   []
        }

        return buyerAllowed[order.status]?.includes(newStatus) || false
    }

    if (actor === 'seller') {
        // 卖家只能操作自己卖的商品
        if (order.seller_id !== actorId) return false

        // 卖家允许的操作
        const sellerAllowed: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.PENDING]:    [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]:  [],
            [OrderStatus.PAID]:       [OrderStatus.SHIPPED],
            [OrderStatus.SHIPPED]:    [OrderStatus.DELIVERED],
            [OrderStatus.DELIVERED]:  [],
            [OrderStatus.COMPLETED]:  [],
            [OrderStatus.CANCELLED]:  [],
            [OrderStatus.REFUNDED]:   []
        }

        return sellerAllowed[order.status]?.includes(newStatus) || false
    }

    return false
}
//大小写转换
const toEnum = (s:string):OrderStatus => {
    if (!s) {
        return OrderStatus.PENDING
    }
    const result = Object.values(OrderStatus).find(e=>e.toLowerCase() === s.toLowerCase())
    return result as OrderStatus || OrderStatus.PENDING
}

export const orderService = {
    //创建订单
    async createOrder(buyerId:number,request:CreateOrderRequest):Promise<IOrder>{
        //计算金额
        const totalPrice = request.unit_price * request.quantity
        const finalPrice = totalPrice + (request.delivery_fee || 0)
        //生成订单号
        const orderNumber = generateOrderNumber({
            businessType:"BOOK",
            transactionMethod:'ONLINE',
            userId:buyerId,
        });
        const orderData: Omit<IOrder, 'id'> = {
            order_number: orderNumber,
            book_id: request.book_id,
            book_snapshot: request.book_snapshot,
            buyer_id: buyerId,
            seller_id: request.seller_id,
            unit_price: request.unit_price,
            quantity: request.quantity,
            total_price: totalPrice,
            delivery_fee: request.delivery_fee || 0,
            final_price: finalPrice,
            status: OrderStatus.PENDING,
            payment_method: request.payment_method || PaymentMethod.CASH,
            payment_status: PaymentStatus.PENDING,
            transaction_method: request.transaction_method,
            meeting_location: request.meeting_location,
            meeting_time: request.meeting_time ? new Date(request.meeting_time) : undefined,
            buyer_note: request.buyer_note,
            created_at: new Date(),
            updated_at: new Date(),
            shipping_address: request.shipping_address,
        }
        return await OrderModel.createOrder(orderData)
    },
    //更新订单状态
    async updateOrderStatus(orderId:number, newStatus:OrderStatus,actor:'buyer' | 'seller' | 'admin', actorId:number,request?:UpdateOrderStatusRequest):Promise<IOrder>{
        //验证订单
        const order = await OrderModel.findOrderById(orderId)
        if(!order) throw new Error('订单不存在')
        const oldStatus = toEnum(order.status)
        
        // 对于线下交易的订单，允许直接从任何状态转换为completed状态
        if(order.transaction_method !== 'face_to_face' && !TRANSITION_RULES[oldStatus]?.includes(newStatus)) {
            throw new Error('订单状态更新失败')
        }
        
        // 对于线下交易的订单，允许卖家直接确认收货
        let hasPermission = checkOrderPermission(order, actorId, actor, newStatus)
        if(!hasPermission && order.transaction_method === 'face_to_face' && actor === 'seller' && newStatus === OrderStatus.COMPLETED) {
            hasPermission = true
        }
        
        if (!hasPermission) {
            throw new Error('无权执行此操作')
        }

        const updateData:Partial<IOrder> = {
            status:newStatus,
            updated_at:new Date()
        }
        //状态转换
        const now = new Date()
        switch (newStatus) {
            case OrderStatus.CONFIRMED:
                updateData.payment_status = PaymentStatus.PENDING
                break
            case OrderStatus.PAID:
                updateData.payment_status = PaymentStatus.PAID
                updateData.paid_at = now
                if(request?.data?.payment_id){
                    updateData.payment_id = request.data.payment_id
                }
                break
            case OrderStatus.SHIPPED:
                updateData.shipped_at = now
                updateData.tracking_company = request?.data?.tracking_company
                updateData.tracking_number = request?.data?.tracking_number
                break

            case OrderStatus.DELIVERED:
                updateData.delivered_at = now
                break

            case OrderStatus.COMPLETED:
                updateData.completed_at = now
                break

            case OrderStatus.CANCELLED:
                updateData.cancelled_at = now
                updateData.cancel_reason = request?.reason
/*                updateData.cancel_type = getCancelType(actor)*/

                // 如果是已支付订单取消，需要退款
                if (oldStatus === OrderStatus.PAID) {
                    updateData.payment_status = PaymentStatus.REFUNDED
                }
                break

            case OrderStatus.REFUNDED:
                updateData.payment_status = PaymentStatus.REFUNDED
                updateData.cancelled_at = now
/*                updateData.cancel_type = getCancelType(actor)*/
                updateData.cancel_reason = request?.reason || '订单退款'
                break
        }
        const ok = await OrderModel.updateOrder(orderId, {...updateData, status: newStatus});
        if (!ok) {
            throw new Error('订单状态更新失败')
        }
        const updated = await OrderModel.findOrderById(orderId)
        if(!updated) throw new Error('订单不存在')
        return updated
    },
    //获取用户订单列表
    async getUserOrders(userId:number,userType:'buyer' | 'seller' | 'admin', options:{
        page?:number
        pageSize?:number
        status?:OrderStatus | 'all'
        startDate?:Date
        endDate?:Date
        keyword?:string
        sortBy?:string
        sortOrder?:string
    }):Promise<{order:IOrder[];page:number;page_size:number;total:number}>{  
        return await OrderModel.getUserOrders(userId,userType,options)
    },
    //取消订单
    async cancelOrder(orderId:number,actor:'buyer'|'seller'|'admin',actorId:number):Promise<IOrder>{  
        const order = await orderService.updateOrderStatus(orderId,OrderStatus.CANCELLED, actor,actorId) /*[orderId],OrderStatus.CANCELLED,{cancel_reason:reason,cancelled_at:new Date()}*/
        if(!order) throw new Error('取消订单失败')
        return order
    },
    //支付
    async payOrder(orderId:number,buyerId:number,paymentMethod:PaymentMethod,paymentId:string):Promise<IOrder> {
        const order = await OrderModel.findOrderById(orderId)
        if(!order) throw new Error('订单不存在')
        if(order.status !== OrderStatus.PENDING) throw new Error('订单状态不正确')
        if(order.buyer_id !== buyerId) throw new Error('订单不属于该用户')
        return await orderService.updateOrderStatus(orderId,OrderStatus.PAID,'buyer',buyerId,{status:OrderStatus.PAID,data:{payment_method:paymentMethod,payment_id:paymentId}})
    },
    //卖家发货
    async shipOrder(orderId:number, sellerId:number, trackingCompany:string, trackingNumber:string):Promise<IOrder> {
        const order = await OrderModel.findOrderById(orderId);
        return await orderService.updateOrderStatus(orderId,OrderStatus.SHIPPED,'seller',sellerId,{status:OrderStatus.SHIPPED,data:{tracking_company:trackingCompany,tracking_number:trackingNumber}})
    },
    //买家确认收货
    async confirmOrder(orderId:number, buyerId:number):Promise<IOrder> {
        const order = await OrderModel.findOrderById(orderId)
        console.log(order?.status,orderId,buyerId)
        if (order?.status !== OrderStatus.DELIVERED) {
            throw new Error('订单当前状态不允许确认收货')
        }
        return await orderService.updateOrderStatus(orderId,OrderStatus.COMPLETED,'buyer',buyerId)
    },
    //需要配送的订单列表
    async deliveredOrderList(filters:{
        tracking_company?:string
        start_date?:Date
        end_date?:Date
        buyer_name?:string
        buyer_phone?:string
    }={},options:{page?:number,pageSize?:number}={}):Promise<{orders:IOrder[];total:number}> {
        return await OrderModel.findOrdersForDelivery(filters,options)
    },
    //标记订单已送达
    async markOrderDelivered(orderId:number, adminId:number, data: {
        tracking_company: string
        tracking_number: string
        delivered_time?:Date
        notes?:string
    }):Promise<IOrder>{
        const order = await OrderModel.findOrderById(orderId)
        if(!order){
            throw new Error('订单不存在')
        }
        if(order.status !== 'shipped') {
            throw new Error('订单当前状态不允许标记为已送达')
        }
        const deliveredAt = data.delivered_time || new Date()
        return await orderService.updateOrderStatus(orderId,OrderStatus.DELIVERED,'admin',adminId,{status:OrderStatus.DELIVERED,data:{deliveredAt}})
    },
    //搜索订单配送
    async searchDeliveredOrders(keyword:string,options:{page?:number,pageSize?:number}={}):Promise<{orders:IOrder[];total:number}> {
        return await OrderModel.searchDeliveryOrders(keyword,options)
    }
}