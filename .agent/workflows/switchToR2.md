---
description: Migrate image storage from Cloudinary to Cloudflare R2 (S3-compatible) with on-the-fly resizing via sharp
---

# Switch to Cloudflare R2 Workflow

This workflow guides you through migrating the image storage system from Cloudinary to Cloudflare R2. This change limits costs and avoids bandwidth limits while maintaining performance.

## 1. Prerequisites & Setup
- [ ] Create a Cloudflare account and enable R2.
- [ ] Create a new R2 Bucket (e.g., `devenir-assets`).
- [ ] Generate R2 API Tokens (Access Key ID, Secret Access Key) with "Admin Read & Write" permissions.
- [ ] Note the Endpoint URL (e.g., `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).
- [ ] (Optional) Set up a custom domain or use the R2.dev subdomain for public access.

## 2. Install Dependencies
Install the AWS SDK (v3 is recommended) and Sharp for image processing in the SERVER directory.

```bash
cd server
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage sharp multer
npm uninstall cloudinary multer-storage-cloudinary
```

## 3. Configure Environment Variables
Add the following to `server/.env`:

```env
# Cloudflare R2 Configuration
R2_AccountId=<YOUR_ACCOUNT_ID>
R2_AccessKeyId=<YOUR_ACCESS_KEY_ID>
R2_SecretAccessKey=<YOUR_SECRET_ACCESS_KEY>
R2_BucketName=devenir-assets
R2_Endpoint=https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com
R2_PublicUrl=https://pub-<HASH>.r2.dev  # Or your custom domain
```

## 4. Create R2 Service Module
Create `server/config/r2.js` to initialize the S3 client used for R2.

```javascript
import { S3Client } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_Endpoint,
  credentials: {
    accessKeyId: process.env.R2_AccessKeyId,
    secretAccessKey: process.env.R2_SecretAccessKey,
  },
});

export default r2Client;
```

## 5. Implement Upload Middleware with Sharp
Create a new upload middleware `server/middleware/uploadMiddleware.js` that:
1.  Uses `multer` to store files in memory (`multer.memoryStorage()`).
2.  Processes the image with `sharp` (resize, convert to WebP/AVIF, compress).
3.  Uploads the processed buffer to R2 using `@aws-sdk/lib-storage` or `PutObjectCommand`.

```javascript
import multer from 'multer';
import sharp from 'sharp';
import { Upload } from '@aws-sdk/lib-storage';
import r2Client from '../config/r2.js';
import path from 'path';

const storage = multer.memoryStorage();
export const upload = multer({ storage });

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
        Bucket: process.env.R2_BucketName,
        Key: filename,
        Body: buffer,
        ContentType: 'image/webp',
        // ACL: 'public-read', // R2 buckets are private by default, usually managed via public bucket setting
      },
    });

    await upload.done();
    
    // Attach URL to file object for controllers to use
    file.path = `${process.env.R2_PublicUrl}/${filename}`;
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
    next(error);
  }
};
```

## 6. Update Routes and Controllers
Replace existing Cloudinary middleware with the new R2 middleware in your routes (e.g., `server/routes/uploadRoutes.js`, `productRoutes.js`).

**Before:**
```javascript
router.post('/', uploadCloudinary.single('image'), uploadController.uploadImage);
```

**After:**
```javascript
import { upload, uploadToR2 } from '../middleware/uploadMiddleware.js';
router.post('/', upload.single('image'), uploadToR2, uploadController.uploadImage);
```

**Controller Update:**
Controllers usually expect `req.file.path`. The new middleware ensures `req.file.path` is the public R2 URL, so minimal controller changes should be needed, unless you have Cloudinary-specific logic (like deleting by public_id).

## 7. Migration Script (Optional)
If you have existing images on Cloudinary:
- Write a script to list all assets from Cloudinary.
- Download each image.
- Process with `sharp`.
- Upload to R2.
- Update MongoDB database URLs from `res.cloudinary.com/...` to `your-r2-domain.com/...`.

## 8. Verification
- [ ] Test uploading a profile picture.
- [ ] Test uploading a product image.
- [ ] Verify image loads correctly in the frontend.
- [ ] Check R2 dashboard for bucket usage.
