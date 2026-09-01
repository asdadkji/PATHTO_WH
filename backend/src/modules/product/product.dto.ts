// 商品模块 DTO：商品列表查询参数（query）契约定义
// 注：query 参数不走 validateBody 中间件（其只校验 req.body），
// category 合法性在 service 内手动校验，不合法抛 400「分类无效」
import { IsOptional, IsIn } from 'class-validator';
import { ProductCategory } from '@/types/enums';

// 合法的商品分类枚举值列表
const PRODUCT_CATEGORIES = Object.values(ProductCategory) as string[];

// 商品列表查询：category 可选，传入时必须为合法枚举值
export class ListProductsDto {
  @IsOptional()
  @IsIn(PRODUCT_CATEGORIES, { message: '分类无效' })
  category?: string;
}
