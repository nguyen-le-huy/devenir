import express from 'express';
import multer from 'multer';
import { uploadImage, uploadImages, deleteImage } from '../controllers/UploadController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    console.log(`Multer fileFilter: ${file.originalname} (${file.mimetype})`);
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Debug middleware
router.use((req, res, next) => {
  console.log(`Upload route: ${req.method} ${req.path}`);
  next();
});

/**
 * POST /api/upload/image
 * Upload single image
 */
router.post('/image', authenticate, isAdmin, upload.single('image'), uploadImage);

/**
 * POST /api/upload/images
 * Upload multiple images
 */
router.post('/images', authenticate, isAdmin, upload.array('images', 10), uploadImages);

/**
 * DELETE /api/upload/:publicId
 * Delete image
 */
router.delete('/:publicId', authenticate, isAdmin, deleteImage);

export default router;
