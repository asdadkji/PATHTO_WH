// 用户端兑换相关接口封装（模块5-兑换）
// 统一响应 { code, data, message } 由 http.ts 拆包，业务层直接拿 data；
// 401 由 http.ts 自动跳登录，业务错误以 { code, message } 形式 reject。
// 注：baseURL 已含 /api，故路径不重复写 /api 前缀，与 cart.ts / task.ts 保持一致。
import http from '@/apis/http'
import type {
  CancelResult,
  CheckoutPayload,
  CheckoutResult,
  RedemptionListItem,
  RedemptionStatus,
  SubmitRedemptionPayload,
  SubmitResult,
  UseRedemptionResult,
} from '@/types'

/**
 * 提交兑换：POST /api/redemption/submit
 * body: { productId, quantity } → 成功 { redemptionId, status:'pending', pointsUsed }
 * 失败：400 积分不足 / 400 库存不足 / 400 商品不可兑换
 */
export function submitRedemption(data: SubmitRedemptionPayload) {
  return http.post('/redemption/submit', data) as unknown as Promise<SubmitResult>
}

/**
 * 购物车批量结算：POST /api/redemption/checkout
 * body: { items: [{ productId, quantity }] }
 * → 成功 { redemptions: [{ redemptionId, productId, productName, pointsUsed }], totalPointsUsed }
 * 失败：400 积分不足 / 400 库存不足 / 400 商品不可兑换
 */
export function checkoutFromCart(data: CheckoutPayload) {
  return http.post('/redemption/checkout', data) as unknown as Promise<CheckoutResult>
}

/**
 * 兑换记录列表：GET /api/redemption/list
 * 可选 query: { status } → 成功 [{ redemptionId, productName, status, pointsUsed }]
 * 失败：401 未登录
 */
export function getRedemptions(status?: RedemptionStatus) {
  return http.get('/redemption/list', {
    params: status ? { status } : {},
  }) as unknown as Promise<RedemptionListItem[]>
}

/**
 * 取消兑换：PUT /api/redemption/:id/cancel
 * → 成功 { success:true, refundPoints }；失败：400 不可取消 / 404 订单不存在
 */
export function cancelRedemption(id: string) {
  return http.put(
    `/redemption/${encodeURIComponent(id)}/cancel`,
  ) as unknown as Promise<CancelResult>
}

/**
 * 立即使用兑换：PUT /api/redemption/:id/use
 * → 成功 { success:true, status:'completed' }；失败：400 不可使用 / 404 订单不存在
 */
export function useRedemption(id: string) {
  return http.put(
    `/redemption/${encodeURIComponent(id)}/use`,
  ) as unknown as Promise<UseRedemptionResult>
}
