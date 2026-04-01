//后台管理
import { Request, Response } from 'express';
import {adminService} from "@/services/adminService";

//获取用户总数
export const getUserCount = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.getUserCountS();
        if(result) {
            res.status(200).json({code:0,message: "成功获取用户总数",data: result})
        }
    }catch (e:any) {
        res.status(500).json({code:1,message: e.message})
    }
}
//获取性别占比
export const getUserGender = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.getSexRatioS();
        if(result) {
            res.status(200).json({code:0,message: "成功获取性别占比",data: result})
        }
    }catch (e:any) {
        res.status(500).json({code:1,message: e.message})
    }
}
//图表总数据（订单各层级成交量、订单各层级销售额、用户日活）
export const getChartData = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.getChartS();
        if(result) {
            res.status(200).json({code:0,message: "成功获取图表数据",data: result})
        }
    }catch (e:any) {
        res.status(500).json({code:1,message: e.message})
    }

}
//获取管理员列表
export const getAdminList = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.getAdminListS();
        if(result) {
            res.status(200).json({code:0,message: "成功获取管理员列表",data: result})
        }
    }catch (e:any) {
        console.log('获取管理员列表失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}
//赋予管理权限
export const setAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const {username,phone} = req.body;
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.setAdminS(username,phone);
        if(result) {
            res.status(200).json({code:0,message: "成功赋予管理权限",data: result})
        }
    }catch (e:any) {
        console.log('赋予权限行为失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}
//取消管理权限
export const cancelAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const userId = Number(req.query.userId);
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.removeAdminS(userId);
        if(result) {
            res.status(200).json({code:0,message: "成功删除管理权限",data: result})
        }
    }catch (e:any) {
        console.log('删除权限行为失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}
//获得商家列表
export const getSellerList = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const page = Number(req.query.page)
        const pageSize = Number(req.query.pageSize)
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.getShopListS(page,pageSize);
        if(result) {
            res.status(200).json({code:0,message: "成功获取商家列表",data: result})
        }
    }catch (e:any) {
        console.log('获取商家列表失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}
//冻结商家权限
export const freezeSeller = async (req: Request, res: Response) => {
    const sellerId = Number(req.query.sellerId);
    const reason = req.body.reason;
    try {
        const result = await adminService.freezeShopS(sellerId,reason);
        if(result) res.status(200).json({code:0,message: "成功冻结商家权限",data: result})
    } catch (e) {
        console.log('冻结商家权限失败',e)
    }
}
//解冻商家权限
export const unfreezeSeller = async (req: Request, res: Response) => {
    const sellerId = Number(req.query.sellerId);
    try {
        const result = await adminService.unfreezeShopS(sellerId);
        if(result) {
            res.status(200).json({code:0,message: "成功解冻商家权限",data: result})
        }
    } catch (e) {
        console.log('解冻商家权限失败',e)
    }
}
//获取已送达的图书列表
export const getDeliveredBooks = async (req: Request, res: Response) => {
    try {
        const result = await adminService.getDeliveredBooksS();
        if(result) res.status(200).json({code:0,message: "成功获取已送达的图书列表",data: result})
    }catch (e:any) {
        console.log('获取已送达的图书列表失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}