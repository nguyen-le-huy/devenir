import axiosInstance from '@/services/axiosConfig'

interface FacebookPostRequest {
    webhookUrl: string
    productId: string
    pageId: string
    postType?: string
}

interface FacebookPostResponse {
    success: boolean
    message: string
    post_id?: string
    caption?: string
    error?: string
}

export const socialApi = {
    /**
     * Send post request to n8n webhook via backend proxy to avoid CORS
     */
    postToFacebook: async (data: FacebookPostRequest): Promise<FacebookPostResponse> => {
        // Use backend proxy to avoid CORS issues
        const response = await axiosInstance.post('/social/webhook-proxy', {
            webhookUrl: data.webhookUrl,
            productId: data.productId,
            postType: "multi_image",
            pageId: data.pageId
        })
        return response.data
    }
}
