import express from 'express';
import helmet from "helmet";
import morgan from "morgan";
//引入路由
import { authRouter } from "./routes/authRoutes";
import { bookRouter } from "@/routes/bookRoutes";
import { userRouter } from "@/routes/userRoutes";
import { couponRouter } from "@/routes/couponRoutes";
import { orderRouter } from "@/routes/orderRoutes";
import { reviewRouter } from "@/routes/reviewRoutes";
import { adminRouter } from "@/routes/adminRoutes";
import { sellerRouter } from "@/routes/sellerRoutes";
//中间件
import { corsMiddleware } from "@/middleware/corsMiddleware";
//express初始化
export const app = express();
app.use(helmet());
//cors反向代理
app.use(corsMiddleware);
app.use(morgan("combined"));
//格式化
app.use(express.json());
//注册路由
app.use('/api/auth', authRouter);
app.use('/api/filter', bookRouter);
app.use('/api/user', userRouter);
app.use('/api/coupon', couponRouter);
app.use('/api/order', orderRouter);
app.use('/api/review', reviewRouter);
app.use('/api/admin', adminRouter);
app.use('/api/seller', sellerRouter);

// 启动定时任务
import { startTasks } from './tasks';
startTasks();

