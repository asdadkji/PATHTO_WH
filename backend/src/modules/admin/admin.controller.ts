// 管理员模块控制器：接收请求、调用 service、返回统一响应
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { adminService } from './admin.service';

// GET /api/admin/redemption/list：所有用户兑换记录（可选 query: status）
export const listRedemptions = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    // query 可能是 string/string[]，仅取 string 形式
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    const data = await adminService.listRedemptions(status);
    return success(res, data);
  },
);

// PUT /api/admin/redemption/:id/approve：批准兑换订单
export const approveRedemption = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const adminId = req.user!.userId;
    const redemptionId = req.params.id;
    const data = await adminService.approveRedemption(redemptionId, adminId);
    return success(res, data);
  },
);

// PUT /api/admin/redemption/:id/reject：拒绝兑换订单（body 经 RejectRedemptionDto 校验）
export const rejectRedemption = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const adminId = req.user!.userId;
    const redemptionId = req.params.id;
    const { rejectReason } = req.body;
    const data = await adminService.rejectRedemption(redemptionId, adminId, rejectReason);
    return success(res, data);
  },
);
