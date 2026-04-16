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
    getDeliveredBooks,
    getBuyerList,
    getBuyerDetail,
    deleteBuyer,
    banBuyer,
    unbanBuyer
} from "@/controllers/adminController";
import {
    getPendingBooks,
    reviewBook,
    getReviewHistory
} from "@/controllers/bookReviewController";
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
adminRouter.get('/buyerList',getBuyerList);
adminRouter.get('/buyerDetail',getBuyerDetail);
adminRouter.patch('/deleteBuyer',deleteBuyer);
adminRouter.patch('/banBuyer',banBuyer);
adminRouter.patch('/unbanBuyer',unbanBuyer);

// 图书审查相关路由
adminRouter.get('/bookReview/pending',getPendingBooks);
adminRouter.post('/bookReview/review',reviewBook);
adminRouter.get('/bookReview/history',getReviewHistory);