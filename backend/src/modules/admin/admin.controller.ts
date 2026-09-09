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

// ─── 任务模板管理 ────────────────────────────────────────────

// GET /api/admin/task-template/list：模板列表（可选 query: taskType）
export const listTemplates = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const taskType = typeof req.query.taskType === 'string' ? req.query.taskType : undefined;
    const data = await adminService.listTemplates(taskType);
    return success(res, data);
  },
);

// GET /api/admin/task-template/:id：单个模板详情
export const getTemplate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getTemplate(req.params.id);
    return success(res, data);
  },
);

// POST /api/admin/task-template：新建模板
export const createTemplate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const createdBy = req.user!.userId;
    const data = await adminService.createTemplate({ ...req.body, createdBy });
    return success(res, data);
  },
);

// PUT /api/admin/task-template/:id：更新模板
export const updateTemplate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.updateTemplate(req.params.id, req.body);
    return success(res, data);
  },
);

// PUT /api/admin/task-template/:id/toggle：切换模板启用/停用
export const toggleTemplateActive = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.toggleTemplateActive(req.params.id);
    return success(res, data);
  },
);

// ─── 商品管理 ────────────────────────────────────────────────

// GET /api/admin/product/list：所有商品列表（含已下架，可选 query: category）
export const listAllProducts = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const data = await adminService.listAllProducts(category);
    return success(res, data);
  },
);

// GET /api/admin/product/:id：单个商品详情
export const getProduct = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getProduct(req.params.id);
    return success(res, data);
  },
);

// POST /api/admin/product：新建商品
export const createProduct = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const createdBy = req.user!.userId;
    const data = await adminService.createProduct({ ...req.body, createdBy });
    return success(res, data);
  },
);

// PUT /api/admin/product/:id：更新商品
export const updateProduct = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.updateProduct(req.params.id, req.body);
    return success(res, data);
  },
);

// PUT /api/admin/product/:id/toggle：切换商品上架/下架
export const toggleProductActive = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.toggleProductActive(req.params.id);
    return success(res, data);
  },
);

// ─── 管理后台仪表盘 ────────────────────────────────────────────

// GET /api/admin/dashboard/kpi
export const getDashboardKpi = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getDashboardKpi();
    return success(res, data);
  },
);

// GET /api/admin/dashboard/weekly-trend
export const getWeeklyTrend = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getWeeklyTrend();
    return success(res, data);
  },
);

// GET /api/admin/dashboard/time-trend
export const getTimeTrend = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getTimeTrend();
    return success(res, data);
  },
);

// GET /api/admin/dashboard/task-type
export const getTaskTypeDistribution = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getTaskTypeDistribution();
    return success(res, data);
  },
);

// GET /api/admin/dashboard/time-distribution
export const getTimeDistribution = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getTimeDistribution();
    return success(res, data);
  },
);

// GET /api/admin/dashboard/time-monthly
export const getMonthlyTimeComparison = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getMonthlyTimeComparison();
    return success(res, data);
  },
);

// GET /api/admin/dashboard/homework-rate
export const getHomeworkRate = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getHomeworkRate();
    return success(res, data);
  },
);

// GET /api/admin/dashboard/points-source
export const getPointsSource = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getPointsSource();
    return success(res, data);
  },
);

// GET /api/admin/dashboard/product-category
export const getProductCategoryDistribution = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await adminService.getProductCategoryDistribution();
    return success(res, data);
  },
);
