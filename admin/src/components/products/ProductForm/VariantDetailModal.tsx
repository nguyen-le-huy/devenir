/**
 * VariantDetailModal
 * Modal to view variant details
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { IconEdit, IconTrash } from "@tabler/icons-react"
import type { VariantData } from "./types"
import type { Color } from "@/services/colorService"
import { getStockStatus, getColorDisplay } from "./utils"

interface VariantDetailModalProps {
  variant: VariantData | null
  productName: string
  colors: Color[]
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function VariantDetailModal({
  variant,
  productName,
  colors,
  onClose,
  onEdit,
  onDelete,
}: VariantDetailModalProps) {
  if (!variant) return null

  const colorDisplay = getColorDisplay(variant.colorId || variant.color, colors)
  const stockStatus = getStockStatus(variant.quantity)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Variant Details</CardTitle>
            <CardDescription>{variant.sku}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ✕
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Image */}
          {variant.mainImage && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Main Image</Label>
              <img
                src={variant.mainImage}
                alt={`${variant.sku} main`}
                className="w-full h-80 object-cover rounded border"
              />
            </div>
          )}

          {/* Hover Image */}
          {variant.hoverImage && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Hover Image</Label>
              <img
                src={variant.hoverImage}
                alt={`${variant.sku} hover`}
                className="w-full h-80 object-cover rounded border"
              />
            </div>
          )}

          {/* Additional Images */}
          {variant.images && variant.images.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">All Images ({variant.images.length})</Label>
              <div className="grid grid-cols-3 gap-3">
                {variant.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${variant.sku} image ${idx + 1}`}
                    className="w-full h-32 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <Label className="text-xs text-muted-foreground">Product</Label>
              <p className="font-semibold">{productName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">SKU</Label>
              <p className="font-semibold font-mono">{variant.sku}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Size</Label>
              <p className="font-semibold">{variant.size}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2 border-gray-400"
                  style={{ backgroundColor: colorDisplay.hex }}
                />
                <p className="font-semibold">{colorDisplay.name}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Price</Label>
              <p className="font-semibold text-lg">${variant.price.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Stock</Label>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{variant.quantity} units</p>
                <span
                  className={`${stockStatus.color} text-white text-xs font-bold px-2 py-1 rounded`}
                >
                  {stockStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 border-t pt-4">
            <Button onClick={onEdit} variant="outline">
              <IconEdit className="w-4 h-4 mr-2" />
              Edit Variant
            </Button>
            <Button
              onClick={() => {
                if (confirm("Delete this variant?")) {
                  onDelete()
                }
              }}
              variant="destructive"
            >
              <IconTrash className="w-4 h-4 mr-2" />
              Delete Variant
            </Button>
            <Button onClick={onClose} variant="ghost" className="ml-auto">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VariantDetailModal
