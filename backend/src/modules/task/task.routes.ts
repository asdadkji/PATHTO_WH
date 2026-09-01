// 任务模块路由
import { Router } from 'express';
import { authRequired } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { CreateTaskDto } from './task.dto';
import {
  getTodayTasks,
  createTask,
  completeTask,
  deleteTask,
  getWeeklyStats,
} from './task.controller';

const router = Router();

// 今日任务列表（需登录）
router.get('/today', authRequired, getTodayTasks);
// 创建任务（需登录 + body 校验）
router.post('/', authRequired, validateBody(CreateTaskDto), createTask);
// 完成任务（需登录）
router.put('/:id/complete', authRequired, completeTask);
// 删除任务（需登录）
router.delete('/:id', authRequired, deleteTask);
// 每周统计（需登录）
router.get('/stats/weekly', authRequired, getWeeklyStats);

export default router;
