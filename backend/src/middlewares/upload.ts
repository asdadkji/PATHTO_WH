// 文件上传中间件
import multer from 'multer';
import path from 'path';

// 确保上传目录存在
import fs from 'fs';
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 生成唯一文件名
const generateUniqueFilename = (ext: string): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${ext}`;
};

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = generateUniqueFilename(ext);
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传 JPG、PNG 或 GIF 格式的图片！'), false);
  }
};

// 配置 multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB 限制
  }
});

export default upload;