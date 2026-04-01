//后台路由
import {Router} from "express";
import {
    getUserCount,
    getUserGender,
    getChartData,
    getAdminList,
    setAdmin,
    cancelAdmin,
    getSellerList,
    freezeSeller,
    unfreezeSeller,
    getDeliveredBooks
} from "@/controllers/adminController";
export const adminRouter = Router();
adminRouter.get('/userCount',getUserCount);
adminRouter.get('/userGender',getUserGender);
adminRouter.get('/chartData',getChartData);
adminRouter.get('/adminList',getAdminList);
adminRouter.patch('/setAdmin',setAdmin);
adminRouter.patch('/cancelAdmin',cancelAdmin);
adminRouter.get('/sellerList',getSellerList);
adminRouter.patch('/freezeSeller',freezeSeller);
adminRouter.patch('/unfreezeSeller',unfreezeSeller);
adminRouter.get('/deliveredBooks',getDeliveredBooks);