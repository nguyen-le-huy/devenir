import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import r2Client from '../config/r2.js';

class UploadService {
    /**
     * Delete an object from R2 bucket
     * @param {string} key - The R2 object key
     */
    async deleteImage(key) {
        if (!key) throw new Error('No image key provided');

        try {
            const command = new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
            });

            await r2Client.send(command);
            return true;
        } catch (error) {
            console.error('R2 Delete error:', error);
            throw new Error(`Error deleting image from R2: ${error.message}`);
        }
    }

    // Note: Upload logic is currently handled by middleware (Multer + custom uploadToR2).
    // Ideally, that logic belongs here too, but refactoring middleware structure is out of scope 
    // for this specific controller refactor step to avoid breaking existing upload flow 
    // without a broader refactor of `uploadMiddleware.js`.
    // We will keep the actual upload handling in the controller as a response formatter 
    // for the middleware's result, effectively treating the middleware as the "service" for upload.
}

export default new UploadService();
