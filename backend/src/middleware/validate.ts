// 请求体校验中间件：基于 class-validator
// 用法：router.post('/x', validateBody(CreateTaskDto), controller)
import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HttpError } from '@/utils/response';

export const validateBody = (DTOClass: new () => any) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    const instance = plainToInstance(DTOClass, req.body, { excludeExtraneousValues: false });
    const errors = await validate(instance, { whitelist: true });
    if (errors.length > 0) {
      // 每个属性只取第一条约束消息（避免缺字段时拼接多条同类消息），多属性用 "; " 连接
      const messages = errors
        .map((e) => Object.values(e.constraints || {})[0])
        .filter(Boolean) as string[];
      return next(new HttpError(400, messages.join('; ') || '参数错误', 400));
    }
    req.body = instance;
    next();
  };
