// 兑换模块控制器：接收请求、调用 service、返回统一响应
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { redemptionService } from './redemption.service';

// POST /api/redemption/submit：提交兑换（body 经 SubmitRedemptionDto 校验）
export const submitRedemption = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { productId, quantity } = req.body;
    const data = await redemptionService.submitRedemption(userId, productId, quantity);
    return success(res, data);
  },
);

// GET /api/redemption/list：当前用户兑换记录（可选 query: status）
export const listRedemptions = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    // query 可能是 string/string[]，仅取 string 形式
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    const data = await redemptionService.listRedemptions(userId, status);
    return success(res, data);
  },
);

// PUT /api/redemption/:id/cancel：取消兑换订单
export const cancelRedemption = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const redemptionId = req.params.id;
    const data = await redemptionService.cancelRedemption(redemptionId, userId);
    return success(res, data);
  },
);
