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
        console.log('赋予权限接收到的数据:', {adminId, username, phone, body: req.body});
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.setAdminS(phone,username);
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
    
    // 参数验证
    if (isNaN(sellerId) || sellerId <= 0) {
        return res.status(400).json({code: 1, message: '无效的商家ID'});
    }
    
    if (!reason || reason.trim().length === 0) {
        return res.status(400).json({code: 1, message: '请输入冻结理由'});
    }
    
    try {
        const result = await adminService.freezeShopS(sellerId, reason);
        if(result) {
            res.status(200).json({code: 0, message: "成功冻结商家权限", data: result});
        } else {
            res.status(400).json({code: 1, message: "冻结商家权限失败"});
        }
    } catch (e) {
        console.log('冻结商家权限失败', e);
        res.status(500).json({code: 1, message: '冻结商家权限失败'});
    }
}
//解冻商家权限
export const unfreezeSeller = async (req: Request, res: Response) => {
    const sellerId = Number(req.query.sellerId);
    
    // 参数验证
    if (isNaN(sellerId) || sellerId <= 0) {
        return res.status(400).json({code: 1, message: '无效的商家ID'});
    }
    
    try {
        const result = await adminService.unfreezeShopS(sellerId);
        if(result) {
            res.status(200).json({code: 0, message: "成功解冻商家权限", data: result});
        } else {
            res.status(400).json({code: 1, message: "解冻商家权限失败"});
        }
    } catch (e) {
        console.log('解冻商家权限失败', e);
        res.status(500).json({code: 1, message: '解冻商家权限失败'});
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

//获取买家列表
export const getBuyerList = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const page = Number(req.query.page);
        const pageSize = Number(req.query.pageSize);
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.getBuyerListS(page, pageSize);
        if(result) {
            res.status(200).json({code:0,message: "成功获取买家列表",data: result})
        }
    }catch (e:any) {
        console.log('获取买家列表失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}

//获取买家详情
export const getBuyerDetail = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const buyerId = Number(req.query.buyerId);
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.getBuyerDetailS(buyerId);
        if(result) {
            res.status(200).json({code:0,message: "成功获取买家详情",data: result})
        }
    }catch (e:any) {
        console.log('获取买家详情失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}

//注销买家账号
export const deleteBuyer = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const buyerId = Number(req.query.buyerId);
        const reason = req.body.reason;
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.deleteBuyerS(buyerId, reason);
        if(result) {
            res.status(200).json({code:0,message: "成功注销买家账号",data: result})
        }
    }catch (e:any) {
        console.log('注销买家账号失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}

//封禁买家账号
export const banBuyer = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.query.adminId);
        const buyerId = Number(req.query.buyerId);
        const reason = req.body.reason;
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.banBuyerS(buyerId, reason);
        res.status(200).json({code:0,message: "成功封禁买家账号",data: result})
    }catch (e:any) {
        console.log('封禁买家账号失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}

//解封买家账号
export const unbanBuyer = async (req: Request, res: Response) => {
    try {
        const adminId = isNaN(Number(req.query.adminId)) ? 1 : Number(req.query.adminId);
        const buyerId = isNaN(Number(req.query.buyerId)) ? 0 : Number(req.query.buyerId);
        console.log('解封买家 - adminId:', adminId, 'buyerId:', buyerId);
        const isAdmin = await adminService.isAdminS(adminId);
        if(!isAdmin) {
            return res.status(401).json({code:1,message: "没有权限"})
        }
        const result = await adminService.unbanBuyerS(buyerId);
        res.status(200).json({code:0,message: "成功解封买家账号",data: result})
    }catch (e:any) {
        console.log('解封买家账号失败',e)
        res.status(500).json({code:1,message: e.message})
    }
}