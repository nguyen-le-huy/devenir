/**
 * VariantListFilters
 * Filters and search for variant list
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconTrash } from "@tabler/icons-react"
import type { Color } from "@/services/colorService"

interface VariantListFiltersProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  filterSize: string
  setFilterSize: (value: string) => void
  filterColor: string
  setFilterColor: (value: string) => void
  variantSizes: string[]
  variantColors: string[]
  colors: Color[]
  filteredCount: number
  totalCount: number
  selectedCount: number
  onDeleteSelected: () => void
}

export function VariantListFilters({
  searchTerm,
  setSearchTerm,
  filterSize,
  setFilterSize,
  filterColor,
  setFilterColor,
  variantSizes,
  variantColors,
  colors,
  filteredCount,
  totalCount,
  selectedCount,
  onDeleteSelected,
}: VariantListFiltersProps) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-4 pb-4">
        {/* Mobile: Search + Delete (first row) */}
        <div className="md:hidden flex gap-2 items-end mb-3">
          {/* Search SKU */}
          <div className="space-y-2 flex-1">
            <Label className="text-xs font-medium">Search</Label>
            <Input
              placeholder="SKU, size, color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Delete Selected Button - Mobile */}
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              className="h-9 w-9 p-0"
              title="Delete selected variants"
            >
              <IconTrash className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Mobile: Filters (second row) */}
        <div className="md:hidden flex gap-2.5 items-end">
          {/* Filter by Size */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Filter by Size</Label>
            <Select value={filterSize} onValueChange={setFilterSize}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                {variantSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Filter by Color</Label>
            <Select value={filterColor} onValueChange={setFilterColor}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                {variantColors.map((color) => {
                  const colorObj = colors.find(c => c._id === color || c.name === color)
                  const hexColor = colorObj?.hex || "#CCCCCC"
                  return (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded border border-gray-400"
                          style={{ backgroundColor: hexColor }}
                        />
                        <span>{colorObj?.name || color}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Results Counter */}
          <div className="px-3 py-2 border rounded bg-background text-sm font-medium whitespace-nowrap">
            {filteredCount} of {totalCount}
          </div>
        </div>

        {/* Desktop: All filters in one row */}
        <div className="hidden md:flex flex-col md:flex-row gap-2 md:gap-4 items-end">
          {/* Search SKU */}
          <div className="space-y-2 flex-1">
            <Label className="text-xs font-medium">Search SKU</Label>
            <Input
              placeholder="Search SKU, size, color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Filter by Size + Color + Results + Delete */}
          <div className="flex gap-2.5 items-end">
            {/* Filter by Size */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Filter by Size</Label>
              <Select value={filterSize} onValueChange={setFilterSize}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {variantSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Color */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Filter by Color</Label>
              <Select value={filterColor} onValueChange={setFilterColor}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {variantColors.map((color) => {
                    const colorObj = colors.find(c => c._id === color || c.name === color)
                    const hexColor = colorObj?.hex || "#CCCCCC"
                    return (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded border border-gray-400"
                            style={{ backgroundColor: hexColor }}
                          />
                          <span>{colorObj?.name || color}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Results Counter */}
            <div className="space-y-2 px-3 py-2 border rounded bg-background text-sm font-medium whitespace-nowrap">
              {filteredCount} of {totalCount}
            </div>

            {/* Delete Selected Button - Desktop */}
            {selectedCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteSelected}
                className="h-9 w-9 p-0"
                title="Delete selected variants"
              >
                <IconTrash className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default VariantListFilters
