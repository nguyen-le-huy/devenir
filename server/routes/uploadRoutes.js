import express from 'express';
import multer from 'multer';
import { uploadImage, uploadImages, deleteImage } from '../controllers/UploadController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for large images
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

// Error handling middleware for multer errors
router.use((err, req, res, next) => {
  console.error('Upload route error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB',
        error: err.message,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message,
    });
  }

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Pass to next error handler
  next(err);
});

export default router;
