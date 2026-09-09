// 商品相关接口封装（模块4-商品）
// 统一响应 { code, data, message } 由 http.ts 拆包，业务层直接拿 data；
// 401 由 http.ts 自动跳登录，业务错误以 { code, message } 形式 reject。
// 注：baseURL 已含 /api，故路径不重复写 /api 前缀，与 task.ts 保持一致。
import http from '@/apis/http'
import type { Product, ProductCategory, ProductDetail } from '@/types'

/**
 * 商品列表：GET /api/product/list
 * query: { category? } → 成功 Product[]
 * 失败：401 未登录 / 400 分类无效
 */
export function getProducts(category?: ProductCategory) {
  return http.get('/product/list', {
    params: category ? { category } : {},
  }) as unknown as Promise<Product[]>
}

/**
 * 商品详情：GET /api/product/:id
 * → 成功 { productId, name, price, description, stock }
 * 失败：404 商品不存在
 */
export function getProductById(id: string) {
  return http.get(`/product/${encodeURIComponent(id)}`) as unknown as Promise<ProductDetail>
}
