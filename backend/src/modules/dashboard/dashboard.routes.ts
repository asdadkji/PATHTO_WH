// 仪表盘模块路由
import { Router } from 'express';
import { authRequired } from '@/middleware/auth';
import { getOverview, getWeekly, getMonthly } from './dashboard.controller';

const router = Router();

// 今日总览（需登录）
router.get('/overview', authRequired, getOverview);
// 每周统计（需登录）
router.get('/weekly', authRequired, getWeekly);
// 每月统计（需登录）
router.get('/monthly', authRequired, getMonthly);

export default router;
