import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

/**
 * @route   POST /api/social/webhook-proxy
 * @desc    Proxy requests to n8n webhook to avoid CORS issues
 * @access  Private (Admin only)
 */
router.post('/webhook-proxy', async (req, res) => {
    try {
        const { webhookUrl, productId, postType, pageId } = req.body;

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

        // Forward request to n8n webhook
        const payload = {
            productId,
            postType: postType || 'multi_image',
            pageId
        };

        console.log(`[Social Proxy] Forwarding to n8n: ${webhookUrl}`);
        console.log(`[Social Proxy] Payload:`, payload);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Get response from n8n
        let result;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            result = { message: text || 'Request sent successfully' };
        }

        if (!response.ok) {
            console.error(`[Social Proxy] n8n error: ${response.status}`, result);
            return res.status(response.status).json({
                success: false,
                error: result.message || `n8n returned status ${response.status}`,
                details: result
            });
        }

        console.log(`[Social Proxy] Success:`, result);

        return res.json({
            success: true,
            message: result.message || 'Posted successfully!',
            post_id: result.post_id,
            ...result
        });

    } catch (error) {
        console.error('[Social Proxy] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to connect to n8n webhook'
        });
    }
});

export default router;
