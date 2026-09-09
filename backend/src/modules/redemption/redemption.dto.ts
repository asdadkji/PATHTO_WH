// 兑换模块 DTO：提交兑换请求参数校验
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, Min } from 'class-validator';

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
