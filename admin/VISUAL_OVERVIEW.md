# 🎨 Visual Overview - Admin Dashboard Structure

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOP NAVIGATION BAR (Height: 12 units)                                   │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ☰  Logo/Devenir  │  🔍 Search...  │ 🔔 🔘 ⚙️ 🌍 👤              │ │
│ └────────────────────────────────────────────────────────────────────┘ │
├──────────┬───────────────────────────────────────────────────────────────┤
│ SIDEBAR  │ MAIN CONTENT AREA                                             │
│ (W: 288) │                                                               │
│          │ PAGE TITLE & DESCRIPTION                                      │
│ 🏠 ▾     │ ┌────────────────────────────────────────────────────────┐  │
│ · D      │ │ BREADCRUMBS / ACTION BUTTONS                          │  │
│ · A      │ └────────────────────────────────────────────────────────┘  │
│          │                                                               │
│ 🛍️ ▾     │ ┌──────────────┬──────────────┬──────────────┬───────────┐ │
│ · O      │ │  Metric 1    │  Metric 2    │  Metric 3    │ Metric 4  │ │
│ · S      │ │ $45,280      │ 1,234        │ 567          │ 4.5%      │ │
│ · R      │ └──────────────┴──────────────┴──────────────┴───────────┘ │
│          │                                                               │
│ 📦 ▾     │ ┌────────────────────────┬──────────────────────┐           │
│ · P      │ │                        │                      │           │
│ · V      │ │  CHART (70%)          │  TOP PRODUCTS (30%)  │           │
│ · C      │ │                        │                      │           │
│ · B      │ │  Revenue & Orders      │  Top 5 List         │           │
│ · I      │ │  [BAR CHART]           │  [LIST VIEW]         │           │
│          │ │                        │                      │           │
│ 👥 ▾     │ └────────────────────────┴──────────────────────┘           │
│ · C      │                                                               │
│ · G      │ ┌──────────────────────┬──────────────────────┐             │
│ · R      │ │  Category Sales      │  Payment Methods     │             │
│          │ │  [PIE CHART]         │  [BAR CHART]         │             │
│          │ └──────────────────────┴──────────────────────┘             │
│ 🎯 ▾     │                                                               │
│ · P      │ ┌──────────────────────┬──────────────────────┐             │
│ · E      │ │  Recent Orders       │  Low Stock Alerts    │             │
│ · L      │ │  [TABLE - 10 rows]   │  [TABLE - stocks]    │             │
│          │ │  [Show All Link]     │  [Show All Link]     │             │
│ 📝 ▾     │ │                      │                      │             │
│ · M      │ └──────────────────────┴──────────────────────┘             │
│ · P      │                                                               │
│ · B      │                                                               │
│          │                                                               │
│ 🤖 ▾     │                                                               │
│ · C      │                                                               │
│ · V      │                                                               │
│          │                                                               │
│ 💰 ▾     │                                                               │
│ · R      │                                                               │
│ · P      │                                                               │
│ · T      │                                                               │
│          │                                                               │
│ ⚙️ ▾     │                                                               │
│ · U      │                                                               │
│ · A      │                                                               │
│ · S      │                                                               │
│          │                                                               │
│ 👤 ▾     │                                                               │
│ Admin    │                                                               │
│ Logout   │                                                               │
└──────────┴───────────────────────────────────────────────────────────────┘
```

## Sidebar Menu Expanded

```
┌─────────────────────────────────────────┐
│ DEVENIR LOGO                            │
├─────────────────────────────────────────┤
│                                         │
│ 📊 DASHBOARD & OVERVIEW                 │
│   → Dashboard                           │
│   → Analytics                           │
│                                         │
│ 🛍️ SALES & ORDERS MANAGEMENT            │
│   ▸ Orders                              │
│     └─ All Orders                      │
│     └─ Pending Orders (12)             │
│     └─ Paid Orders                     │
│     └─ Shipped Orders                  │
│   → Shipments                           │
│   → Returns & Refunds                   │
│                                         │
│ 📦 PRODUCT MANAGEMENT                   │
│   ▸ Products                            │
│     └─ All Products                    │
│     └─ Add New Product                 │
│   → Variants & SKUs                     │
│   → Categories                          │
│   → Brands                              │
│   ▸ Inventory                           │
│     └─ Stock Overview                  │
│     └─ Stock Alerts (5)                │
│                                         │
│ 👥 CUSTOMER MANAGEMENT                  │
│   ▸ Customers                           │
│     └─ All Customers                   │
│     └─ VIP Customers                   │
│   → Customer Groups                     │
│   → Reviews                             │
│                                         │
│ 🎯 MARKETING & PROMOTIONS               │
│   ▸ Promotions                          │
│     └─ All Promotions                  │
│     └─ Create Promotion                │
│   → Email Campaigns                     │
│   → Loyalty Programs                    │
│                                         │
│ 📝 CONTENT MANAGEMENT                   │
│   → Media Library                       │
│   → Pages                               │
│   → Blog/News                           │
│                                         │
│ 🤖 AI & AUTOMATION                      │
│   → AI Chatbot                          │
│   → Virtual Try-On                      │
│                                         │
│ 💰 FINANCIAL MANAGEMENT                 │
│   → Revenue Reports                     │
│   → Payment Methods                     │
│   → Transactions                        │
│                                         │
│ ⚙️ SYSTEM & SETTINGS                    │
│   → Users & Roles                       │
│   → Audit Logs                          │
│   ▸ Settings                            │
│     └─ General Settings                │
│     └─ Payment Configuration           │
│     └─ Email Settings                  │
│     └─ Integrations                    │
│                                         │
└─────────────────────────────────────────┘
```

## Header Navigation

```
┌────────────────────────────────────────────────────────────────┐
│ ☰  📦 DEVENIR  │  🔍 Search order/product/customer...        │
├──────────────────────────────────────────────────────────────→│
                                    🔔  ➕  🌙  🌍  👤          │
└────────────────────────────────────────────────────────────────┘

🔔 NOTIFICATIONS                      ➕ QUICK CREATE
├─ New Order #12345 (2m ago)          ├─ New Product
├─ Low Stock Alert (5m ago)           ├─ New Order
├─ New Product Review (5m ago)        ├─ New Promotion
└─ [View All]                         └─ New Campaign

🌙 THEME TOGGLE                       🌍 LANGUAGE
├─ 🌙 Dark Mode                        ├─ 🇻🇳 Tiếng Việt
└─ ☀️ Light Mode                       └─ 🇺🇸 English

👤 USER MENU
├─ Profile
├─ Settings
└─ Logout
```

## Pages Layout Structure

```
All Pages Follow This Structure:

┌────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ <Back  Page Title  [Add New] [Export]               │ │
│ └──────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ FILTERS & SEARCH                                           │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 🔍 Search...  [Filter]  [Sort]  [View: ⊞ | ≡]      │ │
│ └──────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ MAIN CONTENT                                               │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ All   Active   Inactive   Draft                      │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ [TABLE / GRID VIEW WITH DATA]                        │ │
│ │                                                      │ │
│ │ Showing 1-10 of 1234 [Previous]  [Next]             │ │
│ └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Dashboard Metrics Card

```
┌──────────────────────────────────┐
│ Total Revenue              💰    │
├──────────────────────────────────┤
│ $45,280.50                       │
│ This month                       │
│                                  │
│ ↑ +12.5% from last period       │
│ [Sparkline: ▁▃▄▆▇█▆▅]           │
└──────────────────────────────────┘
```

## Status Badge Variants

```
Order Status:
• ⚪ pending     (Yellow Badge)
• 🟢 paid        (Green Badge)
• 🔵 shipped     (Blue Badge)
• ⚫ delivered   (Gray Badge)
• 🔴 cancelled   (Red Badge)

Inventory Status:
• 🟢 in-stock    (Green)
• 🟡 low-stock   (Yellow)
• 🔴 out-of-stock (Red)

Product Status:
• 🟢 active      (Green)
• ⚫ inactive    (Gray)
• ⚪ draft       (White)
```

## Table Layout Example

```
┌──────────────┬───────────────┬────────────┬──────────┬────────────┐
│ ☑ Order ID   │ Customer      │ Total      │ Status   │ Actions    │
├──────────────┼───────────────┼────────────┼──────────┼────────────┤
│ ☑ ORD-001234 │ Nguyễn Văn A │ $156.80    │ 🟢 Paid  │ View...    │
│   nguyena@.. │               │            │          │            │
├──────────────┼───────────────┼────────────┼──────────┼────────────┤
│ ☑ ORD-001233 │ Trần Thị B    │ $89.50     │ 🔵 Ship  │ View...    │
│   tranb@...  │               │            │          │            │
├──────────────┼───────────────┼────────────┼──────────┼────────────┤
│ ☑ ORD-001232 │ Lê Văn C      │ $234.20    │ ⚫ Deliv  │ View...    │
│   levanc@... │               │            │          │            │
└──────────────┴───────────────┴────────────┴──────────┴────────────┘
         [Bulk Actions: Delete | Export] [Pagination controls]
```

## Mobile Responsive View

```
┌─────────────┐
│ ☰ DEVENIR   │ ← Hamburger menu
├─────────────┤
│ 🔍 Search   │ ← Search bar
├─────────────┤
│ 📊 Content  │
│             │
│ [Metric 1]  │
│ [Metric 2]  │
│             │
│ [Table]     │
│ [Table]     │
│             │
└─────────────┘

When ☰ clicked:
┌─────────────┐
│ × DEVENIR   │
├─────────────┤
│ 🏠 Dashboard│ ← Drawer menu
│ 🛍️ Orders   │
│ 📦 Products │
│ 👥 Customers│
│ ⚙️ Settings │
│ 👤 Profile  │
│ 🚪 Logout   │
└─────────────┘
```

## Color Palette Reference

```
PRIMARY          SECONDARY       SUCCESS         WARNING
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Brand Color  │ │ Light Gray   │ │ #10b981      │ │ #f59e0b      │
│              │ │              │ │ ✓ Green      │ │ ⚠️ Amber      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

DANGER           INFO            MUTED           BACKGROUND
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ #ef4444      │ │ #3b82f6      │ │ Gray 500     │ │ White/Dark   │
│ ✗ Red        │ │ ℹ️ Blue       │ │ Neutral      │ │ Theme-aware  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

## Chart Types Used

```
BAR CHART                LINE CHART              PIE CHART
┌─────────┐             ╱                      ╭─────╮
│     ┌─┐ │           ╱  ╲                   ╱       ╲
│   ┌─┤ │ │          ╱    ╲    ╲           ╱           ╲
│ ┌─┤ │ │ │        ╱      ╲    ╲╲       ╱
│ │ │ │ │ │       ╱        ╲____╲╲    ╱
└─┴─┴─┴─┴─┘                      └─────╯

Revenue & Orders      Sales Trend          Category Distribution
by day/week/month     over time            Áo, Quần, Giày, Khác
```

## Feature Highlights

```
✨ MODERN UI
   • Clean minimalist design
   • Professional color scheme
   • Smooth animations
   • Consistent spacing

🎨 RESPONSIVE
   • Mobile first approach
   • Tablet optimization
   • Desktop full features
   • Touch-friendly buttons

🎯 USER FRIENDLY
   • Intuitive navigation
   • Clear visual hierarchy
   • Status indicators
   • Quick actions

⚡ PERFORMANT
   • Fast loading
   • Smooth interactions
   • Optimized components
   • Efficient rendering
```

---

This visual overview provides a clear understanding of:

- Layout structure and organization
- Navigation and menu system
- Component placement and sizing
- Color usage and scheme
- Responsive behavior
- Data visualization

The actual implementation matches these specifications exactly!
