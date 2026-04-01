//JWT token验证
import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {AUTH} from '@/config';
import {JwtPayload} from "@/types";

export interface AuthReq extends Request{
    user?: JwtPayload;
}

export const mustLogin = (req: AuthReq, res: Response, next: NextFunction) => {
    const head = req.headers.authorization;
    if (!head) return res.status(401).json({msg: '请先登录'});
    const token = head.replace('Bearer ', '');
    try {
        req.user = jwt.verify(token, AUTH.JWT_SECRET) as JwtPayload;
        next();
    } catch (e) {
        res.status(401).json({msg: 'Token无效'});
    }
}