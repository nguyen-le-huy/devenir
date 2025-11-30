import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { IconSearch, IconAdjustmentsHorizontal, IconLayoutGrid, IconList } from '@tabler/icons-react'

interface BrandFiltersBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: 'all' | 'active' | 'inactive'
  onStatusChange: (value: 'all' | 'active' | 'inactive') => void
  country: string
  onCountryChange: (value: string) => void
  countries?: string[]
  view: 'table' | 'grid'
  onViewChange: (value: 'table' | 'grid') => void
  onReset?: () => void
}

export function BrandFiltersBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  country,
  onCountryChange,
  countries = [],
  view,
  onViewChange,
  onReset,
}: BrandFiltersBarProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="brand-search" className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <IconSearch className="h-4 w-4" /> Search brand
        </Label>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="brand-search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name, tagline, origin..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <IconAdjustmentsHorizontal className="h-4 w-4" /> Status
        </Label>
        <Select value={status} onValueChange={(value) => onStatusChange(value as typeof status)}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <IconAdjustmentsHorizontal className="h-4 w-4" /> Origin
        </Label>
        <Select value={country} onValueChange={onCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end justify-between gap-2 lg:col-span-2">
        <ToggleGroup type="single" value={view} onValueChange={(value) => value && onViewChange(value as typeof view)}>
          <ToggleGroupItem value="table" aria-label="Table view">
            <IconList className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <IconLayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onReset?.()
          }}
          className="text-xs"
        >
          Reset filters
        </Button>
      </div>
    </div>
  )
}
