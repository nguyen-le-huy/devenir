import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BrandStatsHighlightProps {
  stats?: {
    totalBrands?: number
    activeBrands?: number
    inactiveBrands?: number
    totalProducts?: number
    activeProducts?: number
  }
}

export function BrandStatsHighlight({ stats }: BrandStatsHighlightProps) {
  const activeRate = stats?.totalBrands ? Math.round(((stats?.activeBrands ?? 0) / stats.totalBrands) * 100) : 0
  const catalogCoverage = stats?.totalProducts ? Math.round(((stats?.activeProducts ?? 0) / stats.totalProducts) * 100) : 0

  const cards = [
    {
      label: 'Total Brands',
      value: stats?.totalBrands ?? 0,
      helper: `${stats?.inactiveBrands ?? 0} archived`,
    },
    {
      label: 'Active Brands',
      value: stats?.activeBrands ?? 0,
      helper: `${activeRate}% of portfolio`,
    },
    {
      label: 'Catalog Size',
      value: stats?.totalProducts ?? 0,
      helper: `${stats?.activeProducts ?? 0} active SKUs`,
    },
    {
      label: 'Coverage',
      value: `${catalogCoverage}%`,
      helper: 'Active SKUs / total',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold leading-tight">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
