import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { Brand } from '@/services/brandService'

interface BrandListGridProps {
  data: Brand[]
  selectedId?: string | null
  onSelect: (brand: Brand) => void
  onEdit: (brand: Brand) => void
  onDelete: (brand: Brand) => void
}

export function BrandListGrid({ data, selectedId, onSelect, onEdit, onDelete }: BrandListGridProps) {
  if (!data.length) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((brand) => (
        <Card
          key={brand._id}
          className={`cursor-pointer transition hover:shadow-md ${selectedId === brand._id ? 'ring-2 ring-primary' : ''}`}
          onClick={() => onSelect(brand)}
        >
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-16 w-16 rounded-md border bg-white object-contain" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-lg font-semibold">
                {brand.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-base">{brand.name}</CardTitle>
              {brand.tagline && <p className="text-xs text-muted-foreground">{brand.tagline}</p>}
            </div>
            <Badge variant={brand.isActive ? 'secondary' : 'outline'}>{brand.isActive ? 'Active' : 'Inactive'}</Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Products</p>
              <p className="text-lg font-semibold">{brand.totalProducts ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active SKUs</p>
              <p className="text-lg font-semibold text-green-600">{brand.activeProducts ?? 0}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Origin</p>
              <p>{brand.originCountry || '—'}</p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(event) => {
                event.stopPropagation()
                onEdit(brand)
              }}
            >
              <IconPencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                onDelete(brand)
              }}
            >
              <IconTrash className="mr-2 h-4 w-4" /> Archive
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
