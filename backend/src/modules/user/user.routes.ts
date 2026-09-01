// 用户模块路由
import { Router } from 'express';
import { authRequired } from '@/middleware/auth';
import { getProfile } from './user.controller';

const router = Router();

// 获取当前用户资料（需登录）
router.get('/profile', authRequired, getProfile);

export default router;
