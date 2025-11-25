import { useState, useEffect } from "react"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { COLOR_CODES } from "@/utils/skuGenerator"
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
import axiosInstance from "@/services/axiosConfig"

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
  createdAt: string
}

interface QuickStats {
  totalSkus: number
  inStock: number
  lowStock: number
  outOfStock: number
  inventoryValue: number
}

export default function VariantsPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [filteredVariants, setFilteredVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProduct, setFilterProduct] = useState("all")
  const [filterSize, setFilterSize] = useState("all")
  const [filterColor, setFilterColor] = useState("all")
  const [filterStockStatus, setFilterStockStatus] = useState("all")
  const [products, setProducts] = useState<any[]>([])
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalSkus: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    inventoryValue: 0,
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  useEffect(() => {
    fetchVariants()
    fetchProducts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filterProduct, filterSize, filterColor, filterStockStatus, variants])

  const fetchVariants = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get("/products/admin/variants?limit=1000")
      console.log("Variants response:", response.data)
      const variantsList = response.data.data || []

      // Enrich variants with product names if not already included
      const enrichedVariants = await Promise.all(
        variantsList.map(async (v: any) => {
          if (!v.productName && v.product) {
            try {
              const prodRes = await axiosInstance.get(`/products/${v.product}`)
              return { ...v, productName: prodRes.data.data?.name || '' }
            } catch {
              return v
            }
          }
          return v
        })
      )

      console.log("Enriched variants:", enrichedVariants)
      setVariants(enrichedVariants)
      calculateStats(enrichedVariants)
    } catch (error) {
      console.error("Error fetching variants:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get("/products?limit=1000")
      setProducts(response.data.data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const calculateStats = (variantsList: Variant[]) => {
    let inStock = 0
    let lowStock = 0
    let outOfStock = 0
    let inventoryValue = 0

    variantsList.forEach((v) => {
      if (v.stock === 0) {
        outOfStock++
      } else if (v.stock <= v.lowStockThreshold) {
        lowStock++
      } else {
        inStock++
      }
      inventoryValue += v.price * v.stock
    })

    setQuickStats({
      totalSkus: variantsList.length,
      inStock,
      lowStock,
      outOfStock,
      inventoryValue,
    })
  }

  const applyFilters = () => {
    let filtered = [...variants]

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.sku.toLowerCase().includes(term) ||
          (v.productName || "").toLowerCase().includes(term) ||
          (v.color || "").toLowerCase().includes(term) ||
          v.size.toLowerCase().includes(term)
      )
    }

    // Product filter
    if (filterProduct !== "all") {
      filtered = filtered.filter((v) => v.product === filterProduct)
    }

    // Size filter
    if (filterSize !== "all") {
      filtered = filtered.filter((v) => v.size === filterSize)
    }

    // Color filter
    if (filterColor !== "all") {
      filtered = filtered.filter((v) => v.color === filterColor)
    }

    // Stock status filter
    if (filterStockStatus !== "all") {
      filtered = filtered.filter((v) => {
        if (filterStockStatus === "inStock") return v.stock > v.lowStockThreshold
        if (filterStockStatus === "low") return v.stock > 0 && v.stock <= v.lowStockThreshold
        if (filterStockStatus === "out") return v.stock === 0
        return true
      })
    }

    setFilteredVariants(filtered)
  }

  const colorMap: { [key: string]: string } = {
    'Trắng': '#FFFFFF',
    'Đen': '#000000',
    'Navy': '#000080',
    'Xám': '#808080',
    'Đỏ': '#FF0000',
    'Xanh': '#0000FF',
    'Xanh Lá': '#00FF00',
    'Vàng': '#FFFF00',
    'Cam': '#FFA500',
    'Tím': '#800080',
    'Hồng': '#FFC0CB',
    'Nâu': '#A52A2A',
    'Beige': '#F5F5DC',
    'Kem': '#FFFDD0',
    'Gray': '#808080',
    'White': '#FFFFFF',
    'Black': '#000000',
  }

  const getColorDisplay = (colorName: string | null) => {
    if (!colorName) return '-'

    // Try to find in COLOR_CODES first (by checking values)
    let colorInfo = null
    for (const code of Object.values(COLOR_CODES)) {
      if (code.name === colorName) {
        colorInfo = code
        break
      }
    }

    // If not found, check if it's a hex string
    if (!colorInfo && colorName.startsWith('#')) {
      colorInfo = { name: colorName, hex: colorName }
    }

    // Fallback to colorMap if not found in COLOR_CODES
    const hexCode = colorInfo?.hex || colorMap[colorName] || '#CCCCCC'

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
  }

  const getStockBadgeVariant = (stock: number, threshold: number) => {
    if (stock === 0) return "destructive"
    if (stock <= threshold) return "secondary"
    return "default"
  }

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return "Out of Stock"
    if (stock <= threshold) return "Low Stock"
    return "In Stock"
  }

  const getStockIcon = (stock: number, threshold: number) => {
    if (stock === 0) return "🔴"
    if (stock <= threshold) return "⚠️"
    return "✅"
  }

  const sizes = [...new Set(variants.map((v) => v.size))].sort()
  const colors = [...new Set(variants.map((v) => v.color).filter((c) => c !== null))].sort() as string[]

  const paginatedVariants = filteredVariants.slice(
    (page - 1) * limit,
    page * limit
  )
  const totalPages = Math.ceil(filteredVariants.length / limit)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🏷️ Product Variants / SKU Management</h1>
          <p className="text-muted-foreground">Manage your product variants and inventory</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4">
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
              <div className="text-2xl font-bold">${quickStats.inventoryValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SKU, Product, Color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <IconFileImport className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button variant="outline">
                <IconFileExport className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Product</label>
                <Select value={filterProduct} onValueChange={setFilterProduct}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Size</label>
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
                <label className="text-sm font-medium mb-1 block">Color</label>
                <Select value={filterColor} onValueChange={setFilterColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                    {colors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Stock Status</label>
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

              <div>
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
                  Reset Filters
                </Button>
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
                      <TableHead className="w-12">
                        <input type="checkbox" />
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
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
                        <TableCell>{variant.size}</TableCell>
                        <TableCell>{getColorDisplay(variant.color)}</TableCell>
                        <TableCell className="text-right">${variant.price.toFixed(2)}</TableCell>
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
                          <Button size="sm" variant="ghost">
                            <IconEye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600">
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
    </AdminLayout>
  )
}
