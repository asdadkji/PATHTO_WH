// 认证模块 DTO：登录、注册请求参数校验
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

// 登录请求：用户名、密码均为必填字符串
export class LoginDto {
  @IsString({ message: '参数错误' })
  @IsNotEmpty({ message: '参数错误' })
  username!: string;

  @IsString({ message: '参数错误' })
  @IsNotEmpty({ message: '参数错误' })
  password!: string;
}

// 注册请求：用户名必填；密码为字符串且不少于 6 位
export class RegisterDto {
  @IsString({ message: '参数错误' })
  @IsNotEmpty({ message: '参数错误' })
  username!: string;

  @IsString({ message: '参数错误' })
  @MinLength(6, { message: '密码至少6位' })
  password!: string;
}
