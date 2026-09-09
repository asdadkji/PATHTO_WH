// 管理员模块 DTO：兑换审核 + 任务模板管理参数校验
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
} from 'class-validator';

// 拒绝兑换请求：rejectReason 必填且非空
export class RejectRedemptionDto {
  @IsString({ message: '拒绝原因不能为空' })
  @IsNotEmpty({ message: '拒绝原因不能为空' })
  rejectReason!: string;
}

// 创建任务模板
export class CreateTemplateDto {
  @IsString({ message: '任务标题不能为空' })
  @IsNotEmpty({ message: '任务标题不能为空' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt({ message: '默认积分必须为整数' })
  @Min(0, { message: '默认积分不能为负数' })
  defaultPoints!: number;

  @IsOptional()
  @IsInt({ message: '7天奖励积分必须为整数' })
  @Min(0)
  streakBonus7?: number;

  @IsOptional()
  @IsInt({ message: '30天奖励积分必须为整数' })
  @Min(0)
  streakBonus30?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean({ message: 'isDailyRepeat 必须为布尔值' })
  isDailyRepeat?: boolean;

  @IsIn(['fixed_daily', 'self_selected', 'challenge'], {
    message: 'taskType 必须为 fixed_daily / self_selected / challenge 之一',
  })
  taskType!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

// 更新任务模板（所有字段可选）
export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt({ message: '默认积分必须为整数' })
  @Min(0, { message: '默认积分不能为负数' })
  defaultPoints?: number;

  @IsOptional()
  @IsInt({ message: '7天奖励积分必须为整数' })
  @Min(0)
  streakBonus7?: number;

  @IsOptional()
  @IsInt({ message: '30天奖励积分必须为整数' })
  @Min(0)
  streakBonus30?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean({ message: 'isDailyRepeat 必须为布尔值' })
  isDailyRepeat?: boolean;

  @IsOptional()
  @IsIn(['fixed_daily', 'self_selected', 'challenge'], {
    message: 'taskType 必须为 fixed_daily / self_selected / challenge 之一',
  })
  taskType?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive 必须为布尔值' })
  isActive?: boolean;
}

// 创建商品
export class CreateProductDto {
  @IsString({ message: '商品名称不能为空' })
  @IsNotEmpty({ message: '商品名称不能为空' })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt({ message: '积分价格必须为整数' })
  @Min(1, { message: '积分价格至少为1' })
  pricePoints!: number;

  @IsIn(['toy', 'game_time', 'activity', 'food', 'book', 'other'], {
    message: 'category 必须为 toy / game_time / activity / food / book / other 之一',
  })
  category!: string;

  @IsOptional()
  @IsInt({ message: '库存必须为整数' })
  @Min(-1, { message: '库存不能小于-1（-1表示无限）' })
  stock?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'isVirtual 必须为布尔值' })
  isVirtual?: boolean;

  @IsOptional()
  @IsInt({ message: 'virtualValue 必须为整数' })
  @Min(0)
  virtualValue?: number;

  @IsOptional()
  @IsInt({ message: 'sortOrder 必须为整数' })
  sortOrder?: number;
}

// 更新商品（所有字段可选）
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt({ message: '积分价格必须为整数' })
  @Min(1, { message: '积分价格至少为1' })
  pricePoints?: number;

  @IsOptional()
  @IsIn(['toy', 'game_time', 'activity', 'food', 'book', 'other'], {
    message: 'category 必须为 toy / game_time / activity / food / book / other 之一',
  })
  category?: string;

  @IsOptional()
  @IsInt({ message: '库存必须为整数' })
  @Min(-1, { message: '库存不能小于-1（-1表示无限）' })
  stock?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive 必须为布尔值' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isVirtual 必须为布尔值' })
  isVirtual?: boolean;

  @IsOptional()
  @IsInt({ message: 'virtualValue 必须为整数' })
  @Min(0)
  virtualValue?: number;

  @IsOptional()
  @IsInt({ message: 'sortOrder 必须为整数' })
  sortOrder?: number;
}
