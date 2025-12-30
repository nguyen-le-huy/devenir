/**
 * Variants Table Component with Pagination
 */
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react'
import type { Variant, Color } from './types'
import { getStockBadgeVariant, getStockStatus, getStockIcon, getColorDisplayInfo } from './utils'

interface VariantsTableProps {
  variants: Variant[]
  colors: Color[]
  loading: boolean
  page: number
  limit: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  onView: (variant: Variant) => void
  onEdit: (variant: Variant) => void
  onDelete: (variantId: string) => void
}

export function VariantsTable({
  variants,
  colors,
  loading,
  page,
  limit,
  totalPages,
  totalItems,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: VariantsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SKU Management Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading variants...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SKU Management Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No variants found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SKU Management Table</CardTitle>
      </CardHeader>
      <CardContent>
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
              {variants.map((variant) => {
                const colorDisplay = getColorDisplayInfo(variant.color, colors)
                return (
                  <TableRow key={variant._id}>
                    <TableCell>
                      <input type="checkbox" />
                    </TableCell>
                    <TableCell className="font-mono font-semibold">{variant.sku}</TableCell>
                    <TableCell>{variant.productName || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">{variant.stock ?? 0}</TableCell>
                    <TableCell>{variant.size}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded border border-gray-300"
                          style={{ backgroundColor: colorDisplay.hex }}
                          title={`${colorDisplay.name} (${colorDisplay.hex})`}
                        />
                        <span className="text-sm">{colorDisplay.name}</span>
                      </div>
                    </TableCell>
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
                    <TableCell className="text-right">
                      ${variant.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStockBadgeVariant(variant.stock, variant.lowStockThreshold)}>
                        {getStockIcon(variant.stock, variant.lowStockThreshold)}{' '}
                        {getStockStatus(variant.stock, variant.lowStockThreshold)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => onView(variant)} title="View Details">
                        <IconEye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onEdit(variant)} title="Edit Variant">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => onDelete(variant._id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalItems)} of {totalItems} SKUs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              {totalPages > 5 && <span className="px-2 self-center">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
