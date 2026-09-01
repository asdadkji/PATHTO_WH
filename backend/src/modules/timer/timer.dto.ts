// 计时模块 DTO：开始/停止/手动记录请求参数校验
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, Min, IsIn } from 'class-validator';
import { ActivityType } from '@/types/enums';

// 合法的活动类型枚举值列表（用于 @IsIn 校验）
const ACTIVITY_TYPES = Object.values(ActivityType) as string[];

// 开始计时请求：activityType 必须为合法枚举值
export class StartTimerDto {
  @IsIn(ACTIVITY_TYPES, { message: '活动类型无效' })
  activityType!: string;
}

// 停止计时请求：sessionId 必填且非空字符串
export class StopTimerDto {
  @IsString({ message: 'sessionId不能为空' })
  @IsNotEmpty({ message: 'sessionId不能为空' })
  sessionId!: string;
}

// 手动记录请求：activityType 合法枚举；durationMinutes 正数（>=1）
export class ManualRecordDto {
  @IsIn(ACTIVITY_TYPES, { message: '活动类型无效' })
  activityType!: string;

  // @Type 把 body 中字符串形式的 durationMinutes 转为 number，再交给 @Min 校验
  @Type(() => Number)
  @Min(1, { message: '时长不能为0' })
  durationMinutes!: number;
}
