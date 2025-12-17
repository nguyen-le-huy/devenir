import { useMemo } from "react"
import type React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { MetricCard } from "@/components/metric-card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  IconCurrencyDollar,
  IconCash,
  IconShoppingCart,
  IconTrendingUp,
  IconTruckDelivery,
  IconRefresh,
} from "@tabler/icons-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useDashboardMetrics } from "@/hooks/useFinancialMetrics"
import { useShipmentList } from "@/hooks/useShipments"

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)

const formatDateTime = (value?: string) => (value ? format(new Date(value), 'dd/MM HH:mm', { locale: vi }) : '—')

export default function Dashboard() {
  const { data: metricsData, isLoading, isFetching, refetch } = useDashboardMetrics()
  const { data: shipmentData, isLoading: isLoadingShipments } = useShipmentList({ status: 'shipped' })

  const revenueSeries = useMemo(() => {
    const days = metricsData?.data?.revenueByDay || []
    return days.map((item) => {
      const { y, m, d } = item._id
      const dateLabel = format(new Date(y, m - 1, d), 'dd/MM', { locale: vi })
      return {
        date: dateLabel,
        revenue: item.revenue || 0,
        costs: item.costs || 0,
        netProfit: item.netProfit || 0,
        orders: item.orders || 0,
      }
    })
  }, [metricsData])

  const today = metricsData?.data?.today || { revenue: 0, costs: 0, netProfit: 0, orders: 0 }
  const thisMonth = metricsData?.data?.thisMonth || { revenue: 0, costs: 0, netProfit: 0, orders: 0 }
  const thisYear = metricsData?.data?.thisYear || { revenue: 0, costs: 0, netProfit: 0, orders: 0 }

  const shipments = shipmentData?.data || []
  const inTransitCount = shipments.filter((s) => s.status === 'shipped').length
  const deliveredCount = shipments.filter((s) => s.status === 'delivered').length

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">Hiển thị lợi nhuận, doanh thu và đơn hàng thời gian thực.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <IconRefresh className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-28 w-full" />)
              ) : (
                <>
                  <MetricCard
                    title="Lợi nhuận ròng hôm nay"
                    value={formatCurrency(today.netProfit)}
                    unit="Hôm nay"
                    icon={<IconCash className="h-4 w-4" />}
                  />
                  <MetricCard
                    title="Doanh thu hôm nay"
                    value={formatCurrency(today.revenue)}
                    unit="Hôm nay"
                    icon={<IconCurrencyDollar className="h-4 w-4" />}
                  />
                  <MetricCard
                    title="Đơn hàng hôm nay"
                    value={today.orders || 0}
                    unit="Đơn"
                    icon={<IconShoppingCart className="h-4 w-4" />}
                  />
                  <MetricCard
                    title="Lợi nhuận ròng tháng"
                    value={formatCurrency(thisMonth.netProfit)}
                    unit="Tháng này"
                    icon={<IconTrendingUp className="h-4 w-4" />}
                  />
                </>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Doanh thu & Lợi nhuận (7 ngày)</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : revenueSeries.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Chưa có dữ liệu doanh thu trong 7 ngày gần nhất.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3b82f6" name="Doanh thu" />
                        <Bar dataKey="netProfit" fill="#10b981" name="Lợi nhuận" />
                        <Bar dataKey="costs" fill="#f97316" name="Giá vốn" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vận chuyển đang giao</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Đang giao</div>
                      <div className="text-2xl font-bold">{inTransitCount}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Đã giao</div>
                      <div className="text-2xl font-bold">{deliveredCount}</div>
                    </div>
                  </div>
                  {isLoadingShipments ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : shipments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Không có đơn đang giao.</div>
                  ) : (
                    <div className="space-y-3">
                      {shipments.slice(0, 4).map((shipment) => (
                        <div key={shipment._id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-mono text-xs">#{shipment._id.slice(-8).toUpperCase()}</div>
                            <Badge variant={shipment.status === 'delivered' ? 'secondary' : 'default'} className="gap-1">
                              <IconTruckDelivery className="h-4 w-4" />
                              {shipment.status === 'delivered' ? 'Đã giao' : 'Đang giao'}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm font-medium">{shipment.orderItems?.[0]?.name || 'Đơn hàng'}</div>
                          <div className="mt-1 text-xs text-muted-foreground">ETA: {formatDateTime(shipment.estimatedDelivery)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tổng hợp tháng hiện tại</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {isLoading ? (
                    <Skeleton className="h-28 w-full" />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Doanh thu</span>
                        <span className="font-semibold">{formatCurrency(thisMonth.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Giá vốn</span>
                        <span>{formatCurrency(thisMonth.costs)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Lợi nhuận ròng</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(thisMonth.netProfit)}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Đơn hàng</span>
                        <span>{thisMonth.orders}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lũy kế năm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {isLoading ? (
                    <Skeleton className="h-28 w-full" />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Doanh thu</span>
                        <span className="font-semibold">{formatCurrency(thisYear.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Giá vốn</span>
                        <span>{formatCurrency(thisYear.costs)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Lợi nhuận ròng</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(thisYear.netProfit)}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Đơn hàng</span>
                        <span>{thisYear.orders}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Chi tiết vận chuyển mới nhất</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingShipments ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-12 w-full" />
                    ))}
                  </div>
                ) : shipments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Chưa có đơn vận chuyển.</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đơn</TableHead>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Giao dự kiến</TableHead>
                          <TableHead>Đã giao</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipments.slice(0, 8).map((shipment) => (
                          <TableRow key={shipment._id}>
                            <TableCell className="font-mono text-xs">{shipment._id.slice(-8).toUpperCase()}</TableCell>
                            <TableCell className="text-sm">
                              <div className="font-medium">{shipment.user?.firstName || shipment.user?.username || 'Khách'}</div>
                              <div className="text-xs text-muted-foreground">{shipment.shippingAddress?.city || shipment.user?.email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={shipment.status === 'delivered' ? 'secondary' : 'default'}>
                                {shipment.status === 'delivered' ? 'Đã giao' : 'Đang giao'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{formatDateTime(shipment.estimatedDelivery)}</TableCell>
                            <TableCell className="text-sm">{formatDateTime(shipment.deliveredAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
