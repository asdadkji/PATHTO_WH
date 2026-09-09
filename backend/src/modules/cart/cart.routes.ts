// 购物车模块路由
import { Router } from 'express';
import { authRequired } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { AddToCartDto, UpdateCartDto } from './cart.dto';
import { getCart, addToCart, updateCartItem, removeCartItem } from './cart.controller';

const router = Router();

// 查看购物车（需登录）
router.get('/', authRequired, getCart);
// 加入购物车（需登录 + body 校验）
router.post('/add', authRequired, validateBody(AddToCartDto), addToCart);
// 更新数量（需登录 + body 校验）
router.put('/update', authRequired, validateBody(UpdateCartDto), updateCartItem);
// 移除购物车项（需登录，cartItemId 取自 query 或 body）
router.delete('/remove', authRequired, removeCartItem);

export default router;
