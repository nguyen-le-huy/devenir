import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { IconAlertTriangle, IconDownload, IconPlus, IconRefresh, IconSparkles, IconTrash } from '@tabler/icons-react'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MetricCard } from '@/components/metric-card'
import { useLocale } from '@/contexts/LocaleContext'
import { useCustomerDetail, useCustomerList, useCustomerMutations, useCustomerOverview } from '@/hooks/useCustomers'
import type { CustomerDetailResponse, CustomerFormPayload, CustomerListFilters, CustomerListItem } from '@/services/customerService'
import { CustomerFilters } from './components/CustomerFilters'
import { CustomerTable } from './components/CustomerTable'
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer'
import { CustomerFormDrawer } from './components/CustomerFormDrawer'

const defaultFilters: CustomerListFilters = {
  page: 1,
  limit: 10,
  segment: 'all',
  status: 'all',
  tier: 'all',
  channel: 'all',
  period: '90d',
  sort: 'recent',
  tags: [],
}

const formatNumber = (value?: number, locale: string = 'vi') => {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')
}

type EditableCustomer = CustomerDetailResponse['data'] | CustomerListItem

export default function CustomersPage() {
  const { locale } = useLocale()
  const [filters, setFilters] = useState<CustomerListFilters>(defaultFilters)
  const [isDetailOpen, setDetailOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>()
  const [isFormOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingCustomer, setEditingCustomer] = useState<EditableCustomer | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EditableCustomer | null>(null)

  const currencyFormatter = useMemo(() => new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: locale === 'vi' ? 'VND' : 'USD',
    maximumFractionDigits: 0,
  }), [locale])

  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview } = useCustomerOverview()
  const overview = overviewData?.data

  const { data: customerList, isLoading: listLoading, error: listError, refetch: refetchList } = useCustomerList(filters)

  const { data: detailData, isLoading: detailLoading } = useCustomerDetail(isDetailOpen ? selectedCustomerId : undefined)

  const { createCustomer, updateCustomer, deleteCustomer } = useCustomerMutations()

  const handleFormDrawerChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingCustomer(undefined)
      setFormMode('create')
    }
  }

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

  const handleSelectCustomer = (customer: CustomerListItem) => {
    setSelectedCustomerId(customer._id)
    setDetailOpen(true)
  }

  const handleOpenCreate = () => {
    setFormMode('create')
    setEditingCustomer(undefined)
    setFormOpen(true)
  }

  const handleEditCustomer = (customer?: EditableCustomer) => {
    if (!customer) return
    setFormMode('edit')
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  const handleViewCustomer = (customer: CustomerListItem) => {
    setSelectedCustomerId(customer._id)
    setDetailOpen(true)
  }

  const handleDeleteRequest = (customer: EditableCustomer) => {
    setDeleteTarget(customer)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (payload: CustomerFormPayload) => {
    try {
      if (formMode === 'create') {
        await createCustomer.mutateAsync(payload)
        toast.success('Tạo khách hàng thành công')
      } else if (formMode === 'edit' && editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer._id, payload })
        toast.success('Cập nhật khách hàng thành công')
      }
      await Promise.all([refetchList(), refetchOverview()])
      handleFormDrawerChange(false)
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Không thể lưu khách hàng'
      toast.error(message)
    }
  }

  const handleExport = () => {
    const rows = customerList?.data
    if (!rows || rows.length === 0) {
      toast.info('Không có dữ liệu để xuất')
      return
    }
    const headers = ['Name', 'Email', 'Phone', 'Tier', 'Segment', 'TotalSpent', 'Orders', 'LastOrder']
    const csvRows = rows.map(row => {
      const name = row.firstName || row.lastName ? `${row.firstName || ''} ${row.lastName || ''}`.trim() : row.username || row.email
      const values = [
        name,
        row.email,
        row.phone ?? '',
        row.loyaltyTier,
        row.customerSegment,
        row.totalSpent,
        row.totalOrders,
        row.lastOrderDate ?? '',
      ]
      return values.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
    })
    const csvContent = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'customers.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCustomer.mutateAsync(deleteTarget._id)
      toast.success('Đã lưu trữ khách hàng')
      await Promise.all([refetchList(), refetchOverview()])
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      if (selectedCustomerId === deleteTarget._id) {
        setDetailOpen(false)
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Không thể xóa khách hàng'
      toast.error(message)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  const totalCustomers = overview?.totals.totalCustomers ?? 0
  const segments = overview?.distribution.segments ?? []
  const insights = overview?.insights ?? []

  const renderMetricValue = (value?: number) => {
    if (value === undefined || value === null) return '—'
    return formatNumber(Math.round(value), locale)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý khách hàng</h1>
            <p className="text-muted-foreground">Theo dõi toàn bộ hành trình và sức khỏe khách hàng để tối ưu doanh thu.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { refetchOverview(); refetchList(); }}>
              <IconRefresh className="mr-2 h-4 w-4" /> Cập nhật dữ liệu
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <IconDownload className="mr-2 h-4 w-4" /> Xuất CSV
            </Button>
            <Button onClick={handleOpenCreate}>
              <IconPlus className="mr-2 h-4 w-4" /> Khách hàng mới
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Tổng khách hàng"
            value={renderMetricValue(overview?.totals.totalCustomers)}
            change={overview?.totals.growth.totalCustomers ?? undefined}
            trend={overview && (overview.totals.growth.totalCustomers ?? 0) >= 0 ? 'up' : 'down'}
          />
          <MetricCard
            title="Khách mới trong tháng"
            value={renderMetricValue(overview?.totals.newThisMonth)}
            change={overview?.totals.growth.newThisMonth ?? undefined}
            trend={overview && (overview.totals.growth.newThisMonth ?? 0) >= 0 ? 'up' : 'down'}
          />
          <MetricCard
            title="Khách VIP"
            value={renderMetricValue(overview?.totals.vipCustomers)}
            change={overview?.totals.growth.vipCustomers ?? undefined}
            trend="up"
          />
          <MetricCard
            title="Avg. Order Value"
            value={overview ? currencyFormatter.format(Math.round(overview.revenue.avgOrderValue || 0)) : '—'}
            change={overview?.revenue.repeatPurchaseRate ?? undefined}
            trend="up"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[3fr_1.2fr]">
          <Card className="xl:col-span-1">
            <CardHeader className="gap-2">
              <CardTitle>Bảng điều khiển khách hàng</CardTitle>
              <CardDescription>Lọc, phân khúc và quản lý khách hàng theo thời gian thực.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CustomerFilters
                filters={filters}
                onChange={handleFiltersChange}
                onReset={handleResetFilters}
                metaTags={customerList?.meta.tags}
              />

              {listError && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <IconAlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p>Không thể tải danh sách khách hàng.</p>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => refetchList()}>
                      Thử lại
                    </Button>
                  </div>
                </div>
              )}

              <CustomerTable
                customers={customerList?.data}
                isLoading={listLoading}
                pagination={customerList?.pagination}
                locale={locale}
                currencyFormatter={currencyFormatter}
                onSelect={handleSelectCustomer}
                onView={handleViewCustomer}
                onEdit={(customer) => handleEditCustomer(customer)}
                onDelete={handleDeleteRequest}
                onPageChange={(page) => handleFiltersChange({ page })}
                onPageSizeChange={(limit) => handleFiltersChange({ limit, page: 1 })}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Phân bổ phân khúc</CardTitle>
                <CardDescription>Tổng {totalCustomers} khách hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {overviewLoading && <Skeleton className="h-32 w-full" />}
                {!overviewLoading && segments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có dữ liệu phân khúc.</p>
                )}
                {!overviewLoading && segments.map(segment => {
                  const ratio = totalCustomers ? (segment.count / totalCustomers) * 100 : 0
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
                <CardTitle className="text-base flex items-center gap-2">
                  <IconSparkles className="h-4 w-4" /> Insight nổi bật
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {overviewLoading && <Skeleton className="h-20 w-full" />}
                {!overviewLoading && insights.length === 0 && (
                  <p className="text-muted-foreground">Chưa có insight đủ dữ liệu.</p>
                )}
                {!overviewLoading && insights.map((insight, index) => (
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
        customer={detailData?.data}
        isLoading={detailLoading}
        onEdit={(customer) => {
          handleEditCustomer(customer)
          setDetailOpen(false)
        }}
        onDelete={(customer) => {
          handleDeleteRequest(customer)
        }}
        currencyFormatter={currencyFormatter}
        locale={locale}
      />

      <CustomerFormDrawer
        open={isFormOpen}
        onOpenChange={handleFormDrawerChange}
        mode={formMode}
        initialData={formMode === 'edit' ? editingCustomer : undefined}
        loading={createCustomer.isPending || updateCustomer.isPending}
        onSubmit={handleFormSubmit}
        onDelete={formMode === 'edit' && editingCustomer ? () => handleDeleteRequest(editingCustomer) : undefined}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận lưu trữ khách hàng</DialogTitle>
            <DialogDescription>
              Khách hàng sẽ bị đưa vào trạng thái lưu trữ và không còn xuất hiện trong danh sách chính.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{deleteTarget?.firstName || deleteTarget?.lastName ? `${deleteTarget?.firstName || ''} ${deleteTarget?.lastName || ''}`.trim() : deleteTarget?.email}</p>
            <p className="text-muted-foreground">{deleteTarget?.email}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={cancelDelete}>Hủy</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteCustomer.isPending}>
              <IconTrash className="mr-2 h-4 w-4" /> Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
