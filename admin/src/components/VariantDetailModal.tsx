import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCopy } from "@tabler/icons-react"
import { COLOR_CODES } from "@/utils/skuGenerator"

export interface Variant {
  id?: string
  sku: string
  size: string
  color: string
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

interface VariantDetailModalProps {
  open: boolean
  variant: Variant | null
  onClose: () => void
  onSave: (variant: Variant) => void
  readonly?: boolean
}

export function VariantDetailModal({
  open,
  variant: initialVariant,
  onClose,
  onSave,
  readonly = false,
}: VariantDetailModalProps) {
  const [variant, setVariant] = useState<Variant | null>(initialVariant)

  if (!variant) return null

  const colorInfo = COLOR_CODES[variant.color as keyof typeof COLOR_CODES] ||
    (variant.color?.startsWith('#') ? { name: variant.color, hex: variant.color } : null)

  const handleSave = () => {
    onSave(variant)
    onClose()
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-xl font-bold">Edit Variant: {variant.sku}</h2>
              <p className="text-sm text-muted-foreground">Update pricing, inventory, and details</p>
            </div>

            <div className="space-y-6 p-6">
              {/* SKU Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SKU Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <div className="flex gap-2 mt-2">
                      <Input id="sku" value={variant.sku} disabled className="font-mono" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(variant.sku)
                        }}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Size</Label>
                      <p className="text-sm font-medium mt-2">{variant.size}</p>
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex items-center gap-2 mt-2">
                        {colorInfo && (
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: colorInfo.hex }}
                          />
                        )}
                        <p className="text-sm font-medium">{colorInfo?.name}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={variant.price}
                      onChange={(e) =>
                        setVariant({ ...variant, price: parseInt(e.target.value) || 0 })
                      }
                      disabled={readonly}
                    />
                  </div>

                  <div>
                    <Label htmlFor="comparePrice">Compare at Price (Optional)</Label>
                    <Input
                      id="comparePrice"
                      type="number"
                      placeholder="60.00"
                      value={variant.comparePrice || ""}
                      onChange={(e) =>
                        setVariant({ ...variant, comparePrice: parseInt(e.target.value) || undefined })
                      }
                      disabled={readonly}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={variant.stock}
                      onChange={(e) => setVariant({ ...variant, stock: parseInt(e.target.value) || 0 })}
                      disabled={readonly}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={variant.lowStockThreshold}
                      onChange={(e) =>
                        setVariant({ ...variant, lowStockThreshold: parseInt(e.target.value) || 10 })
                      }
                      disabled={readonly}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Weight & Dimensions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Weight & Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="weight">Weight (g)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={variant.weight || ""}
                      onChange={(e) =>
                        setVariant({ ...variant, weight: parseInt(e.target.value) || undefined })
                      }
                      disabled={readonly}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={readonly}>
                Save Variant
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
