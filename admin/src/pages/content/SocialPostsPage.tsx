import { useState, useEffect } from "react"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import {
    IconBrandFacebook,
    IconSend,
    IconSettings,
    IconCheck,
    IconX,
    IconPhoto,
    IconEdit,
    IconExternalLink
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
}

// LocalStorage Keys
const SETTINGS_KEY = "devenir_social_settings"
const POSTED_PRODUCTS_KEY = "devenir_posted_products"

export default function SocialPostsPage() {
    // Settings State
    const [settings, setSettings] = useState<SocialSettings>({ webhookUrl: "", pageId: "" })
    const [tempSettings, setTempSettings] = useState<SocialSettings>({ webhookUrl: "", pageId: "" })
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Posted Products State (local tracking)
    const [postedProducts, setPostedProducts] = useState<PostedProduct[]>([])

    // Posting State
    const [postingProductId, setPostingProductId] = useState<string | null>(null)

    // Products Query
    const { data: productsData, isLoading } = useProductsQuery({ limit: 100 })
    const products = productsData?.data || []

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

    // Check if product is posted
    const isProductPosted = (productId: string) => {
        return postedProducts.some(p => p.productId === productId)
    }

    // Get post info for a product
    const getPostInfo = (productId: string) => {
        return postedProducts.find(p => p.productId === productId)
    }

    // Handle posting a product
    const handlePost = async (productId: string) => {
        if (!isConfigured) {
            toast.error("Please configure Webhook URL and Page ID first")
            setIsSettingsOpen(true)
            return
        }

        setPostingProductId(productId)
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

            // Mark product as posted
            const newPostedProduct: PostedProduct = {
                productId,
                postedAt: new Date().toISOString(),
                postId: result.post_id
            }
            const updatedPosted = [...postedProducts.filter(p => p.productId !== productId), newPostedProduct]
            setPostedProducts(updatedPosted)
            localStorage.setItem(POSTED_PRODUCTS_KEY, JSON.stringify(updatedPosted))

            toast.success(result.message || "Posted to Facebook successfully!")
        } catch (error: any) {
            console.error("Post error:", error)
            toast.error(error.message || "Failed to send post request")
        } finally {
            setPostingProductId(null)
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Stats
    const totalProducts = products.length
    const postedCount = products.filter((p: any) => isProductPosted(p._id)).length
    const pendingCount = totalProducts - postedCount

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Social Media Management</h1>
                        <p className="text-muted-foreground">Manage and post products to Facebook via n8n automation.</p>
                    </div>
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

                {/* Status Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                            <IconPhoto className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalProducts}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Posted</CardTitle>
                            <IconCheck className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{postedCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <IconX className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
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

                {/* Products Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconBrandFacebook className="text-blue-600" />
                            Products
                        </CardTitle>
                        <CardDescription>
                            Select products to post to your Facebook Page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <span className="animate-spin text-2xl">⏳</span>
                                <span className="ml-2">Loading products...</span>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No products found.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Image</TableHead>
                                            <TableHead>Product Name</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Variants</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Posted At</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product: any) => {
                                            const isPosted = isProductPosted(product._id)
                                            const postInfo = getPostInfo(product._id)
                                            const mainImage = product.variants?.[0]?.mainImage
                                            const price = product.variants?.[0]?.price

                                            return (
                                                <TableRow key={product._id}>
                                                    <TableCell>
                                                        {mainImage ? (
                                                            <img
                                                                src={mainImage}
                                                                alt={product.name}
                                                                className="w-12 h-12 object-cover rounded-md"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                                                <IconPhoto className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium max-w-[200px] truncate">
                                                        {product.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {price ? `$${price.toLocaleString()}` : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {product.variants?.length || 0}
                                                    </TableCell>
                                                    <TableCell>
                                                        {isPosted ? (
                                                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                                                <IconCheck className="h-3 w-3 mr-1" />
                                                                Posted
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                                                Pending
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {postInfo ? formatDate(postInfo.postedAt) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {isPosted ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handlePost(product._id)}
                                                                    disabled={postingProductId === product._id}
                                                                    className="gap-1"
                                                                >
                                                                    <IconEdit className="h-3 w-3" />
                                                                    Repost
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handlePost(product._id)}
                                                                    disabled={postingProductId === product._id || !isConfigured}
                                                                    className="gap-1"
                                                                >
                                                                    {postingProductId === product._id ? (
                                                                        <>
                                                                            <span className="animate-spin">⏳</span>
                                                                            Posting...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <IconSend className="h-3 w-3" />
                                                                            Post
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

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
