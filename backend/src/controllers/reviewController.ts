//评论控制器
import { Request, Response } from "express";
import { reviewService } from "@/services/reviewService";
import type{ ReviewInput, ReviewFilter, PaginatedReviews, UserStats, ApiResponse } from "@/models/Review";

export const createReview = async (req: Request, res: Response) => {
    try {
        const requiredFields = ['order_id', 'reviewer_id', 'reviewed_user_id', 'role', 'rating'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ code:1, message: `缺少${field}字段` });
            }
        }
        const reviewData = {
            order_id: parseInt(req.body.order_id),
            reviewer_id: parseInt(req.body.reviewer_id),
            reviewed_user_id: parseInt(req.body.reviewed_user_id),
            role: req.body.role,
            rating: parseInt(req.body.rating),
            comment: req.body.comment,
            tags: req.body.tags,
            is_anonymous: req.body.is_anonymous || false,
            book_snapshot: req.body.book_snapshot
        };
        if(!['buyer', 'seller'].includes(reviewData.role)) {
            return res.status(400).json({ code:1, message: '角色必须是buyer或seller' });
        }
        const result = await reviewService.createReviewS(reviewData);
        if(result) {
            return res.status(200).json({ code:0, message: '评论成功', data: result });
        } else {
            return res.status(500).json({ code:1, message: '评论失败' });
        }
    } catch (e:any) {
        console.log('评论失败', e);
        return res.status(500).json({ code:1, message: e.message });
    }
}
export const getReviews = async (req: Request, res: Response) => {
    try {
        const reviewedId = parseInt(req.params.reviewedId);
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const result = await reviewService.getReviewsS(reviewedId,page,pageSize);
        if(result) {
            return res.status(200).json({ code:0, message: '获取评论成功', data: result });
        } else {
            return res.status(500).json({ code:1, message: '获取评论失败' });
        }
    } catch (e:any) {
        console.log('获取评论失败',e)
        return res.status(500).json({ code:1, message: e.message });
    }
}
/*export const deleteReview = async (req: Request, res: Response) => {
    try {
        const reviewId = parseInt(req.params.id);
        const userId = parseInt(req.body.userId);
        const isVisible = req.body.is_visible === true;
        if (!reviewId || reviewId <= 0) {
            return res.status(400).json({ code:1, message: '无效的评论ID' });
        }

        if (!userId || userId <= 0) {
            return res.status(400).json({ code:1, message: '无效的用户ID' });
        }
        const result = await toggleReviewVisibilityService(reviewId, userId, isVisible);
    } catch (e) {

    }
}*/
