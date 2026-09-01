// 购物车模块 DTO：加入购物车、更新数量请求参数校验
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, Min } from 'class-validator';

// 加入购物车请求：productId 必填；quantity 正整数（>=1）
export class AddToCartDto {
  @IsString({ message: '商品ID不能为空' })
  @IsNotEmpty({ message: '商品ID不能为空' })
  productId!: string;

  // @Type 把 body 中字符串形式的 quantity 转为 number，再交给 @Min 校验
  @Type(() => Number)
  @Min(1, { message: '数量必须>0' })
  quantity!: number;
}

// 更新购物车数量请求：cartItemId 必填；quantity 正整数（>=1）
export class UpdateCartDto {
  @IsString({ message: '购物车项ID不能为空' })
  @IsNotEmpty({ message: '购物车项ID不能为空' })
  cartItemId!: string;

  @Type(() => Number)
  @Min(1, { message: '数量必须>0' })
  quantity!: number;
}
