//订单处理
import { Request, Response } from 'express'
import {orderService} from "@/services/orderService";

export const OrderController = {
    //创建订单
    async createUserOrder(req: Request, res: Response) {
        console.log('========== 后端 OrderController.createUserOrder 开始 ==========')
        console.log('req.params:', req.params)
        console.log('req.body:', req.body)
        try {
            const userId = req.params.userId;
            if(!userId) {
                res.status(400).json({code:1,message: 'userId is required'});
                return;
            }
            const {body} = req;
            const requiredFields = ['book_id', 'seller_id', 'unit_price', 'quantity', 'transaction_method'];
            const missingFields = requiredFields.filter(field => !body[field]);
            console.log('missingFields:', missingFields)
            if(missingFields.length > 0) {
                res.status(400).json({code:1, message: `Missing required fields: ${missingFields.join(', ')}`});
                return;
            }
            console.log('调用 orderService.createOrder')
            const result = await orderService.createOrder(Number(userId), body);
            console.log('orderService.createOrder 返回:', result)
            if(result) {
                res.status(200).json({code:0, message: 'success', data: result});
            } else {
                res.status(500).json({code:1, message: 'create order failed'});
            }
        } catch (e) {
            console.log('创建订单失败',e);
            res.status(500).json({code:1, message: 'create order failed'});
        }
        console.log('========== 后端 OrderController.createUserOrder 结束 ==========')
    },
    //更新订单收货地址
    async updateOrderAddress(req: Request, res: Response) {
        console.log('========== 后端 OrderController.updateOrderAddress 开始 ==========')
        try {
            const { userId, orderId } = req.params;
            const { shipping_address } = req.body;
            
            if (!userId || !orderId) {
                res.status(400).json({code:1, message: 'Missing userId or orderId'});
                return;
            }
            
            if (!shipping_address) {
                res.status(400).json({code:1, message: 'Missing shipping_address'});
                return;
            }
            
            console.log('updateOrderAddress - userId:', userId, 'orderId:', orderId)
            console.log('updateOrderAddress - shipping_address:', shipping_address)
            
            const result = await orderService.updateOrderAddress(Number(orderId), shipping_address);
            
            if (result) {
                res.status(200).json({code:0, message: 'Address updated successfully', data: result});
            } else {
                res.status(500).json({code:1, message: 'Update address failed'});
            }
        } catch (e) {
            console.error('更新订单地址失败', e);
            res.status(500).json({code:1, message: 'Update address failed'});
        }
        console.log('========== 后端 OrderController.updateOrderAddress 结束 ==========')
    },
    //获取用户订单列表
    async getUserOrders(req: Request, res: Response) {
        try {
            const userId = Number(req.params.userId);
            const userRole = req.query.userRole as 'buyer' | 'seller' | 'admin'
            if(userId === undefined || userId === null || isNaN(userId)) {
                res.status(400).json({code:1, message: 'Missing user id'});
                return;
            }
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
            const status = req.query.status as any;
            const keyword = req.query.keyword as string;
            const sortBy = req.query.sortBy as string;
            const sortOrder = req.query.sortOrder as string;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;
            
            const result = await orderService.getUserOrders(userId, userRole, {
                page, 
                pageSize, 
                status,
                keyword,
                sortBy,
                sortOrder,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            });
            if(result) {
                res.status(200).json({code:0, message: 'success', data: result});
            }
        } catch (e) {
            console.log('获取订单失败',e);
            res.status(500).json({code:1, message: 'Internal server error'});
        }
    },
    //更新订单
    async updateUserOrderStatus(req: Request, res: Response) {
        try {
            const userId = Number(req.params.userId);
            const userRole = req.query.userRole as 'buyer' | 'seller' // 默认为买家
            const orderId = parseInt(req.params.orderId);
            const {status, reason, data} = req.body;
            if(!userId) {
                res.status(400).json({code:1, message: 'Missing user id'});
                return;
            }
            if(!orderId) {
                res.status(400).json({code:1, message: 'Missing order id'});
                return;
            }
            if(!status) {
                res.status(400).json({code:1, message: 'Missing status'});
                return;
            }
            if(isNaN(orderId)) {
                res.status(400).json({code:1, message: 'Invalid order id'});
                return;
            }
            let actor:'buyer' | 'seller' | 'admin' = userRole;

            const updatedOrder = await orderService.updateOrderStatus(orderId,status,actor,userId,{status,reason,data})
            if(updatedOrder) {
                res.status(200).json({code:0, message: 'Order status updated successfully', data: updatedOrder});
            } else {
                res.status(400).json({code:1, message: 'Failed to update order status'});
            }
        } catch (e) {
            console.log('updateUserOrderStatus error:',e);
            res.status(500).json({code:1, message: 'Internal server error'});
        }
    },
    //取消订单
    async cancelOrder(req:Request,res:Response) {
        try {
            const userId = Number(req.params.userId);
            const orderId = parseInt(req.params.orderId);
            const userRole = req.query.userRole as 'buyer' | 'seller' | 'admin';
            if(isNaN(orderId)) {
                res.status(400).json({code:1, message: 'Invalid order id'});
                return;
            }
            if(userId === undefined || userId === null || isNaN(userId)) {
                res.status(400).json({code:1, message: 'Invalid user id'});
                return;
            }
            const actor = userRole;
            const updateOrder = await orderService.cancelOrder(orderId,actor,userId)
            if(updateOrder) {
                res.status(200).json({code:0, message: 'Order cancelled successfully', data: updateOrder});
            } else {
                res.status(400).json({code:1, message: 'Failed to cancel order'});
            }
        } catch (e) {
            res.status(500).json({code:1, message: 'Internal server error'});
        }
    },
    //进入支付页面
    async enterPaymentPage(req:Request,res:Response) {
        try {
            const userId = Number(req.params.userId);
            const orderId = parseInt(req.params.orderId);
            if(isNaN(orderId)) {
                res.status(400).json({code:1, message: 'Invalid order id'});
                return;
            }
            if(!userId) {
                res.status(400).json({code:1, message: 'Invalid user id'});
                return;
            }
            const updatedOrder = await orderService.enterPaymentPage(orderId, userId);
            if(updatedOrder) {
                res.status(200).json({code:0, message: 'Enter payment page successfully', data: updatedOrder});
            } else {
                res.status(404).json({code:1, message: 'Order not found'});
            }
        } catch (e) {
            console.error('Enter payment page error:', e);
            res.status(500).json({code:1, message: 'Internal server error', error: (e as Error).message});
        }
    },
    //支付
    async processPayment(req:Request,res:Response) {
        try {
            const userId = Number(req.params.userId);
            const orderId = parseInt(req.params.orderId);
            const {payment_method,payment_id} = req.body;
            if(isNaN(orderId)) {
                res.status(400).json({code:1, message: 'Invalid order id'});
                return;
            }
            if(!userId) {
                res.status(400).json({code:1, message: 'Invalid user id'});
                return;
            }
            if(!payment_method || !payment_id) {
                res.status(400).json({code:1, message: 'Invalid payment details'});
                return;
            }
            const updatedOrder = await orderService.payOrder(orderId,userId,payment_method,payment_id);
            if(updatedOrder) {
                res.status(200).json({code:0, message: 'Order payment processed successfully'});
            } else {
                res.status(404).json({code:1, message: 'Order not found'});
            }
        } catch (e) {
            console.error('Payment error:', e);
            res.status(500).json({code:1, message: 'Internal server error', error: (e as Error).message});
        }
    },
    //卖家发货
    async shipSellerOrder(req:Request,res:Response) {
        try {
            const sellerId = Number(req.params.sellerId);
            const orderId = parseInt(req.params.orderId);
            const { tracking_company, tracking_number } = req.body
            if(isNaN(orderId)) {
                res.status(400).json({code:1, message: 'Invalid order id'});
                return;
            }
            if(!sellerId) {
                res.status(400).json({code: 1, message: 'Invalid user id'});
            }
            if (!tracking_company || !tracking_number) {
                return res.status(400).json({
                    success: false,
                    message: '发货需要填写快递公司和快递单号'
                })
            }
            const updatedOrder = await orderService.shipOrder( orderId, sellerId, tracking_company, tracking_number);
            if(updatedOrder) {
                res.status(200).json({code:0, message: 'Order shipped successfully', data: updatedOrder});
            } else {
                res.status(400).json({code:1, message: 'Order not found'});
            }
        } catch (e) {
            console.log(e)
            res.status(500).json({code:1, message: 'Internal server error'});
        }
    },
    //买家收货
    async receiveOrder(req: Request, res: Response) {
        try {
            const userId = Number(req.params.userId);
            const orderId = parseInt(req.params.orderId);
            if (!userId) {
                return res.status(401).json({ success: false, message: '未授权' })
            }

            if (isNaN(orderId)) {
                return res.status(400).json({ success: false, message: '订单ID无效' })
            }
            const updatedOrder = await orderService.confirmOrder(orderId,userId);
            if(updatedOrder) {
                res.status(200).json({code:0, message: 'Order received successfully', data: updatedOrder});
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({code:1, message: 'Internal server error'});
        }
    },
    //获取需要配送的订单
    async getOrdersToDeliver(req: Request, res: Response) {
        try {
            const userRole = req.query.userRole;
            if(userRole !== 'admin' ) {  /*&& userRole !== 'delivery'*/
                return res.status(401).json({ code:1, message: '未授权' })
            }
            const tracking_company = req.query.tracking_company as string | undefined;
            const start_date = req.query.start_date as Date | undefined;
            const end_date = req.query.end_date as Date | undefined;
            const buyer_name = req.query.buyer_name as string | undefined;
            const buyer_phone = req.query.buyer_phone as string | undefined;
            const status = req.query.status as string | undefined;
            const page = parseInt(req.query.page as string);
            const pageSize = parseInt(req.query.pageSize as string);
            const result = await orderService.deliveredOrderList(
                {tracking_company,start_date,end_date,buyer_name,buyer_phone,status},
                {page, pageSize});
            if(result) {
                res.status(200).json({code:0, message: '获取成功', data: result});
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({code:1, message: 'Internal server error'});
        }
    },
    //标记为已送达
    async markDelivered(req: Request, res: Response) {
        try {
            const adminId = Number(req.params.adminId);
            const userRole = req.query.userRole;
            if(!adminId || userRole !== 'admin') {
                return res.status(401).json({ code:1, message: '未授权' })
            }
            const orderId = parseInt(req.params.orderId);
            const {
                tracking_company,
                tracking_number,
                delivered_time,
                notes
            } = req.body
            if(isNaN(orderId)) {
                return res.status(400).json({ code:1, message: '无效的订单ID' })
            }
            const result = await orderService.markOrderDelivered(orderId,adminId,{tracking_company, tracking_number, delivered_time, notes})
            if(result) {
                return res.status(200).json({code:0, message: '订单已标记为已送达'});
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({code:1, message: 'Internal server error'});
        }
    },
    //搜索配送订单
    async searchDeliveredOrders(req: Request, res: Response) {
        try {
            const userRole = req.query.userRole
            if(userRole !== 'admin') {
                return res.status(401).json({ code:1, message: '未授权' })
            }
            const page = parseInt(req.query.page as string) || 1
            const pageSize = parseInt(req.query.pageSize as string) || 20
            const keyword = req.query.keyword as string
            console.log(keyword)//////////////
            if (!keyword || keyword.trim() === '') {
                return res.status(400).json({
                    code: 1,
                    message: '请输入搜索关键词'
                })
            }
            const result = await orderService.searchDeliveredOrders(keyword, {page, pageSize})
            if(result) {
                return res.status(200).json({code:0, message: '查询成功', data: result})
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({code:1, message: 'Internal server error'});
        }
    }
}