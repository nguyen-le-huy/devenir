import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEdit, IconTrash } from "@tabler/icons-react"
import { COLOR_CODES } from "@/utils/skuGenerator"

export interface Variant {
  id?: string
  sku: string
  size: string
  color?: string | null
  price: number
  comparePrice?: number
  stock: number
  lowStockThreshold: number
  images: string[]
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  barcode?: string
}

interface VariantsMatrixProps {
  variants: Variant[]
  onVariantEdit?: (variant: Variant) => void
  onVariantDelete?: (sku: string) => void
  onVariantAdd?: () => void
  onBulkAction?: (selectedSkus: string[], action: string, data?: any) => void
  customColors?: Record<string, { name: string; hex: string }>
}

export function VariantsMatrix({
  variants,
  onVariantEdit,
  onVariantDelete,
  onBulkAction,
  customColors = {},
}: VariantsMatrixProps) {
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set())
  const [filterSize, setFilterSize] = useState<string>("all")
  const [filterColor, setFilterColor] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Get unique sizes and colors
  const sizes = Array.from(new Set(variants.map((v) => v.size)))
  const colors = Array.from(new Set(variants.map((v) => v.color).filter((c) => c !== null && c !== undefined)))

  // Filter variants
  const filteredVariants = variants.filter((v) => {
    const matchesSize = filterSize === "all" || v.size === filterSize
    const variantColor = v.color === null || v.color === undefined ? "null" : v.color
    const matchesColor = filterColor === "all" || variantColor === filterColor
    const matchesSearch =
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.size.includes(searchTerm) ||
      (v.color && v.color.includes(searchTerm))

    return matchesSize && matchesColor && matchesSearch
  })

  // Toggle variant selection
  const toggleVariantSelection = (sku: string) => {
    const newSelected = new Set(selectedVariants)
    if (newSelected.has(sku)) {
      newSelected.delete(sku)
    } else {
      newSelected.add(sku)
    }
    setSelectedVariants(newSelected)
  }

  // Toggle all variants
  const toggleAllVariants = () => {
    if (selectedVariants.size === filteredVariants.length) {
      setSelectedVariants(new Set())
    } else {
      setSelectedVariants(new Set(filteredVariants.map((v) => v.sku)))
    }
  }

  // Stock status helper
  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { label: "Out", color: "bg-red-500" }
    if (stock < threshold) return { label: "Low", color: "bg-yellow-500" }
    return { label: "In", color: "bg-green-500" }
  }

  // Calculate totals
  const totalStock = filteredVariants.reduce((sum, v) => sum + v.stock, 0)
  const totalValue = filteredVariants.reduce((sum, v) => sum + v.price * v.stock, 0)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search SKU</label>
              <Input
                placeholder="Search SKU, size, color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Filter by Size</label>
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
              <label className="text-sm font-medium">Filter by Color</label>
              <Select value={filterColor} onValueChange={setFilterColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {/* Show "None" option if there are size-only variants */}
                  {variants.some((v) => v.color === null || v.color === undefined) && (
                    <SelectItem value="null">None (Size Only)</SelectItem>
                  )}
                  {colors.map((color) => {
                    const colorFromCodes = COLOR_CODES[color as keyof typeof COLOR_CODES]
                    const colorFromCustom = customColors[color]
                    const finalColor = colorFromCodes || colorFromCustom
                    return (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          {finalColor && (
                            <div
                              className="w-3 h-3 rounded border"
                              style={{
                                backgroundColor: finalColor.hex,
                              }}
                            />
                          )}
                          {finalColor?.name || color}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Variants</p>
            <p className="text-2xl font-bold">{filteredVariants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Stock</p>
            <p className="text-2xl font-bold">{totalStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">{(totalValue / 1000000).toFixed(1)}M VNĐ</p>
          </CardContent>
        </Card>
      </div>

      {/* Variants Matrix Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Variants Matrix</CardTitle>
              <CardDescription>{filteredVariants.length} variants</CardDescription>
            </div>
            {selectedVariants.size > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedVariants.size} selected
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVariants(new Set())}
                  className="ml-2"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-3 w-12">
                    <Checkbox
                      checked={selectedVariants.size === filteredVariants.length && filteredVariants.length > 0}
                      onCheckedChange={() => toggleAllVariants()}
                    />
                  </th>
                  <th className="text-left py-3 px-3">Preview</th>
                  <th className="text-left py-3 px-3 font-mono text-xs">SKU</th>
                  <th className="text-left py-3 px-3">Size</th>
                  <th className="text-left py-3 px-3">Color</th>
                  <th className="text-right py-3 px-3">Price</th>
                  <th className="text-right py-3 px-3">Stock</th>
                  <th className="text-center py-3 px-3">Images</th>
                  <th className="text-center py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      No variants found
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map((variant) => {
                    const stockStatus = getStockStatus(variant.stock, variant.lowStockThreshold)

                    return (
                      <tr
                        key={variant.sku}
                        className={`border-b hover:bg-muted/50 transition ${
                          selectedVariants.has(variant.sku) ? "bg-muted/70" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <Checkbox
                            checked={selectedVariants.has(variant.sku)}
                            onCheckedChange={() => toggleVariantSelection(variant.sku)}
                          />
                        </td>
                        <td className="py-3 px-3">
                          {variant.images.length > 0 ? (
                            <div className="w-10 h-10 rounded overflow-hidden">
                              <img
                                src={variant.images[0]}
                                alt={variant.sku}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              📎
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs font-semibold">{variant.sku}</td>
                        <td className="py-3 px-3 font-medium">{variant.size}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {(() => {
                              // Handle null colors
                              if (variant.color === null || variant.color === undefined) {
                                return (
                                  <>
                                    <div className="w-4 h-4 rounded border border-gray-300 bg-gray-200" />
                                    <span className="text-sm text-muted-foreground">None</span>
                                  </>
                                )
                              }
                              
                              const colorFromCodes = COLOR_CODES[variant.color as keyof typeof COLOR_CODES]
                              const colorFromCustom = customColors[variant.color]
                              const finalColor = colorFromCodes || colorFromCustom
                              
                              return (
                                <>
                                  {finalColor && (
                                    <div
                                      className="w-4 h-4 rounded border border-gray-300"
                                      style={{ backgroundColor: finalColor.hex }}
                                      title={finalColor.name}
                                    />
                                  )}
                                  <span className="text-sm">{finalColor?.name || variant.color}</span>
                                </>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold">
                          {variant.price.toLocaleString()} VNĐ
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold">{variant.stock}</span>
                            <span
                              className={`${stockStatus.color} text-white text-xs font-bold px-2 py-1 rounded`}
                            >
                              {stockStatus.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-xs text-muted-foreground">
                            {variant.images.length} 📎
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onVariantEdit?.(variant)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onVariantDelete?.(variant.sku)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedVariants.size > 0 && (
            <div className="mt-6 pt-4 border-t flex gap-2">
              <Button
                size="sm"
                onClick={() => onBulkAction?.(Array.from(selectedVariants), "setPrices")}
              >
                Set Prices
              </Button>
              <Button
                size="sm"
                onClick={() => onBulkAction?.(Array.from(selectedVariants), "updateStock")}
              >
                Update Stock
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction?.(Array.from(selectedVariants), "export")}
              >
                Export
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
