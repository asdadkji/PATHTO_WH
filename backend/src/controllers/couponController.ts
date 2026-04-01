//优惠券控制器
import { Request, Response } from 'express';
import type {GetUserCouponsRequest} from '@/types/apis/Coupon';
import {CouponService} from '@/services/couponService';
export const CouponController = {
    //获取用户优惠券列表
    async getUserCoupons(req: Request, res: Response) {
        try {
            //获取参数
            const userId = parseInt(req.params.userId);
            const status = req.query.status as string;
            const page = req.query.page?parseInt(req.query.page as string):1;
            const pageSize = req.query.pageSize?parseInt(req.query.pageSize as string):20;
            //验证参数
            if(!userId || isNaN(userId)) {
                res.status(400).json({code:1, message: 'userId参数错误'});
                return
            }
            if(!status) {
                res.status(400).json({code:1, message: 'status参数错误'});
                return
            }
            const result = await CouponService.getCoupons(userId, status, page, pageSize);
            if(result) {
                res.status(200).json({code:0, message: '获取优惠券成功', data: result});
            }
        } catch (e) {
            console.log('获取优惠券失败', e);
            res.status(500).json({code:1, message: '获取优惠券失败'});
        }

    },
    //获取商家优惠券展示
    async getMerchantCoupons(req: Request, res: Response) {
        try {
            const merchantId = Number(req.params.merchantId);
            const result = await CouponService.getMerchantCoupons(merchantId);
            if(result) {
                res.status(200).json({code:0, message: '获取优惠券成功', data: result});
            }
        } catch (e) {
            console.log('获取优惠券失败', e);
            res.status(500).json({code:1, message: '获取优惠券失败'});
        }
    },
    //用户领取优惠券
    async updateCoupon(req: Request, res: Response) {
        try {
            const userId = Number(req.params.userId);
            const batchId = Number(req.query.batchId);
            const result = await CouponService.receiveCoupon(userId, batchId);
            res.status(200).json({code:0, message: '领取优惠券成功'});
        } catch (e) {
            console.log('领取优惠券失败', e);
            res.status(500).json({code:1, message: '领取优惠券失败'});
        }
    },
    //商家添加优惠券
    async addCoupon(req: Request, res: Response) {
        try {
            const CouponData = req.body;
            const result = await CouponService.createCoupon(CouponData);
            if(result) {
                res.status(200).json({code:0, message: '添加优惠券成功'});
            }
        } catch (e) {
            console.log('添加优惠券失败', e);
            res.status(500).json({code:1, message: '添加优惠券失败'});
        }
    },
    //商家查看优惠券
    async getCoupon(req: Request, res: Response) {
        try {
            const merchantId = Number(req.params.merchantId);
            const {title,status} = req.query;
            const filters: { title?: string; status?: number } = {};
            if (title && typeof title === 'string' && title.trim()) {
                filters.title = title.trim();
            }
            const result = await CouponService.getMerchantCoupon(merchantId,filters);
            res.status(200).json({code:0, message: '查看优惠券成功', data: result});
        } catch (e) {
            console.log('查看优惠券失败', e);
            res.status(500).json({code:1, message: '查看优惠券失败'});
        }
    },
    //商家停用优惠券
    async disableCoupon(req: Request, res: Response) {
        try {
            const batchId = Number(req.params.batchId);
            const couponId = Number(req.query.couponId)
            const result = await CouponService.disableCoupon(couponId,batchId);
            if(result) res.status(200).json({code:0, message: '停用优惠券成功'});
        } catch (e) {
            console.log('停用优惠券失败', e);
            res.status(500).json({code:1, message: '停用优惠券失败'});
        }
    },
    //商家启用优惠券
    async enableCoupon(req: Request, res: Response) {
        try {
            const batchId = Number(req.params.batchId);
            const couponId = Number(req.query.couponId)
            const result = await CouponService.enableCoupon(couponId,batchId);
            if(result) res.status(200).json({code:0, message: '启用优惠券成功'});
        } catch (e) {
            console.log('启用优惠券失败', e);
            res.status(500).json({code:1, message: '启用优惠券失败'});
        }
    }
}
