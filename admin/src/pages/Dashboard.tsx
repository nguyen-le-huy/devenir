import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { MetricCard } from "@/components/common/Stats/MetricCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconCurrencyDollar,
  IconUsers,
  IconShoppingCart,
  IconTrendingUp,
  IconArrowRight,
  IconCalendar,
} from "@tabler/icons-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useCustomerOverview } from "@/hooks/useCustomers"
import { useOrderStats, useOrderList } from "@/hooks/useOrders"
import { useInventoryAlerts } from "@/hooks/useInventory"
import { useProductsQuery } from "@/hooks/useProductsQuery"
import { useCategoriesQuery } from "@/hooks/useCategoriesQuery"

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "90 ngày", value: "90d" },
  { label: "Năm nay", value: "ytd" },
  { label: "Năm ngoái (test)", value: "prev-year" },
]

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount)

const toISODate = (d: Date) => d.toISOString().split("T")[0]

const getPeriodDateRange = (period: string) => {
  const end = new Date()
  const start = new Date()
  switch (period) {
    case "7d":       start.setDate(end.getDate() - 6); break
    case "30d":      start.setDate(end.getDate() - 29); break
    case "90d":      start.setDate(end.getDate() - 89); break
    case "ytd":      start.setMonth(0, 1); break
    case "prev-year": {
      const prevYear = end.getFullYear() - 1
      start.setFullYear(prevYear, 0, 1)   // Jan 1 of last year
      end.setFullYear(prevYear, 11, 31)   // Dec 31 of last year
      break
    }
    default: start.setDate(end.getDate() - 29)
  }
  return { startDate: toISODate(start), endDate: toISODate(end) }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()

  // ── Period selector state ──────────────────────────────────────────────────
  const [selectedPeriod, setSelectedPeriod] = useState("30d")

  // ── Chart date range state — initialised to match the default period ───────
  const [chartStart, setChartStart] = useState(() => getPeriodDateRange("30d").startDate)
  const [chartEnd, setChartEnd]     = useState(() => getPeriodDateRange("30d").endDate)

  // Sync chart date range whenever the period selector changes
  useEffect(() => {
    const range = getPeriodDateRange(selectedPeriod)
    setChartStart(range.startDate)
    setChartEnd(range.endDate)
  }, [selectedPeriod])

  // ── Computed period date range ─────────────────────────────────────────────
  const periodRange = useMemo(() => getPeriodDateRange(selectedPeriod), [selectedPeriod])

  // ── Data fetching ──────────────────────────────────────────────────────────

  // Order stats — backend supports: 7d | 30d | 90d | ytd only.
  // For "prev-year" we fall back to "30d" here and derive all metrics from
  // bulkOrdersData below (which IS fetched for the correct date range).
  const orderStatsPeriod = selectedPeriod === "prev-year" ? "30d" : selectedPeriod
  const { data: orderStatsData, isLoading: orderStatsLoading } =
    useOrderStats(orderStatsPeriod)

  // Customer overview (point-in-time, customer side has no period filter)
  const { data: customerData, isLoading: customerLoading } = useCustomerOverview()

  // Recent orders (5 newest, no period filter)
  const { data: recentOrdersData, isLoading: recentOrdersLoading } = useOrderList({
    limit: 5,
    sort: "newest",
  })

  // Orders for chart — fetched using the chart date range chosen by the user.
  // This queries the Order collection directly so it always reflects real data.
  const { data: chartOrdersData, isLoading: chartOrdersLoading } = useOrderList({
    limit: 500,
    sort: "newest",
    startDate: chartStart,
    endDate: chartEnd,
  })

  // Bulk orders in selected period (for payment + product + category charts)
  const { data: bulkOrdersData } = useOrderList({
    limit: 200,
    sort: "newest",
    startDate: periodRange.startDate,
    endDate: periodRange.endDate,
  })

  // Products + categories for the category sales chart
  const { data: productsData } = useProductsQuery({ limit: 200 })
  const { data: categoriesData } = useCategoriesQuery()

  // Inventory alerts
  const { data: alertsData, isLoading: alertsLoading } = useInventoryAlerts()

  // ── Derived: revenue chart from order data (respects chartStart / chartEnd) ─

  const revenueChartData = useMemo(() => {
    if (!chartOrdersData?.data?.length) return []
    const dayMap = new Map<string, { revenue: number; orders: number }>()
    chartOrdersData.data.forEach((order) => {
      const day = order.createdAt.split("T")[0]
      const prev = dayMap.get(day) ?? { revenue: 0, orders: 0 }
      prev.revenue += order.totalPrice
      prev.orders += 1
      dayMap.set(day, prev)
    })
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        // Format as DD/MM for readable x-axis
        date: new Date(date + "T12:00:00").toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        ...data,
      }))
  }, [chartOrdersData])

  // ── Derived: top 5 selling products ───────────────────────────────────────

  const topProducts = useMemo(() => {
    if (!bulkOrdersData?.data?.length) return []
    const map = new Map<string, { name: string; sales: number; revenue: number }>()
    bulkOrdersData.data.forEach((order) => {
      order.orderItems.forEach((item) => {
        const prev = map.get(item.name) ?? { name: item.name, sales: 0, revenue: 0 }
        prev.sales += item.quantity
        prev.revenue += item.quantity * item.price
        map.set(item.name, prev)
      })
    })
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [bulkOrdersData])

  // ── Derived: payment methods distribution ─────────────────────────────────

  const paymentChartData = useMemo(() => {
    if (!bulkOrdersData?.data?.length) return []
    const counts: Record<string, number> = {}
    bulkOrdersData.data.forEach((order) => {
      counts[order.paymentMethod] = (counts[order.paymentMethod] ?? 0) + 1
    })
    const total = bulkOrdersData.data.length
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
    }))
  }, [bulkOrdersData])

  // ── Derived: sales by category ────────────────────────────────────────────

  const categoryChartData = useMemo(() => {
    if (!productsData?.data?.length || !bulkOrdersData?.data?.length) return []

    // Build product name → category name map
    const productCategoryMap = new Map<string, string>()
    productsData.data.forEach((product) => {
      let categoryName = "Khác"
      if (product.category) {
        if (typeof product.category === "object" && product.category.name) {
          categoryName = product.category.name
        } else if (typeof product.category === "string") {
          const found = Array.isArray(categoriesData)
            ? categoriesData.find((c: any) => c._id === product.category)
            : null
          if (found) categoryName = found.name
        }
      }
      productCategoryMap.set(product.name.toLowerCase().trim(), categoryName)
    })

    // Aggregate order items by category
    const categoryMap = new Map<string, { revenue: number; sales: number }>()
    bulkOrdersData.data.forEach((order) => {
      order.orderItems.forEach((item) => {
        const cat = productCategoryMap.get(item.name.toLowerCase().trim()) ?? "Khác"
        const prev = categoryMap.get(cat) ?? { revenue: 0, sales: 0 }
        prev.revenue += item.quantity * item.price
        prev.sales += item.quantity
        categoryMap.set(cat, prev)
      })
    })

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
  }, [productsData, bulkOrdersData, categoriesData])

  // ── Derived: scalar metrics ────────────────────────────────────────────────
  // For "prev-year" all order metrics are derived from bulkOrdersData because
  // useOrderStats does not support arbitrary date ranges.
  // For other periods, orderStatsData (from the /orders/stats endpoint) is used.

  const isPrevYear = selectedPeriod === "prev-year"

  // Revenue — sum totalPrice of paid/shipped/delivered orders in the period
  const currentRevenue = isPrevYear
    ? (bulkOrdersData?.data
        ?.filter((o) => ["paid", "shipped", "delivered"].includes(o.status))
        .reduce((sum, o) => sum + o.totalPrice, 0) ?? 0)
    : (orderStatsData?.data.revenue.total ?? 0)

  // Active orders — pending + paid + shipped
  const activeOrders = isPrevYear
    ? (bulkOrdersData?.data
        ?.filter((o) => ["pending", "paid", "shipped"].includes(o.status)).length ?? 0)
    : (orderStatsData
        ? orderStatsData.data.orders.pending +
          orderStatsData.data.orders.paid +
          orderStatsData.data.orders.shipped
        : 0)

  // Conversion rate — delivered / total (non-cancelled)
  const totalOrders = isPrevYear
    ? (bulkOrdersData?.data?.filter((o) => o.status !== "cancelled").length ?? 0)
    : (orderStatsData?.data.orders.total ?? 0)
  const deliveredOrders = isPrevYear
    ? (bulkOrdersData?.data?.filter((o) => o.status === "delivered").length ?? 0)
    : (orderStatsData?.data.orders.delivered ?? 0)
  const conversionRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0

  // Loading state — for prev-year wait for bulkOrdersData; otherwise follow orderStatsLoading
  const revenueLoading = isPrevYear ? !bulkOrdersData : orderStatsLoading

  const newCustomers   = customerData?.data.totals.newThisMonth ?? 0
  const customerGrowth = customerData?.data.totals.growth.newThisMonth ?? undefined
  const periodLabel    = PERIOD_OPTIONS.find((o) => o.value === selectedPeriod)?.label ?? ""
  const lowStockItems  = alertsData?.lowStock?.slice(0, 5) ?? []

  // ── Render ─────────────────────────────────────────────────────────────────

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

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Tổng quan hiệu suất cửa hàng của bạn.
                </p>
              </div>

              {/* Period selector */}
              <div className="flex items-center gap-2">
                <IconCalendar className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Thống kê theo:</span>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Key Metrics Cards ────────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {revenueLoading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : (
                <MetricCard
                  title="Doanh thu"
                  value={formatCurrency(currentRevenue)}
                  unit={periodLabel}
                  icon={<IconCurrencyDollar className="h-4 w-4" />}
                />
              )}

              {customerLoading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : (
                <MetricCard
                  title="Khách hàng mới"
                  value={newCustomers.toLocaleString("vi-VN")}
                  change={customerGrowth !== undefined ? customerGrowth : undefined}
                  trend={
                    customerGrowth !== undefined
                      ? customerGrowth >= 0 ? "up" : "down"
                      : "neutral"
                  }
                  unit="Tháng này"
                  icon={<IconUsers className="h-4 w-4" />}
                />
              )}

              {orderStatsLoading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : (
                <MetricCard
                  title="Đơn hàng đang xử lý"
                  value={activeOrders.toLocaleString("vi-VN")}
                  unit={periodLabel}
                  icon={<IconShoppingCart className="h-4 w-4" />}
                />
              )}

              {orderStatsLoading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : (
                <MetricCard
                  title="Tỉ lệ hoàn thành"
                  value={`${conversionRate.toFixed(1)}%`}
                  trend={conversionRate > 0 ? "up" : "neutral"}
                  unit={periodLabel}
                  icon={<IconTrendingUp className="h-4 w-4" />}
                />
              )}
            </div>

            {/* ── Revenue & Orders Chart ───────────────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Doanh thu & Đơn hàng</CardTitle>
                    {/* Chart date range picker */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground text-xs">Từ</span>
                      <input
                        type="date"
                        value={chartStart}
                        max={chartEnd}
                        onChange={(e) => setChartStart(e.target.value)}
                        className="border-input bg-background focus-visible:ring-ring/50 h-8 rounded-md border px-2 py-1 text-xs shadow-xs transition-[color,box-shadow] focus-visible:ring-2 focus-visible:outline-none"
                      />
                      <span className="text-muted-foreground text-xs">đến</span>
                      <input
                        type="date"
                        value={chartEnd}
                        min={chartStart}
                        max={toISODate(new Date())}
                        onChange={(e) => setChartEnd(e.target.value)}
                        className="border-input bg-background focus-visible:ring-ring/50 h-8 rounded-md border px-2 py-1 text-xs shadow-xs transition-[color,box-shadow] focus-visible:ring-2 focus-visible:outline-none"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartOrdersLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : revenueChartData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      Không có dữ liệu trong khoảng thời gian đã chọn
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            name === "revenue" ? formatCurrency(Number(value)) : value,
                            name === "revenue" ? "Doanh thu" : "Đơn hàng",
                          ]}
                        />
                        <Legend
                          formatter={(value) =>
                            value === "revenue" ? "Doanh thu" : "Đơn hàng"
                          }
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" name="revenue" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="orders" fill="#10b981" name="orders" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Selling Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sản phẩm bán chạy</CardTitle>
                </CardHeader>
                <CardContent>
                  {!bulkOrdersData ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : topProducts.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Chưa có dữ liệu trong kỳ này
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {topProducts.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between border-b pb-2 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.sales.toLocaleString("vi-VN")} đã bán
                            </p>
                          </div>
                          <p className="ml-2 shrink-0 text-sm font-semibold">
                            {formatCurrency(product.revenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Category Sales & Payment Distribution ───────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">

              {/* Sales by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Doanh số theo danh mục</CardTitle>
                </CardHeader>
                <CardContent>
                  {!productsData || !bulkOrdersData ? (
                    <Skeleton className="h-[260px] w-full" />
                  ) : categoryChartData.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                      Chưa có dữ liệu trong kỳ này
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {/* Pie chart */}
                      <div className="shrink-0">
                        <ResponsiveContainer width={180} height={200}>
                          <PieChart>
                            <Pie
                              data={categoryChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="revenue"
                            >
                              {categoryChartData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [formatCurrency(Number(value)), "Doanh thu"]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Custom legend */}
                      <div className="min-w-0 flex-1 space-y-2">
                        {categoryChartData.map((item, index) => {
                          const totalRevenue = categoryChartData.reduce((s, c) => s + c.revenue, 0)
                          const pct = totalRevenue > 0
                            ? Math.round((item.revenue / totalRevenue) * 100)
                            : 0
                          return (
                            <div key={index} className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="truncate text-sm font-medium">{item.name}</span>
                                  <span className="ml-1 shrink-0 text-xs font-semibold text-muted-foreground">
                                    {pct}%
                                  </span>
                                </div>
                                <div className="bg-muted mt-0.5 h-1.5 w-full overflow-hidden rounded-full">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {item.sales.toLocaleString("vi-VN")} sp •{" "}
                                  {formatCurrency(item.revenue)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Phương thức thanh toán</CardTitle>
                </CardHeader>
                <CardContent>
                  {!bulkOrdersData ? (
                    <Skeleton className="h-[260px] w-full" />
                  ) : paymentChartData.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                      Chưa có dữ liệu trong kỳ này
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={paymentChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" unit="%" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => [`${value}%`, "Tỉ lệ"]} />
                        <Bar dataKey="value" fill="#3b82f6" name="Tỉ lệ (%)" radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Recent Orders & Low Stock Alerts ────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-2">

              {/* Recent Orders */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Đơn hàng gần đây</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate("/admin/orders")}>
                    Xem tất cả
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentOrdersLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đơn</TableHead>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Tổng tiền</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrdersData?.data.map((order) => {
                          const displayName =
                            [order.user.firstName, order.user.lastName]
                              .filter(Boolean)
                              .join(" ") || order.user.email
                          return (
                            <TableRow key={order._id}>
                              <TableCell className="font-mono text-sm">
                                #{order._id.slice(-8).toUpperCase()}
                              </TableCell>
                              <TableCell className="text-sm">{displayName}</TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(order.totalPrice)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={order.status as any} />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {!recentOrdersData?.data?.length && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-4 text-center text-sm text-muted-foreground"
                            >
                              Chưa có đơn hàng
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Low Stock Alerts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Cảnh báo tồn kho thấp</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate("/admin/inventory/alerts")}>
                    Xem tất cả
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {alertsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Tồn kho</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockItems.map((item) => {
                          const productLabel = [item.product.name, item.size, item.color]
                            .filter(Boolean)
                            .join(" - ")
                          return (
                            <TableRow key={item._id}>
                              <TableCell className="text-sm">
                                <div>{productLabel}</div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  {item.sku}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold text-red-600">
                                {item.quantity}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status="low-stock" />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {lowStockItems.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="py-4 text-center text-sm text-muted-foreground"
                            >
                              Không có sản phẩm tồn kho thấp
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
