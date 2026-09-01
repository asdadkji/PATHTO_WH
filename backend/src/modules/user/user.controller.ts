// 用户模块控制器
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { userService } from './user.service';

// GET /api/user/profile
export const getProfile = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await userService.getProfile(userId);
    return success(res, data);
  },
);
