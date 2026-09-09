// 购物车相关接口封装（模块4-购物车）
// 统一响应 { code, data, message } 由 http.ts 拆包，业务层直接拿 data；
// 401 由 http.ts 自动跳登录，业务错误以 { code, message } 形式 reject。
// 注：baseURL 已含 /api，故路径不重复写 /api 前缀，与 task.ts 保持一致。
import http from '@/apis/http'
import type {
  AddCartPayload,
  AddCartResult,
  CartData,
  RemoveCartResult,
  UpdateCartPayload,
  UpdateCartResult,
} from '@/types'

/**
 * 获取购物车：GET /api/cart
 * → 成功 { items: [{ cartItemId, productId, name, price, quantity }] }
 * 失败：401 未登录
 */
export function getCart() {
  return http.get('/cart') as unknown as Promise<CartData>
}

/**
 * 加入购物车：POST /api/cart/add
 * body: { productId, quantity } → 成功 { success, cartItemId }
 * 失败：400 库存不足 / 400 商品已下架
 */
export function addToCart(data: AddCartPayload) {
  return http.post('/cart/add', data) as unknown as Promise<AddCartResult>
}

/**
 * 更新购物车数量：PUT /api/cart/update
 * body: { cartItemId, quantity } → 成功 { success, quantity }
 * 失败：400 数量必须 > 0
 */
export function updateCartItem(data: UpdateCartPayload) {
  return http.put('/cart/update', data) as unknown as Promise<UpdateCartResult>
}

/**
 * 移除购物车项：DELETE /api/cart/remove
 * 契约支持 body 或 query 传 cartItemId，这里用 query 更通用（避免部分服务端不解析 DELETE body）
 * → 成功 { success: true }；失败：404 商品不在购物车中
 */
export function removeCartItem(cartItemId: string) {
  return http.delete('/cart/remove', {
    params: { cartItemId },
  }) as unknown as Promise<RemoveCartResult>
}
