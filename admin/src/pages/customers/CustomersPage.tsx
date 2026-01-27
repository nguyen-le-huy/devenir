import { useState } from 'react'
import {
  IconDownload,
  IconFilter,
  IconMailForward,
  IconRefresh,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/common/Stats/MetricCard'
import { useLocale } from '@/contexts/LocaleContext'
import type { CustomerListFilters } from '@/services/customerService'
import { useCustomerList, useCustomerOverview, useCustomerDetail } from '@/hooks/useCustomers'
import {
  CustomerFilters,
  CustomerTable,
  CustomerDetailDrawer,
} from '@/components/customers'

const defaultFilters: CustomerListFilters = {
  page: 1,
  limit: 10,
  segment: 'all',
  status: 'all',
  tier: 'all',
  channel: 'all',
  period: 'all',
  sort: 'recent',
  tags: [],
  marketingOptIn: 'all',
  rfmSegment: undefined,
  spendMin: undefined,
  spendMax: undefined,
  ordersMin: undefined,
  ordersMax: undefined,
  city: undefined,
  province: undefined,
}

const formatNumber = (value?: number | null, locale: string = 'vi') => {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')
}

const formatCurrency = (value: number, locale: string) => {
  const formatter = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: locale === 'vi' ? 'VND' : 'USD',
    maximumFractionDigits: 0,
  })
  return formatter.format(Math.round(value || 0))
}

export default function CustomersPage() {
  const { locale } = useLocale()
  const [filters, setFilters] = useState<CustomerListFilters>(defaultFilters)
  const [isDetailOpen, setDetailOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>()

  // Fetch data with React Query
  const { data: overviewData, isLoading: overviewLoading } = useCustomerOverview()
  const { data: customersData, isLoading: customersLoading } = useCustomerList(filters)
  const { data: customerDetail, isLoading: detailLoading } = useCustomerDetail(selectedCustomerId)

  const handleFiltersChange = (updates: Partial<CustomerListFilters>) => {
    setFilters(prev => {
      const shouldResetPage = Object.keys(updates).some(key => !['page', 'limit'].includes(key))
      return {
        ...prev,
        ...updates,
        page: updates.page ?? (shouldResetPage ? 1 : prev.page),
        limit: updates.limit ?? prev.limit,
      }
    })
  }

  const handleResetFilters = () => {
    setFilters(defaultFilters)
  }

  // Extract data from API responses
  const overview = overviewData?.data
  const customers = customersData?.data || []
  const pagination = customersData?.pagination || { page: 1, limit: 10, total: 0, pages: 1 }
  const segments = overview?.distribution?.segments || []
  const insights = overview?.insights || []
  const metaTags = customersData?.meta?.tags || []
  const selectedCustomer = customerDetail?.data

  const currencyFormatter = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: locale === 'vi' ? 'VND' : 'USD',
    maximumFractionDigits: 0,
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary flex items-center gap-2"><IconSparkles className="h-4 w-4" /> Customer 360</p>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý khách hàng</h1>
            <p className="text-muted-foreground">Phân tích toàn diện, phân khúc RFM, và quản lý chiến dịch marketing.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={overviewLoading}>
              <IconRefresh className="mr-2 h-4 w-4" /> Làm mới
            </Button>
            <Button variant="outline">
              <IconDownload className="mr-2 h-4 w-4" /> Xuất CSV
            </Button>
            <Button>
              <IconMailForward className="mr-2 h-4 w-4" /> Gửi email chiến dịch
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Tổng khách hàng"
            value={formatNumber(overview?.totals?.totalCustomers, locale)}
            change={overview?.totals?.growth?.totalCustomers ?? undefined}
            trend={(overview?.totals?.growth?.totalCustomers ?? 0) >= 0 ? 'up' : 'down'}
          />
          <MetricCard
            title="Khách mới tháng này"
            value={formatNumber(overview?.totals?.newThisMonth, locale)}
            change={overview?.totals?.growth?.newThisMonth ?? undefined}
            trend={(overview?.totals?.growth?.newThisMonth ?? 0) >= 0 ? 'up' : 'down'}
          />
          <MetricCard
            title="Repeat Customer Rate"
            value={overview?.revenue?.repeatPurchaseRate ? `${overview.revenue.repeatPurchaseRate.toFixed(1)}%` : '—'}
            change={undefined}
            trend="neutral"
          />
          <MetricCard
            title="AOV"
            value={overview?.revenue?.avgOrderValue ? formatCurrency(overview.revenue.avgOrderValue, locale) : '—'}
            change={undefined}
            trend="neutral"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[3fr_1fr]">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Danh sách khách hàng</CardTitle>
                  <CardDescription>Lọc nâng cao, bulk actions, preview RFM.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline"><IconFilter className="mr-2 h-4 w-4" /> Bulk: thêm tag</Button>
                  <Button variant="outline"><IconUsers className="mr-2 h-4 w-4" /> Gộp trùng</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CustomerFilters
                filters={filters}
                onChange={handleFiltersChange}
                onReset={handleResetFilters}
                metaTags={metaTags}
              />

              <CustomerTable
                customers={customers}
                isLoading={customersLoading}
                pagination={pagination}
                locale={locale}
                currencyFormatter={currencyFormatter}
                onSelect={(c) => { setSelectedCustomerId(c._id); setDetailOpen(true) }}
                onView={(c) => { setSelectedCustomerId(c._id); setDetailOpen(true) }}
                onPageChange={(page) => handleFiltersChange({ page })}
                onPageSizeChange={(limit) => handleFiltersChange({ limit, page: 1 })}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Phân bổ phân khúc</CardTitle>
                <CardDescription>Tổng {overview?.totals?.totalCustomers || 0} khách hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {segments.length === 0 && !overviewLoading && (
                  <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
                )}
                {segments.map(segment => {
                  const totalCustomers = overview?.totals?.totalCustomers || 1
                  const ratio = (segment.count / totalCustomers) * 100
                  return (
                    <div key={segment.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{segment.label}</span>
                        <span>{segment.count} ({ratio.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><IconSparkles className="h-4 w-4" /> Insight nổi bật</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {insights.length === 0 && !overviewLoading && (
                  <p className="text-muted-foreground">Chưa có insight</p>
                )}
                {insights.map((insight, index) => (
                  <div key={`${insight}-${index}`} className="rounded-md border bg-muted/40 p-2">
                    {insight}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CustomerDetailDrawer
        open={isDetailOpen}
        onOpenChange={setDetailOpen}
        customer={selectedCustomer as any}
        isLoading={detailLoading}
        currencyFormatter={currencyFormatter}
        locale={locale}
      />
    </AdminLayout>
  )
}
