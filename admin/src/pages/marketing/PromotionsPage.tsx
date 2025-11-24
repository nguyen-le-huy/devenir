import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PromotionsPage() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Marketing & Promotions</h1>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            New Promotion
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Promotions Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconSearch className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search promotions by code..." />
              </div>
              
              <Tabs defaultValue="active">
                <TabsList>
                  <TabsTrigger value="active">Active Promotions</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="expired">Expired</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="mt-4">
                  <p className="text-muted-foreground">Active promotions coming soon...</p>
                </TabsContent>
                <TabsContent value="scheduled" className="mt-4">
                  <p className="text-muted-foreground">Scheduled promotions coming soon...</p>
                </TabsContent>
                <TabsContent value="expired" className="mt-4">
                  <p className="text-muted-foreground">Expired promotions coming soon...</p>
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  <p className="text-muted-foreground">All promotions coming soon...</p>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns and Loyalty tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Marketing Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="campaigns">
              <TabsList>
                <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
                <TabsTrigger value="loyalty">Loyalty Programs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="campaigns" className="mt-4">
                <p className="text-muted-foreground">Email campaigns management coming soon...</p>
              </TabsContent>
              <TabsContent value="loyalty" className="mt-4">
                <p className="text-muted-foreground">Loyalty programs management coming soon...</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
