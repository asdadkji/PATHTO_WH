// 商品模块路由
import { Router } from 'express';
import { authRequired } from '@/middleware/auth';
import { listProducts, getProductDetail } from './product.controller';

const router = Router();

// 商品列表（可选 query: category，需登录）
router.get('/list', authRequired, listProducts);
// 商品详情（需登录）
router.get('/:id', authRequired, getProductDetail);

export default router;
