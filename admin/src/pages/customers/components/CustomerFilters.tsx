import { IconAdjustments, IconFilter, IconMapPin, IconSearch, IconTags } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CustomerListFilters } from '@/services/customerService'

interface CustomerFiltersProps {
  filters: CustomerListFilters
  onChange: (filters: Partial<CustomerListFilters>) => void
  onReset: () => void
  metaTags?: Array<{ label: string; count: number }>
}

const segmentOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'VIP', value: 'vip' },
  { label: 'Returning', value: 'returning' },
  { label: 'New', value: 'new' },
  { label: 'At Risk', value: 'at-risk' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Regular', value: 'regular' },
]

const tierOptions = [
  { label: 'Tất cả cấp độ', value: 'all' },
  { label: 'Platinum', value: 'platinum' },
  { label: 'Gold', value: 'gold' },
  { label: 'Silver', value: 'silver' },
  { label: 'Bronze', value: 'bronze' },
]

const statusOptions = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Prospect', value: 'prospect' },
  { label: 'VIP', value: 'vip' },
  { label: 'At Risk', value: 'at-risk' },
  { label: 'Inactive', value: 'inactive' },
]

const channelOptions = [
  { label: 'Mọi kênh', value: 'all' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'Messaging', value: 'messaging' },
  { label: 'In-person', value: 'in-person' },
]

const periodOptions = [
  { label: 'Tất cả thời gian', value: 'all' },
  { label: '30 ngày gần nhất', value: '30d' },
  { label: '60 ngày gần nhất', value: '60d' },
  { label: '90 ngày gần nhất', value: '90d' },
  { label: 'Từ đầu năm', value: 'ytd' },
]

const sortOptions = [
  { label: 'Gần đây nhất', value: 'recent' },
  { label: 'Theo giá trị cao nhất', value: 'value_desc' },
  { label: 'Theo số đơn', value: 'orders_desc' },
  { label: 'Theo điểm gắn kết', value: 'engagement_desc' },
]

const marketingOptions = [
  { label: 'Mọi trạng thái', value: 'all' },
  { label: 'Đã opt-in', value: 'yes' },
  { label: 'Chưa opt-in', value: 'no' },
]

const rfmSegments = [
  { label: 'Tất cả RFM', value: 'all' },
  { label: 'Loyal Customers', value: 'loyal' },
  { label: 'Potential Loyalists', value: 'potential' },
  { label: 'New / One-time', value: 'new' },
  { label: 'At Risk', value: 'risk' },
]

export function CustomerFilters({ filters, onChange, onReset, metaTags = [] }: CustomerFiltersProps) {
  const activeTagCount = filters.tags?.length ?? 0

  const handleTagToggle = (tag: string, checked: boolean) => {
    const currentTags = filters.tags || []
    const nextTags = checked
      ? Array.from(new Set([...currentTags, tag]))
      : currentTags.filter(item => item !== tag)
    onChange({ tags: nextTags })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full">
            <IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Tìm kiếm theo tên, email, điện thoại..."
              value={filters.search ?? ''}
              onChange={(event) => onChange({ search: event.target.value, page: 1 })}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <IconTags className="h-4 w-4" />
                Tags
                {activeTagCount > 0 && (
                  <Badge variant="secondary" className="rounded-sm px-1 text-[10px]">
                    {activeTagCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Chọn thẻ phân loại</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {metaTags.length === 0 && (
                <p className="px-2 py-1 text-sm text-muted-foreground">Chưa có tag nào</p>
              )}
              {metaTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag.label}
                  checked={filters.tags?.includes(tag.label) ?? false}
                  onCheckedChange={(checked) => handleTagToggle(tag.label, Boolean(checked))}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="capitalize">{tag.label}</span>
                    <Badge variant="secondary">{tag.count}</Badge>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              {activeTagCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked
                    onCheckedChange={() => onChange({ tags: [] })}
                  >
                    Bỏ chọn tất cả
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" className="gap-2" onClick={onReset}>
            <IconFilter className="h-4 w-4" />
            Đặt lại
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Select value={filters.segment ?? 'all'} onValueChange={(value) => onChange({ segment: value as CustomerListFilters['segment'], page: 1 })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Phân khúc" />
          </SelectTrigger>
          <SelectContent>
            {segmentOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.status ?? 'all'} onValueChange={(value) => onChange({ status: value as CustomerListFilters['status'], page: 1 })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.tier ?? 'all'} onValueChange={(value) => onChange({ tier: value as CustomerListFilters['tier'], page: 1 })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Cấp độ" />
          </SelectTrigger>
          <SelectContent>
            {tierOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Select value={filters.channel ?? 'all'} onValueChange={(value) => onChange({ channel: value as CustomerListFilters['channel'], page: 1 })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Kênh ưa thích" />
          </SelectTrigger>
          <SelectContent>
            {channelOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.period ?? '90d'} onValueChange={(value) => onChange({ period: value as CustomerListFilters['period'], page: 1 })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Khoảng thời gian" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.sort ?? 'recent'} onValueChange={(value) => onChange({ sort: value as CustomerListFilters['sort'] })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Select
          value={filters.marketingOptIn ?? 'all'}
          onValueChange={(value) => onChange({ marketingOptIn: value as CustomerListFilters['marketingOptIn'], page: 1 })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Marketing opt-in" />
          </SelectTrigger>
          <SelectContent>
            {marketingOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.rfmSegment ?? 'all'}
          onValueChange={(value) => onChange({ rfmSegment: value === 'all' ? undefined : value, page: 1 })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="RFM Segment" />
          </SelectTrigger>
          <SelectContent>
            {rfmSegments.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min orders"
            value={filters.ordersMin ?? ''}
            onChange={(e) => onChange({ ordersMin: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          />
          <Input
            type="number"
            min={0}
            placeholder="Max orders"
            value={filters.ordersMax ?? ''}
            onChange={(e) => onChange({ ordersMax: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min spend"
            value={filters.spendMin ?? ''}
            onChange={(e) => onChange({ spendMin: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          />
          <Input
            type="number"
            min={0}
            placeholder="Max spend"
            value={filters.spendMax ?? ''}
            onChange={(e) => onChange({ spendMax: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Thành phố"
            value={filters.city ?? ''}
            onChange={(e) => onChange({ city: e.target.value || undefined, page: 1 })}
          />
          <Input
            placeholder="Quận / Tỉnh"
            value={filters.province ?? ''}
            onChange={(e) => onChange({ province: e.target.value || undefined, page: 1 })}
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <IconMapPin className="h-4 w-4" />
          Lọc theo khu vực, giá trị đơn, RFM và opt-in.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <IconAdjustments className="h-3.5 w-3.5" />
        Bộ lọc nâng cao đang áp dụng cho dữ liệu khách hàng.
      </div>
    </div>
  )
}
