import { useState, useEffect, useMemo, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axiosInstance from "@/services/axiosConfig"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus, IconChevronLeft, IconEdit, IconTrash, IconX } from "@tabler/icons-react"
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
import { useDebounce } from "@/hooks/useDebounce"
import { apiCache } from "@/utils/performance"

export default function ProductsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [variantsMap, setVariantsMap] = useState<{ [key: string]: any[] }>({})
  const [page, setPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState<any[]>([])
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts()

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    // Auto-open form if URL is /new
    if (location.pathname === '/admin/products/new') {
      setIsFormOpen(true)
      setEditingProduct(null)
    }
    loadProducts()
    loadCategories()
  }, [location.pathname])

  const loadCategories = useCallback(async () => {
    // Check cache first
    const cached = apiCache.get<any[]>('categories')
    if (cached) {
      setCategories(cached)
      return
    }

    try {
      const response = await axiosInstance.get('/categories?limit=100&isActive=true')
      const categoriesData = response.data?.data || response.data || []
      setCategories(categoriesData)
      apiCache.set('categories', categoriesData)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [])

  // Optimize: Only fetch variants when products change AND not already loaded
  useEffect(() => {
    if (products.length > 0 && Object.keys(variantsMap).length === 0) {
      fetchVariantsForProducts()
    }
  }, [products])

  const loadProducts = useCallback(async () => {
    try {
      await fetchProducts(1, 100) // Reduced from loading all variants individually
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }, [fetchProducts])

  // OPTIMIZED: Batch fetch variants in single request instead of N+1 queries
  const fetchVariantsForProducts = useCallback(async () => {
    if (products.length === 0) return

    try {
      // Instead of fetching variants per product, fetch ALL variants once
      const response = await axiosInstance.get('/products/admin/variants?limit=500')
      const allVariants = response.data.data || []

      // Group variants by product_id
      const variantDataMap: { [key: string]: any[] } = {}
      
      allVariants.forEach((variant: any) => {
        const productId = variant.product_id || variant.product
        if (!variantDataMap[productId]) {
          variantDataMap[productId] = []
        }
        variantDataMap[productId].push(variant)
      })

      setVariantsMap(variantDataMap)
    } catch (error) {
      console.error('Error fetching variants:', error)
    }
  }, [products])

  const getVariantCount = useCallback((productId: string) => {
    return (variantsMap[productId] || []).length
  }, [variantsMap])

  const getTotalStock = useCallback((productId: string) => {
    const variants = variantsMap[productId] || []
    return variants.reduce((total: number, variant: any) => total + (variant.quantity || variant.stock || 0), 0)
  }, [variantsMap])

  // Memoize filtered products to avoid recalculating on every render
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter
      const categoryId = typeof product.category === 'object' ? product.category?._id : product.category
      const matchesCategory = categoryFilter === 'all' || categoryId === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [products, debouncedSearchTerm, statusFilter, categoryFilter])

  // Memoize paginated products
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  }, [filteredProducts, page, itemsPerPage])

  // Memoize total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / itemsPerPage)
  }, [filteredProducts.length, itemsPerPage])

  const handleAddProduct = useCallback(() => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }, [])

  const handleEditProduct = useCallback((product: any) => {
    navigate(`/admin/products/edit/${product._id}`)
  }, [navigate])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingProduct(null)
  }, [])

  const handleSaveProduct = useCallback(async (data: ProductFormData) => {
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
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        urlSlug: data.urlSlug,
      }

      let result
      if (editingProduct) {
        result = await updateProduct(editingProduct._id, productData as any)
      } else {
        result = await createProduct(productData as any)
      }

      if (result) {
        handleCloseForm()
        // Clear cache to force refresh
        apiCache.clear('products')
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
  }, [editingProduct, updateProduct, createProduct, handleCloseForm, loadProducts])

  const handleDeleteProduct = useCallback(async (productId: string) => {
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
        // Clear cache to force refresh
        apiCache.clear('products')
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
  }, [deleteProduct, loadProducts])

  const handleDraftProduct = useCallback(async (data: ProductFormData) => {
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
        // Clear cache to force refresh
        apiCache.clear('products')
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
  }, [createProduct, loadProducts])

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

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="search">Search Products</Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setPage(1)
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setPage(1)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <IconX className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: any) => {
                    setStatusFilter(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <>
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
                      {paginatedProducts.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            {(() => {
                              // Handle both populated object and string ID
                              if (typeof product.category === 'object' && product.category) {
                                return product.category.name || '—'
                              } else if (typeof product.category === 'string') {
                                // Find category name from categories state
                                const cat = categories.find(c => c._id === product.category)
                                return cat?.name || product.category
                              }
                              return '—'
                            })()}
                          </TableCell>
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredProducts.length)} of{" "}
                      {filteredProducts.length} products
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                      >
                        ← Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                          // Show first, last, and pages around current
                          let pageNum: number
                          if (totalPages <= 5) {
                            pageNum = idx + 1
                          } else if (page <= 3) {
                            pageNum = idx + 1
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + idx
                          } else {
                            pageNum = page - 2 + idx
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="w-8"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
