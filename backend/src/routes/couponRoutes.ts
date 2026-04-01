//优惠券路由
import {Router} from "express";
import {CouponController} from "@/controllers/couponController";

export const couponRouter = Router();
couponRouter.get("/mycoupon/:userId", CouponController.getUserCoupons);
couponRouter.get("/merchantCoupon/:merchantId", CouponController.getMerchantCoupons);
couponRouter.post("/updateCoupon/:userId", CouponController.updateCoupon);
couponRouter.post("/createCoupon", CouponController.addCoupon);
couponRouter.get("/getCoupon/:merchantId", CouponController.getCoupon);
couponRouter.patch("/deleteCoupon/:batchId", CouponController.disableCoupon);
couponRouter.patch("/enableCoupon/:batchId", CouponController.enableCoupon);