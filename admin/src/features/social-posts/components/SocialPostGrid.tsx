import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    IconHeart,
    IconMessageCircle,
    IconEdit,
    IconSparkles,
    IconClock,
    IconCheck,
    IconX,
} from "@tabler/icons-react"
import { optimizeImageUrl } from '../utils/imageUtils'
import type { PostedProduct } from '../types'
import type { Product } from '@/hooks/useProductsQuery'

import type { Variant } from '@/hooks/useVariantsQuery'

interface SocialPostGridProps {
    products: Product[]
    selectedProducts: Set<string>
    onSelectionChange: (selected: Set<string>) => void
    getPostInfo: (id: string) => PostedProduct | undefined
    getProductStatus: (id: string) => PostedProduct['status']
    variantsMap: Record<string, Variant[]>
}

export function SocialPostGrid({
    products,
    selectedProducts,
    onSelectionChange,
    getPostInfo,
    getProductStatus,
    variantsMap
}: SocialPostGridProps) {

    const toggleSelection = (productId: string) => {
        const newSelection = new Set(selectedProducts)
        if (newSelection.has(productId)) {
            newSelection.delete(productId)
        } else {
            newSelection.add(productId)
        }
        onSelectionChange(newSelection)
    }

    const getProductMainImage = (productId: string) => {
        const variants = variantsMap[productId] || []
        if (variants.length === 0) return ''
        return variants[0]?.mainImage || variants[0]?.images?.[0] || ''
    }

    // Reuse status badge logic but simplified for grid
    const getStatusIcon = (status: PostedProduct['status']) => {
        switch (status) {
            case 'published': return <IconCheck className="h-4 w-4 text-green-600" />
            case 'scheduled': return <IconClock className="h-4 w-4 text-blue-600" />
            case 'failed': return <IconX className="h-4 w-4 text-red-600" />
            case 'ai_generating': return <IconSparkles className="h-4 w-4 text-yellow-600 animate-pulse" />
            default: return <IconEdit className="h-4 w-4 text-gray-500" />
        }
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: Product) => {
                const postInfo = getPostInfo(product._id)
                const status = getProductStatus(product._id)
                const mainImage = getProductMainImage(product._id)
                const isSelected = selectedProducts.has(product._id)

                return (
                    <Card key={product._id} className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                        <div className="relative aspect-square bg-muted">
                            <img
                                src={optimizeImageUrl(mainImage) || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E'
                                }}
                            />
                            <div className="absolute top-2 left-2">
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelection(product._id)}
                                    className="bg-white/90"
                                />
                            </div>
                            <div className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-sm">
                                {getStatusIcon(status)}
                            </div>
                        </div>
                        <CardContent className="p-3">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                    ${(variantsMap[product._id]?.[0]?.price || product.basePrice)?.toLocaleString()}
                                </Badge>
                                {variantsMap[product._id]?.length > 0 && (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                        {variantsMap[product._id]?.length} vars
                                    </Badge>
                                )}
                            </div>
                            {status === 'published' && postInfo?.metrics && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <IconHeart className="h-3 w-3" />
                                        {postInfo.metrics.likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <IconMessageCircle className="h-3 w-3" />
                                        {postInfo.metrics.comments}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
