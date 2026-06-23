import express from 'express';
import helmet from "helmet";
import morgan from "morgan";
import path from 'path';
//引入路由
import { authRouter } from "./routes/authRoutes";
import { bookRouter } from "@/routes/bookRoutes";
import { userRouter } from "@/routes/userRoutes";
import { couponRouter } from "@/routes/couponRoutes";
import { orderRouter } from "@/routes/orderRoutes";
import { reviewRouter } from "@/routes/reviewRoutes";
import { adminRouter } from "@/routes/adminRoutes";
import { sellerRouter } from "@/routes/sellerRoutes";
import { uploadRouter } from "@/routes/uploadRoutes";
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
// 静态文件服务，用于访问上传的图片
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
//注册路由
app.use('/api/auth', authRouter);
app.use('/api/filter', bookRouter);
app.use('/api/user', userRouter);
app.use('/api/coupon', couponRouter);
app.use('/api/order', orderRouter);
app.use('/api/review', reviewRouter);
app.use('/api/admin', adminRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/upload', uploadRouter);

// 启动定时任务
import { startTasks } from './tasks';
startTasks();

