/**
 * ProductInventoryTab
 * Tab 3: Inventory summary and statistics
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProductFormData } from "./types"
import type { Color } from "@/services/colorService"
import {
  calculateTotalStock,
  calculateTotalValue,
  getStockDistributionBySize,
  getStockDistributionByColor,
} from "./utils"

interface ProductInventoryTabProps {
  formData: ProductFormData
  colors: Color[]
}

export function ProductInventoryTab({ formData, colors }: ProductInventoryTabProps) {
  const { variants } = formData
  
  if (variants.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Add variants first to view inventory summary
        </p>
      </Card>
    )
  }

  const totalStock = calculateTotalStock(variants)
  const totalValue = calculateTotalValue(variants)
  const sizeDistribution = getStockDistributionBySize(variants)
  const colorDistribution = getStockDistributionByColor(variants)
  const needsAttention = variants.filter(v => v.quantity === 0 || v.quantity < 10)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Variants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{variants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Distribution by Size */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Distribution by Size</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(sizeDistribution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([size, stock]) => {
              const percentage = ((stock / totalStock) * 100).toFixed(1)
              const barWidth = (stock / totalStock) * 100
              return (
                <div key={size} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Size {size}</span>
                    <span className="text-sm text-muted-foreground">
                      {stock} units ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </CardContent>
      </Card>

      {/* Stock Distribution by Color */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Distribution by Color</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(colorDistribution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([color, stock]) => {
              const percentage = ((stock / totalStock) * 100).toFixed(1)
              const isNone = color === "None"
              const colorObj = colors.find(c => c.name === color)
              const colorHex = isNone ? "#999999" : (colorObj?.hex || "#999999")

              return (
                <div key={color} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: colorHex }}
                    />
                    <span className="text-sm font-medium">
                      {isNone ? "None (Size Only)" : color}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stock} units ({percentage}%)
                  </span>
                </div>
              )
            })}
        </CardContent>
      </Card>

      {/* Variants Needing Attention */}
      {needsAttention.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-900">
              ⚠️ Variants Needing Attention ({needsAttention.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsAttention.map((v, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-red-200">
                  <span className="text-sm font-mono font-medium">{v.sku}</span>
                  <span
                    className={`text-sm font-medium ${
                      v.quantity === 0 ? "text-red-600" : "text-amber-600"
                    }`}
                  >
                    {v.quantity === 0 ? "Out of Stock" : `Low Stock (${v.quantity} units)`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProductInventoryTab
