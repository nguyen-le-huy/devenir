import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TopBrand {
  _id: string
  name: string
  logoUrl?: string
  originCountry?: string
  totalProducts?: number
}

interface BrandTopPerformersProps {
  items?: TopBrand[]
}

export function BrandTopPerformers({ items }: BrandTopPerformersProps) {
  if (!items?.length) {
    return null
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
        <Badge variant="outline">Top {items.length}</Badge>
      </CardHeader>
      <CardContent className="grid gap-4">
        {items.map((brand, index) => (
          <div key={brand._id} className="flex items-center gap-3">
            <div className="text-2xl font-semibold text-muted-foreground">{String(index + 1).padStart(2, '0')}</div>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-12 w-12 rounded-md border bg-white object-contain" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-sm font-medium">
                {brand.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium leading-tight">{brand.name}</p>
              <p className="text-xs text-muted-foreground">
                {brand.originCountry || 'Origin unknown'} • {brand.totalProducts ?? 0} SKUs
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
