import { Router } from 'express';
import { authRequired } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { CreateTaskDto, SelectTaskDto } from './task.dto';
import {
  getTodayTasks,
  createTask,
  completeTask,
  deleteTask,
  getWeeklyStats,
  selectSelfSelectedTask,
  startChallenge,
  getAvailableTemplates,
} from './task.controller';

const router = Router();

router.get('/today', authRequired, getTodayTasks);
router.post('/', authRequired, validateBody(CreateTaskDto), createTask);
router.put('/:id/complete', authRequired, completeTask);
router.delete('/:id', authRequired, deleteTask);
router.get('/stats/weekly', authRequired, getWeeklyStats);
router.post('/select', authRequired, validateBody(SelectTaskDto), selectSelfSelectedTask);
router.post('/challenge/:templateId', authRequired, startChallenge);
router.get('/templates', authRequired, getAvailableTemplates);

export default router;
