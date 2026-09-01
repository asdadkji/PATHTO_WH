// 管理员模块 DTO：拒绝兑换请求参数校验
import { IsString, IsNotEmpty } from 'class-validator';

// 拒绝兑换请求：rejectReason 必填且非空
export class RejectRedemptionDto {
  @IsString({ message: '拒绝原因不能为空' })
  @IsNotEmpty({ message: '拒绝原因不能为空' })
  rejectReason!: string;
}
