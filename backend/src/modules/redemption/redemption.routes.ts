// 兑换模块路由（用户端）
import { Router } from 'express';
import { authRequired } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { SubmitRedemptionDto, CheckoutDto } from './redemption.dto';
import { submitRedemption, checkoutFromCart, listRedemptions, cancelRedemption, useRedemption } from './redemption.controller';

const router = Router();

// 提交兑换（需登录 + body 校验）
router.post('/submit', authRequired, validateBody(SubmitRedemptionDto), submitRedemption);
// 购物车批量结算（需登录 + body 校验）
router.post('/checkout', authRequired, validateBody(CheckoutDto), checkoutFromCart);
// 兑换记录列表（需登录，可选 query: status）
router.get('/list', authRequired, listRedemptions);
// 取消兑换订单（需登录）
router.put('/:id/cancel', authRequired, cancelRedemption);
// 立即使用已批准的兑换（需登录）
router.put('/:id/use', authRequired, useRedemption);

export default router;
