import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconDots, IconPencil, IconTrash } from '@tabler/icons-react'
import type { Brand } from '@/services/brandService'

interface BrandListTableProps {
  data: Brand[]
  isLoading?: boolean
  selectedId?: string | null
  onSelect: (brand: Brand) => void
  onEdit: (brand: Brand) => void
  onDelete: (brand: Brand) => void
}

const numberFormatter = new Intl.NumberFormat()

export function BrandListTable({ data, isLoading, selectedId, onSelect, onEdit, onDelete }: BrandListTableProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Brand</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead className="text-center">Products</TableHead>
              <TableHead className="text-center">Active SKUs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Skeleton className="h-12 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              data.map((brand) => (
                <TableRow
                  key={brand._id}
                  data-state={selectedId === brand._id ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => onSelect(brand)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="h-12 w-12 rounded-md border bg-white object-contain"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-sm font-medium">
                          {brand.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium leading-tight">{brand.name}</p>
                        {brand.tagline && (
                          <p className="text-xs text-muted-foreground">{brand.tagline}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {brand.originCountry ? (
                      <Badge variant="outline">{brand.originCountry}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {numberFormatter.format(brand.totalProducts ?? 0)}
                  </TableCell>
                  <TableCell className="text-center text-green-600">
                    {numberFormatter.format(brand.activeProducts ?? 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={brand.isActive ? 'secondary' : 'outline'}>
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation()
                          onEdit(brand)
                        }}
                      >
                        <IconPencil className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(brand)}>
                            <IconPencil className="h-4 w-4" /> Edit brand
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(brand)}
                          >
                            <IconTrash className="h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
