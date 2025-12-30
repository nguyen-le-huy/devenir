/**
 * Filters & Search Card Component for Variants Page
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
import { IconPlus, IconSearch, IconFileImport, IconFileExport } from '@tabler/icons-react'
import type { Product, Color } from './types'

interface VariantFiltersCardProps {
  // Search
  searchTerm: string
  onSearchChange: (value: string) => void
  // Filters
  filterProduct: string
  onFilterProductChange: (value: string) => void
  filterSize: string
  onFilterSizeChange: (value: string) => void
  filterColor: string
  onFilterColorChange: (value: string) => void
  filterStockStatus: string
  onFilterStockStatusChange: (value: string) => void
  // Data
  products: Product[]
  sizes: string[]
  colors: Color[]
  // Actions
  onImportCSV: () => void
  onExportCSV: () => void
  onAddVariant: () => void
  onReset: () => void
}

export function VariantFiltersCard({
  searchTerm,
  onSearchChange,
  filterProduct,
  onFilterProductChange,
  filterSize,
  onFilterSizeChange,
  filterColor,
  onFilterColorChange,
  filterStockStatus,
  onFilterStockStatusChange,
  products,
  sizes,
  colors,
  onImportCSV,
  onExportCSV,
  onAddVariant,
  onReset,
}: VariantFiltersCardProps) {
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

        {/* Desktop Filters (lg+) */}
        <div className="hidden lg:grid grid-cols-5 gap-3">
          <FilterSelect
            label="Product"
            value={filterProduct}
            onChange={onFilterProductChange}
            options={[
              { value: 'all', label: 'All Products' },
              ...products.map((p) => ({ value: p._id, label: p.name })),
            ]}
          />
          <FilterSelect
            label="Size"
            value={filterSize}
            onChange={onFilterSizeChange}
            options={[
              { value: 'all', label: 'All Sizes' },
              ...sizes.map((s) => ({ value: s, label: s })),
            ]}
          />
          <ColorFilterSelect
            label="Color"
            value={filterColor}
            onChange={onFilterColorChange}
            colors={colors}
            colorOptions={colorOptions}
          />
          <FilterSelect
            label="Stock Status"
            value={filterStockStatus}
            onChange={onFilterStockStatusChange}
            options={[
              { value: 'all', label: 'All' },
              { value: 'inStock', label: 'In Stock' },
              { value: 'low', label: 'Low Stock' },
              { value: 'out', label: 'Out of Stock' },
            ]}
          />
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={onReset}>
              Reset
            </Button>
          </div>
        </div>

        {/* Tablet/Mobile Filters */}
        <div className="lg:hidden space-y-3">
          <FilterSelect
            label="Product"
            value={filterProduct}
            onChange={onFilterProductChange}
            options={[
              { value: 'all', label: 'All Products' },
              ...products.map((p) => ({ value: p._id, label: p.name })),
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <FilterSelect
              label="Size"
              value={filterSize}
              onChange={onFilterSizeChange}
              options={[
                { value: 'all', label: 'All Sizes' },
                ...sizes.map((s) => ({ value: s, label: s })),
              ]}
            />
            <ColorFilterSelect
              label="Color"
              value={filterColor}
              onChange={onFilterColorChange}
              colors={colors}
              colorOptions={colorOptions}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FilterSelect
              label="Stock"
              value={filterStockStatus}
              onChange={onFilterStockStatusChange}
              options={[
                { value: 'all', label: 'All' },
                { value: 'inStock', label: 'In Stock' },
                { value: 'low', label: 'Low Stock' },
                { value: 'out', label: 'Out of Stock' },
              ]}
            />
            <div className="flex items-end">
              <Button variant="outline" className="w-full text-sm" onClick={onReset}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper Components
interface FilterSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface ColorFilterSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  colors: Color[]
  colorOptions: string[]
}

function ColorFilterSelect({ label, value, onChange, colors, colorOptions }: ColorFilterSelectProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Colors</SelectItem>
          {colorOptions.map((colorName) => {
            const colorInfo = colors.find((c) => c.name === colorName)
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
  )
}
