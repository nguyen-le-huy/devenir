# Admin Dashboard - Kiến trúc & Hướng dẫn sử dụng

## Tổng quan

Trang Admin của Devenir đã được thiết kế lại hoàn toàn với kiến trúc hiện đại, tổ chức theo nhóm chức năng logic, và giao diện trực quan dễ sử dụng.

## 📁 Cấu trúc thư mục mới

```
admin/src/
├── pages/
│   ├── Dashboard.tsx                      # Trang chính dashboard
│   ├── LoginPage.tsx                      # Đăng nhập
│   ├── SignupPage.tsx                     # Đăng ký
│   ├── products/
│   │   └── ProductsPage.tsx              # Quản lý sản phẩm
│   ├── orders/
│   │   └── OrdersPage.tsx                # Quản lý đơn hàng
│   ├── customers/
│   │   └── CustomersPage.tsx             # Quản lý khách hàng
│   ├── inventory/
│   │   └── InventoryPage.tsx             # Quản lý tồn kho
│   ├── marketing/
│   │   └── PromotionsPage.tsx            # Quản lý khuyến mãi
│   ├── analytics/
│   │   └── AnalyticsPage.tsx             # Báo cáo & phân tích
│   ├── settings/
│   │   └── SettingsPage.tsx              # Cài đặt hệ thống
│   └── chatbot/
│       └── ChatbotPage.tsx               # Quản lý AI Chatbot
├── components/
│   ├── app-sidebar.tsx                   # Sidebar navigation (updated)
│   ├── site-header.tsx                   # Top header (enhanced)
│   ├── metric-card.tsx                   # Reusable metric card component
│   ├── status-badge.tsx                  # Status badge component
│   └── ui/                               # Shadcn UI components
├── layouts/
│   └── AdminLayout.tsx                   # Layout wrapper cho tất cả pages
└── App.tsx                               # Router configuration (updated)
```

## 🎨 Sidebar Navigation - Cấu trúc Menu

Sidebar được chia thành **8 nhóm chính** với hệ thống biểu tượng rõ ràng:

### 1. **Dashboard & Overview**

- Dashboard (Trang chủ)
- Analytics (Phân tích chi tiết)

### 2. **Sales & Orders Management**

- Orders (Quản lý đơn hàng)
  - All Orders
  - Pending Orders (badge số lượng)
  - Paid Orders
  - Shipped Orders
- Shipments (Theo dõi vận chuyển)
- Returns & Refunds (Hoàn trả)

### 3. **Product Management**

- Products (Danh sách sản phẩm)
  - All Products
  - Add New Product
- Variants & SKUs (Quản lý SKU/màu/size)
- Categories (Danh mục)
- Brands (Thương hiệu)
- Inventory (Tồn kho)
  - Stock Overview
  - Stock Alerts (badge)

### 4. **Customer Management**

- Customers (Khách hàng)
  - All Customers
  - VIP Customers
- Customer Groups (Phân nhóm)
- Reviews (Đánh giá)

### 5. **Marketing & Promotions**

- Promotions (Khuyến mãi)
  - All Promotions
  - Create Promotion
- Email Campaigns (Chiến dịch email)
- Loyalty Programs (Chương trình tích điểm)

### 6. **Content Management**

- Media Library (Thư viện ảnh)
- Pages (Quản lý trang)
- Blog/News (Bài viết)

### 7. **AI & Automation**

- AI Chatbot (Quản lý RAG chatbot)
- Virtual Try-On (Thử đồ ảo)

### 8. **Financial Management**

- Revenue Reports (Báo cáo doanh thu)
- Payment Methods (Phương thức thanh toán)
- Transactions (Lịch sử giao dịch)

### 9. **System & Settings**

- Users & Roles (Quản lý admin)
- Audit Logs (Nhật ký hệ thống)
- Settings (Cài đặt)
  - General Settings
  - Payment Configuration
  - Email Settings
  - Integrations

## 🔝 Top Navigation Bar

**Bên trái:**

- Logo Devenir + tên dự án
- Toggle button để collapse/expand sidebar

**Giữa:**

- Search bar thông minh (tìm kiếm đơn hàng, sản phẩm, khách hàng)

**Bên phải:**

- 🔔 Notifications (Thông báo đơn hàng mới, hết hàng, review)
- ➕ Quick Actions (Tạo nhanh đơn hàng/sản phẩm/khuyến mãi)
- 🌙/☀️ Theme Toggle (Light/Dark mode)
- 🌍 Language Selector (VI/EN)
- 👤 User Profile (Avatar + Dropdown menu)

## 📊 Dashboard - Trang chủ

### Section 1: Key Metrics Cards (4 cards)

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Rev   │ New Cust    │ Active Ord  │ Conversion  │
│ $45,280.50  │ 1,234       │ 567         │ 4.5%        │
│ ↑ +12.5%    │ ↓ -2.5%     │ ↑ +12.5%    │ ↑ +4.5%     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Section 2: Charts & Visualization

- **Revenue & Orders Chart** (70%): Biểu đồ combo line + bar (7 ngày)
- **Top Selling Products** (30%): List 5 sản phẩm bán chạy

### Section 3: Distribution Charts

- **Sales by Category**: Pie chart (Áo, Quần, Giày, Khác)
- **Payment Methods Distribution**: Bar chart (Bank vs COD vs Crypto)

### Section 4: Operational Tables

- **Recent Orders**: 10 đơn mới nhất với status badge
- **Low Stock Alerts**: Các SKU sắp hết với thông báo

## 🔧 Components - Thành phần tái sử dụng

### MetricCard Component

```tsx
<MetricCard
  title="Total Revenue"
  value="$45,280.50"
  change={12.5}
  trend="up"
  unit="This month"
  icon={<IconCurrencyDollar />}
/>
```

**Props:**

- `title`: Tiêu đề metric
- `value`: Giá trị chính
- `change`: Phần trăm thay đổi
- `trend`: "up" | "down" | "neutral"
- `unit`: Đơn vị (tùy chọn)
- `icon`: Icon (tùy chọn)
- `color`: primary | success | warning | destructive | secondary

### StatusBadge Component

```tsx
<StatusBadge status="paid" />
<StatusBadge status="low-stock" />
<StatusBadge status="active" />
```

**Supported statuses:**

- Order: `pending`, `paid`, `shipped`, `delivered`, `cancelled`
- Inventory: `in-stock`, `low-stock`, `out-of-stock`
- Product: `active`, `inactive`, `draft`

### AdminLayout Wrapper

```tsx
<AdminLayout>
  <div>Your page content</div>
</AdminLayout>
```

Tất cả pages đều sử dụng layout này để có sidebar và header nhất quán.

## 🛣️ Routes Configuration

Tất cả routes được cấu hình trong `App.tsx`:

```
/admin                    → Dashboard
/admin/products           → Products List
/admin/products/new       → Create Product
/admin/products/:id       → Edit Product
/admin/orders             → Orders List
/admin/orders/:id         → Order Detail
/admin/customers          → Customers List
/admin/customers/:id      → Customer Profile
/admin/inventory          → Inventory Dashboard
/admin/promotions         → Promotions List
/admin/analytics          → Analytics & Reports
/admin/chatbot            → AI Chatbot Management
/admin/settings/*         → System Settings
```

## 🎯 Pages chi tiết

### ProductsPage

- Tab view: All, Active, Inactive, Draft
- Search & Filter: by name/SKU, category, brand, price, stock
- Bulk actions: Delete, Export, Update Price
- Grid/List view toggle

**Cấu trúc Form thêm/sửa sản phẩm:**

- Tab 1: Basic Information (name, description, category, brand, base price)
- Tab 2: Images & Media (upload, reorder, alt text)
- Tab 3: Variants Management (size, color, SKU, price, stock)
- Tab 4: SEO & Additional Info (meta title, slug, publish status)

### OrdersPage

- Status tabs: All, Pending, Paid, Shipped, Delivered, Cancelled
- Filters: Date range, payment method, customer search, price range
- Table columns: Order ID, Customer info, Items, Total, Status, Actions
- Order detail view with timeline, payment info, shipping

### CustomersPage

- Metrics cards: Total, New This Month, VIP, Avg Order Value
- Search & Filter by name, email, phone
- Customer segments: All, VIP, Regular, Inactive
- Customer profile: Personal info, addresses, order history, purchase analytics

### InventoryPage

- Overview cards: Total Stock Value, Low Stock Items, Out of Stock, Turnover Rate
- Inventory table: Product, Variant, SKU, Current Stock, Reserved, Available, Actions
- Stock Adjustment modal: Type (Add/Remove/Set), Quantity, Reason, Note
- Filters: All Items, In Stock, Low Stock, Out of Stock

### PromotionsPage

- Active Promotions cards: Code, Type, Discount, Dates, Usage
- Promotion form: Code, Type, Value, Min Order, Usage Limit, Date Range, Products/Categories
- Tabs: Promotions, Email Campaigns, Loyalty Programs

### AnalyticsPage

- Metrics cards: Total Revenue, Total Orders, Avg Order Value, Conversion Rate
- Tabs: Sales Reports, Product Reports, Customer Reports, Marketing Reports
- Export options: Excel, PDF, CSV

### SettingsPage

- Tabs: General, Payment, Email, Users & Roles, Integrations, Audit Logs
- Editable forms cho từng tab

### ChatbotPage

- Metrics: Total Conversations, Avg Response Time, Satisfaction Rate, Active Users
- Tabs: Dashboard, Knowledge Base, Conversations, Settings
- Knowledge base management, conversation history, performance analytics

## 🎨 Design System

**Colors:**

- Primary: Brand color của Devenir
- Success: #10b981
- Warning: #f59e0b
- Danger: #ef4444
- Info: #3b82f6

**Typography:**

- Headings: Inter
- Body: Inter
- Monospace: JetBrains Mono (cho SKU/codes)

**Components từ Shadcn/ui:**

- Badge, Table, Dialog, Dropdown Menu, Toast
- Tabs, Card, Checkbox, Input, Select
- Collapsible, Drawer, Separator

**Responsive Breakpoints:**

- Mobile: Sidebar collapse thành hamburger
- Tablet: 2-column layout
- Desktop: Full layout

## 🚀 Cách sử dụng

1. **Chạy dev server:**

   ```bash
   cd admin
   npm run dev
   ```

2. **Truy cập admin:**

   ```
   http://localhost:5173/admin
   ```

3. **Đăng nhập** (trang login chưa kết nối backend)

4. **Điều hướng** qua sidebar để truy cập các trang khác

## 📝 Next Steps - Tiếp theo

1. **Integrate with Backend APIs:**

   - Connect ProductsPage với `/api/products` endpoints
   - Connect OrdersPage với `/api/orders` endpoints
   - Connect CustomersPage với `/api/customers` endpoints
   - etc.

2. **Implement Data Tables:**

   - Thêm server-side pagination, sorting, filtering
   - Sử dụng React Query cho data fetching
   - Add loading/error states

3. **Add Form Validations:**

   - Dùng React Hook Form + Zod/Yup
   - Validations cho product form, order creation, etc.

4. **Implement Real-time Updates:**

   - WebSocket cho notifications
   - Real-time order status updates

5. **Authentication & Authorization:**

   - JWT token management
   - Role-based access control
   - Protect routes

6. **Export & Reporting:**

   - Excel export cho orders, customers, products
   - PDF invoice generation
   - CSV export

7. **Notifications System:**

   - Toast notifications cho actions
   - Real-time notification dropdown
   - Email notifications

8. **Search & Advanced Filters:**
   - Elasticsearch integration
   - Advanced filter combinations
   - Saved filters

## 📞 Troubleshooting

**Issue: Sidebar không hiển thị đúng**

- Check `app-sidebar.tsx` data structure
- Ensure icons từ `@tabler/icons-react` đúng tên

**Issue: Routes không hoạt động**

- Verify routes trong `App.tsx`
- Check path names match sidebar URLs

**Issue: Styling không nhất quán**

- Ensure TailwindCSS config correct
- Check Shadcn UI components imported đúng

---

## 📚 References

- [Shadcn/ui Components](https://ui.shadcn.com/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [React Router v7](https://reactrouter.com/)
- [Recharts Documentation](https://recharts.org/)
- [Tabler Icons](https://tabler.io/icons)
