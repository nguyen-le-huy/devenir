import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import VariantDrawer from '@/components/VariantDrawer'
import axiosInstance from '@/services/axiosConfig'

interface Variant {
  _id: string
  sku: string
  product: string
  productName?: string
  size: string
  color: string | null
  price: number
  quantity?: number
  stock?: number
  lowStockThreshold: number
  mainImage?: string
  hoverImage?: string
  images?: string[]
  createdAt: string
}

export default function ViewVariantPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [variant, setVariant] = useState<Variant | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    // Check if variant data was passed via navigation state (instant load!)
    const stateData = location.state?.variantData
    if (stateData && stateData._id === id) {
      setVariant(stateData)
      setLoading(false)
      return
    }
    
    // Otherwise fetch from cache or API
    fetchVariant()
  }, [id, location.state])

  const fetchVariant = async () => {
    try {
      setLoading(true)
      
      // Try to get from sessionStorage cache first
      const cachedVariants = sessionStorage.getItem('variants_cache')
      let allVariants: any[] = []
      
      if (cachedVariants) {
        try {
          const { data, timestamp } = JSON.parse(cachedVariants)
          // Cache valid for 3 minutes (shorter for variant detail page)
          if (Date.now() - timestamp < 3 * 60 * 1000) {
            allVariants = data
          }
        } catch (e) {}
      }
      
      // If no cache or expired, fetch from API
      if (allVariants.length === 0) {
        const response = await axiosInstance.get("/products/admin/variants?limit=500")
        allVariants = response.data.data || []
        sessionStorage.setItem('variants_cache', JSON.stringify({ 
          data: allVariants, 
          timestamp: Date.now() 
        }))
      }
      
      const variantData = allVariants.find((v: any) => v._id === id)

      if (!variantData) {
        alert('Variant not found')
        navigate('/admin/variants')
        return
      }

      // Fetch product name if needed
      if (variantData.product && !variantData.productName) {
        try {
          const prodRes = await axiosInstance.get(`/products/${variantData.product}`)
          variantData.productName = prodRes.data.data?.name || ''
        } catch (err) {
          console.error('Error fetching product:', err)
        }
      }

      setVariant(variantData)
    } catch (error) {
      console.error('Error fetching variant:', error)
      alert('Failed to load variant')
      navigate('/admin/variants')
    } finally {
      setLoading(false)
    }
  }

  const getStockBadge = (stock: number, threshold: number) => {
    if (stock === 0) return { variant: 'destructive', label: 'Out of Stock' }
    if (stock <= threshold) return { variant: 'secondary', label: 'Low Stock' }
    return { variant: 'default', label: 'In Stock' }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading variant details...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!variant) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Variant not found</p>
          <Button onClick={() => navigate('/admin/variants')} className="mt-4">
            Back to Variants
          </Button>
        </div>
      </AdminLayout>
    )
  }

  const stockBadge = getStockBadge(variant.quantity ?? variant.stock ?? 0, variant.lowStockThreshold)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">👁️ Variant Details</h1>
            <p className="text-muted-foreground">SKU: {variant.sku}</p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate('/admin/variants')}>
              ← Back
            </Button>
            <Button onClick={() => setDrawerOpen(true)}>
              ✏️ Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {variant.mainImage && (
                <div>
                  <p className="text-sm font-medium mb-2">Main Image</p>
                  <img
                    src={variant.mainImage}
                    alt="main"
                    className="w-full h-48 object-cover rounded border"
                  />
                </div>
              )}
              {variant.hoverImage && (
                <div>
                  <p className="text-sm font-medium mb-2">Hover Image</p>
                  <img
                    src={variant.hoverImage}
                    alt="hover"
                    className="w-full h-48 object-cover rounded border"
                  />
                </div>
              )}
              {variant.images && variant.images.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Gallery ({variant.images.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {variant.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`gallery-${idx}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Variant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Row 1: Product + Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product</label>
                  <p className="text-lg font-semibold">{variant.productName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantity Available</label>
                  <p className="text-lg font-semibold">{variant.quantity ?? variant.stock ?? 0} units</p>
                </div>
              </div>

              {/* Row 2: SKU */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-semibold">{variant.sku}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(variant.sku)
                      alert('SKU copied to clipboard')
                    }}
                  >
                    📋 Copy
                  </Button>
                </div>
              </div>

              {/* Row 3: Size & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <p className="text-lg font-semibold">{variant.size}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    {variant.color && (
                      <>
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: variant.color }}
                          title={variant.color}
                        />
                        <p className="text-lg font-semibold">{variant.color}</p>
                      </>
                    )}
                    {!variant.color && <p className="text-lg font-semibold">N/A</p>}
                  </div>
                </div>
              </div>

              {/* Row 4: Price + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <p className="text-2xl font-bold text-green-600">
                    ${variant.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={stockBadge.variant as any} className="text-base py-1 px-3">
                      {stockBadge.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Inventory Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Low Stock Threshold
                  </label>
                  <p className="text-sm">{variant.lowStockThreshold} units</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-sm text-muted-foreground">
                <p>Created: {new Date(variant.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => setDrawerOpen(true)}>
            ✏️ Edit Variant
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/variants')}>
            ← Back to List
          </Button>
        </div>

        {/* Edit Drawer */}
        {variant && (
          <VariantDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            variantId={variant._id}
            isEdit={true}
            onSuccess={() => {
              setDrawerOpen(false)
              // Refresh variant data
              fetchVariant()
            }}
          />
        )}
      </div>
    </AdminLayout>
  )
}
