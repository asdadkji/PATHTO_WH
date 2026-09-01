// 任务模块控制器：接收请求、调用 service、返回统一响应
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { taskService } from './task.service';

// GET /api/task/today：今日任务列表（按 created_at 升序）
export const getTodayTasks = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await taskService.getTodayTasks(userId);
    return success(res, data);
  },
);

// POST /api/task：创建任务（body 经 CreateTaskDto 校验）
export const createTask = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { title, points, description } = req.body;
    const data = await taskService.createTask(userId, title, points, description);
    return success(res, data);
  },
);

// PUT /api/task/:id/complete：完成任务（事务发放积分）
export const completeTask = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const taskId = req.params.id;
    const data = await taskService.completeTask(taskId, userId);
    return success(res, data);
  },
);

// DELETE /api/task/:id：删除任务（已完成不可删）
export const deleteTask = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const taskId = req.params.id;
    const data = await taskService.deleteTask(taskId, userId);
    return success(res, data);
  },
);

// GET /api/task/stats/weekly：每周统计
export const getWeeklyStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await taskService.getWeeklyStats(userId);
    return success(res, data);
  },
);
