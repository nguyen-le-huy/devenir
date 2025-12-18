import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { MetricCard } from "@/components/metric-card"
import { StatusBadge } from "@/components/status-badge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  IconCurrencyDollar,
  IconUsers,
  IconShoppingCart,
  IconTrendingUp,
  IconArrowRight,
} from "@tabler/icons-react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Sample data
const revenueData = [
  { date: "Mon", revenue: 2400, orders: 24 },
  { date: "Tue", revenue: 1398, orders: 21 },
  { date: "Wed", revenue: 9800, orders: 29 },
  { date: "Thu", revenue: 3908, orders: 20 },
  { date: "Fri", revenue: 4800, orders: 22 },
  { date: "Sat", revenue: 3800, orders: 19 },
  { date: "Sun", revenue: 4300, orders: 25 },
]

const topProducts = [
  { id: 1, name: "Classic White T-Shirt", sales: 234, revenue: "$8,760" },
  { id: 2, name: "Blue Denim Jeans", sales: 189, revenue: "$7,560" },
  { id: 3, name: "Black Polo Shirt", sales: 156, revenue: "$6,240" },
  { id: 4, name: "Gray Hoodie", sales: 134, revenue: "$5,360" },
  { id: 5, name: "Navy Blazer", sales: 123, revenue: "$4,920" },
]

const categoryData = [
  { name: "Áo", value: 35 },
  { name: "Quần", value: 28 },
  { name: "Giày", value: 22 },
  { name: "Khác", value: 15 },
]

const paymentData = [
  { name: "Bank Transfer", value: 45, color: "#3b82f6" },
  { name: "Crypto", value: 20, color: "#10b981" },
  { name: "COD", value: 35, color: "#f59e0b" },
]

const recentOrders = [
  {
    id: "ORD-001234",
    customer: "Nguyễn Văn A",
    email: "nguyena@example.com",
    total: "$156.80",
    status: "paid",
    date: "2025-01-15",
  },
  {
    id: "ORD-001233",
    customer: "Trần Thị B",
    email: "tranb@example.com",
    total: "$89.50",
    status: "shipped",
    date: "2025-01-14",
  },
  {
    id: "ORD-001232",
    customer: "Lê Văn C",
    email: "levanc@example.com",
    total: "$234.20",
    status: "delivered",
    date: "2025-01-14",
  },
  {
    id: "ORD-001231",
    customer: "Phạm Thị D",
    email: "phamd@example.com",
    total: "$123.45",
    status: "pending",
    date: "2025-01-13",
  },
  {
    id: "ORD-001230",
    customer: "Vũ Văn E",
    email: "vuve@example.com",
    total: "$67.99",
    status: "cancelled",
    date: "2025-01-13",
  },
]

const lowStockAlerts = [
  { product: "White T-Shirt (L)", sku: "WTS-L-WHT", stock: 5, reorderLevel: 20 },
  { product: "Blue Denim (32)", sku: "BDJ-32-BLU", stock: 3, reorderLevel: 15 },
  { product: "Black Polo (M)", sku: "BPL-M-BLK", stock: 8, reorderLevel: 25 },
  { product: "Gray Hoodie (XL)", sku: "GHD-XL-GRY", stock: 2, reorderLevel: 10 },
]

export default function Dashboard() {
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
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-2">Welcome back! Here's your store performance overview.</p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value="$45,280.50"
                change={12.5}
                trend="up"
                unit="This month"
                icon={<IconCurrencyDollar className="h-4 w-4" />}
              />
              <MetricCard
                title="New Customers"
                value="1,234"
                change={-2.5}
                trend="down"
                unit="This month"
                icon={<IconUsers className="h-4 w-4" />}
              />
              <MetricCard
                title="Active Orders"
                value="567"
                change={12.5}
                trend="up"
                unit="In progress"
                icon={<IconShoppingCart className="h-4 w-4" />}
              />
              <MetricCard
                title="Conversion Rate"
                value="4.5%"
                change={4.5}
                trend="up"
                unit="Last 30 days"
                icon={<IconTrendingUp className="h-4 w-4" />}
              />
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Revenue & Orders Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue & Orders (7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                      <Bar dataKey="orders" fill="#10b981" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                        </div>
                        <p className="font-semibold text-sm">{product.revenue}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category & Payment Distribution */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Sales by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Methods Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={paymentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" name="Orders (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders & Low Stock Alerts */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Recent Orders */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Button variant="outline" size="sm">
                    View All
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id}</TableCell>
                          <TableCell className="text-sm">{order.customer}</TableCell>
                          <TableCell className="font-semibold">{order.total}</TableCell>
                          <TableCell>
                            <StatusBadge status={order.status as any} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Low Stock Alerts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Low Stock Alerts</CardTitle>
                  <Button variant="outline" size="sm">
                    View All
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockAlerts.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell className="text-sm">
                            <div>{item.product}</div>
                            <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                          </TableCell>
                          <TableCell className="font-semibold text-red-600">{item.stock}</TableCell>
                          <TableCell>
                            <StatusBadge status="low-stock" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
