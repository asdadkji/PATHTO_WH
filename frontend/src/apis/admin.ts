// 管理员接口封装（兑换审核 + 任务模板管理 + 商品管理 + 仪表盘）
import http from '@/apis/http'
import type {
  AdminRedemptionListItem,
  ApproveRedemptionResult,
  RedemptionStatus,
  RejectRedemptionPayload,
  RejectRedemptionResult,
  AdminTemplateItem,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  TaskType,
  AdminProductItem,
  CreateProductPayload,
  UpdateProductPayload,
  ProductCategory,
  DashboardKpi,
  WeeklyTrend,
  TimeTrend,
  TaskTypeDistItem,
  TimeDistItem,
  MonthlyTimeComparison,
  HomeworkRate,
  PointsSourceItem,
  ProductCategoryDistItem,
} from '@/types'

/**
 * 管理端兑换列表：GET /api/admin/redemption/list
 * 可选 query: { status } → 成功 [{ redemptionId, userName, productName, status, pointsUsed }]
 * 失败：403 无权限
 */
export function getAdminRedemptions(status?: RedemptionStatus) {
  return http.get('/admin/redemption/list', {
    params: status ? { status } : {},
  }) as unknown as Promise<AdminRedemptionListItem[]>
}

/**
 * 批准兑换：PUT /api/admin/redemption/:id/approve
 * → 成功 { success:true, status:'approved' }；失败：400 库存不足
 */
export function approveRedemption(id: string) {
  return http.put(
    `/admin/redemption/${encodeURIComponent(id)}/approve`,
  ) as unknown as Promise<ApproveRedemptionResult>
}

/**
 * 拒绝兑换：PUT /api/admin/redemption/:id/reject
 * body: { rejectReason } → 成功 { success:true, status:'rejected' }；失败：403 无权限
 */
export function rejectRedemption(id: string, data: RejectRedemptionPayload) {
  return http.put(
    `/admin/redemption/${encodeURIComponent(id)}/reject`,
    data,
  ) as unknown as Promise<RejectRedemptionResult>
}

// ─── 任务模板管理 ────────────────────────────────────────────

/** 模板列表：GET /api/admin/task-template/list，可选 taskType 过滤 */
export function getAdminTemplates(taskType?: TaskType) {
  return http.get('/admin/task-template/list', {
    params: taskType ? { taskType } : {},
  }) as unknown as Promise<AdminTemplateItem[]>
}

/** 单个模板详情：GET /api/admin/task-template/:id */
export function getAdminTemplate(id: string) {
  return http.get(
    `/admin/task-template/${encodeURIComponent(id)}`,
  ) as unknown as Promise<AdminTemplateItem>
}

/** 新建模板：POST /api/admin/task-template */
export function createAdminTemplate(data: CreateTemplatePayload) {
  return http.post('/admin/task-template', data) as unknown as Promise<AdminTemplateItem>
}

/** 更新模板：PUT /api/admin/task-template/:id */
export function updateAdminTemplate(id: string, data: UpdateTemplatePayload) {
  return http.put(
    `/admin/task-template/${encodeURIComponent(id)}`,
    data,
  ) as unknown as Promise<AdminTemplateItem>
}

/** 切换模板启用/停用：PUT /api/admin/task-template/:id/toggle */
export function toggleAdminTemplate(id: string) {
  return http.put(
    `/admin/task-template/${encodeURIComponent(id)}/toggle`,
  ) as unknown as Promise<AdminTemplateItem>
}

// ─── 商品管理 ────────────────────────────────────────────────

/** 商品列表（含已下架）：GET /api/admin/product/list，可选 category 过滤 */
export function getAdminProducts(category?: ProductCategory) {
  return http.get('/admin/product/list', {
    params: category ? { category } : {},
  }) as unknown as Promise<AdminProductItem[]>
}

/** 单个商品详情：GET /api/admin/product/:id */
export function getAdminProduct(id: string) {
  return http.get(
    `/admin/product/${encodeURIComponent(id)}`,
  ) as unknown as Promise<AdminProductItem>
}

/** 新建商品：POST /api/admin/product */
export function createAdminProduct(data: CreateProductPayload) {
  return http.post('/admin/product', data) as unknown as Promise<AdminProductItem>
}

/** 更新商品：PUT /api/admin/product/:id */
export function updateAdminProduct(id: string, data: UpdateProductPayload) {
  return http.put(
    `/admin/product/${encodeURIComponent(id)}`,
    data,
  ) as unknown as Promise<AdminProductItem>
}

/** 切换商品上架/下架：PUT /api/admin/product/:id/toggle */
export function toggleAdminProduct(id: string) {
  return http.put(
    `/admin/product/${encodeURIComponent(id)}/toggle`,
  ) as unknown as Promise<AdminProductItem>
}

// ─── 仪表盘 ──────────────────────────────────────────────────

/** KPI 统计卡片：GET /api/admin/dashboard/kpi */
export function getDashboardKpi() {
  return http.get('/admin/dashboard/kpi') as unknown as Promise<DashboardKpi>
}

/** 近7天积分与任务趋势：GET /api/admin/dashboard/weekly-trend */
export function getWeeklyTrend() {
  return http.get('/admin/dashboard/weekly-trend') as unknown as Promise<WeeklyTrend>
}

/** 近7天时间分配趋势：GET /api/admin/dashboard/time-trend */
export function getTimeTrend() {
  return http.get('/admin/dashboard/time-trend') as unknown as Promise<TimeTrend>
}

/** 任务类型分布：GET /api/admin/dashboard/task-type */
export function getTaskTypeDistribution() {
  return http.get('/admin/dashboard/task-type') as unknown as Promise<TaskTypeDistItem[]>
}

/** 活动时间分布：GET /api/admin/dashboard/time-distribution */
export function getTimeDistribution() {
  return http.get('/admin/dashboard/time-distribution') as unknown as Promise<TimeDistItem[]>
}

/** 本月 vs 上月时间对比：GET /api/admin/dashboard/time-monthly */
export function getMonthlyTimeComparison() {
  return http.get('/admin/dashboard/time-monthly') as unknown as Promise<MonthlyTimeComparison>
}

/** 作业达标率：GET /api/admin/dashboard/homework-rate */
export function getHomeworkRate() {
  return http.get('/admin/dashboard/homework-rate') as unknown as Promise<HomeworkRate>
}

/** 积分来源构成：GET /api/admin/dashboard/points-source */
export function getPointsSource() {
  return http.get('/admin/dashboard/points-source') as unknown as Promise<PointsSourceItem[]>
}

/** 商品分类分布：GET /api/admin/dashboard/product-category */
export function getProductCategoryDistribution() {
  return http.get(
    '/admin/dashboard/product-category',
  ) as unknown as Promise<ProductCategoryDistItem[]>
}
