// 任务模块 DTO：创建任务请求参数校验
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

// 创建任务请求：标题必填；积分为正整数（>0）；描述可选
export class CreateTaskDto {
  @IsString({ message: '标题不能为空' })
  @IsNotEmpty({ message: '标题不能为空' })
  title!: string;

  // @Type 把 body 中字符串形式的 points 转为 number，再交给 @IsInt @Min 校验
  @Type(() => Number)
  @IsInt({ message: '积分必须>0' })
  @Min(1, { message: '积分必须>0' })
  points!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
