import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { env } from '../../config/env.js';
import { cloudinary } from '../../config/cloudinary.js';
import { sendSuccess } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';

const uploadRouter = Router();

// In-memory storage for handling upload to Cloudinary or disk fallback
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter,
});

// Helper to save a single file buffer to Cloudinary or local disk
async function saveImageBuffer(
  req: Request,
  file: Express.Multer.File
): Promise<{ url: string; originalName: string; size: number }> {
  // Try Cloudinary first if configured
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    try {
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'furniture-store/products' },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Cloudinary upload returned empty result'));
            }
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      return {
        url: uploadResult.secure_url,
        originalName: file.originalname,
        size: file.size,
      };
    } catch (cloudinaryErr) {
      console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryErr);
    }
  }

  // Fallback: save to local public/uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(file.originalname) || '.jpg';
  const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${cleanBase}${ext}`;
  const filePath = path.join(uploadsDir, filename);

  await fs.promises.writeFile(filePath, file.buffer);

  const host = req.get('host') || `localhost:${env.PORT}`;
  const protocol = req.protocol || 'http';
  const fileUrl = `${protocol}://${host}/uploads/${filename}`;

  return {
    url: fileUrl,
    originalName: file.originalname,
    size: file.size,
  };
}

// Single image upload endpoint
uploadRouter.post(
  '/image',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file provided in "image" field');
      }

      const result = await saveImageBuffer(req, req.file);
      sendSuccess(res, result, 'Image uploaded successfully');
    } catch (error) {
      next(error);
    }
  }
);

// Multiple images upload endpoint (up to 10)
uploadRouter.post(
  '/images',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  upload.array('images', 10),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new BadRequestError('No image files provided in "images" field');
      }

      const results = await Promise.all(files.map((file) => saveImageBuffer(req, file)));
      sendSuccess(res, results, 'Images uploaded successfully');
    } catch (error) {
      next(error);
    }
  }
);

export { uploadRouter };
