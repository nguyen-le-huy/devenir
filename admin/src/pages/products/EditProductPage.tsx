import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { IconChevronLeft } from "@tabler/icons-react"
import ProductFormSimplified, { type ProductFormData } from "@/components/ProductFormSimplified"
import { useProducts } from "@/hooks/useProducts"
import { api } from "@/services/api"
import { toast } from "sonner"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { updateProduct } = useProducts()

  // Get preserved page from URL params
  const preservedPage = searchParams.get('page') || '1'

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        navigate(`/admin/products?page=${preservedPage}`)
        return
      }

      try {
        setLoading(true)
        const response = await api.get(`/products/${id}`)
        const data = response.data
        if (data.success) {
          setEditingProduct(data.data)
        } else {
          toast.error('Product not found')
          navigate(`/admin/products?page=${preservedPage}`)
        }
      } catch (error) {
        console.error('Error loading product:', error)
        toast.error('Error loading product')
        navigate(`/admin/products?page=${preservedPage}`)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id, navigate])

  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      if (!data.name || !data.description || !data.category || !data.brand) {
        toast.error('Please fill in: Name, Description, Category, Brand')
        return
      }

      const productData = {
        name: data.name,
        description: data.description,
        category: data.category,
        brand: data.brand,
        tags: data.tags,
        status: data.status,
        variants: data.variants.map(v => ({
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          quantity: v.quantity,
          mainImage: v.mainImage,
          hoverImage: v.hoverImage,
          images: v.images || [],
        })),
        // SEO fields
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        urlSlug: data.urlSlug,
      }

      const result = await updateProduct(id!, productData as any)

      if (result) {
        toast.success('Product updated successfully')
        navigate(`/admin/products?page=${preservedPage}`)
      } else {
        toast.error('Failed to update product')
      }
    } catch (error: any) {
      console.error('Error updating product:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error updating product'
      toast.error(errorMsg)
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
          <Button onClick={() => navigate(`/admin/products?page=${preservedPage}`)} className="mt-4">
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
          onClick={() => navigate(`/admin/products?page=${preservedPage}`)}
          className="mb-4"
        >
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <ProductFormSimplified
          initialData={editingProduct}
          onSave={handleSaveProduct}
          onDraft={handleDraftProduct}
        />
      </div>
    </AdminLayout>
  )
}
