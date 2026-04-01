//用户认证
import { Request, Response } from 'express';
import {AuthService} from "@/services/authService";

export const register = async (req: Request, res: Response) => {
    try{
        const {username, password, phone} = req.body;
        const data = await AuthService.register(username, password, phone);
        res.json({code:0, data})
    } catch (error:any) {
        res.json({code:1, message:error.message})
    }
}

export const login = async (req: Request, res: Response) => {
    try{
        const {username, password} = req.body;
        const data = await AuthService.login(username, password);
        res.json({code:0, data})
    } catch (error:any) {
        res.json({code:1, message:error.message})
    }
}

export const beforeResetPwd = async (req: Request, res: Response) => {
    try{
        const {username, phone} = req.body;
        const data = await AuthService.beforeResetPwdS(username, phone);
        res.json({code:0, data})
    } catch (error:any) {
        res.json({code: 1, message: error.message})
    }
}

export const resetPwd = async (req: Request, res: Response) => {
    try{
        const {username, password} = req.body;
        await AuthService.resetPwd(username, password);
        res.json({code:0, message:"密码重置成功"})
    } catch (error:any) {
        res.json({code:1, message:error.message})
    }
}
export const applySeller = async (req: Request, res: Response) => {
    try {
        const {userId, realUserName} = req.body;
        if(!userId || !realUserName) {
            res.json({code:1, message:"参数错误"})
            return
        }
        const result = await AuthService.applyForMerchant(Number(userId), realUserName);
        if(result) {
            res.json({code:1, message:"您已提交过商家认证申请"})
        } else {
            res.json({code:0, data:result, message:"申请成功"})
        }
    } catch (e) {
        console.log('认证失败',e)
        res.json({code:1, message:"认证失败"})
    }
}
export const isMerchant = async (req: Request, res: Response) => {
    try {
        const {userId} = req.query;
        if(!userId) {
            res.json({code:1, data: false, message:"参数错误"})
            return
        }
        const result = await AuthService.isMerchantS(Number(userId));
        res.json({code:0, data:result, message:"查询成功"})
    } catch (e) {
        console.log('认证失败',e)
        res.json({code:1, message:"认证失败"})
    }
}