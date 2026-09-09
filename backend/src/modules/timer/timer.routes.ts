// 计时模块路由
import { Router } from 'express';
import { authRequired } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { StartTimerDto, StopTimerDto, ManualRecordDto } from './timer.dto';
import { startTimer, stopTimer, manualRecord } from './timer.controller';

const router = Router();

// 开始计时（需登录 + body 校验）
router.post('/start', authRequired, validateBody(StartTimerDto), startTimer);
// 停止计时（需登录 + body 校验）
router.put('/stop', authRequired, validateBody(StopTimerDto), stopTimer);
// 手动记录时长（需登录 + body 校验）
router.post('/manual', authRequired, validateBody(ManualRecordDto), manualRecord);

export default router;
