// 卖家路由
import {Router} from "express";
import {
    getSellerBookReviewHistory
} from "@/controllers/sellerBookReviewController";

export const sellerRouter = Router();

// 卖家图书审查相关路由
sellerRouter.get('/bookReview/history', getSellerBookReviewHistory);
