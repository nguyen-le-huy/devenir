# Admin Dashboard - Quick Reference Guide

## 🚀 Quick Start

### Start the dev server

```bash
cd admin
npm run dev
```

### Access the dashboard

```
http://localhost:5173/admin
```

---

## 📂 File Organization

```
admin/src/
├── App.tsx                          # Main router (30+ routes)
├── pages/
│   ├── Dashboard.tsx               # Main dashboard with metrics & charts
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── products/ProductsPage.tsx
│   ├── orders/OrdersPage.tsx
│   ├── customers/CustomersPage.tsx
│   ├── inventory/InventoryPage.tsx
│   ├── marketing/PromotionsPage.tsx
│   ├── analytics/AnalyticsPage.tsx
│   ├── settings/SettingsPage.tsx
│   ├── chatbot/ChatbotPage.tsx
│   └── index.ts                    # Page exports
├── components/
│   ├── app-sidebar.tsx             # Navigation sidebar
│   ├── site-header.tsx             # Top navigation bar
│   ├── metric-card.tsx             # Metric card component
│   ├── status-badge.tsx            # Status badge component
│   ├── index.ts                    # Component exports
│   └── ui/                         # Shadcn UI components
├── layouts/
│   └── AdminLayout.tsx             # Main layout wrapper
└── ...
```

---

## 🧩 Using Components

### MetricCard

```tsx
import { MetricCard } from "@/components";

<MetricCard
  title="Total Revenue"
  value="$45,280.50"
  change={12.5}
  trend="up"
  unit="This month"
  icon={<IconCurrencyDollar className="h-4 w-4" />}
/>;
```

### StatusBadge

```tsx
import { StatusBadge } from "@/components"

<StatusBadge status="paid" />
<StatusBadge status="low-stock" />
<StatusBadge status="active" />
```

### AdminLayout

```tsx
import { AdminLayout } from "@/layouts/AdminLayout";

export default function MyPage() {
  return (
    <AdminLayout>
      <h1>Your Page Title</h1>
      {/* Your content here */}
    </AdminLayout>
  );
}
```

---

## 🎨 Colors & Styling

### Primary Colors

```
Primary: Brand color
Success: #10b981
Warning: #f59e0b
Danger: #ef4444
Info: #3b82f6
```

### Using Tailwind Classes

```tsx
// Text colors
className = "text-destructive"; // Red
className = "text-success"; // Green

// Background colors
className = "bg-primary";
className = "bg-secondary";

// Responsive
className = "hidden md:flex";
className = "grid gap-4 md:grid-cols-2 lg:grid-cols-4";
```

---

## 📊 Charts

### Using Recharts

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="value" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>;
```

---

## 🔗 Navigation Routes

### Main Routes

```
/admin                          Dashboard
/admin/products                 Products
/admin/orders                   Orders
/admin/customers                Customers
/admin/inventory                Inventory
/admin/promotions               Promotions
/admin/analytics                Analytics
/admin/chatbot                  Chatbot
/admin/settings                 Settings
```

### Sub Routes

```
/admin/products/new             Create Product
/admin/products/:id             Edit Product
/admin/orders/:id               Order Details
/admin/customers/:id            Customer Profile
/admin/inventory/alerts         Low Stock Alerts
/admin/promotions/new           Create Promotion
/admin/reports/revenue          Revenue Reports
/admin/settings/payment         Payment Settings
/admin/settings/email           Email Settings
```

---

## 🎯 Adding a New Page

### 1. Create Page File

```tsx
// src/pages/my-feature/MyFeaturePage.tsx
import { AdminLayout } from "@/layouts/AdminLayout";

export default function MyFeaturePage() {
  return (
    <AdminLayout>
      <h1>My Feature</h1>
    </AdminLayout>
  );
}
```

### 2. Add Route to App.tsx

```tsx
import MyFeaturePage from "./pages/my-feature/MyFeaturePage";

<Route path="/admin/my-feature" element={<MyFeaturePage />} />;
```

### 3. Add to Sidebar (app-sidebar.tsx)

```tsx
{
  title: "My Feature",
  url: "/admin/my-feature",
  icon: IconMyIcon,
}
```

---

## 📝 Using Tables

### Basic Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.col1}</TableCell>
        <TableCell>{item.col2}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>;
```

---

## 🔔 Icons

### Available Icon Sets

```tsx
import { IconPackage, IconShoppingCart, IconUsers } from "@tabler/icons-react";

// Usage
<IconPackage className="h-4 w-4" />;
```

### Common Icons

```
IconDashboard         - Dashboard
IconPackage          - Products
IconShoppingCart     - Orders
IconUsers            - Customers
IconDatabase         - Inventory
IconGift             - Promotions
IconChartBar         - Analytics
IconBrain            - AI/Chatbot
IconGear             - Settings
IconBell             - Notifications
IconPlus             - Add/Create
IconSearch           - Search
IconTrendingUp       - Trending up
IconTrendingDown     - Trending down
```

---

## 🎭 Using Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>

  <TabsContent value="tab1">Content for Tab 1</TabsContent>
  <TabsContent value="tab2">Content for Tab 2</TabsContent>
</Tabs>;
```

---

## 💬 Using Dropdowns

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

---

## 🔐 Responsive Classes

```tsx
// Hide on mobile, show on desktop
className = "hidden md:block";

// Show on mobile, hide on desktop
className = "md:hidden";

// Responsive grid
className = "grid gap-4 md:grid-cols-2 lg:grid-cols-4";

// Responsive text
className = "text-sm md:text-base lg:text-lg";
```

---

## 📱 Mobile Navigation

The sidebar automatically collapses on mobile devices:

- Hamburger menu button appears
- Icons show with tooltips
- Sidebar becomes a drawer/sheet

---

## 🎯 Sidebar Data Structure

Location: `src/components/app-sidebar.tsx`

```tsx
const data = {
  navigation: [
    {
      group: "Group Name",
      items: [
        {
          title: "Menu Item",
          url: "/admin/path",
          icon: IconName,
          badge: null,
          items: [
            // Optional sub-items
            {
              title: "Sub Item",
              url: "/admin/subpath",
              badge: 5, // Optional badge
            },
          ],
        },
      ],
    },
  ],
};
```

---

## 🔍 Search Feature

The header includes a smart search that can search:

- Orders (by order ID)
- Products (by name/SKU)
- Customers (by name/email)

Currently displays placeholder - connect to your search API.

---

## 🔔 Notifications

Notification dropdown in header shows:

- New orders
- Low stock alerts
- New product reviews
- Custom notifications

Currently displays mock data - connect to your notification system.

---

## ⚡ Performance Tips

1. **Use React Query** for data fetching
2. **Lazy load** heavy components
3. **Memoize** expensive components
4. **Paginate** large tables
5. **Use skeletons** for loading states

---

## 🐛 Common Issues & Solutions

### Issue: Sidebar not responding

**Solution**: Check browser console for errors, verify sidebar data structure

### Issue: Routes not working

**Solution**: Ensure page component exists, check App.tsx route definitions

### Issue: Icons not showing

**Solution**: Verify icon name is correct from @tabler/icons-react

### Issue: Styling broken

**Solution**: Check Tailwind CSS is running, verify className syntax

---

## 📚 Resources

- [Shadcn/ui Docs](https://ui.shadcn.com/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [Tabler Icons](https://tabler.io/icons)
- [React Router Docs](https://reactrouter.com/)
- [Recharts Docs](https://recharts.org/)

---

## 📞 Support

For questions about:

- **Layout**: Check `AdminLayout.tsx`
- **Navigation**: Check `app-sidebar.tsx`
- **Components**: Check `src/components/`
- **Routes**: Check `App.tsx`
- **Styling**: Check `tailwind.config.js`

---

## ✨ Happy Coding!

This admin dashboard is built to be:

- ✅ Easy to navigate
- ✅ Simple to extend
- ✅ Quick to develop
- ✅ Beautiful to use

Good luck with your development! 🚀
