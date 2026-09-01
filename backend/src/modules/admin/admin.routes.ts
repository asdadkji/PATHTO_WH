// 管理员模块路由（需登录 + 管理员角色）
import { Router } from 'express';
import { authRequired, roleRequired } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { Role } from '@/types/enums';
import { RejectRedemptionDto } from './admin.dto';
import { listRedemptions, approveRedemption, rejectRedemption } from './admin.controller';

const router = Router();

// 所有用户兑换记录（需管理员，可选 query: status）
router.get(
  '/redemption/list',
  authRequired,
  roleRequired(Role.Admin),
  listRedemptions,
);
// 批准兑换订单（需管理员）
router.put(
  '/redemption/:id/approve',
  authRequired,
  roleRequired(Role.Admin),
  approveRedemption,
);
// 拒绝兑换订单（需管理员 + body 校验）
router.put(
  '/redemption/:id/reject',
  authRequired,
  roleRequired(Role.Admin),
  validateBody(RejectRedemptionDto),
  rejectRedemption,
);

export default router;
