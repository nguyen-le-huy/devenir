import React, { useState, useMemo, useCallback } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import axiosInstance from "@/services/axiosConfig"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import VariantDrawer from "@/components/VariantDrawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconPlus, IconSearch, IconFileImport, IconFileExport, IconEdit, IconTrash, IconEye } from "@tabler/icons-react"
import { useDebounce } from "@/hooks/useDebounce"
import { useVariantsQuery, useDeleteVariant } from "@/hooks/useVariantsQuery"
import { useProductsQuery } from "@/hooks/useProductsQuery"
import { useColorsQuery } from "@/hooks/useColorsQuery"

// Import types from hook files
type Variant = {
  _id: string
  sku: string
  product: string
  productName?: string
  size: string
  color: string | null
  colorId?: string
  price: number
  stock: number
  lowStockThreshold: number
  mainImage?: string
  hoverImage?: string
  images?: string[]
  createdAt: string
}

type Product = {
  _id: string
  name: string
  slug: string
  description?: string
  category: any
  brand?: any
  basePrice: number
  status: 'draft' | 'published' | 'archived'
  isActive: boolean
  images?: string[]
  createdAt: string
  updatedAt: string
}

interface Color {
  _id: string
  name: string
  hex: string
  isActive: boolean
}

export default function VariantsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProduct, setFilterProduct] = useState("all")
  const [filterSize, setFilterSize] = useState("all")
  const [filterColor, setFilterColor] = useState("all")
  const [filterStockStatus, setFilterStockStatus] = useState("all")

  // Initialize page from URL search params (preserves state on navigation)
  const initialPage = parseInt(searchParams.get('page') || '1', 10)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(10)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | undefined>()

  // Debounce search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Fetch data with React Query - STABLE CACHE KEY (no filters in query)
  // All filtering happens client-side to maintain cache stability
  const { data: variantsData, isLoading: variantsLoading } = useVariantsQuery({
    limit: 500, // Fetch all variants once
  })

  const { data: productsData } = useProductsQuery({ limit: 100 })
  const { data: colors = [] } = useColorsQuery()
  const deleteVariantMutation = useDeleteVariant()

  const variants: Variant[] = variantsData?.data || []
  const products: Product[] = productsData?.data || []
  const loading = variantsLoading

  // Memoize quick stats calculation
  const quickStats = useMemo(() => {
    let inStock = 0
    let lowStock = 0
    let outOfStock = 0
    let inventoryValue = 0

    variants.forEach((v: Variant) => {
      const stockQty = v.stock ?? 0

      if (stockQty === 0) {
        outOfStock++
      } else if (stockQty <= v.lowStockThreshold) {
        lowStock++
      } else {
        inStock++
      }
      inventoryValue += (v.price || 0) * stockQty
    })

    return {
      totalSkus: variants.length,
      inStock,
      lowStock,
      outOfStock,
      inventoryValue,
    }
  }, [variants])

  // Auto-open drawer if edit param exists (without resetting page)
  const editId = searchParams.get('edit')
  if (editId && !drawerOpen) {
    setEditingVariantId(editId)
    setDrawerOpen(true)
    // Don't navigate - preserve URL params including page
  }

  const getInventoryValueFontSize = () => {
    const value = quickStats.inventoryValue.toLocaleString('en-US', { maximumFractionDigits: 0 })
    const length = value.length

    if (length <= 10) return 'text-2xl'
    if (length <= 13) return 'text-xl'
    if (length <= 16) return 'text-lg'
    return 'text-base'
  }

  // Sync page to URL search params
  React.useEffect(() => {
    const currentPage = searchParams.get('page')
    if (currentPage !== page.toString()) {
      setSearchParams({ page: page.toString() }, { replace: true })
    }
  }, [page, searchParams, setSearchParams])

  // Reset page to 1 when filters change
  const prevFiltersRef = React.useRef({ debouncedSearchTerm, filterProduct, filterSize, filterColor, filterStockStatus })
  React.useEffect(() => {
    const prev = prevFiltersRef.current
    const hasFilterChanged =
      prev.debouncedSearchTerm !== debouncedSearchTerm ||
      prev.filterProduct !== filterProduct ||
      prev.filterSize !== filterSize ||
      prev.filterColor !== filterColor ||
      prev.filterStockStatus !== filterStockStatus

    if (hasFilterChanged) {
      setPage(1) // Only reset page when filters actually change
      prevFiltersRef.current = { debouncedSearchTerm, filterProduct, filterSize, filterColor, filterStockStatus }
    }
  }, [debouncedSearchTerm, filterProduct, filterSize, filterColor, filterStockStatus])

  // Handle direct URL navigation to edit variant
  React.useEffect(() => {
    const editMatch = location.pathname.match(/\/admin\/variants\/edit\/([a-fA-F0-9]+)/)
    if (editMatch && variants.length > 0) {
      const variantId = editMatch[1]
      const variant = variants.find((v) => v._id === variantId)
      if (variant) {
        setEditingVariantId(variantId)
        setDrawerOpen(true)
      } else {
        console.warn(`Variant with ID ${variantId} not found in cache`)
      }
    }
  }, [location.pathname, variants])

  // Memoize filtered variants to avoid recalculation on every render
  const filteredVariants = useMemo(() => {
    let filtered = [...variants]

    // Search filter
    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(
        (v: Variant) =>
          v.sku.toLowerCase().includes(term) ||
          (v.productName || "").toLowerCase().includes(term) ||
          (v.color || "").toLowerCase().includes(term) ||
          v.size.toLowerCase().includes(term)
      )
    }

    // Product filter
    if (filterProduct !== "all") {
      filtered = filtered.filter((v: Variant) => v.product === filterProduct)
    }

    // Size filter
    if (filterSize !== "all") {
      filtered = filtered.filter((v: Variant) => v.size === filterSize)
    }

    // Color filter
    if (filterColor !== "all") {
      filtered = filtered.filter((v: Variant) => v.color === filterColor)
    }

    // Stock status filter
    if (filterStockStatus !== "all") {
      filtered = filtered.filter((v: Variant) => {
        if (filterStockStatus === "inStock") return v.stock > v.lowStockThreshold
        if (filterStockStatus === "low") return v.stock > 0 && v.stock <= v.lowStockThreshold
        if (filterStockStatus === "out") return v.stock === 0
        return true
      })
    }

    return filtered
  }, [variants, debouncedSearchTerm, filterProduct, filterSize, filterColor, filterStockStatus])

  // Memoize paginated variants
  const paginatedVariants = useMemo(() => {
    return filteredVariants.slice((page - 1) * limit, page * limit)
  }, [filteredVariants, page, limit])

  // Memoize total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredVariants.length / limit)
  }, [filteredVariants.length, limit])

  const getColorDisplay = useCallback((colorName: string | null) => {
    if (!colorName) return '-'

    const colorInfo = colors.find((c: Color) => c.name === colorName)
    const hexCode = colorInfo?.hex || '#CCCCCC'

    return (
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded border border-gray-300"
          style={{ backgroundColor: hexCode }}
          title={`${colorName} (${hexCode})`}
        />
        <span className="text-sm">{colorName}</span>
      </div>
    )
  }, [colors])

  const getStockBadgeVariant = useCallback((stock: number, threshold: number) => {
    if (stock === 0) return "destructive"
    if (stock <= threshold) return "secondary"
    return "default"
  }, [])

  const getStockStatus = useCallback((stock: number, threshold: number) => {
    if (stock === 0) return "Out of Stock"
    if (stock <= threshold) return "Low Stock"
    return "In Stock"
  }, [])

  const getStockIcon = useCallback((stock: number, threshold: number) => {
    if (stock === 0) return "🔴"
    if (stock <= threshold) return "⚠️"
    return "✅"
  }, [])

  // Memoize unique sizes and colors
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))].sort(), [variants])
  const colorOptions = useMemo(() => colors.map((c: Color) => c.name).sort(), [colors])

  // Handle CSV Export
  const handleExportCSV = useCallback(() => {
    try {
      const headers = ["SKU", "Product Name", "Size", "Color", "Price", "Stock", "Status"]
      const csvContent = [
        headers.join(","),
        ...filteredVariants.map((v) =>
          [
            `"${v.sku}"`,
            `"${v.productName || ''}"`,
            `"${v.size}"`,
            `"${v.color || ''}"`,
            v.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            v.stock,
            getStockStatus(v.stock, v.lowStockThreshold),
          ].join(",")
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `variants_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      alert("CSV exported successfully!")
    } catch (error) {
      console.error("Error exporting CSV:", error)
      alert("Failed to export CSV")
    }
  }, [filteredVariants, getStockStatus])

  // Handle CSV Import
  const handleImportCSV = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event: any) => {
        try {
          const csv = event.target.result
          const lines = csv.split("\n").filter((line: string) => line.trim())
          const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())

          const requiredColumns = ["sku", "size", "color", "price", "stock"]
          const missingCols = requiredColumns.filter((col) => !headers.includes(col))

          if (missingCols.length > 0) {
            alert(`Missing required columns: ${missingCols.join(", ")}`)
            return
          }

          const importedVariants = lines.slice(1).map((line: string) => {
            const values = line.split(",").map((v: string) => v.trim().replace(/^"|"$/g, ""))
            const row: { [key: string]: any } = {}
            headers.forEach((header: string, index: number) => {
              row[header] = values[index]
            })
            return row
          })

          // Validate and create variants
          for (const variant of importedVariants) {
            try {
              const colorObj = colors.find((c: Color) => c.name === variant.color)
              await axiosInstance.post("/products/admin/variants", {
                sku: variant.sku,
                size: variant.size,
                colorId: colorObj?._id,
                price: parseFloat(variant.price),
                stock: parseInt(variant.stock),
              })
            } catch (error) {
              console.error("Error importing variant:", variant.sku, error)
            }
          }

          alert(`Imported ${importedVariants.length} variants successfully!`)
          // React Query will auto-refetch after mutation
        } catch (error) {
          console.error("Error reading CSV:", error)
          alert("Failed to import CSV")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [colors])

  // Handle Delete Variant with React Query mutation
  const handleDeleteVariant = async (variantId: string) => {
    if (confirm("Are you sure you want to delete this variant? This action cannot be undone.")) {
      try {
        await deleteVariantMutation.mutateAsync(variantId)
        alert("Variant deleted successfully")
      } catch (error) {
        console.error("Error deleting variant:", error)
        alert("Failed to delete variant")
      }
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🏷️ Product Variants / SKU Management</h1>
          <p className="text-muted-foreground">Manage your product variants and inventory</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total SKUs</div>
              <div className="text-2xl font-bold">{quickStats.totalSkus}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-green-600">✅ In Stock</div>
              <div className="text-2xl font-bold">{quickStats.inStock}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-yellow-600">⚠️ Low Stock</div>
              <div className="text-2xl font-bold">{quickStats.lowStock}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-red-600">🔴 Out of Stock</div>
              <div className="text-2xl font-bold">{quickStats.outOfStock}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Inventory Value</div>
              <div className={`${getInventoryValueFontSize()} font-bold`}>
                ${quickStats.inventoryValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters & Search</CardTitle>
              {/* Mobile Actions - Show on small screens */}
              <div className="sm:hidden flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportCSV}
                  title="Import CSV"
                >
                  <IconFileImport className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  title="Export CSV"
                >
                  <IconFileExport className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingVariantId(undefined)
                    setDrawerOpen(true)
                  }}
                >
                  <IconPlus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar + Desktop Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SKU, Product, Color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="hidden sm:flex gap-2">
                <Button variant="outline" size="sm" onClick={handleImportCSV}>
                  <IconFileImport className="mr-1 h-4 w-4" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <IconFileExport className="mr-1 h-4 w-4" />
                  Export
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingVariantId(undefined)
                    setDrawerOpen(true)
                  }}
                >
                  <IconPlus className="mr-1 h-4 w-4" />
                  Add Variant
                </Button>
              </div>
            </div>

            {/* Filters - Desktop: 5 cols, Mobile: Custom Layout */}
            {/* Desktop Layout (lg+) */}
            <div className="hidden lg:grid grid-cols-5 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Product</label>
                <Select value={filterProduct} onValueChange={setFilterProduct}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((p: Product) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Size</label>
                <Select value={filterSize} onValueChange={setFilterSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    {sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <Select value={filterColor} onValueChange={setFilterColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                    {colorOptions.map((colorName: string) => {
                      const colorInfo = colors.find((c: Color) => c.name === colorName)
                      const hexCode = colorInfo?.hex || '#CCCCCC'
                      return (
                        <SelectItem key={colorName} value={colorName}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: hexCode }}
                            />
                            <span>{colorName}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Stock Status</label>
                <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="inStock">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterProduct("all")
                    setFilterSize("all")
                    setFilterColor("all")
                    setFilterStockStatus("all")
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Tablet/Mobile Layout */}
            <div className="lg:hidden space-y-3">
              {/* Row 2: Product (full width) */}
              <div>
                <label className="text-sm font-medium mb-2 block">Product</label>
                <Select value={filterProduct} onValueChange={setFilterProduct}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((p: Product) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3: Size + Color */}
              <div className="grid grid-cols-2 gap-3 overflow-x-auto">
                <div className="min-w-max">
                  <label className="text-sm font-medium mb-2 block">Size</label>
                  <Select value={filterSize} onValueChange={setFilterSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      {sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Color</label>
                  <Select value={filterColor} onValueChange={setFilterColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Colors</SelectItem>
                      {colorOptions.map((colorName: string) => {
                        const colorInfo = colors.find((c: Color) => c.name === colorName)
                        const hexCode = colorInfo?.hex || '#CCCCCC'
                        return (
                          <SelectItem key={colorName} value={colorName}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: hexCode }}
                              />
                              <span>{colorName}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Stock Status + Reset */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Stock</label>
                  <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="inStock">In Stock</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="out">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => {
                      setSearchTerm("")
                      setFilterProduct("all")
                      setFilterSize("all")
                      setFilterColor("all")
                      setFilterStockStatus("all")
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants Table */}
        <Card>
          <CardHeader>
            <CardTitle>SKU Management Table</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading variants...</p>
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No variants found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input type="checkbox" />
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVariants.map((variant) => (
                      <TableRow key={variant._id}>
                        <TableCell>
                          <input type="checkbox" />
                        </TableCell>
                        <TableCell className="font-mono font-semibold">{variant.sku}</TableCell>
                        <TableCell>{variant.productName || "-"}</TableCell>
                        <TableCell className="text-right font-semibold">{variant.stock ?? 0}</TableCell>
                        <TableCell>{variant.size}</TableCell>
                        <TableCell>{getColorDisplay(variant.color)}</TableCell>
                        <TableCell>
                          {variant.mainImage ? (
                            <img
                              src={variant.mainImage}
                              alt="variant"
                              className="h-12 w-12 object-cover rounded border"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              No image
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">${variant.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right">
                          <span>
                            {getStockIcon(variant.stock, variant.lowStockThreshold)} {variant.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStockBadgeVariant(
                              variant.stock,
                              variant.lowStockThreshold
                            )}
                          >
                            {getStockStatus(
                              variant.stock,
                              variant.lowStockThreshold
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/admin/variants/view/${variant._id}?page=${page}`, {
                              state: { variantData: variant }
                            })}
                            title="View Details"
                          >
                            <IconEye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingVariantId(variant._id)
                              setDrawerOpen(true)
                            }}
                            title="Edit Variant"
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleDeleteVariant(variant._id)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1}-{Math.min(page * limit, filteredVariants.length)} of{" "}
                    {filteredVariants.length} SKUs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Variant Drawer */}
      <VariantDrawer
        isOpen={drawerOpen}
        variantId={editingVariantId}
        variantData={editingVariantId ? variants.find((v: Variant) => v._id === editingVariantId) : undefined}
        isEdit={!!editingVariantId}
        onClose={() => {
          setDrawerOpen(false)
          setEditingVariantId(undefined)
          // Navigate back to list with preserved page
          navigate(`/admin/variants?page=${page}`)
        }}
        onSuccess={() => {
          // React Query will auto-refetch after mutation
          setDrawerOpen(false)
          setEditingVariantId(undefined)
          // Navigate back to list with preserved page
          navigate(`/admin/variants?page=${page}`)
        }}
      />
    </AdminLayout>
  )
}
