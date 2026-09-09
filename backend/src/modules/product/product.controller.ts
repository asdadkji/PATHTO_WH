// 商品模块控制器：接收请求、调用 service、返回统一响应
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { productService } from './product.service';

// GET /api/product/list：商品列表（可选 query: category，需登录）
export const listProducts = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    // query 参数可能是 string/string[]，仅取 string 形式
    const category =
      typeof req.query.category === 'string' ? req.query.category : undefined;
    const data = await productService.listProducts(category);
    return success(res, data);
  },
);

// GET /api/product/:id：商品详情（需登录）
export const getProductDetail = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const productId = req.params.id;
    const data = await productService.getProductDetail(productId);
    return success(res, data);
  },
);
