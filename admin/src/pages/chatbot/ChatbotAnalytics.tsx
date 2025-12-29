import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconMessages, 
  IconRobot, 
  IconTrendingUp,
  IconShoppingCart,
  IconBrain
} from '@tabler/icons-react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import api from '@/services/api';
import { toast } from 'sonner';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899'
};

const CUSTOMER_TYPE_COLORS = {
  'VIP Premium': '#8b5cf6',
  'Loyal Customer': '#3b82f6',
  'High-Intent Browser': '#10b981',
  'Price-Conscious': '#f59e0b',
  'Window Shopper': '#ec4899',
  'New Visitor': '#6b7280'
};

export function ChatbotAnalyticsWidget() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/analytics/chatbot/dashboard?days=${period}`);
      setData(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <IconRobot className="h-12 w-12 animate-pulse text-muted-foreground" />
            <p className="text-muted-foreground">Đang tải analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Không có dữ liệu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chatbot Analytics</h2>
          <p className="text-muted-foreground">AI-powered customer interaction insights</p>
        </div>
        <Tabs value={period.toString()} onValueChange={(v) => setPeriod(parseInt(v))}>
          <TabsList>
            <TabsTrigger value="7">7 ngày</TabsTrigger>
            <TabsTrigger value="30">30 ngày</TabsTrigger>
            <TabsTrigger value="90">90 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <IconMessages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.avgMessagesPerSession.toFixed(1)} msg/session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personalization Rate</CardTitle>
            <IconBrain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.personalizationRate}%</div>
            <p className="text-xs text-muted-foreground">
              Using customer intelligence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Performance metric
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Shown</CardTitle>
            <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalProductsShown}</div>
            <p className="text-xs text-muted-foreground">
              Recommended in chat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="personalization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="customers">Customer Types</TabsTrigger>
          <TabsTrigger value="intents">Intents</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>

        {/* Personalization Tab */}
        <TabsContent value="personalization" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personalized vs Non-Personalized</CardTitle>
                <CardDescription>Performance comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    {
                      name: 'Sessions',
                      Personalized: data.personalization.personalized.sessions,
                      'Non-Personalized': data.personalization.nonPersonalized.sessions
                    },
                    {
                      name: 'Avg Messages',
                      Personalized: data.personalization.personalized.avgMessages,
                      'Non-Personalized': data.personalization.nonPersonalized.avgMessages
                    },
                    {
                      name: 'Engagement',
                      Personalized: data.personalization.personalized.avgEngagement,
                      'Non-Personalized': data.personalization.nonPersonalized.avgEngagement
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Personalized" fill={COLORS.primary} />
                    <Bar dataKey="Non-Personalized" fill={COLORS.warning} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personalization Impact</CardTitle>
                <CardDescription>Improvements from AI context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Message Increase</span>
                    <span className={`text-lg font-bold ${data.personalization.improvement.messageIncrease > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.personalization.improvement.messageIncrease > 0 ? '+' : ''}
                      {data.personalization.improvement.messageIncrease}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-600 rounded-full" 
                      style={{ width: `${Math.min(100, Math.abs(data.personalization.improvement.messageIncrease))}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement Increase</span>
                    <span className={`text-lg font-bold ${data.personalization.improvement.engagementIncrease > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.personalization.improvement.engagementIncrease > 0 ? '+' : ''}
                      {data.personalization.improvement.engagementIncrease}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-600 rounded-full" 
                      style={{ width: `${Math.min(100, Math.abs(data.personalization.improvement.engagementIncrease))}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Personalized sessions show <strong>{data.personalization.improvement.messageIncrease}%</strong> more engagement 
                    with <strong>{data.personalization.personalized.avgMessages.toFixed(1)}</strong> messages on average.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Types Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Type Distribution</CardTitle>
                <CardDescription>Who's using the chatbot</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.customerTypes}
                      dataKey="sessionCount"
                      nameKey="customerType"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {data.customerTypes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CUSTOMER_TYPE_COLORS[entry.customerType as keyof typeof CUSTOMER_TYPE_COLORS] || COLORS.primary} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement by Customer Type</CardTitle>
                <CardDescription>Average engagement scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.customerTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="customerType" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgEngagementScore" fill={COLORS.purple} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Intents Tab */}
        <TabsContent value="intents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intent Distribution</CardTitle>
              <CardDescription>What users are asking about</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.intents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="intent" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.success}>
                    {data.intents.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Chat Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.conversion.totalChatUsers}</div>
                <p className="text-xs text-muted-foreground">Used chatbot</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Cart Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{data.conversion.cartConversionRate}%</div>
                <p className="text-xs text-muted-foreground">{data.conversion.usersWithCartAdditions} added to cart</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Purchase Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{data.conversion.purchaseConversionRate}%</div>
                <p className="text-xs text-muted-foreground">{data.conversion.usersWithPurchases} completed purchase</p>
              </CardContent>
            </Card>
          </div>

          {data.trend && data.trend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Usage Trend</CardTitle>
                <CardDescription>Chat sessions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sessions" stroke={COLORS.primary} strokeWidth={2} />
                    <Line type="monotone" dataKey="personalizedSessions" stroke={COLORS.success} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
