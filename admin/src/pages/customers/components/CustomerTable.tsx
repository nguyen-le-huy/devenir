import { IconChevronLeft, IconChevronRight, IconDotsVertical, IconUsers } from '@tabler/icons-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { CustomerListItem, CustomerListResponse, CustomerSegment, LoyaltyTier } from '@/services/customerService'
import { cn } from '@/lib/utils'

interface CustomerTableProps {
  customers?: CustomerListItem[]
  isLoading?: boolean
  pagination?: CustomerListResponse['pagination']
  locale: string
  currencyFormatter: Intl.NumberFormat
  onSelect?: (customer: CustomerListItem) => void
  onView?: (customer: CustomerListItem) => void
  onEdit?: (customer: CustomerListItem) => void
  onDelete?: (customer: CustomerListItem) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (limit: number) => void
}

const tierStyles: Record<LoyaltyTier, string> = {
  platinum: 'bg-slate-900 text-white',
  gold: 'bg-amber-100 text-amber-900 border border-amber-200',
  silver: 'bg-gray-100 text-gray-900',
  bronze: 'bg-orange-50 text-orange-900 border border-orange-200',
}

const segmentVariants: Record<CustomerSegment, string> = {
  vip: 'bg-purple-100 text-purple-900',
  returning: 'bg-emerald-100 text-emerald-900',
  new: 'bg-blue-100 text-blue-900',
  'at-risk': 'bg-red-100 text-red-900',
  inactive: 'bg-muted text-muted-foreground',
  regular: 'bg-secondary text-secondary-foreground',
}

const formatDate = (value?: string | null, locale = 'vi') => {
  if (!value) return '—'
  const formatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return formatter.format(new Date(value))
}

const initialsOf = (customer: CustomerListItem) => {
  const first = customer.firstName?.[0] || customer.username?.[0] || customer.email[0]
  const last = customer.lastName?.[0] || customer.email.split('@')[0]?.[1]
  return `${(first || '').toUpperCase()}${(last || '').toUpperCase()}`
}

const formatRange = (page: number, limit: number, total: number) => {
  const start = (page - 1) * limit + 1
  const end = Math.min(total, page * limit)
  if (total === 0) return '0'
  return `${start}-${end}`
}

export function CustomerTable({
  customers,
  isLoading,
  pagination,
  locale,
  currencyFormatter,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: CustomerTableProps) {
  const page = pagination?.page ?? 1
  const limit = pagination?.limit ?? 10
  const total = pagination?.total ?? 0
  const totalPages = pagination?.pages ?? 1

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Phân khúc</TableHead>
              <TableHead>Giá trị & đơn hàng</TableHead>
              <TableHead>Lần mua cuối</TableHead>
              <TableHead>Kênh ưu tiên</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-12 text-right">&nbsp;</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              [...Array(5)].map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-6 w-6" /></TableCell>
                </TableRow>
              ))
            )}

            {!isLoading && customers && customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    <IconUsers className="h-8 w-8" />
                    <p>Chưa có khách hàng nào phù hợp với bộ lọc hiện tại.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && customers?.map((customer) => (
              <TableRow
                key={customer._id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => onSelect?.(customer)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initialsOf(customer)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {customer.firstName || customer.lastName
                          ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                          : customer.username || customer.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                      {customer.phone && (
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Badge className={cn('w-fit capitalize', segmentVariants[customer.customerSegment])}>
                      {customer.customerSegment}
                    </Badge>
                    <Badge className={cn('w-fit capitalize', tierStyles[customer.loyaltyTier])}>
                      {customer.loyaltyTier}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Engagement: {customer.engagementScore}/100</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-semibold">{currencyFormatter.format(Math.round(customer.totalSpent || 0))}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.totalOrders} đơn • AOV {currencyFormatter.format(Math.round(customer.averageOrderValue || 0))}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{formatDate(customer.lastOrderDate, locale)}</p>
                    <p className="text-xs text-muted-foreground">
                      Lần cuối: {customer.lastOrderValue ? currencyFormatter.format(Math.round(customer.lastOrderValue)) : '—'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {customer.customerProfile?.preferredChannel || 'email'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Opt-in: {customer.customerProfile?.marketingOptIn ? 'Có' : 'Không'}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(customer.customerProfile?.tags || []).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="capitalize">
                        {tag}
                      </Badge>
                    ))}
                    {(customer.customerProfile?.tags?.length || 0) > 3 && (
                      <Badge variant="outline">+{(customer.customerProfile?.tags?.length || 0) - 3}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <IconDotsVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onView?.(customer) }}>
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onEdit?.(customer) }}>
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(event) => { event.stopPropagation(); onDelete?.(customer) }}
                      >
                        Xóa khách hàng
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          Hiển thị {formatRange(page, limit, total)} / {total.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')} khách hàng
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span>Hiển thị</span>
            <Select value={String(limit)} onValueChange={(value) => onPageSizeChange?.(Number(value))}>
              <SelectTrigger className="h-8 w-20">
                <SelectValue placeholder="Số dòng" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map(size => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>dòng</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(Math.max(page - 1, 1))}
              disabled={page <= 1}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(Math.min(page + 1, totalPages))}
              disabled={page >= totalPages}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
