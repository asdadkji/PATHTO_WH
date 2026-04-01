//评论服务
import type{ Review, ReviewInput, ReviewFilter, PaginatedReviews, UserStats, ApiResponse } from "@/models/Review";
import { reviewModel } from "@/models/Review";
export const reviewService = {
    async createReviewS(reviewData: ReviewInput) {
        if(!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
            throw new Error('评分必须在1到5之间');
        }
        if(reviewData.reviewer_id === reviewData.reviewed_user_id) {
            throw new Error('不能评价自己');
        }
        if(reviewData.tags && reviewData.tags.length > 5) {
            throw new Error('最多只能添加5个标签');
        }
        if (reviewData.tags && !Array.isArray(reviewData.tags)) {
            throw new Error('标签必须是数组格式');
        }
        return await reviewModel.createReview(reviewData);
    },
    async getReviewsS(reviewedId: number,page:number,pageSize:number): Promise<PaginatedReviews> {
        return await reviewModel.showReview(reviewedId,page,pageSize);
    },
/*    async deleteReviewS(reviewId: number, userId: number, isVisible: boolean): Promise<Review> {

    }*/
}
