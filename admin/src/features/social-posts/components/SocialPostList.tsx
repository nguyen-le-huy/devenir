import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    IconBrandFacebook,
    IconSend,
    IconEdit,
    IconCheck,
    IconX,
    IconPhoto,
    IconDotsVertical,
    IconEye,
    IconRocket,
    IconExternalLink,
    IconSparkles,
    IconClock,
    IconAlertCircle,
    IconHeart,
    IconMessageCircle,
    IconEyeCheck
} from "@tabler/icons-react"
import { optimizeImageUrl } from '../utils/imageUtils'
import type { PostedProduct } from '../types'
import type { Product } from '@/hooks/useProductsQuery'

import type { Variant } from '@/hooks/useVariantsQuery'

interface SocialPostListProps {
    products: Product[]
    selectedProducts: Set<string>
    onSelectionChange: (selected: Set<string>) => void
    postedProducts: PostedProduct[]
    postingProductId: string | null
    onPost: (id: string) => void
    onPreview: (product: Product) => void
    isConfigured: boolean
    getPostInfo: (id: string) => PostedProduct | undefined
    getProductStatus: (id: string) => PostedProduct['status']
    variantsMap: Record<string, Variant[]>
}

export function SocialPostList({
    products,
    selectedProducts,
    onSelectionChange,
    postingProductId,
    onPost,
    onPreview,
    isConfigured,
    getPostInfo,
    getProductStatus,
    variantsMap
}: SocialPostListProps) {

    // Toggle single selection
    const toggleSelection = (productId: string) => {
        const newSelection = new Set(selectedProducts)
        if (newSelection.has(productId)) {
            newSelection.delete(productId)
        } else {
            newSelection.add(productId)
        }
        onSelectionChange(newSelection)
    }

    // Toggle all selection
    const toggleAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(new Set(products.map(p => p._id)))
        } else {
            onSelectionChange(new Set())
        }
    }

    // Helper to get product main image
    const getProductMainImage = (productId: string) => {
        const variants = variantsMap[productId] || []
        if (variants.length === 0) return ''
        return variants[0]?.mainImage || variants[0]?.images?.[0] || ''
    }

    // Helper to get all product images
    const getProductImages = (productId: string) => {
        const variants = variantsMap[productId] || []
        return variants.flatMap(v => v.images || [])
    }

    // Helper for status badges
    const getStatusBadge = (status: PostedProduct['status'], errorMessage?: string) => {
        const badges = {
            draft: {
                icon: <IconEdit className="h-3 w-3" />,
                label: 'Draft',
                className: 'bg-gray-100 text-gray-700 hover:bg-gray-100'
            },
            ai_generating: {
                icon: <IconSparkles className="h-3 w-3 animate-pulse" />,
                label: 'AI Generating',
                className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
            },
            approval_needed: {
                icon: <IconAlertCircle className="h-3 w-3" />,
                label: 'Approval Needed',
                className: 'bg-orange-100 text-orange-700 hover:bg-orange-100'
            },
            scheduled: {
                icon: <IconClock className="h-3 w-3" />,
                label: 'Scheduled',
                className: 'bg-blue-100 text-blue-700 hover:bg-blue-100'
            },
            published: {
                icon: <IconCheck className="h-3 w-3" />,
                label: 'Published',
                className: 'bg-green-100 text-green-700 hover:bg-green-100'
            },
            failed: {
                icon: <IconX className="h-3 w-3" />,
                label: 'Failed',
                className: 'bg-red-100 text-red-700 hover:bg-red-100'
            }
        }

        const badge = badges[status]
        const BadgeContent = (
            <Badge variant="secondary" className={badge.className}>
                {badge.icon}
                <span className="ml-1">{badge.label}</span>
            </Badge>
        )

        if (status === 'failed' && errorMessage) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {BadgeContent}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p className="text-sm">{errorMessage}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }

        return BadgeContent
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                            <Checkbox
                                checked={selectedProducts.size === products.length && products.length > 0}
                                onCheckedChange={toggleAll}
                            />
                        </TableHead>
                        <TableHead className="w-[100px]">Creative Asset</TableHead>
                        <TableHead>Content Preview</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Workflow Stage</TableHead>
                        <TableHead>Live Metrics</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product: Product) => {
                        const postInfo = getPostInfo(product._id)
                        const status = getProductStatus(product._id)
                        const productVariants = variantsMap[product._id] || []
                        const mainImage = getProductMainImage(product._id)
                        const images = getProductImages(product._id)
                        const price = productVariants[0]?.price
                        const isSelected = selectedProducts.has(product._id)
                        const isProcessing = postingProductId === product._id

                        return (
                            <TableRow
                                key={product._id}
                                className={`${isSelected ? 'bg-muted/50' : ''} ${isProcessing ? 'opacity-60' : ''}`}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelection(product._id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="relative">
                                        {mainImage ? (
                                            <img
                                                src={optimizeImageUrl(mainImage)}
                                                alt={product.name}
                                                className="w-16 h-16 object-cover rounded-lg border-2 border-muted"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E'
                                                }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                                <IconPhoto className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1 max-w-md">
                                        <p className="font-semibold text-sm">{product.name}</p>
                                        {postInfo?.caption ? (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {postInfo.caption}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {product.description || 'No description available'}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <Badge variant="outline" className="text-xs">
                                                ${price?.toLocaleString() || 'N/A'}
                                            </Badge>
                                            {images.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {images.length} photos
                                                </Badge>
                                            )}
                                            {productVariants.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {productVariants.length} variants
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <IconBrandFacebook className="h-4 w-4 text-blue-600" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(status, postInfo?.errorMessage)}
                                </TableCell>
                                <TableCell>
                                    {status === 'published' && postInfo?.metrics && (
                                        <div className="flex items-center gap-3 text-xs">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-1">
                                                            <IconEyeCheck className="h-3 w-3 text-blue-600" />
                                                            <span>{postInfo.metrics.reach?.toLocaleString()}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Reach</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-1">
                                                            <IconHeart className="h-3 w-3 text-red-600" />
                                                            <span>{postInfo.metrics.likes}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Likes</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-1">
                                                            <IconMessageCircle className="h-3 w-3 text-green-600" />
                                                            <span>{postInfo.metrics.comments}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Comments</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <IconDotsVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onPreview(product)}>
                                                <IconEye className="h-4 w-4 mr-2" />
                                                Preview Mobile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onPost(product._id)}
                                                disabled={!isConfigured || isProcessing}
                                            >
                                                <IconSend className="h-4 w-4 mr-2" />
                                                {status === 'published' ? 'Repost' : 'Post Now'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled>
                                                <IconRocket className="h-4 w-4 mr-2" />
                                                Boost Post (Soon)
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {postInfo?.postId && (
                                                <DropdownMenuItem asChild>
                                                    <a
                                                        href={`https://facebook.com/${postInfo.postId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center"
                                                    >
                                                        <IconExternalLink className="h-4 w-4 mr-2" />
                                                        View on Facebook
                                                    </a>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
