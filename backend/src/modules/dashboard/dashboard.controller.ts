// 仪表盘模块控制器
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { dashboardService } from './dashboard.service';

// GET /api/dashboard/overview
export const getOverview = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await dashboardService.getOverview(userId);
    return success(res, data);
  },
);

// GET /api/dashboard/weekly
export const getWeekly = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await dashboardService.getWeekly(userId);
    return success(res, data);
  },
);

// GET /api/dashboard/monthly
export const getMonthly = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await dashboardService.getMonthly(userId);
    return success(res, data);
  },
);
