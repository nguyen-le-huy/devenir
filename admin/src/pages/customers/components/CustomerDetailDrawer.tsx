import { IconMail, IconPhone, IconTrash, IconUser } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import type { CustomerDetailResponse } from '@/services/customerService'
import { cn } from '@/lib/utils'

interface CustomerDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: CustomerDetailResponse['data']
  isLoading?: boolean
  onEdit?: (customer: CustomerDetailResponse['data']) => void
  onDelete?: (customer: CustomerDetailResponse['data']) => void
  currencyFormatter: Intl.NumberFormat
  locale: string
}

const tierAccent: Record<string, string> = {
  platinum: 'bg-slate-900 text-white',
  gold: 'bg-amber-100 text-amber-900',
  silver: 'bg-gray-100 text-gray-900',
  bronze: 'bg-orange-100 text-orange-900',
}

const defaultProfile = {
  preferredChannel: 'email',
  marketingOptIn: true,
  notes: '',
  tags: [] as string[],
}

const createDefaultStats = () => ({
  paymentMethods: [] as Array<{ label?: string; count: number }>,
  statusBreakdown: [] as Array<{ label?: string; count: number }>,
  topProducts: [] as Array<{ name: string; quantity: number; revenue: number }>,
})

const formatDateTime = (value?: string | null, locale = 'vi') => {
  if (!value) return '—'
  const formatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  return formatter.format(new Date(value))
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <p className="text-xs uppercase text-muted-foreground">{label}</p>
    <p className="text-xl font-semibold">{value}</p>
  </div>
)

export function CustomerDetailDrawer({
  open,
  onOpenChange,
  customer,
  isLoading,
  onEdit,
  onDelete,
  currencyFormatter,
  locale,
}: CustomerDetailDrawerProps) {
  const handleEdit = () => {
    if (customer) {
      onEdit?.(customer)
    }
  }

  const handleDelete = () => {
    if (customer) {
      onDelete?.(customer)
    }
  }

  const profile = customer?.customerProfile
    ? { ...defaultProfile, ...customer.customerProfile, tags: customer.customerProfile.tags ?? [] }
    : { ...defaultProfile }
  const stats = customer?.stats
    ? {
        paymentMethods: customer.stats.paymentMethods ?? [],
        statusBreakdown: customer.stats.statusBreakdown ?? [],
        topProducts: customer.stats.topProducts ?? [],
      }
    : createDefaultStats()
  const recentOrders = customer?.recentOrders ?? []
  const tags = profile.tags ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full space-y-4 overflow-y-auto sm:max-w-xl" side="right">
        <SheetHeader>
          <SheetTitle>Hồ sơ khách hàng</SheetTitle>
          <SheetDescription>Thông tin đầy đủ về hoạt động mua sắm và hành vi của khách hàng.</SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {!isLoading && customer && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-2xl font-semibold">{customer.firstName || customer.lastName ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : customer.username || customer.email}</h3>
                <p className="text-sm text-muted-foreground">Khách hàng từ {formatDateTime(customer.createdAt, locale)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('capitalize', tierAccent[customer.loyaltyTier])}>{customer.loyaltyTier}</Badge>
                <Badge variant="secondary" className="capitalize">{customer.customerSegment}</Badge>
                <Badge variant="outline">Engagement {customer.engagementScore}/100</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="default" size="sm" onClick={handleEdit}>Chỉnh sửa</Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${customer.email}`}>
                    <IconMail className="mr-2 h-4 w-4" />Email
                  </a>
                </Button>
                {onDelete && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
                    <IconTrash className="mr-2 h-4 w-4" /> Lưu trữ
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Tổng chi tiêu" value={currencyFormatter.format(Math.round(customer.totalSpent || 0))} />
              <StatCard label="Số đơn hàng" value={`${customer.totalOrders} đơn`} />
              <StatCard label="AOV" value={currencyFormatter.format(Math.round(customer.averageOrderValue || 0))} />
              <StatCard label="Lần mua cuối" value={formatDateTime(customer.lastOrderDate, locale)} />
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Thông tin liên hệ</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><IconMail className="h-4 w-4" /> {customer.email}</p>
                {customer.phone && <p className="flex items-center gap-2"><IconPhone className="h-4 w-4" /> {customer.phone}</p>}
                {customer.primaryAddress && (
                  <p className="flex items-start gap-2"><IconUser className="h-4 w-4" />
                    <span>{customer.primaryAddress.street}, {customer.primaryAddress.district}, {customer.primaryAddress.city}</span>
                  </p>
                )}
                <p className="text-muted-foreground">Kênh ưu tiên: {profile.preferredChannel}</p>
                <p className="text-muted-foreground">Marketing opt-in: {profile.marketingOptIn ? 'Có' : 'Không'}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold">Insights</h4>
              <ul className="space-y-2 text-sm">
                {customer.insights?.map((insight, index) => (
                  <li key={index} className="rounded-md bg-muted/40 p-2">{insight}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Phân tích</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Phương thức thanh toán</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.paymentMethods.map(method => (
                      <Badge key={method.label} variant="outline">
                        {method.label || 'N/A'} ({method.count})
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Trạng thái đơn hàng</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.statusBreakdown.map(status => (
                      <Badge key={status.label} variant="secondary">
                        {status.label}: {status.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Sản phẩm nổi bật</h4>
              <div className="space-y-2 text-sm">
                {stats.topProducts.length === 0 && <p className="text-muted-foreground">Chưa có dữ liệu</p>}
                {stats.topProducts.map(product => (
                  <div key={product.name} className="flex items-center justify-between rounded-md border p-2">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Số lượng: {product.quantity}</p>
                    </div>
                    <p className="font-semibold">{currencyFormatter.format(Math.round(product.revenue || 0))}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Đơn hàng gần nhất</h4>
              <div className="space-y-2 text-sm">
                {recentOrders.length === 0 && <p className="text-muted-foreground">Chưa có đơn hàng</p>}
                {recentOrders.map(order => (
                  <div key={order._id} className="rounded-md border p-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDateTime(order.createdAt, locale)}</span>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                    <p className="font-semibold">{currencyFormatter.format(Math.round(order.totalPrice || 0))}</p>
                    <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Ghi chú</h4>
              <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground min-h-16">
                {profile.notes?.trim() || 'Chưa có ghi chú cho khách hàng này.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
