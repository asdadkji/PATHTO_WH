//用户信息
import { Request, Response } from 'express';
import { UserService } from '@/services/userService';
import type { UpdateUserRequest } from '@/types/apis/User';


export const UserController = {
    //获取用户信息
    async getUserInfo(req: Request, res: Response) {
        try {
            //鉴权
            const userId = req.params.userId;
            if (!userId) {
                res.status(401).json({ code: 1,message: 'Unauthorized' });
                return
            }
            //判定是否找到个人信息
            const userInfo = await UserService.getUserInfo(Number(userId));
            if (!userInfo) {
                res.status(404).json({ code: 1,message: 'User not found' });
                return
            }
            //返回数据
            res.json({ code: 0, data: userInfo });
        } catch (e) {
            console.log('获取用户资料失败',e)
            res.status(500).json({code:1,message: 'Internal server error' });
        }
    },
    //更新用户信息
    async updateUser(req:Request, res: Response) {
        try {
            //前端参数
            const userId = req.params.userId;
            const updateData:UpdateUserRequest = req.body;
            //鉴权
            if (!userId) {
                res.status(401).json({ code:1, message: 'Unauthorized' });
                return
            }
            //返回数据
            const result = await UserService.updateUserProfile(Number(userId),updateData);
            res.json({code: 0, data: result });
        } catch (e) {
            console.log('更新用户资料失败',e)
            res.status(500).json({code:1,message: 'Internal server error' });
        }
    }
}