import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "@/components/metric-card"

export default function InventoryPage() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Adjust Stock
          </Button>
        </div>

        {/* Inventory Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Stock Value"
            value="$45,280"
            change={3.2}
            trend="up"
          />
          <MetricCard
            title="Low Stock Items"
            value="23"
            change={5}
            trend="up"
          />
          <MetricCard
            title="Out of Stock"
            value="8"
            change={-2}
            trend="down"
          />
          <MetricCard
            title="Stock Turnover Rate"
            value="4.2x"
            change={1.5}
            trend="up"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconSearch className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by product name or SKU..." />
              </div>
              
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All Items</TabsTrigger>
                  <TabsTrigger value="in-stock">In Stock</TabsTrigger>
                  <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
                  <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <p className="text-muted-foreground">Inventory table coming soon...</p>
                </TabsContent>
                <TabsContent value="in-stock" className="mt-4">
                  <p className="text-muted-foreground">In stock items coming soon...</p>
                </TabsContent>
                <TabsContent value="low-stock" className="mt-4">
                  <p className="text-muted-foreground">Low stock items coming soon...</p>
                </TabsContent>
                <TabsContent value="out-of-stock" className="mt-4">
                  <p className="text-muted-foreground">Out of stock items coming soon...</p>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
