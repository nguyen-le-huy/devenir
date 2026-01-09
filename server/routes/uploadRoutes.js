import express from 'express';
import multer from 'multer';
import { uploadImage, uploadImages, deleteImage, uploadCategoryImage } from '../controllers/UploadController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { upload, uploadToR2 } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`Upload route: ${req.method} ${req.path}`);
  next();
});

/**
 * POST /api/upload/image
 * Upload single image to R2
 */
router.post('/image', authenticate, isAdmin, upload.single('image'), uploadToR2, uploadImage);

/**
 * POST /api/upload/images
 * Upload multiple images to R2
 */
router.post('/images', authenticate, isAdmin, upload.array('images', 10), uploadToR2, uploadImages);

/**
 * POST /api/upload/category-image
 * Upload category image to R2
 */
router.post('/category-image', authenticate, isAdmin, upload.single('image'), uploadToR2, uploadCategoryImage);

/**
 * DELETE /api/upload/:publicId
 * Delete image from R2
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
