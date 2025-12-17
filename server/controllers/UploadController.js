import { v2 as cloudinary } from 'cloudinary';
import asyncHandler from 'express-async-handler';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc    Upload image to Cloudinary
 * @route   POST /api/upload/image
 * @access  Private/Admin
 */
export const uploadImage = asyncHandler(async (req, res) => {
  console.log('=== UPLOAD IMAGE REQUEST ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('File present:', !!req.file);
  console.log('Body:', req.body);

  if (!req.file) {
    console.log('ERROR: No file in request');
    return res.status(400).json({
      success: false,
      message: 'No file provided',
    });
  }

  // Check Cloudinary config
  const hasConfig = !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);

  console.log('Cloudinary config present:', hasConfig);

  if (!hasConfig) {
    console.error('Cloudinary credentials missing!');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: Cloudinary credentials not configured',
    });
  }

  try {
    console.log('Starting image upload...');
    console.log('File:', req.file.originalname);
    console.log('File size:', (req.file.buffer.length / 1024 / 1024).toFixed(2), 'MB');
    console.log('MIME type:', req.file.mimetype);

    // Convert buffer to base64 for upload
    const base64String = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'devenir/products',
      resource_type: 'image',
      format: 'webp', // Convert to WebP for smaller file size
      quality: 100, // Maximum quality - preserve original
    });

    console.log('Upload successful:', result.public_id);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    });
    res.status(500).json({
      success: false,
      message: 'Error uploading image to Cloudinary',
      error: error.message,
      details: error.code || 'Unknown error',
    });
  }
});

/**
 * @desc    Upload multiple images
 * @route   POST /api/upload/images
 * @access  Private/Admin
 */
export const uploadImages = asyncHandler(async (req, res) => {
  console.log('Upload images endpoint hit');
  console.log('Files:', req.files ? `${req.files.length} files` : 'NO FILES');

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files provided',
    });
  }

  try {
    console.log('Starting multiple image upload...');
    const uploadedImages = [];

    for (const file of req.files) {
      console.log(`Uploading file: ${file.originalname}, size: ${file.buffer.length}`);

      // Convert buffer to base64 for upload
      const base64String = file.buffer.toString('base64');
      const dataURI = `data:${file.mimetype};base64,${base64String}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'devenir/products',
        resource_type: 'image',
        format: 'webp', // Convert to WebP for smaller file size
        quality: 100, // Maximum quality - preserve original
      });

      console.log(`Upload successful: ${result.public_id}`);

      uploadedImages.push({
        id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
      });
    }

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: uploadedImages,
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error uploading images to Cloudinary',
      error: error.message,
    });
  }
});

/**
 * @desc    Upload category image to Cloudinary (auto-convert to WebP)
 * @route   POST /api/upload/category-image
 * @access  Private/Admin
 */
export const uploadCategoryImage = asyncHandler(async (req, res) => {
  console.log('=== UPLOAD CATEGORY IMAGE REQUEST ===');

  if (!req.file) {
    console.log('ERROR: No file in request');
    return res.status(400).json({
      success: false,
      message: 'No file provided',
    });
  }

  // Check Cloudinary config
  const hasConfig = !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);

  if (!hasConfig) {
    console.error('Cloudinary credentials missing!');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: Cloudinary credentials not configured',
    });
  }

  try {
    console.log('Starting category image upload...');
    console.log('File:', req.file.originalname);
    console.log('File size:', (req.file.buffer.length / 1024 / 1024).toFixed(2), 'MB');
    console.log('MIME type:', req.file.mimetype);

    // Convert buffer to base64 for upload
    const base64String = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    console.log('Uploading to Cloudinary with WebP conversion...');
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'devenir/categories',
      resource_type: 'image',
      format: 'webp', // Convert to WebP
      quality: 'auto:best', // Auto quality optimization
      flags: 'lossy', // Use lossy compression for smaller file size
    });

    console.log('Upload successful:', result.public_id);
    console.log('WebP URL:', result.secure_url);

    res.status(200).json({
      success: true,
      message: 'Category image uploaded successfully (WebP format)',
      data: {
        id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading category image to Cloudinary',
      error: error.message,
    });
  }
});

/**
 * @desc    Delete image from Cloudinary
 * @route   DELETE /api/upload/:publicId
 * @access  Private/Admin
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    return res.status(400).json({
      success: false,
      message: 'No publicId provided',
    });
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: result,
    });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting image from Cloudinary',
      error: error.message,
    });
  }
});

