import multer from 'multer';
import sharp from 'sharp';
import { Upload } from '@aws-sdk/lib-storage';
import r2Client from '../config/r2.js';
import path from 'path';

const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

export const uploadToR2 = async (req, res, next) => {
    if (!req.file && !req.files) return next();

    const files = req.files || [req.file];
    const uploadPromises = files.map(async (file) => {
        // 1. Resize & Compress
        const buffer = await sharp(file.buffer)
            .resize({ width: 1920, withoutEnlargement: true }) // Intelligent resize
            .webp({ quality: 80 })
            .toBuffer();

        const filename = `products/${Date.now()}-${path.parse(file.originalname).name}.webp`;

        // 2. Upload to R2
        const upload = new Upload({
            client: r2Client,
            params: {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: filename,
                Body: buffer,
                ContentType: 'image/webp',
                // ACL: 'public-read', // R2 buckets are private by default, usually managed via public bucket setting
            },
        });

        await upload.done();

        // Attach URL to file object for controllers to use
        // If R2_PUBLIC_URL is setup (e.g. assets.devenir.shop)
        file.path = `${process.env.R2_PUBLIC_URL}/${filename}`;
        file.filename = filename;
        return file;
    });

    try {
        const uploadedFiles = await Promise.all(uploadPromises);
        // If single file, update req.file
        if (req.file) req.file = uploadedFiles[0];
        req.files = uploadedFiles; // For multi-upload
        next();
    } catch (error) {
        console.error('R2 Upload Error:', error);
        next(error);
    }
};
