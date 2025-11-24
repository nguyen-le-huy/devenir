import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function OrdersPage() {
  const orderStats = [
    { status: "All Orders", count: 1234, variant: "secondary" as const },
    { status: "Pending", count: 45, variant: "destructive" as const },
    { status: "Paid", count: 234, variant: "default" as const },
    { status: "Shipped", count: 123, variant: "secondary" as const },
    { status: "Delivered", count: 832, variant: "secondary" as const },
  ]

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {orderStats.map((stat) => (
            <Badge key={stat.status} variant={stat.variant}>
              {stat.status} ({stat.count})
            </Badge>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconSearch className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search orders by ID, customer name or email..." />
              </div>
              
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All Orders</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="shipped">Shipped</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <p className="text-muted-foreground">Orders list coming soon...</p>
                </TabsContent>
                <TabsContent value="pending" className="mt-4">
                  <p className="text-muted-foreground">Pending orders coming soon...</p>
                </TabsContent>
                <TabsContent value="paid" className="mt-4">
                  <p className="text-muted-foreground">Paid orders coming soon...</p>
                </TabsContent>
                <TabsContent value="shipped" className="mt-4">
                  <p className="text-muted-foreground">Shipped orders coming soon...</p>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
