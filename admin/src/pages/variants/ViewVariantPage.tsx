import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import axiosInstance from '@/services/axiosConfig'

interface Variant {
  _id: string
  sku: string
  product: string
  productName?: string
  size: string
  color: string | null
  price: number
  stock: number
  lowStockThreshold: number
  mainImage?: string
  hoverImage?: string
  images?: string[]
  createdAt: string
}

export default function ViewVariantPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [variant, setVariant] = useState<Variant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVariant()
  }, [id])

  const fetchVariant = async () => {
    try {
      setLoading(true)
      // Endpoint dùng SKU hoặc ID - lấy từ getAllVariants rồi tìm theo _id
      const response = await axiosInstance.get("/products/admin/variants?limit=1000")
      const allVariants = response.data.data || []
      const variantData = allVariants.find((v: any) => v._id === id)

      if (!variantData) {
        alert('Variant not found')
        navigate('/admin/variants')
        return
      }

      // Fetch product name
      if (variantData.product) {
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

  const stockBadge = getStockBadge(variant.stock, variant.lowStockThreshold)

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
            <Button onClick={() => navigate(`/admin/variants/edit/${variant._id}`)}>
              ✏️ Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Variant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product</label>
                <p className="text-lg font-semibold">{variant.productName || 'N/A'}</p>
              </div>

              {/* SKU */}
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

              {/* Size & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <p className="text-lg font-semibold">{variant.size}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Color</label>
                  <p className="text-lg font-semibold">{variant.color || 'N/A'}</p>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Price</label>
                <p className="text-2xl font-bold text-green-600">
                  {variant.price.toLocaleString()} VNĐ
                </p>
              </div>

              {/* Inventory */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                  <p className="text-lg font-semibold">{variant.stock} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant={stockBadge.variant as any} className="text-base py-1 px-3">
                    {stockBadge.label}
                  </Badge>
                </div>
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
          <Button onClick={() => navigate(`/admin/variants/edit/${variant._id}`)}>
            ✏️ Edit Variant
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/variants')}>
            ← Back to List
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
