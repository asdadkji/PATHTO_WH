// 管理员模块路由（需登录 + 管理员角色）
import { Router } from 'express';
import { authRequired, roleRequired } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { Role } from '@/types/enums';
import { RejectRedemptionDto, CreateTemplateDto, UpdateTemplateDto, CreateProductDto, UpdateProductDto } from './admin.dto';
import {
  listRedemptions,
  approveRedemption,
  rejectRedemption,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  toggleTemplateActive,
  listAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  toggleProductActive,
  getDashboardKpi,
  getWeeklyTrend,
  getTimeTrend,
  getTaskTypeDistribution,
  getTimeDistribution,
  getMonthlyTimeComparison,
  getHomeworkRate,
  getPointsSource,
  getProductCategoryDistribution,
} from './admin.controller';

const router = Router();

// ─── 兑换审核 ────────────────────────────────────────────────

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

// ─── 任务模板管理 ────────────────────────────────────────────

// 模板列表（可选 query: taskType 过滤）
router.get(
  '/task-template/list',
  authRequired,
  roleRequired(Role.Admin),
  listTemplates,
);
// 单个模板详情
router.get(
  '/task-template/:id',
  authRequired,
  roleRequired(Role.Admin),
  getTemplate,
);
// 新建模板
router.post(
  '/task-template',
  authRequired,
  roleRequired(Role.Admin),
  validateBody(CreateTemplateDto),
  createTemplate,
);
// 更新模板
router.put(
  '/task-template/:id',
  authRequired,
  roleRequired(Role.Admin),
  validateBody(UpdateTemplateDto),
  updateTemplate,
);
// 切换模板启用/停用
router.put(
  '/task-template/:id/toggle',
  authRequired,
  roleRequired(Role.Admin),
  toggleTemplateActive,
);

// ─── 商品管理 ────────────────────────────────────────────────

// 商品列表（含已下架，可选 query: category 过滤）
router.get(
  '/product/list',
  authRequired,
  roleRequired(Role.Admin),
  listAllProducts,
);
// 单个商品详情
router.get(
  '/product/:id',
  authRequired,
  roleRequired(Role.Admin),
  getProduct,
);
// 新建商品
router.post(
  '/product',
  authRequired,
  roleRequired(Role.Admin),
  validateBody(CreateProductDto),
  createProduct,
);
// 更新商品
router.put(
  '/product/:id',
  authRequired,
  roleRequired(Role.Admin),
  validateBody(UpdateProductDto),
  updateProduct,
);
// 切换商品上架/下架
router.put(
  '/product/:id/toggle',
  authRequired,
  roleRequired(Role.Admin),
  toggleProductActive,
);

// ─── 仪表盘 ──────────────────────────────────────────────────

router.get('/dashboard/kpi', authRequired, roleRequired(Role.Admin), getDashboardKpi);
router.get('/dashboard/weekly-trend', authRequired, roleRequired(Role.Admin), getWeeklyTrend);
router.get('/dashboard/time-trend', authRequired, roleRequired(Role.Admin), getTimeTrend);
router.get('/dashboard/task-type', authRequired, roleRequired(Role.Admin), getTaskTypeDistribution);
router.get('/dashboard/time-distribution', authRequired, roleRequired(Role.Admin), getTimeDistribution);
router.get('/dashboard/time-monthly', authRequired, roleRequired(Role.Admin), getMonthlyTimeComparison);
router.get('/dashboard/homework-rate', authRequired, roleRequired(Role.Admin), getHomeworkRate);
router.get('/dashboard/points-source', authRequired, roleRequired(Role.Admin), getPointsSource);
router.get('/dashboard/product-category', authRequired, roleRequired(Role.Admin), getProductCategoryDistribution);

export default router;
