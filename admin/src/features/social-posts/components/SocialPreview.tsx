import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    IconDeviceMobile,
    IconDotsVertical,
    IconHeart,
    IconMessageCircle,
    IconShare,
    IconSend
} from "@tabler/icons-react"
import { optimizeImageUrl } from '../utils/imageUtils'
import type { PostedProduct } from '../types'
import type { Product } from '@/hooks/useProductsQuery'

interface SocialPreviewProps {
    isOpen: boolean
    onClose: () => void
    product: Product | null
    postInfo?: PostedProduct
    mainImage: string
    onPost: (productId: string) => void
}

export function SocialPreview({
    isOpen,
    onClose,
    product,
    postInfo,
    mainImage,
    onPost
}: SocialPreviewProps) {
    if (!product) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconDeviceMobile className="h-5 w-5" />
                        Mobile Preview
                    </DialogTitle>
                    <DialogDescription>
                        Preview how this post will look on Facebook mobile app
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Facebook Mobile UI Mockup */}
                    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                        {/* Post Header */}
                        <div className="flex items-center gap-3 p-3 border-b">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                D
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">Devenir Fashion</p>
                                <p className="text-xs text-gray-500">Just now · 🌍</p>
                            </div>
                            <IconDotsVertical className="h-5 w-5 text-gray-500" />
                        </div>
                        {/* Post Caption */}
                        <div className="px-3 py-2">
                            <p className="text-sm border-l-2 pl-2 border-primary/20 italic">
                                {postInfo?.caption || `🔥 ${product.name}\n\n✨ Premium quality, modern design\n💰 Special price: $${product.basePrice}\n\n#Fashion #Style #Devenir`}
                            </p>
                        </div>
                        {/* Post Image */}
                        <div className="relative aspect-square bg-muted">
                            <img
                                src={optimizeImageUrl(mainImage) || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Engagement Bar */}
                        <div className="px-3 py-2 border-t">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                <span>👍❤️ 324 likes</span>
                                <span>48 comments · 12 shares</span>
                            </div>
                            <div className="flex items-center justify-around py-2 border-t">
                                <button className="flex items-center gap-1 text-sm text-gray-600">
                                    <IconHeart className="h-5 w-5" />
                                    Like
                                </button>
                                <button className="flex items-center gap-1 text-sm text-gray-600">
                                    <IconMessageCircle className="h-5 w-5" />
                                    Comment
                                </button>
                                <button className="flex items-center gap-1 text-sm text-gray-600">
                                    <IconShare className="h-5 w-5" />
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={() => {
                        onPost(product._id)
                        onClose()
                    }}>
                        <IconSend className="h-4 w-4 mr-2" />
                        Post Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
