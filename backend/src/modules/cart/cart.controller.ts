// 购物车模块控制器：接收请求、调用 service、返回统一响应
import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { asyncHandler } from '@/utils/asyncHandler';
import { cartService } from './cart.service';

// GET /api/cart：当前用户购物车（需登录）
export const getCart = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const data = await cartService.getCart(userId);
    return success(res, data);
  },
);

// POST /api/cart/add：加入购物车（body 经 AddToCartDto 校验，需登录）
export const addToCart = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { productId, quantity } = req.body;
    const data = await cartService.addToCart(userId, productId, quantity);
    return success(res, data);
  },
);

// PUT /api/cart/update：更新数量（body 经 UpdateCartDto 校验，需登录）
export const updateCartItem = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { cartItemId, quantity } = req.body;
    const data = await cartService.updateCartItem(userId, cartItemId, quantity);
    return success(res, data);
  },
);

// DELETE /api/cart/remove：移除购物车项（cartItemId 取自 query 或 body，需登录）
export const removeCartItem = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    // query 优先，其次 body；都没有则空字符串（service 会返回 404）
    const fromQuery =
      typeof req.query.cartItemId === 'string' ? req.query.cartItemId : '';
    const fromBody = req.body?.cartItemId;
    const cartItemId = fromQuery || fromBody || '';
    const data = await cartService.removeCartItem(userId, cartItemId);
    return success(res, data);
  },
);
