// 管理员兑换审核相关接口封装（模块5-管理员审核）
// 统一响应 { code, data, message } 由 http.ts 拆包，业务层直接拿 data；
// 401 由 http.ts 自动跳登录，403 无权限 / 400 库存不足等业务错误以 { code, message } reject。
// 注：baseURL 已含 /api，故路径写作 /admin/redemption/... 即对应 /api/admin/redemption/...
import http from '@/apis/http'
import type {
  AdminRedemptionListItem,
  ApproveRedemptionResult,
  RedemptionStatus,
  RejectRedemptionPayload,
  RejectRedemptionResult,
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
