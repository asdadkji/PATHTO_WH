// 认证模块路由
import { Router } from 'express';
import { validateBody } from '@/middleware/validate';
import { LoginDto, RegisterDto } from './auth.dto';
import { login, register } from './auth.controller';

const router = Router();

// 登录
router.post('/login', validateBody(LoginDto), login);
// 注册
router.post('/register', validateBody(RegisterDto), register);

export default router;
