import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { IconChevronLeft } from "@tabler/icons-react"
import { ProductForm, type ProductFormData } from "@/components/ProductForm"
import { useProducts } from "@/hooks/useProducts"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { updateProduct } = useProducts()

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        navigate('/admin/products')
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`http://localhost:5000/api/products/${id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setEditingProduct(data.data)
          } else {
            alert('Product not found')
            navigate('/admin/products')
          }
        } else {
          alert('Failed to load product')
          navigate('/admin/products')
        }
      } catch (error) {
        console.error('Error loading product:', error)
        alert('Error loading product')
        navigate('/admin/products')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id, navigate])

  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      if (!data.name || !data.description || !data.category) {
        alert('Please fill in: Name, Description, Category')
        return
      }

      const productData = {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        category: data.category,
        brand: data.brand,
        images: data.images.map(img => ({
          url: img.url,
          altText: img.altText,
          isMain: img.isMain,
        })),
        tags: data.tags,
        status: data.status,
        variants: data.variants.map(v => ({
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          comparePrice: v.comparePrice,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          images: v.images || [],
          weight: v.weight,
          dimensions: v.dimensions,
          barcode: v.barcode,
        })) as any,
        // SEO fields
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        urlSlug: data.urlSlug,
        focusKeyword: data.focusKeyword,
        relatedProducts: data.relatedProducts || [],
        upsellProducts: data.upsellProducts || [],
      } as any

      const result = await updateProduct(id!, productData)
      
      if (result) {
        alert('Product updated successfully!')
        navigate('/admin/products')
      } else {
        alert('Failed to update product')
      }
    } catch (error: any) {
      console.error('Error updating product:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error updating product'
      alert(`Error: ${errorMsg}`)
    }
  }

  const handleDraftProduct = async (data: ProductFormData) => {
    // For edit page, just save as published since it's an update
    await handleSaveProduct(data)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!editingProduct) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Product not found</p>
          <Button onClick={() => navigate('/admin/products')} className="mt-4">
            Back to Products
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/products')}
          className="mb-4"
        >
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <ProductForm
          initialData={editingProduct}
          onSave={handleSaveProduct}
          onDraft={handleDraftProduct}
        />
      </div>
    </AdminLayout>
  )
}
