// 认证模块控制器：接收请求、调用 service、返回统一响应
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { authService } from './auth.service';

// POST /api/auth/login
export const login = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { username, password } = req.body;
    const data = await authService.login(username, password);
    return success(res, data);
  },
);

// POST /api/auth/register
export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { username, password } = req.body;
    const data = await authService.register(username, password);
    return success(res, data);
  },
);
