
import axios from 'axios';

class SocialService {
    /**
     * Post product to Facebook via n8n webhook
     * @param {Object} data - { webhookUrl, productId, pageId, postType }
     * @returns {Promise<Object>} - Response from n8n
     */
    async postToFacebook({ webhookUrl, productId, pageId, postType }) {
        console.log(`[SocialService] Sending to n8n:`, { webhookUrl, productId, pageId });

        // NOTE: Previously attempted "Smart Routing" to replace domain with internal docker host 'n8n:5678'.
        // However, 'n8n' service is not present in the current docker-compose stack, so this would fail.
        // We will use the webhookUrl exactly as provided.
        // If n8n is on the same machine but outside docker, ensure webhookUrl is accessible (e.g. public IP or host.docker.internal).

        try {
            const response = await axios.post(webhookUrl, {
                productId,
                pageId,
                postType: postType || "multi_image"
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            // Axios automatically throws for non-2xx responses usually, but let's be sure.
            // If we are here, status is 2xx.
            const result = response.data;

            // If n8n returns 200 but with success: false in body (depends on n8n workflow)
            // But usually we rely on HTTP status.

            return result;

        } catch (error) {
            // Handle Axios errors
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error(`[SocialService] n8n error: ${error.response.status}`, error.response.data);
                throw {
                    status: error.response.status,
                    message: error.response.data?.message || `n8n returned status ${error.response.status}`,
                    details: error.response.data
                };
            } else if (error.request) {
                // The request was made but no response was received
                console.error('[SocialService] No response received from n8n:', error.message);

                // Detailed error for debugging
                const isConnectionRefused = error.code === 'ECONNREFUSED';
                const isNameNotResolved = error.code === 'ENOTFOUND';

                throw {
                    status: 502, // Bad Gateway
                    message: isConnectionRefused
                        ? 'Connection refused by n8n. Is the service running?'
                        : (isNameNotResolved ? 'Cannot resolve n8n hostname.' : 'No response from n8n webhook'),
                    details: error.message
                };
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('[SocialService] Request setup error:', error.message);
                throw {
                    status: 500,
                    message: error.message
                };
            }
        }
    }
}

export default new SocialService();
