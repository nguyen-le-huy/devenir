/**
 * Variant Data Table Component
 * Displays variant data in a table with actions
 */
import { useNavigate } from 'react-router-dom'
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
import { getStockBadgeVariant, getStockStatus, getStockIcon, getColorHex } from './utils'
import type { Variant, Color } from './types'

interface VariantDataTableProps {
  variants: Variant[]
  colors: Color[]
  loading: boolean
  currentPage: number
  limit: number
  totalFiltered: number
  totalPages: number
  onPageChange: (page: number) => void
  onEditVariant: (variantId: string) => void
  onDeleteVariant: (variantId: string) => void
}

export function VariantDataTable({
  variants,
  colors,
  loading,
  currentPage,
  limit,
  totalFiltered,
  totalPages,
  onPageChange,
  onEditVariant,
  onDeleteVariant,
}: VariantDataTableProps) {
  const navigate = useNavigate()

  const getColorDisplay = (colorName: string | null) => {
    if (!colorName) return '-'
    const hexCode = getColorHex(colorName, colors)

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
              {variants.map((variant) => (
                <TableRow key={variant._id}>
                  <TableCell>
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell className="font-mono font-semibold">{variant.sku}</TableCell>
                  <TableCell>{variant.productName || '-'}</TableCell>
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
                  <TableCell className="text-right">
                    ${variant.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span>
                      {getStockIcon(variant.stock, variant.lowStockThreshold)} {variant.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStockBadgeVariant(variant.stock, variant.lowStockThreshold)}>
                      {getStockStatus(variant.stock, variant.lowStockThreshold)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigate(`/admin/variants/view/${variant._id}?page=${currentPage}`, {
                          state: { variantData: variant },
                        })
                      }
                      title="View Details"
                    >
                      <IconEye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditVariant(variant._id)}
                      title="Edit Variant"
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => onDeleteVariant(variant._id)}
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
              Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, totalFiltered)} of{' '}
              {totalFiltered} SKUs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                // Show pages around current page
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
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
