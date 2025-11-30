import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { IconWorld, IconCalendar, IconMapPin, IconExternalLink, IconInfoCircle } from '@tabler/icons-react'
import type { Brand } from '@/services/brandService'

interface BrandDetailPanelProps {
  brand?: Brand | null
  onEdit: (brand: Brand) => void
  onDelete: (brand: Brand) => void
}

export function BrandDetailPanel({ brand, onEdit, onDelete }: BrandDetailPanelProps) {
  if (!brand) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>No brand selected</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Choose a brand from the list to review performance metrics, catalogue coverage, and quick actions.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex items-start gap-3">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.name} className="h-16 w-16 rounded-md border object-contain bg-white" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-xl font-semibold">
              {brand.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{brand.name}</h2>
              <Badge variant={brand.isActive ? 'default' : 'outline'}>
                {brand.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {brand.tagline && <p className="text-sm text-muted-foreground">{brand.tagline}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onEdit(brand)}>Edit Profile</Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(brand)}>
            Archive
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Total Products</p>
            <p className="text-2xl font-semibold">{brand.totalProducts ?? 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Active Listings</p>
            <p className="text-2xl font-semibold text-green-600">{brand.activeProducts ?? 0}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          {brand.originCountry && (
            <div className="flex items-center gap-3">
              <IconMapPin className="h-4 w-4 text-muted-foreground" />
              <span>{brand.originCountry}</span>
            </div>
          )}
          {brand.foundedYear && (
            <div className="flex items-center gap-3">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span>Founded {brand.foundedYear}</span>
            </div>
          )}
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-primary hover:underline"
            >
              <IconWorld className="h-4 w-4" />
              <span>{brand.website}</span>
              <IconExternalLink className="h-4 w-4" />
            </a>
          )}
          <div className="flex items-start gap-3 text-muted-foreground">
            <IconInfoCircle className="mt-1 h-4 w-4" />
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/60">About</p>
              <p className="text-sm">{brand.description || 'No overview yet.'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
