import { IconActivity, IconCalendarClock, IconEdit, IconMail, IconMapPin, IconPhone, IconUser } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CustomerDetailResponse, CustomerListItem } from '@/services/customerService'
import { cn } from '@/lib/utils'

interface CustomerDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: DrawerCustomer
  isLoading?: boolean
  currencyFormatter: Intl.NumberFormat
  locale: string
}

type DrawerCustomer = (CustomerDetailResponse['data'] | CustomerListItem) & {
  rfm?: { r: number; f: number; m: number; segment?: string }
  emailSubscribed?: boolean
  lastOrderRelative?: string
  insights?: string[]
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

const formatDateTime = (value?: string | null, locale = 'vi') => {
  if (!value) return '—'
  const formatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  return formatter.format(new Date(value))
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-card p-4 shadow-sm">
    <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
)

export function CustomerDetailDrawer({
  open,
  onOpenChange,
  customer,
  isLoading,
  currencyFormatter,
  locale,
}: CustomerDetailDrawerProps) {
  const profile = customer?.customerProfile
    ? { ...defaultProfile, ...customer.customerProfile, tags: customer.customerProfile.tags ?? [] }
    : { ...defaultProfile }
  const recentOrders = (customer as any)?.recentOrders ?? []
  const tags = profile.tags ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full space-y-0 overflow-y-auto p-0 sm:max-w-3xl" side="right">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SheetHeader className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <SheetTitle className="text-2xl">Hồ sơ khách hàng</SheetTitle>
                <SheetDescription>Chi tiết đầy đủ về khách hàng và lịch sử tương tác</SheetDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <IconEdit className="mr-2 h-4 w-4" /> Chỉnh sửa
                </Button>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="px-6 py-4">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {!isLoading && customer && (
            <div className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      {customer.firstName || customer.lastName
                        ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                        : customer.username || customer.email}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Khách hàng từ {formatDateTime(customer.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${customer.email}`}>
                        <IconMail className="h-4 w-4" />
                      </a>
                    </Button>
                    {customer.phone && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${customer.phone}`}>
                          <IconPhone className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn('capitalize', tierAccent[customer.loyaltyTier])}>{customer.loyaltyTier}</Badge>
                  <Badge variant="secondary" className="capitalize">{customer.customerSegment}</Badge>
                  <Badge variant="outline">Engagement {customer.engagementScore}/100</Badge>
                  {customer.rfm && <Badge variant="outline">R {customer.rfm.r} • F {customer.rfm.f} • M {customer.rfm.m}</Badge>}
                </div>
                <Separator />
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconMail className="h-4 w-4" /> 
                    <span>{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconPhone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.primaryAddress?.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconMapPin className="h-4 w-4" />
                      <span>{customer.primaryAddress.street}, {customer.primaryAddress.district}, {customer.primaryAddress.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Tổng chi tiêu" value={currencyFormatter.format(Math.round(customer.totalSpent || 0))} />
              <StatCard label="Số đơn hàng" value={`${customer.totalOrders} đơn`} />
              <StatCard label="AOV" value={currencyFormatter.format(Math.round(customer.averageOrderValue || 0))} />
              <StatCard label="Lần mua cuối" value={formatDateTime(customer.lastOrderDate, locale)} />
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
                <TabsTrigger value="addresses">Địa chỉ</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="mb-3 font-semibold">Thông tin liên hệ</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.primaryAddress && (
                      <div className="flex items-start gap-2">
                        <IconUser className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{customer.primaryAddress.street}, {customer.primaryAddress.district}, {customer.primaryAddress.city}</span>
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Kênh ưu tiên</p>
                        <p className="font-medium capitalize">{profile.preferredChannel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Marketing opt-in</p>
                        <p className="font-medium">{profile.marketingOptIn ? 'Có' : 'Không'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <h4 className="mb-3 font-semibold">Tags & Ghi chú</h4>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {tags.length > 0 ? (
                        tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="capitalize">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Chưa có tag</p>
                      )}
                    </div>
                    <Separator />
                    <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground min-h-16">
                      {profile.notes?.trim() || 'Chưa có ghi chú cho khách hàng này.'}
                    </p>
                  </div>
                </div>

                {customer.insights?.length ? (
                  <div className="rounded-lg border bg-card p-4">
                    <h4 className="mb-3 font-semibold">Insights</h4>
                    <ul className="space-y-2 text-sm">
                      {customer.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 rounded-md bg-primary/5 p-3">
                          <IconCalendarClock className="h-4 w-4 text-primary mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-lg border bg-card p-4">
                  <h4 className="mb-3 font-semibold">Hoạt động gần đây</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconActivity className="h-4 w-4" />
                      <span>Last login: {formatDateTime((customer as any).lastLogin, locale)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconCalendarClock className="h-4 w-4" />
                      <span>Updated: {formatDateTime(customer.updatedAt, locale)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconCalendarClock className="h-4 w-4" />
                      <span>Last order: {formatDateTime(customer.lastOrderDate, locale)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                {customer.primaryAddress && (
                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <h4 className="mb-3 font-semibold text-sm">Địa chỉ giao hàng mặc định</h4>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{customer.primaryAddress.street}</p>
                      <p className="text-muted-foreground">{customer.primaryAddress.district}, {customer.primaryAddress.city}</p>
                      {customer.primaryAddress.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground mt-2">
                          <IconPhone className="h-4 w-4" />
                          <span>{customer.primaryAddress.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {recentOrders.length === 0 ? (
                  <div className="rounded-lg border bg-card p-8 text-center">
                    <p className="text-muted-foreground">Chưa có đơn hàng</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Đơn hàng gần đây</h4>
                    {recentOrders.map((order: any) => (
                      <div key={order._id} className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">{formatDateTime(order.createdAt, locale)}</span>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                        <p className="text-lg font-bold">{currencyFormatter.format(Math.round(order.totalPrice || 0))}</p>
                        <p className="text-xs text-muted-foreground mt-1">{order.paymentMethod}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="addresses" className="space-y-3 text-sm">
                {customer.addresses && customer.addresses.length > 0 ? (
                  customer.addresses.map((address, index) => (
                    <div key={index} className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                      <p className="font-medium">{address.street}</p>
                      <p className="text-xs text-muted-foreground mt-1">{address.district}, {address.city}</p>
                      {address.phone && <p className="text-xs text-muted-foreground mt-0.5">{address.phone}</p>}
                      {address.isDefault && <Badge className="mt-2" variant="secondary">Địa chỉ mặc định</Badge>}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border bg-card p-8 text-center">
                    <p className="text-muted-foreground">Chưa có địa chỉ</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
