import asyncHandler from 'express-async-handler';
import uploadService from '../services/upload.service.js';

/**
 * @desc    Upload image to R2 (handled by middleware)
 * @route   POST /api/upload/image
 * @access  Private/Admin
 */
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully to R2',
    data: {
      id: req.file.filename,
      url: req.file.path,
      filename: req.file.filename,
    },
  });
});

/**
 * @desc    Upload multiple images
 * @route   POST /api/upload/images
 * @access  Private/Admin
 */
export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files provided' });
  }

  const uploadedImages = req.files.map(file => ({
    id: file.filename,
    url: file.path,
    filename: file.filename,
  }));

  res.status(200).json({
    success: true,
    message: `${uploadedImages.length} image(s) uploaded successfully`,
    data: uploadedImages,
  });
});

/**
 * @desc    Upload category image
 * @route   POST /api/upload/category-image
 * @access  Private/Admin
 */
export const uploadCategoryImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  res.status(200).json({
    success: true,
    message: 'Category image uploaded successfully',
    data: {
      id: req.file.filename,
      url: req.file.path,
    },
  });
});

/**
 * @desc    Delete image from R2
 * @route   DELETE /api/upload/:key
 * @access  Private/Admin
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId: key } = req.params;

  try {
    await uploadService.deleteImage(key);
    res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
