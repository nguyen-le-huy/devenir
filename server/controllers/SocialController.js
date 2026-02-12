
import SocialService from '../services/SocialService.js';

class SocialController {
    /**
     * Proxy request to n8n webhook for Facebook posting
     * @route POST /api/social/webhook-proxy
     */
    async postToFacebook(req, res) {
        try {
            const { webhookUrl, productId, postType, pageId } = req.body;

            // Validation
            if (!webhookUrl) {
                return res.status(400).json({
                    success: false,
                    error: 'Webhook URL is required'
                });
            }

            if (!productId || !pageId) {
                return res.status(400).json({
                    success: false,
                    error: 'Product ID and Page ID are required'
                });
            }

            // Call Service
            const result = await SocialService.postToFacebook({
                webhookUrl,
                productId,
                pageId,
                postType
            });

            console.log(`[SocialController] Success:`, result);

            return res.status(200).json({
                success: true,
                message: result.message || 'Posted successfully!',
                post_id: result.post_id,
                ...result
            });

        } catch (error) {
            console.error('[SocialController] Error:', error);

            // Handle expected service errors (e.g., n8n error response)
            if (error.status) {
                return res.status(error.status).json({
                    success: false,
                    error: error.message,
                    details: error.details
                });
            }

            // Handle unexpected server errors
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to connect to n8n webhook'
            });
        }
    }
}

export default new SocialController();
