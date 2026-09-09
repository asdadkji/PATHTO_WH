// 兑换模块 DTO：提交兑换 / 购物车批量结算的请求参数校验
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, Min, IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';

// 提交兑换请求：productId 必填且非空；quantity 正整数（>=1）
export class SubmitRedemptionDto {
  @IsString({ message: '商品ID不能为空' })
  @IsNotEmpty({ message: '商品ID不能为空' })
  productId!: string;

  // @Type 把 body 中字符串形式的 quantity 转为 number，再交给 @Min 校验
  @Type(() => Number)
  @Min(1, { message: '数量必须>0' })
  quantity!: number;
}

// 购物车结算单项
export class CheckoutItemDto {
  @IsString({ message: '商品ID不能为空' })
  @IsNotEmpty({ message: '商品ID不能为空' })
  productId!: string;

  @Type(() => Number)
  @Min(1, { message: '数量必须>0' })
  quantity!: number;
}

// 购物车批量结算请求：items 非空数组，每项经 CheckoutItemDto 校验
export class CheckoutDto {
  @IsArray({ message: '商品列表不能为空' })
  @ArrayNotEmpty({ message: '购物车不能为空' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];
}
