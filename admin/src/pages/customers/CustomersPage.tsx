import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "@/components/metric-card"

export default function CustomersPage() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Customer Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Customers"
            value="12,345"
            change={8.2}
            trend="up"
          />
          <MetricCard
            title="New This Month"
            value="234"
            change={-2.5}
            trend="down"
          />
          <MetricCard
            title="VIP Customers"
            value="456"
            change={12.3}
            trend="up"
          />
          <MetricCard
            title="Avg Order Value"
            value="$125.40"
            change={5.1}
            trend="up"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconSearch className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search customers by name or email..." />
              </div>
              
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All Customers</TabsTrigger>
                  <TabsTrigger value="vip">VIP</TabsTrigger>
                  <TabsTrigger value="regular">Regular</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <p className="text-muted-foreground">Customers list coming soon...</p>
                </TabsContent>
                <TabsContent value="vip" className="mt-4">
                  <p className="text-muted-foreground">VIP customers coming soon...</p>
                </TabsContent>
                <TabsContent value="regular" className="mt-4">
                  <p className="text-muted-foreground">Regular customers coming soon...</p>
                </TabsContent>
                <TabsContent value="inactive" className="mt-4">
                  <p className="text-muted-foreground">Inactive customers coming soon...</p>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
