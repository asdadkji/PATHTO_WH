import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { notFound, errorHandler } from '@/middleware/errorHandler';
import authRouter from '@/modules/auth/auth.routes';
import userRouter from '@/modules/user/user.routes';
import taskRouter from '@/modules/task/task.routes';
import dashboardRouter from '@/modules/dashboard/dashboard.routes';
import timerRouter from '@/modules/timer/timer.routes';
import timeRouter from '@/modules/time/time.routes';
import productRouter from '@/modules/product/product.routes';
import cartRouter from '@/modules/cart/cart.routes';
import redemptionRouter from '@/modules/redemption/redemption.routes';
import adminRouter from '@/modules/admin/admin.routes';

//express初始化
export const app = express();

//安全与日志中间件
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//静态文件服务（上传的图片）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

//健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok' }, message: 'success' });
});

//模块路由将在此按模块逐步挂载（由 backend-architect 在各模块后端阶段接入）：
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/task', taskRouter);
app.use('/api/timer', timerRouter);
app.use('/api/time', timeRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/redemption', redemptionRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);
//app.use('/api/points', pointsRouter);
//app.use('/api/notification', notificationRouter);

//404与统一错误处理
app.use(notFound);
app.use(errorHandler);
