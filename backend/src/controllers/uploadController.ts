// 上传控制器
import { Request, Response } from 'express';
import path from 'path';

export const UploadController = {
  // 上传图片
  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ code: 1, message: '没有上传文件' });
      }
      
      // 构建图片URL
      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({ code: 0, data: { url: imageUrl }, message: '上传成功' });
    } catch (error) {
      console.error('上传失败:', error);
      res.status(500).json({ code: 1, message: '上传失败' });
    }
  }
};