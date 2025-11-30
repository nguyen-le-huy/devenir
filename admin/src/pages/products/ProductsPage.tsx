import { useState, useEffect, useMemo, useCallback } from "react"
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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
import { useProductsQuery, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProductsQuery"
import { useVariantsQuery } from "@/hooks/useVariantsQuery"
import { useCategoriesQuery } from "@/hooks/useCategoriesQuery"
import { useBrandsQuery, useBrandsRealtimeSync } from "@/hooks/useBrandsQuery"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from 'sonner'
import type { Brand } from "@/services/brandService"

export default function ProductsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  // Initialize page from URL search params (preserves state on navigation)
  const initialPage = parseInt(searchParams.get('page') || '1', 10)
  const [page, setPage] = useState(initialPage)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Fetch data with React Query - PERSISTENT CACHE!
  const { data: productsData, isLoading: productsLoading } = useProductsQuery({ limit: 100 })
  const { data: variantsData } = useVariantsQuery({ limit: 500 })
  const { data: categories = [] } = useCategoriesQuery()
  const brandQueryParams = useMemo(() => ({ limit: 500 }), [])
  const { data: brandsResponse } = useBrandsQuery(brandQueryParams)
  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  const deleteProductMutation = useDeleteProduct()
  useBrandsRealtimeSync()

  const products = productsData?.data || []
  const allVariants = variantsData?.data || []
  const brandsById = useMemo(() => {
    const map = new Map<string, Brand>()
    ;(brandsResponse?.data || []).forEach((brand: Brand) => {
      map.set(brand._id, brand)
    })
    return map
  }, [brandsResponse])
  const loading = productsLoading

  // Group variants by product_id for easy lookup
  const variantsMap = useMemo(() => {
    const map: { [key: string]: any[] } = {}
    allVariants.forEach((variant: any) => {
      const productId = variant.product_id || variant.product
      if (!map[productId]) {
        map[productId] = []
      }
      map[productId].push(variant)
    })
    return map
  }, [allVariants])

  // Sync page to URL search params
  useEffect(() => {
    const currentPage = searchParams.get('page')
    if (currentPage !== page.toString()) {
      setSearchParams({ page: page.toString() }, { replace: true })
    }
  }, [page, searchParams, setSearchParams])

  useEffect(() => {
    // Auto-open form if URL is /new
    if (location.pathname === '/admin/products/new') {
      setIsFormOpen(true)
      setEditingProduct(null)
      return
    }

    // Handle edit URL: /admin/products/edit/:id
    const editMatch = location.pathname.match(/\/admin\/products\/edit\/([a-fA-F0-9]+)/)
    if (editMatch && products.length > 0) {
      const productId = editMatch[1]
      const product = products.find((p) => p._id === productId)
      if (product) {
        setEditingProduct(product)
        setIsFormOpen(true)
      } else {
        console.warn(`Product with ID ${productId} not found in cache`)
      }
    }
  }, [location.pathname, products])

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
        (product.description || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
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
    // Set product from cache immediately - no loading!
    setEditingProduct(product)
    setIsFormOpen(true)
    // Preserve current page in URL when navigating to edit
    navigate(`/admin/products/edit/${product._id}?page=${page}`)
  }, [navigate, page])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingProduct(null)
    // Navigate back to list with preserved page
    navigate(`/admin/products?page=${page}`)
  }, [navigate, page])

  const handleSaveProduct = useCallback(async (data: ProductFormData) => {
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
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        urlSlug: data.urlSlug,
      }

      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct._id, data: productData as any })
        toast.success('Product updated successfully')
      } else {
        await createProductMutation.mutateAsync(productData as any)
        toast.success('Product created successfully')
      }
      
      handleCloseForm()
    } catch (error: any) {
      console.error('Error saving product:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error saving product'
      toast.error(errorMsg)
    }
  }, [editingProduct, updateProductMutation, createProductMutation, handleCloseForm])

  const handleDeleteProduct = useCallback(async (productId: string) => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete this product? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      await deleteProductMutation.mutateAsync(productId)
      toast.success('Product deleted successfully')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error deleting product'
      toast.error(errorMsg)
    }
  }, [deleteProductMutation])

  const handleDraftProduct = useCallback(async (data: ProductFormData) => {
    try {
      if (!data.name || !data.description || !data.category || !data.brand) {
        toast.error('Please fill in: Name, Description, Category, Brand')
        return
      }

      await createProductMutation.mutateAsync({
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

      setIsFormOpen(false)
      toast.success('Product saved as draft')
    } catch (error: any) {
      console.error('Error saving draft:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error saving draft'
      toast.error(errorMsg)
    }
  }, [createProductMutation])

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
                    {categories.map((cat: any) => (
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
                              if (typeof product.category === 'object' && product.category) {
                                return product.category.name || '—'
                              } else if (typeof product.category === 'string') {
                                const cat = categories.find((c: any) => c._id === product.category)
                                return cat?.name || product.category
                              }
                              return '—'
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              if (!product.brand) return '—'
                              if (typeof product.brand === 'object') {
                                return product.brand?.name || '—'
                              }
                              return brandsById.get(product.brand)?.name || '—'
                            })()}
                          </TableCell>
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
                              disabled={deleteProductMutation.isPending}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProduct(product._id)}
                              disabled={deleteProductMutation.isPending}
                            >
                              {deleteProductMutation.isPending ? (
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
