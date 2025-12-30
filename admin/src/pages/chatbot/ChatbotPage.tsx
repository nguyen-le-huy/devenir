import { AdminLayout } from "@/layouts/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "@/components/common/Stats/MetricCard"

export default function ChatbotPage() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">AI Chatbot Management</h1>
          <Button>Configure Chatbot</Button>
        </div>

        {/* Chatbot Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Conversations"
            value="1,234"
            change={15.3}
            trend="up"
          />
          <MetricCard
            title="Avg Response Time"
            value="0.8s"
            change={-0.2}
            trend="down"
          />
          <MetricCard
            title="Satisfaction Rate"
            value="92%"
            change={2.1}
            trend="up"
          />
          <MetricCard
            title="Active Users"
            value="456"
            change={8.5}
            trend="up"
          />
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Common Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Common questions coming soon...</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Performance charts coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Upload and manage training documents...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversations" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversation History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Recent conversations coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chatbot Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Configure RAG parameters and behavior...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
