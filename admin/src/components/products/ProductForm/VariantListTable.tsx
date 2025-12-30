/**
 * VariantListTable
 * Table displaying variants with pagination
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEdit, IconEye, IconTrash } from "@tabler/icons-react"
import type { VariantData } from "./types"
import type { Color } from "@/services/colorService"
import { getStockStatus, getColorDisplay } from "./utils"

interface VariantListTableProps {
  variants: VariantData[]
  filteredVariants: VariantData[]
  colors: Color[]
  selectedVariants: Set<number>
  variantPage: number
  variantItemsPerPage: number
  onToggleSelect: (index: number) => void
  onToggleSelectAll: () => void
  onView: (index: number) => void
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  onPageChange: (page: number) => void
}

export function VariantListTable({
  variants,
  filteredVariants,
  colors,
  selectedVariants,
  variantPage,
  variantItemsPerPage,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDelete,
  onPageChange,
}: VariantListTableProps) {
  const filteredIndices = variants
    .map((_, idx) => idx)
    .filter((idx) => {
      const v = variants[idx]
      return filteredVariants.some(fv => fv.sku === v.sku)
    })

  const totalPages = Math.ceil(filteredVariants.length / variantItemsPerPage)

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-3 w-12">
                  <Checkbox
                    checked={selectedVariants.size === filteredIndices.length && filteredIndices.length > 0}
                    onCheckedChange={() => onToggleSelectAll()}
                  />
                </th>
                <th className="text-left py-3 px-3 font-mono text-xs">SKU & Size</th>
                <th className="text-left py-3 px-3"></th>
                <th className="text-left py-3 px-3">Color</th>
                <th className="text-right py-3 px-3">Price</th>
                <th className="text-right py-3 px-3">Stock</th>
                <th className="text-center py-3 px-3">Image</th>
                <th className="text-center py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No variants found
                  </td>
                </tr>
              ) : (
                (() => {
                  const paginatedVariants = filteredVariants.slice(
                    (variantPage - 1) * variantItemsPerPage,
                    variantPage * variantItemsPerPage
                  )
                  return paginatedVariants.map((filteredVariant) => {
                    const index = variants.findIndex(
                      (v) => v.sku === filteredVariant.sku
                    )
                    if (index === -1) return null

                    const variant = variants[index]
                    const stockStatus = getStockStatus(variant.quantity)
                    const isSelected = selectedVariants.has(index)
                    const colorDisplay = getColorDisplay(variant.colorId || variant.color, colors)

                    return (
                      <tr
                        key={`${variant.sku}-${index}`}
                        className={`border-b hover:bg-muted/50 transition ${
                          isSelected ? "bg-muted/70" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggleSelect(index)}
                          />
                        </td>
                        <td className="py-3 px-3 font-mono text-xs font-semibold">
                          <div className="flex flex-col gap-1">
                            <span className="text-lg font-bold text-foreground">{variant.sku}</span>
                            <span className="text-xs text-muted-foreground font-medium">Size: {variant.size}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3"></td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded border border-gray-400 shadow-sm"
                              style={{ backgroundColor: colorDisplay.hex }}
                              title={`${colorDisplay.name} (${colorDisplay.hex})`}
                            />
                            <span className="text-sm font-medium">{colorDisplay.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold">
                          ${variant.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold">{variant.quantity}</span>
                            <span
                              className={`${stockStatus.color} text-white text-xs font-bold px-2 py-1 rounded`}
                            >
                              {stockStatus.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {variant.mainImage ? (
                              <img
                                src={variant.mainImage}
                                alt="variant main"
                                className="h-12 w-12 object-cover rounded border border-gray-300"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                No img
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground font-medium">
                              +{variant.images.length}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onView(index)}
                              className="h-8 w-8 p-0"
                              title="View details"
                            >
                              <IconEye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(index)}
                              className="h-8 w-8 p-0"
                              title="Edit variant"
                            >
                              <IconEdit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm("Delete this variant?")) {
                                  onDelete(index)
                                }
                              }}
                              className="h-8 w-8 p-0"
                              title="Delete variant"
                            >
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t px-4 pb-4">
            <div className="text-sm text-muted-foreground">
              Showing {(variantPage - 1) * variantItemsPerPage + 1}-{Math.min(variantPage * variantItemsPerPage, filteredVariants.length)} of{" "}
              {filteredVariants.length} variants
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, variantPage - 1))}
                disabled={variantPage === 1}
              >
                ← Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
                    key={idx + 1}
                    variant={variantPage === idx + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(idx + 1)}
                    className="w-8"
                  >
                    {idx + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, variantPage + 1))}
                disabled={variantPage === totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VariantListTable
