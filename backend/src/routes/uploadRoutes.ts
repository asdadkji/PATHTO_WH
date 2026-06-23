// 上传路由
import express from 'express';
import { UploadController } from '@/controllers/uploadController';
import upload from '@/middlewares/upload';

const router = express.Router();

// 上传图片
router.post('/image', upload.single('file'), UploadController.uploadImage);

export const uploadRouter = router;