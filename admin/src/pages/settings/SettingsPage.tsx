import { AdminLayout } from "@/layouts/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconCheck } from "@tabler/icons-react"

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Settings & System</h1>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name</label>
                  <Input defaultValue="Devenir Fashion" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Email</label>
                  <Input defaultValue="contact@devenir.shop" type="email" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input defaultValue="+84 1234 567 890" />
                </div>
                <Button>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Configure payment gateways and methods</p>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium">PayOS / VNPAY Configuration</h3>
                    <p className="text-sm text-muted-foreground mt-1">Bank transfer and QR code payments</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium">Coinbase Commerce</h3>
                    <p className="text-sm text-muted-foreground mt-1">Cryptocurrency payments</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium">Cash on Delivery (COD)</h3>
                    <p className="text-sm text-muted-foreground mt-1">Payment on delivery configuration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Server</label>
                  <Input placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Port</label>
                  <Input placeholder="587" />
                </div>
                <Button>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Save Email Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Users & Roles Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User management and permissions coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Third-party integrations configuration coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System audit logs coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
