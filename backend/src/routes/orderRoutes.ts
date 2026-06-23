//订单路由
import {Router} from "express";
import {OrderController} from "@/controllers/orderController";
export const orderRouter = Router();
//创建订单
orderRouter.post("/create/:userId", OrderController.createUserOrder);
//更新订单收货地址
orderRouter.put("/:userId/:orderId/address", OrderController.updateOrderAddress);
//获取用户订单列表
orderRouter.get("/list/:userId", OrderController.getUserOrders);
//更新订单状态
orderRouter.put("/:userId/:orderId/status", OrderController.updateUserOrderStatus)
//取消订单
orderRouter.post("/:userId/:orderId/cancel", OrderController.cancelOrder);
//进入支付页面
orderRouter.post("/:userId/:orderId/enterPayment", OrderController.enterPaymentPage);
//支付
orderRouter.post("/:userId/:orderId/pay", OrderController.processPayment);
//卖家发货
orderRouter.post("/:sellerId/:orderId/ship",OrderController.shipSellerOrder);
//买家收货
orderRouter.post("/:userId/:orderId/complete", OrderController.receiveOrder)
//查看配送订单列表
orderRouter.get("/shipList", OrderController.getOrdersToDeliver);
//标记为已送达
orderRouter.post("/:adminId/:orderId/delivered", OrderController.markDelivered);
//搜索配送订单
orderRouter.get("/search", OrderController.searchDeliveredOrders);

