// 后台路由
import express from 'express';
import { getAllBooks, removeBook, publishBook } from '../controllers/bookMgtController';
import { getUserCount, getUserGender, getChartData, getAdminList, setAdmin, cancelAdmin, getSellerList, freezeSeller, unfreezeSeller, getDeliveredBooks, getBuyerList, getBuyerDetail, deleteBuyer, banBuyer, unbanBuyer } from '../controllers/adminController';
import { getPendingBooks, reviewBook, getReviewHistory } from '../controllers/bookReviewController';

const router = express.Router();

// 获取所有图书
router.get('/books', getAllBooks);

// 下架图书
router.patch('/books/:bookId/remove', removeBook);

// 上架图书
router.patch('/books/:bookId/publish', publishBook);

// 获取用户总数
router.get('/userCount', getUserCount);

// 获取性别占比
router.get('/userGender', getUserGender);

// 图表总数据
router.get('/chartData', getChartData);

// 获取管理员列表
router.get('/adminList', getAdminList);

// 赋予管理权限
router.patch('/setAdmin', setAdmin);

// 取消管理权限
router.patch('/cancelAdmin', cancelAdmin);

// 获得商家列表
router.get('/sellerList', getSellerList);

// 冻结商家权限
router.patch('/freezeSeller', freezeSeller);

// 解冻商家权限
router.patch('/unfreezeSeller', unfreezeSeller);

// 获取已送达的图书列表
router.get('/deliveredBooks', getDeliveredBooks);

// 获取买家列表
router.get('/buyerList', getBuyerList);

// 获取买家详情
router.get('/buyerDetail', getBuyerDetail);

// 注销买家账号
router.patch('/deleteBuyer', deleteBuyer);

// 封禁买家账号
router.patch('/banBuyer', banBuyer);

// 解封买家账号
router.patch('/unbanBuyer', unbanBuyer);

// 获取待审核图书列表
router.get('/bookReview/pending', getPendingBooks);

// 审核图书
router.post('/bookReview/review', reviewBook);

// 获取图书审查历史
router.get('/bookReview/history', getReviewHistory);

export const adminRouter = router;