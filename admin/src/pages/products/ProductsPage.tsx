import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axiosInstance from "@/services/axiosConfig"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconPlus, IconChevronLeft, IconEdit, IconTrash } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ProductFormSimplified, { type ProductFormData } from "@/components/ProductFormSimplified"
import { useProducts } from "@/hooks/useProducts"

export default function ProductsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [variantsMap, setVariantsMap] = useState<{ [key: string]: any[] }>({})
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts()

  useEffect(() => {
    // Auto-open form if URL is /new
    if (location.pathname === '/admin/products/new') {
      setIsFormOpen(true)
      setEditingProduct(null)
    }
    loadProducts()
  }, [location.pathname])

  useEffect(() => {
    // Fetch variants when products change
    if (products.length > 0) {
      fetchVariantsForProducts()
    }
  }, [products])

  const loadProducts = async () => {
    try {
      await fetchProducts(1, 50)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const fetchVariantsForProducts = async () => {
    try {
      const variantDataMap: { [key: string]: any[] } = {}

      for (const product of products) {
        try {
          const response = await axiosInstance.get(`/products/${product._id}/variants`)
          const variants = response.data.data || []
          variantDataMap[product._id] = variants
        } catch (error) {
          console.error(`Error fetching variants for product ${product._id}:`, error)
          variantDataMap[product._id] = []
        }
      }

      setVariantsMap(variantDataMap)
    } catch (error) {
      console.error('Error fetching variants:', error)
    }
  }

  const getVariantCount = (productId: string) => {
    return (variantsMap[productId] || []).length
  }

  const getTotalStock = (productId: string) => {
    const variants = variantsMap[productId] || []
    return variants.reduce((total: number, variant: any) => total + (variant.quantity || 0), 0)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  const handleEditProduct = (product: any) => {
    navigate(`/admin/products/edit/${product._id}`)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingProduct(null)
  }

  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      if (!data.name || !data.description || !data.category) {
        alert('Please fill in: Name, Description, Category')
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
        // SEO fields (optional)
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        urlSlug: data.urlSlug,
      }

      let result
      if (editingProduct) {
        // Update mode
        result = await updateProduct(editingProduct._id, productData as any)
      } else {
        // Create mode
        result = await createProduct(productData as any)
      }

      if (result) {
        handleCloseForm()
        await loadProducts()
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!')
      } else {
        alert('Failed to save product')
      }
    } catch (error: any) {
      console.error('Error saving product:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error saving product'
      alert(`Error: ${errorMsg}`)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete this product? This action cannot be undone.'
    )
    if (!confirmed) return

    setDeletingProductId(productId)
    try {
      const result = await deleteProduct(productId)
      if (result) {
        setDeletingProductId(null)
        alert('✅ Product deleted successfully!')
        await loadProducts()
      } else {
        alert('❌ Failed to delete product')
        setDeletingProductId(null)
      }
    } catch (error: any) {
      console.error('Error deleting product:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error deleting product'
      alert(`❌ Error: ${errorMsg}`)
      setDeletingProductId(null)
    }
  }

  const handleDraftProduct = async (data: ProductFormData) => {
    try {
      if (!data.name || !data.description || !data.category) {
        alert('Please fill in: Name, Description, Category')
        return
      }

      const result = await createProduct({
        name: data.name,
        description: data.description,
        category: data.category,
        brand: data.brand,
        tags: data.tags,
        status: 'draft',
        variants: data.variants,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        urlSlug: data.urlSlug,
      } as any)

      if (result) {
        setIsFormOpen(false)
        await loadProducts()
        alert('Product saved as draft!')
      } else {
        alert('Failed to save draft')
      }
    } catch (error: any) {
      console.error('Error saving draft:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error saving draft'
      alert(`Error: ${errorMsg}`)
    }
  }

  if (isFormOpen) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={handleCloseForm}
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Button onClick={handleAddProduct}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>Product List ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No products yet</p>
                <Button onClick={handleAddProduct}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create First Product
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Variants</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>${product.basePrice?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === 'published'
                                ? 'default'
                                : product.status === 'draft'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getVariantCount(product._id)} variants</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTotalStock(product._id) > 0 ? "default" : "destructive"}>
                            {getTotalStock(product._id)} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(product.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProduct(product)}
                            disabled={deletingProductId === product._id}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product._id)}
                            disabled={deletingProductId === product._id}
                          >
                            {deletingProductId === product._id ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Deleting...
                              </>
                            ) : (
                              <IconTrash className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
