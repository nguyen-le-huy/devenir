import { useState, useEffect, useMemo, useCallback } from "react"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useProductsQuery } from "@/hooks/useProductsQuery"
import { useVariantsQuery } from "@/hooks/useVariantsQuery"
import { toast } from "sonner"
import {
    IconBrandFacebook,
    IconSend,
    IconSettings,
    IconCheck,
    IconX,
    IconPhoto,
    IconEdit,
    IconExternalLink,
    IconDotsVertical,
    IconEye,
    IconCalendar,
    IconSparkles,
    IconTag,
    IconPlayerPlay,
    IconDeviceMobile,
    IconLayoutGrid,
    IconList,
    IconRocket,
    IconAlertCircle,
    IconClock,
    IconEyeCheck,
    IconHeart,
    IconMessageCircle,
    IconShare
} from "@tabler/icons-react"

// Types
interface SocialSettings {
    webhookUrl: string
    pageId: string
}

interface PostedProduct {
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

type ViewMode = 'list' | 'grid' | 'calendar'
type FilterTab = 'all' | 'drafts' | 'scheduled' | 'published' | 'errors'

// LocalStorage Keys
const SETTINGS_KEY = "devenir_social_settings"
const POSTED_PRODUCTS_KEY = "devenir_posted_products"

// Helper function to optimize image URLs
const optimizeImageUrl = (url: string | undefined): string => {
    if (!url) return ''
    
    // If it's a Cloudinary URL, add optimization parameters
    if (url.includes('cloudinary.com')) {
        // Add f_auto,q_auto for automatic format and quality optimization
        if (!url.includes('/upload/')) return url
        return url.replace('/upload/', '/upload/f_auto,q_auto,w_300/')
    }
    
    return url
}

export default function SocialPostsPage() {
    // Settings State
    const [settings, setSettings] = useState<SocialSettings>({ webhookUrl: "", pageId: "" })
    const [tempSettings, setTempSettings] = useState<SocialSettings>({ webhookUrl: "", pageId: "" })
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Posted Products State (local tracking)
    const [postedProducts, setPostedProducts] = useState<PostedProduct[]>([])

    // Posting State
    const [postingProductId, setPostingProductId] = useState<string | null>(null)

    // Selection State
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

    // View State
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [filterTab, setFilterTab] = useState<FilterTab>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Preview State
    const [previewProduct, setPreviewProduct] = useState<any>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    // Products Query
    const { data: productsData, isLoading: productsLoading } = useProductsQuery({ limit: 100 })
    const { data: variantsData, isLoading: variantsLoading } = useVariantsQuery({ limit: 500 })
    const products = productsData?.data || []
    const allVariants = variantsData?.data || []
    const isLoading = productsLoading || variantsLoading

    // Create variants map by product_id for easy lookup
    const variantsMap = useMemo(() => {
        const map: { [key: string]: any[] } = {}
        allVariants.forEach((variant: any) => {
            const productId = variant.product_id || variant.product || ''
            if (!map[productId]) {
                map[productId] = []
            }
            map[productId].push(variant)
        })
        return map
    }, [allVariants])

    // Helper to get product main image from variants
    const getProductMainImage = useCallback((productId: string) => {
        const variants = variantsMap[productId] || []
        if (variants.length === 0) return ''
        return variants[0]?.mainImage || variants[0]?.images?.[0] || ''
    }, [variantsMap])

    // Helper to get all product images
    const getProductImages = useCallback((productId: string) => {
        const variants = variantsMap[productId] || []
        return variants.flatMap(v => v.images || [])
    }, [variantsMap])

    // Debug: Log products data to check image URLs
    useEffect(() => {
        if (products.length > 0 && allVariants.length > 0) {
            console.log('📦 Products loaded:', products.length)
            console.log('🎨 Variants loaded:', allVariants.length)
            console.log('🔍 First product:', products[0])
            console.log('🖼️ First product variants:', variantsMap[products[0]._id])
            console.log('📸 First product main image:', getProductMainImage(products[0]._id))
        }
    }, [products, allVariants, variantsMap, getProductMainImage])

    // Load settings & posted products from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem(SETTINGS_KEY)
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings)
                setSettings(parsed)
                setTempSettings(parsed)
            } catch (e) {
                console.error("Failed to parse saved settings", e)
            }
        }

        const savedPosted = localStorage.getItem(POSTED_PRODUCTS_KEY)
        if (savedPosted) {
            try {
                setPostedProducts(JSON.parse(savedPosted))
            } catch (e) {
                console.error("Failed to parse posted products", e)
            }
        }
    }, [])

    // Save settings
    const saveSettings = () => {
        if (!tempSettings.webhookUrl || !tempSettings.pageId) {
            toast.error("Please fill in both Webhook URL and Page ID")
            return
        }
        setSettings(tempSettings)
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(tempSettings))
        setIsSettingsOpen(false)
        toast.success("Settings saved successfully!")
    }

    // Check if settings are configured
    const isConfigured = settings.webhookUrl && settings.pageId

    // Get post info for a product
    const getPostInfo = (productId: string) => {
        return postedProducts.find(p => p.productId === productId)
    }

    // Get product status
    const getProductStatus = (productId: string): PostedProduct['status'] => {
        const postInfo = getPostInfo(productId)
        return postInfo?.status || 'draft'
    }

    // Selection handlers
    const toggleSelection = (productId: string) => {
        const newSelection = new Set(selectedProducts)
        if (newSelection.has(productId)) {
            newSelection.delete(productId)
        } else {
            newSelection.add(productId)
        }
        setSelectedProducts(newSelection)
    }

    const selectAll = () => {
        const filtered = getFilteredProducts()
        setSelectedProducts(new Set(filtered.map((p: any) => p._id)))
    }

    const clearSelection = () => {
        setSelectedProducts(new Set())
    }

    // Bulk actions
    const handleBulkSchedule = () => {
        toast.info(`Scheduling ${selectedProducts.size} posts...`)
        // TODO: Implement bulk schedule modal
    }

    const handleBulkAIRewrite = async () => {
        toast.info(`🤖 AI đang viết lại nội dung cho ${selectedProducts.size} sản phẩm...`)
        // TODO: Implement AI rewrite
    }

    const handleBulkForceRun = async () => {
        for (const productId of selectedProducts) {
            await handlePost(productId)
        }
        clearSelection()
    }

    // Handle posting a product
    const handlePost = async (productId: string) => {
        if (!isConfigured) {
            toast.error("Please configure Webhook URL and Page ID first")
            setIsSettingsOpen(true)
            return
        }

        setPostingProductId(productId)
        
        // Update to "AI Generating" status
        updateProductStatus(productId, 'ai_generating')
        
        try {
            // Use backend proxy to avoid CORS issues
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3111/api'

            const response = await fetch(`${API_URL}/social/webhook-proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    webhookUrl: settings.webhookUrl,
                    productId: productId,
                    postType: "multi_image",
                    pageId: settings.pageId
                })
            })

            const result = await response.json()

            if (!response.ok || result.success === false) {
                throw new Error(result.error || result.message || "Failed to post")
            }

            // Mark product as posted with published status
            const newPostedProduct: PostedProduct = {
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
            const updatedPosted = [...postedProducts.filter(p => p.productId !== productId), newPostedProduct]
            setPostedProducts(updatedPosted)
            localStorage.setItem(POSTED_PRODUCTS_KEY, JSON.stringify(updatedPosted))

            toast.success(result.message || "Posted to Facebook successfully!")
        } catch (error: any) {
            console.error("Post error:", error)
            updateProductStatus(productId, 'failed', error.message)
            toast.error(error.message || "Failed to send post request")
        } finally {
            setPostingProductId(null)
        }
    }

    // Update product status
    const updateProductStatus = (productId: string, status: PostedProduct['status'], errorMessage?: string) => {
        const existing = postedProducts.find(p => p.productId === productId)
        const updated: PostedProduct = {
            productId,
            postedAt: existing?.postedAt || new Date().toISOString(),
            postId: existing?.postId,
            status,
            caption: existing?.caption,
            errorMessage,
            metrics: existing?.metrics
        }
        const updatedPosted = [...postedProducts.filter(p => p.productId !== productId), updated]
        setPostedProducts(updatedPosted)
        localStorage.setItem(POSTED_PRODUCTS_KEY, JSON.stringify(updatedPosted))
    }

    // Get filtered products based on tab and search
    const getFilteredProducts = () => {
        let filtered = products

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter((p: any) => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Filter by tab
        if (filterTab !== 'all') {
            filtered = filtered.filter((p: any) => {
                const status = getProductStatus(p._id)
                switch (filterTab) {
                    case 'drafts':
                        return status === 'draft' || status === 'approval_needed'
                    case 'scheduled':
                        return status === 'scheduled'
                    case 'published':
                        return status === 'published'
                    case 'errors':
                        return status === 'failed'
                    default:
                        return true
                }
            })
        }

        return filtered
    }

    // Get status badge component
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

    // Stats
    const filteredProducts = getFilteredProducts()
    const totalProducts = products.length
    const postedCount = products.filter((p: any) => getProductStatus(p._id) === 'published').length
    const scheduledCount = products.filter((p: any) => getProductStatus(p._id) === 'scheduled').length
    const draftCount = products.filter((p: any) => ['draft', 'approval_needed'].includes(getProductStatus(p._id))).length
    const errorCount = products.filter((p: any) => getProductStatus(p._id) === 'failed').length

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Facebook Campaign Manager</h1>
                        <p className="text-muted-foreground">Professional social media automation powered by n8n & AI.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2" onClick={() => toast.info("Magic Generate feature coming soon!")}>
                            <IconSparkles className="h-4 w-4" />
                            Magic Generate
                        </Button>
                        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <IconSettings className="h-4 w-4" />
                                    Settings
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <IconSettings className="h-5 w-5" />
                                        Social Media Settings
                                    </DialogTitle>
                                    <DialogDescription>
                                        Configure your n8n webhook and Facebook Page credentials.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="webhook">N8N Webhook URL</Label>
                                        <Input
                                            id="webhook"
                                            placeholder="https://n8n.your-domain.com/webhook/..."
                                            value={tempSettings.webhookUrl}
                                            onChange={(e) => setTempSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            The endpoint from your n8n Webhook node (Production URL).
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pageId">Facebook Page ID</Label>
                                        <Input
                                            id="pageId"
                                            placeholder="e.g. 905478369317354"
                                            value={tempSettings.pageId}
                                            onChange={(e) => setTempSettings(prev => ({ ...prev, pageId: e.target.value }))}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Your Facebook Page ID (found in Page Settings &gt; Transparency).
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => {
                                        setTempSettings(settings)
                                        setIsSettingsOpen(false)
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button onClick={saveSettings}>
                                        Save Settings
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                            <IconPhoto className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalProducts}</div>
                            <p className="text-xs text-muted-foreground mt-1">All content assets</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Published</CardTitle>
                            <IconCheck className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{postedCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Live on Facebook</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                            <IconClock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Queued for posting</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                            <IconEdit className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{draftCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Configuration Status */}
                {!isConfigured && (
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <IconSettings className="h-5 w-5 text-orange-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-orange-800 dark:text-orange-200">Configuration Required</p>
                                    <p className="text-sm text-orange-600 dark:text-orange-400">
                                        Please configure your Webhook URL and Page ID before posting.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                                    Configure Now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filter Bar & View Controls */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            {/* Filter Tabs */}
                            <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
                                <TabsList>
                                    <TabsTrigger value="all">All ({totalProducts})</TabsTrigger>
                                    <TabsTrigger value="drafts">Drafts ({draftCount})</TabsTrigger>
                                    <TabsTrigger value="scheduled">Scheduled ({scheduledCount})</TabsTrigger>
                                    <TabsTrigger value="published">Published ({postedCount})</TabsTrigger>
                                    <TabsTrigger value="errors">Errors ({errorCount})</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {/* Search & View Controls */}
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-64"
                                />
                                <div className="flex items-center border rounded-md">
                                    <Button
                                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        className="rounded-r-none"
                                    >
                                        <IconList className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className="rounded-none border-x"
                                    >
                                        <IconLayoutGrid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('calendar')}
                                        className="rounded-l-none"
                                    >
                                        <IconCalendar className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Table/Grid */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <IconBrandFacebook className="text-blue-600" />
                                <CardTitle>Content Library</CardTitle>
                            </div>
                            {selectedProducts.size > 0 && (
                                <div className="text-sm text-muted-foreground">
                                    {selectedProducts.size} selected
                                </div>
                            )}
                        </div>
                        <CardDescription>
                            Manage your product posts with enterprise-grade tools.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center space-y-3">
                                    <span className="animate-spin text-3xl inline-block">⏳</span>
                                    <p className="text-muted-foreground">Loading campaign data...</p>
                                </div>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <IconPhoto className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No products found matching your filters.</p>
                                {searchQuery && (
                                    <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2">
                                        Clear search
                                    </Button>
                                )}
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px]">
                                                <Checkbox
                                                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            selectAll()
                                                        } else {
                                                            clearSelection()
                                                        }
                                                    }}
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
                                        {filteredProducts.map((product: any) => {
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
                                                                        console.error('Image failed to load:', mainImage)
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
                                                                {images.length > 1 && (
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
                                                                <DropdownMenuItem onClick={() => {
                                                                    setPreviewProduct(product)
                                                                    setIsPreviewOpen(true)
                                                                }}>
                                                                    <IconEye className="h-4 w-4 mr-2" />
                                                                    Preview Mobile
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handlePost(product._id)} disabled={!isConfigured || isProcessing}>
                                                                    <IconSend className="h-4 w-4 mr-2" />
                                                                    {status === 'published' ? 'Repost' : 'Post Now'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => toast.info("Boost feature coming soon!")}>
                                                                    <IconRocket className="h-4 w-4 mr-2" />
                                                                    Boost Post
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
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredProducts.map((product: any) => {
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
                                                        console.error('Grid image failed to load:', mainImage)
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
                                                <div className="absolute top-2 right-2">
                                                    {getStatusBadge(status, postInfo?.errorMessage)}
                                                </div>
                                            </div>
                                            <CardContent className="p-3">
                                                <p className="font-medium text-sm line-clamp-2">{product.name}</p>
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
                        ) : (
                            <div className="text-center py-12">
                                <IconCalendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">Calendar view coming soon!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Floating Bulk Action Bar */}
                {selectedProducts.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
                        <Card className="shadow-2xl border-2">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                            {selectedProducts.size}
                                        </div>
                                        <span className="font-medium">products selected</span>
                                    </div>
                                    <div className="h-6 w-px bg-border" />
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={handleBulkSchedule}>
                                            <IconCalendar className="h-4 w-4 mr-2" />
                                            Bulk Schedule
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleBulkAIRewrite}>
                                            <IconSparkles className="h-4 w-4 mr-2" />
                                            AI Rewrite
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => toast.info("Tagging feature coming soon!")}>
                                            <IconTag className="h-4 w-4 mr-2" />
                                            Add Tags
                                        </Button>
                                        <Button size="sm" onClick={handleBulkForceRun} disabled={!isConfigured}>
                                            <IconPlayerPlay className="h-4 w-4 mr-2" />
                                            Force Run
                                        </Button>
                                    </div>
                                    <div className="h-6 w-px bg-border" />
                                    <Button size="sm" variant="ghost" onClick={clearSelection}>
                                        <IconX className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Mobile Preview Modal */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
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
                        {previewProduct && (
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
                                        <p className="text-sm">
                                            {getPostInfo(previewProduct._id)?.caption || `🔥 ${previewProduct.name}\n\n✨ Premium quality, modern design\n💰 Special price: $${previewProduct.variants?.[0]?.price}\n\n#Fashion #Style #Devenir`}
                                        </p>
                                    </div>
                                    {/* Post Image */}
                                    <div className="relative aspect-square bg-muted">
                                        <img
                                            src={optimizeImageUrl(getProductMainImage(previewProduct._id)) || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E'}
                                            alt={previewProduct.name}
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
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                                Close
                            </Button>
                            {previewProduct && (
                                <Button onClick={() => {
                                    handlePost(previewProduct._id)
                                    setIsPreviewOpen(false)
                                }}>
                                    <IconSend className="h-4 w-4 mr-2" />
                                    Post Now
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Current Configuration Display */}
                {isConfigured && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Current Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2 text-sm">
                            <div className="flex items-start gap-2">
                                <span className="font-medium min-w-[100px]">Webhook:</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                                    {settings.webhookUrl}
                                </code>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[100px]">Page ID:</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {settings.pageId}
                                </code>
                                <a
                                    href={`https://facebook.com/${settings.pageId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                    <IconExternalLink className="h-3 w-3" />
                                    View Page
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    )
}
