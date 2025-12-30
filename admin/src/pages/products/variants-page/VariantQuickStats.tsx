/**
 * Quick Stats Cards Component for Variants Page
 */
import { Card, CardContent } from '@/components/ui/card'
import type { QuickStats } from './types'
import { getInventoryValueFontSize } from './utils'

interface VariantQuickStatsProps {
  stats: QuickStats
}

export function VariantQuickStats({ stats }: VariantQuickStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground">Total SKUs</div>
          <div className="text-2xl font-bold">{stats.totalSkus}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-green-600">✅ In Stock</div>
          <div className="text-2xl font-bold">{stats.inStock}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-yellow-600">⚠️ Low Stock</div>
          <div className="text-2xl font-bold">{stats.lowStock}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-red-600">🔴 Out of Stock</div>
          <div className="text-2xl font-bold">{stats.outOfStock}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground">Inventory Value</div>
          <div className={`${getInventoryValueFontSize(stats.inventoryValue)} font-bold`}>
            ${stats.inventoryValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
