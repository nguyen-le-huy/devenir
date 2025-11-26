import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
import axiosInstance from "@/services/axiosConfig"

interface Variant {
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

interface Color {
  _id: string
  name: string
  hex: string
  isActive: boolean
}

interface QuickStats {
  totalSkus: number
  inStock: number
  lowStock: number
  outOfStock: number
  inventoryValue: number
}

export default function VariantsPage() {
  const navigate = useNavigate()
  const [variants, setVariants] = useState<Variant[]>([])
  const [filteredVariants, setFilteredVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProduct, setFilterProduct] = useState("all")
  const [filterSize, setFilterSize] = useState("all")
  const [filterColor, setFilterColor] = useState("all")
  const [filterStockStatus, setFilterStockStatus] = useState("all")
  const [products, setProducts] = useState<any[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalSkus: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    inventoryValue: 0,
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | undefined>()

  useEffect(() => {
    fetchVariants()
    fetchProducts()
    fetchColors()
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

      // Fetch all products once
      let productsMap: { [key: string]: string } = {}
      try {
        const prodRes = await axiosInstance.get("/products?limit=1000")
        const productsList = prodRes.data.data || []
        productsList.forEach((p: any) => {
          productsMap[p._id] = p.name
        })
      } catch (err) {
        console.error("Error fetching products:", err)
      }

      // Enrich variants with product names
      const enrichedVariants = variantsList.map((v: any) => ({
        ...v,
        productName: productsMap[v.product] || '',
      }))

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

  const fetchColors = async () => {
    try {
      const response = await axiosInstance.get("/colors")
      setColors(response.data.data || [])
    } catch (error) {
      console.error("Error fetching colors:", error)
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

  const getColorDisplay = (colorName: string | null) => {
    if (!colorName) return '-'

    // Find color hex from database colors array
    const colorInfo = colors.find((c) => c.name === colorName)
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
  const colorOptions = colors.map((c) => c.name).sort()

  // Handle CSV Export
  const handleExportCSV = () => {
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
            v.price.toFixed(2),
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
  }

  // Handle CSV Import
  const handleImportCSV = () => {
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
              const colorObj = colors.find((c) => c.name === variant.color)
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
          fetchVariants()
        } catch (error) {
          console.error("Error reading CSV:", error)
          alert("Failed to import CSV")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // Handle Delete Variant
  const handleDeleteVariant = async (variantId: string) => {
    if (confirm("Are you sure you want to delete this variant? This action cannot be undone.")) {
      try {
        await axiosInstance.delete(`/products/admin/variants/${variantId}`)
        setVariants(variants.filter((v) => v._id !== variantId))
        setFilteredVariants(filteredVariants.filter((v) => v._id !== variantId))
        const updatedVariants = variants.filter((v) => v._id !== variantId)
        calculateStats(updatedVariants)
        alert("Variant deleted successfully")
      } catch (error) {
        console.error("Error deleting variant:", error)
        alert("Failed to delete variant")
      }
    }
  }

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
              <div className="text-2xl font-bold">{quickStats.inventoryValue.toLocaleString()} VNĐ</div>
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
              <Button variant="outline" onClick={handleImportCSV}>
                <IconFileImport className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <IconFileExport className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => {
                setEditingVariantId(undefined)
                setDrawerOpen(true)
              }}>
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
                    {colorOptions.map((colorName) => (
                      <SelectItem key={colorName} value={colorName}>
                        {colorName}
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
                      <TableHead>Image</TableHead>
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
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => navigate(`/admin/variants/view/${variant._id}`)}
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
        isEdit={!!editingVariantId}
        onClose={() => {
          setDrawerOpen(false)
          setEditingVariantId(undefined)
        }}
        onSuccess={() => {
          fetchVariants()
        }}
      />
    </AdminLayout>
  )
}
