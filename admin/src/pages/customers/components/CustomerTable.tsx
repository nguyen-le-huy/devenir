import { IconChevronLeft, IconChevronRight, IconMail, IconMapPin, IconUsers } from '@tabler/icons-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CustomerListItem, CustomerListResponse, CustomerSegment, LoyaltyTier } from '@/services/customerService'
import { cn } from '@/lib/utils'

interface CustomerTableProps {
  customers?: Array<CustomerListItem & {
    rfm?: { r: number; f: number; m: number; segment?: string }
    emailSubscribed?: boolean
    lastOrderRelative?: string
    city?: string
    province?: string
  }>
  isLoading?: boolean
  pagination?: CustomerListResponse['pagination']
  locale: string
  currencyFormatter: Intl.NumberFormat
  onSelect?: (customer: CustomerListItem) => void
  onView?: (customer: CustomerListItem) => void
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

const formatRelativeTime = (value?: string | null) => {
  if (!value) return '—'
  const now = Date.now()
  const date = new Date(value).getTime()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return '1 ngày trước'
  if (diffDays < 7) return `${diffDays} ngày trước`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
  return `${Math.floor(diffDays / 365)} năm trước`
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  vip: 'bg-purple-100 text-purple-900 border-purple-200',
  'at-risk': 'bg-red-100 text-red-900 border-red-200',
  inactive: 'bg-muted text-muted-foreground',
  prospect: 'bg-blue-100 text-blue-900 border-blue-200',
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
              <TableHead>Hành trình</TableHead>
              <TableHead>Trạng thái & Thời gian</TableHead>
              <TableHead>Khu vực</TableHead>
              <TableHead>Marketing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              [...Array(5)].map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                </TableRow>
              ))
            )}

            {!isLoading && customers && customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
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
                onClick={() => { onSelect?.(customer); onView?.(customer) }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initialsOf(customer)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {customer.firstName || customer.lastName
                            ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                            : customer.username || customer.email}
                        </p>
                        <Badge className={cn('capitalize', tierStyles[customer.loyaltyTier])}>{customer.loyaltyTier}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{customer.email}</span>
                        {customer.customerProfile?.preferredChannel === 'email' && <IconMail className="h-3.5 w-3.5" />}
                        {customer.phone && <span>• {customer.phone}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary" className={cn('capitalize', segmentVariants[customer.customerSegment])}>{customer.customerSegment}</Badge>
                        <span className="text-muted-foreground">Engagement {customer.engagementScore}/100</span>
                        {customer.lastOrderRelative && <span className="text-muted-foreground">• {customer.lastOrderRelative}</span>}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{customer.totalOrders} đơn • {currencyFormatter.format(Math.round(customer.totalSpent || 0))}</p>
                    <p className="text-xs text-muted-foreground">AOV {currencyFormatter.format(Math.round(customer.averageOrderValue || 0))}</p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {(customer.customerProfile?.tags || []).slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="capitalize">{tag}</Badge>
                      ))}
                      {(customer.customerProfile?.tags?.length || 0) > 3 && (
                        <Badge variant="outline">+{(customer.customerProfile?.tags?.length || 0) - 3}</Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5 text-sm">
                    <Badge variant="outline" className={cn('capitalize border', statusStyles[customer.customerProfile?.status || 'active'])}>
                      {customer.customerProfile?.status || 'active'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Khách từ {formatDate(customer.createdAt, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lần mua: {formatRelativeTime(customer.lastOrderDate)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <IconMapPin className="h-4 w-4" />
                      <span>{customer.city || customer.primaryAddress?.city || '—'}</span>
                    </div>
                    <p className="text-xs">{customer.province || customer.primaryAddress?.district || ''}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <Badge variant="outline" className="capitalize">{customer.customerProfile?.preferredChannel || 'email'}</Badge>
                    <p className="text-xs text-muted-foreground">
                      Opt-in email: {(customer.emailSubscribed ?? customer.customerProfile?.marketingOptIn) ? 'Có' : 'Không'}
                    </p>
                    <p className="text-xs text-muted-foreground">Sửa đổi: {formatDate(customer.updatedAt, locale)}</p>
                  </div>
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
