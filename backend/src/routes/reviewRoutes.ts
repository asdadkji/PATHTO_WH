//评论路由
import {Router} from "express";
import {createReview, getReviews} from "../controllers/reviewController";
const router = Router();
export const reviewRouter = router;
reviewRouter.post('/createReview',createReview);
reviewRouter.get('/getReviews/:reviewedId',getReviews);