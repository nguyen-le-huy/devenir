export interface SocialSettings {
    webhookUrl: string
    pageId: string
}

export interface PostedProduct {
    productId: string
    postedAt: string
    postId?: string
    status: 'draft' | 'ai_generating' | 'approval_needed' | 'scheduled' | 'published' | 'failed'
    caption?: string
    scheduledDate?: string
    errorMessage?: string
    metrics?: {
        reach?: number
        engagement?: number
        comments?: number
        likes?: number
        shares?: number
    }
}

export type ViewMode = 'list' | 'grid' | 'calendar'
export type FilterTab = 'all' | 'drafts' | 'scheduled' | 'published' | 'errors'

export const SETTINGS_KEY = "devenir_social_settings"
export const POSTED_PRODUCTS_KEY = "devenir_posted_products"
