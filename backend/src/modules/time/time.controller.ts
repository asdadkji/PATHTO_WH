// 时间统计模块控制器：接收请求、调用 service、返回统一响应
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { timeService } from './time.service';

// GET /api/time/target-status：今日达标状态
export const getTargetStatus = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await timeService.getTargetStatus(userId);
    return success(res, data);
  },
);

// GET /api/time/summary/today：今日时长汇总
export const getTodaySummary = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await timeService.getTodaySummary(userId);
    return success(res, data);
  },
);
