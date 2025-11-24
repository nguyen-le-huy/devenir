import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "@/components/metric-card"
import { IconDownload } from "@tabler/icons-react"

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <Button variant="outline">
            <IconDownload className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value="$45,280.50"
            change={12.5}
            trend="up"
          />
          <MetricCard
            title="Total Orders"
            value="1,234"
            change={8.2}
            trend="up"
          />
          <MetricCard
            title="Avg Order Value"
            value="$36.75"
            change={-3.2}
            trend="down"
          />
          <MetricCard
            title="Conversion Rate"
            value="4.5%"
            change={0.8}
            trend="up"
          />
        </div>

        <Tabs defaultValue="sales">
          <TabsList>
            <TabsTrigger value="sales">Sales Reports</TabsTrigger>
            <TabsTrigger value="products">Product Reports</TabsTrigger>
            <TabsTrigger value="customers">Customer Reports</TabsTrigger>
            <TabsTrigger value="marketing">Marketing Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Sales charts and reports coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Product performance data coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Customer insights coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketing" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Marketing campaign performance coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
