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
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file provided',
    });
  }

  try {
    console.log('Starting image upload...');
    console.log('File buffer size:', req.file.buffer.length);

    // Convert buffer to base64 for upload
    const base64String = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'devenir/products',
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
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
    console.error('Upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error uploading image to Cloudinary',
      error: error.message,
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
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
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

