/**
 * Variant Filters Component
 * Search bar and filter controls for variant table
 */
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IconSearch, IconPlus, IconFileImport, IconFileExport } from '@tabler/icons-react'
import type { Product, Color } from './types'
import { getColorHex } from './utils'

interface VariantFiltersProps {
  // Search state
  searchTerm: string
  onSearchChange: (value: string) => void

  // Filter states
  filterProduct: string
  filterSize: string
  filterColor: string
  filterStockStatus: string
  onFilterProductChange: (value: string) => void
  onFilterSizeChange: (value: string) => void
  onFilterColorChange: (value: string) => void
  onFilterStockStatusChange: (value: string) => void
  onResetFilters: () => void

  // Options
  products: Product[]
  sizes: string[]
  colors: Color[]

  // Actions
  onAddVariant: () => void
  onImportCSV: () => void
  onExportCSV: () => void
}

export function VariantFilters({
  searchTerm,
  onSearchChange,
  filterProduct,
  filterSize,
  filterColor,
  filterStockStatus,
  onFilterProductChange,
  onFilterSizeChange,
  onFilterColorChange,
  onFilterStockStatusChange,
  onResetFilters,
  products,
  sizes,
  colors,
  onAddVariant,
  onImportCSV,
  onExportCSV,
}: VariantFiltersProps) {
  const colorOptions = colors.map((c) => c.name).sort()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filters & Search</CardTitle>
          {/* Mobile Actions */}
          <div className="sm:hidden flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onImportCSV} title="Import CSV">
              <IconFileImport className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onExportCSV} title="Export CSV">
              <IconFileExport className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={onAddVariant}>
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="sm" onClick={onImportCSV}>
              <IconFileImport className="mr-1 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={onExportCSV}>
              <IconFileExport className="mr-1 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={onAddVariant}>
              <IconPlus className="mr-1 h-4 w-4" />
              Add Variant
            </Button>
          </div>
        </div>

        {/* Desktop Layout (lg+) */}
        <div className="hidden lg:grid grid-cols-5 gap-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Product</label>
            <Select value={filterProduct} onValueChange={onFilterProductChange}>
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
            <label className="text-sm font-medium mb-2 block">Size</label>
            <Select value={filterSize} onValueChange={onFilterSizeChange}>
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
            <Select value={filterColor} onValueChange={onFilterColorChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                {colorOptions.map((colorName) => {
                  const hexCode = getColorHex(colorName, colors)
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
            <Select value={filterStockStatus} onValueChange={onFilterStockStatusChange}>
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
            <Button variant="outline" className="w-full" onClick={onResetFilters}>
              Reset
            </Button>
          </div>
        </div>

        {/* Tablet/Mobile Layout */}
        <div className="lg:hidden space-y-3">
          {/* Product (full width) */}
          <div>
            <label className="text-sm font-medium mb-2 block">Product</label>
            <Select value={filterProduct} onValueChange={onFilterProductChange}>
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

          {/* Size + Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Size</label>
              <Select value={filterSize} onValueChange={onFilterSizeChange}>
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
              <Select value={filterColor} onValueChange={onFilterColorChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {colorOptions.map((colorName) => {
                    const hexCode = getColorHex(colorName, colors)
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

          {/* Stock Status + Reset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Stock</label>
              <Select value={filterStockStatus} onValueChange={onFilterStockStatusChange}>
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
              <Button variant="outline" className="w-full text-sm" onClick={onResetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
