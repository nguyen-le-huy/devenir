import { useState, useMemo, useCallback } from "react"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconSettings, IconSparkles, IconBrandFacebook, IconCalendar, IconTag, IconPlayerPlay, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import { useProductsQuery } from "@/hooks/useProductsQuery"
import type { Product } from "@/hooks/useProductsQuery"
import { useVariantsQuery } from "@/hooks/useVariantsQuery"
import type { Variant } from "@/hooks/useVariantsQuery"

// Feature Imports
import { SocialStatsCards } from "@/features/social-posts/components/SocialStatsCards"
import { SocialOptionBar } from "@/features/social-posts/components/SocialOptionBar"
import { SocialPostList } from "@/features/social-posts/components/SocialPostList"
import { SocialPostGrid } from "@/features/social-posts/components/SocialPostGrid"
import { SocialSettings } from "@/features/social-posts/components/SocialSettings"
import { SocialPreview } from "@/features/social-posts/components/SocialPreview"
import { useSocialSettings } from "@/features/social-posts/hooks/useSocialSettings"
import { useSocialPosts } from "@/features/social-posts/hooks/useSocialPosts"
import type { ViewMode, FilterTab } from "@/features/social-posts/types"
import { optimizeImageUrl } from "@/features/social-posts/utils/imageUtils"

export default function SocialPostsPage() {
    // Feature Hooks
    const {
        settings,
        isSettingsOpen,
        setIsSettingsOpen,
        saveSettings,
        isConfigured
    } = useSocialSettings()

    const {
        postedProducts,
        postingProductId,
        getPostInfo,
        getProductStatus,
        handlePost
    } = useSocialPosts(settings, isConfigured)

    // Local UI State
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [filterTab, setFilterTab] = useState<FilterTab>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    // Data Fetching
    const { data: productsData, isLoading: productsLoading } = useProductsQuery({ limit: 100 })
    const { data: variantsData, isLoading: variantsLoading } = useVariantsQuery({ limit: 500 })



    const products = useMemo(() => productsData?.data || [], [productsData])
    const isLoading = productsLoading || variantsLoading

    // Optimized Variants Map
    const variantsMap = useMemo(() => {
        const allVariants = variantsData?.data || []
        const map: { [key: string]: Variant[] } = {}

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allVariants.forEach((variant: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawProduct = (variant as any).product
            const productId = (typeof rawProduct === 'object' && rawProduct?._id)
                ? rawProduct._id
                : (rawProduct || variant.product_id)

            if (productId) {
                const key = String(productId)
                if (!map[key]) map[key] = []
                map[key].push(variant)
            }
        })

        return map
    }, [variantsData])

    // Get Main Image Helper (needed for preview)
    const getProductMainImage = useCallback((productId: string) => {
        const variants = variantsMap[productId] || []
        if (variants.length === 0) return ''
        return variants[0]?.mainImage || variants[0]?.images?.[0] || ''
    }, [variantsMap])

    // Filtering Logic
    const filteredProducts = useMemo(() => {
        let filtered: Product[] = products

        if (searchQuery) {
            filtered = filtered.filter((p: Product) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (filterTab !== 'all') {
            filtered = filtered.filter((p: Product) => {
                const status = getProductStatus(p._id)
                switch (filterTab) {
                    case 'drafts': return status === 'draft' || status === 'approval_needed'
                    case 'scheduled': return status === 'scheduled'
                    case 'published': return status === 'published'
                    case 'errors': return status === 'failed'
                    default: return true
                }
            })
        }
        return filtered
    }, [products, searchQuery, filterTab, getProductStatus])

    // Calculate Counts
    const counts = useMemo(() => {
        return {
            total: products.length,
            published: products.filter((p: Product) => getProductStatus(p._id) === 'published').length,
            scheduled: products.filter((p: Product) => getProductStatus(p._id) === 'scheduled').length,
            drafts: products.filter((p: Product) => ['draft', 'approval_needed'].includes(getProductStatus(p._id))).length,
            errors: products.filter((p: Product) => getProductStatus(p._id) === 'failed').length
        }
    }, [products, getProductStatus])

    // Bulk Actions
    const handleBulkSchedule = () => toast.info(`Scheduling ${selectedProducts.size} posts...`)
    const handleBulkAIRewrite = () => toast.info(`🤖 AI rewriting content for ${selectedProducts.size} products...`)
    const handleBulkForceRun = async () => {
        for (const productId of selectedProducts) {
            await handlePost(productId)
        }
        setSelectedProducts(new Set())
    }

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
                        <Button variant="outline" className="gap-2" onClick={() => setIsSettingsOpen(true)}>
                            <IconSettings className="h-4 w-4" />
                            Settings
                        </Button>
                    </div>
                </div>

                {/* Statistics */}
                <SocialStatsCards
                    totalProducts={counts.total}
                    postedCount={counts.published}
                    scheduledCount={counts.scheduled}
                    draftCount={counts.drafts}
                />

                {/* Configuration Warning */}
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

                {/* Options & Filters */}
                <SocialOptionBar
                    filterTab={filterTab}
                    setFilterTab={setFilterTab}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    counts={counts}
                />

                {/* Content Area */}
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
                                <div className="mx-auto h-12 w-12 text-muted-foreground bg-muted rounded-full flex items-center justify-center mb-3">
                                    <IconSettings className="h-6 w-6" />
                                </div>
                                <p className="text-muted-foreground">No products found matching your filters.</p>
                                {searchQuery && (
                                    <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2">
                                        Clear search
                                    </Button>
                                )}
                            </div>
                        ) : viewMode === 'list' ? (
                            <SocialPostList
                                products={filteredProducts}
                                selectedProducts={selectedProducts}
                                onSelectionChange={setSelectedProducts}
                                postedProducts={postedProducts}
                                postingProductId={postingProductId}
                                onPost={handlePost}
                                onPreview={(p) => {
                                    setPreviewProduct(p)
                                    setIsPreviewOpen(true)
                                }}
                                isConfigured={isConfigured}
                                getPostInfo={getPostInfo}
                                getProductStatus={getProductStatus}
                                variantsMap={variantsMap}
                            />
                        ) : viewMode === 'grid' ? (
                            <SocialPostGrid
                                products={filteredProducts}
                                selectedProducts={selectedProducts}
                                onSelectionChange={setSelectedProducts}
                                getPostInfo={getPostInfo}
                                getProductStatus={getProductStatus}
                                variantsMap={variantsMap}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <IconCalendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">Calendar view coming soon!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Floating Bulk Actions */}
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
                                    <Button size="sm" variant="ghost" onClick={() => setSelectedProducts(new Set())}>
                                        <IconX className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Dialogs */}
                <SocialSettings
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    settings={settings}
                    onSave={saveSettings}
                />

                <SocialPreview
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    product={previewProduct}
                    postInfo={previewProduct ? getPostInfo(previewProduct._id) : undefined}
                    mainImage={previewProduct ? optimizeImageUrl(getProductMainImage(previewProduct._id)) : ''}
                    onPost={handlePost}
                />
            </div>
        </AdminLayout>
    )
}
