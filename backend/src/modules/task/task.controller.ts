import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { taskService } from './task.service';

export const getTodayTasks = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await taskService.getTodayTasks(userId);
    return success(res, data);
  },
);

export const createTask = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { title, points, description } = req.body;
    const data = await taskService.createTask(userId, title, points, description);
    return success(res, data);
  },
);

export const completeTask = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const taskId = req.params.id;
    const data = await taskService.completeTask(taskId, userId);
    return success(res, data);
  },
);

export const deleteTask = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const taskId = req.params.id;
    const data = await taskService.deleteTask(taskId, userId);
    return success(res, data);
  },
);

export const getWeeklyStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await taskService.getWeeklyStats(userId);
    return success(res, data);
  },
);

export const selectSelfSelectedTask = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { templateId } = req.body;
    const data = await taskService.selectSelfSelectedTask(userId, templateId);
    return success(res, data);
  },
);

export const startChallenge = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const templateId = req.params.templateId;
    const data = await taskService.startChallenge(userId, templateId);
    return success(res, data);
  },
);

export const getAvailableTemplates = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await taskService.getAvailableTemplates();
    return success(res, data);
  },
);
