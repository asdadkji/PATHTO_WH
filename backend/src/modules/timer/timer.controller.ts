// 计时模块控制器：接收请求、调用 service、返回统一响应
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { timerService } from './timer.service';

// POST /api/timer/start：开始计时（body 经 StartTimerDto 校验）
export const startTimer = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { activityType } = req.body;
    const data = await timerService.startTimer(userId, activityType);
    return success(res, data);
  },
);

// PUT /api/timer/stop：停止计时（body 经 StopTimerDto 校验）
export const stopTimer = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { sessionId } = req.body;
    const data = await timerService.stopTimer(userId, sessionId);
    return success(res, data);
  },
);

// POST /api/timer/manual：手动记录时长（body 经 ManualRecordDto 校验）
export const manualRecord = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { activityType, durationMinutes } = req.body;
    const data = await timerService.manualRecord(userId, activityType, durationMinutes);
    return success(res, data);
  },
);
