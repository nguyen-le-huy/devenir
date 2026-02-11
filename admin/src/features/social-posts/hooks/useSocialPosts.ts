import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { socialApi } from '../api/socialApi'
import { POSTED_PRODUCTS_KEY } from '../types'
import type { PostedProduct, SocialSettings } from '../types'

export function useSocialPosts(settings: SocialSettings, isConfigured: boolean) {
    const [postedProducts, setPostedProducts] = useState<PostedProduct[]>([])
    const [postingProductId, setPostingProductId] = useState<string | null>(null)

    // Load posted products from localStorage
    useEffect(() => {
        const savedPosted = localStorage.getItem(POSTED_PRODUCTS_KEY)
        if (savedPosted) {
            try {
                setPostedProducts(JSON.parse(savedPosted))
            } catch (e) {
                console.error("Failed to parse posted products", e)
            }
        }
    }, [])

    const updateProductStatus = (productId: string, status: PostedProduct['status'], errorMessage?: string) => {
        setPostedProducts(prev => {
            const existing = prev.find(p => p.productId === productId)
            const updated: PostedProduct = {
                productId,
                postedAt: existing?.postedAt || new Date().toISOString(),
                postId: existing?.postId,
                status,
                caption: existing?.caption,
                errorMessage,
                metrics: existing?.metrics
            }
            const newPostedStats = [...prev.filter(p => p.productId !== productId), updated]
            localStorage.setItem(POSTED_PRODUCTS_KEY, JSON.stringify(newPostedStats))
            return newPostedStats
        })
    }

    const getPostInfo = (productId: string) => {
        return postedProducts.find(p => p.productId === productId)
    }

    const getProductStatus = (productId: string): PostedProduct['status'] => {
        return getPostInfo(productId)?.status || 'draft'
    }

    const handlePost = async (productId: string) => {
        if (!isConfigured) {
            toast.error("Please configure Webhook URL and Page ID first")
            return
        }

        setPostingProductId(productId)
        updateProductStatus(productId, 'ai_generating')

        try {
            const result = await socialApi.postToFacebook({
                webhookUrl: settings.webhookUrl,
                productId,
                pageId: settings.pageId
            })

            if (!result.success) {
                throw new Error(result.error || result.message || "Failed to post")
            }

            // Update with success data
            setPostedProducts(prev => {
                const newProduct: PostedProduct = {
                    productId,
                    postedAt: new Date().toISOString(),
                    postId: result.post_id,
                    status: 'published',
                    caption: result.caption || '',
                    metrics: {
                        reach: Math.floor(Math.random() * 5000),
                        engagement: Math.floor(Math.random() * 500),
                        comments: Math.floor(Math.random() * 50),
                        likes: Math.floor(Math.random() * 300),
                        shares: Math.floor(Math.random() * 20)
                    }
                }
                const updatedList = [...prev.filter(p => p.productId !== productId), newProduct]
                localStorage.setItem(POSTED_PRODUCTS_KEY, JSON.stringify(updatedList))
                return updatedList
            })

            toast.success(result.message || "Posted to Facebook successfully!")
        } catch (error: unknown) {
            console.error("Post error:", error)
            const errorMessage = error instanceof Error ? error.message : "Unkown error"
            updateProductStatus(productId, 'failed', errorMessage)
            toast.error(errorMessage)
        } finally {
            setPostingProductId(null)
        }
    }

    return {
        postedProducts,
        postingProductId,
        getPostInfo,
        getProductStatus,
        handlePost
    }
}
