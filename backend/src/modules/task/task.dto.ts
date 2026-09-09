import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsString({ message: '标题不能为空' })
  @IsNotEmpty({ message: '标题不能为空' })
  title!: string;

  @Type(() => Number)
  @IsInt({ message: '积分必须>0' })
  @Min(1, { message: '积分必须>0' })
  points!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SelectTaskDto {
  @IsString({ message: '模板ID不能为空' })
  @IsNotEmpty({ message: '模板ID不能为空' })
  templateId!: string;
}
