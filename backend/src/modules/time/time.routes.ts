// 时间统计模块路由
import { Router } from 'express';
import { authRequired } from '@/middleware/auth';
import { getTargetStatus, getTodaySummary } from './time.controller';

const router = Router();

// 今日达标状态（需登录）
router.get('/target-status', authRequired, getTargetStatus);
// 今日时长汇总（需登录）
router.get('/summary/today', authRequired, getTodaySummary);

export default router;
