# Hướng dẫn Tích hợp Dữ liệu Thật - Customer Management

## ✅ Đã Hoàn Thành

### Frontend (Admin Panel)

- ✅ Tích hợp React Query hooks: `useCustomerList`, `useCustomerOverview`, `useCustomerDetail`
- ✅ Xóa toàn bộ mock data (mockCustomers, mockOverview)
- ✅ Cập nhật CustomersPage.tsx để sử dụng real API
- ✅ Loading states cho tất cả components
- ✅ Error handling tự động qua React Query
- ✅ Pagination, filtering, sorting từ backend

### Backend API

- ✅ CustomerController.js với đầy đủ endpoints:
  - GET `/api/customers/overview` - Metrics tổng quan
  - GET `/api/customers` - Danh sách khách hàng (có pagination, filters)
  - GET `/api/customers/:id` - Chi tiết khách hàng
  - GET `/api/customers/:id/orders` - Lịch sử đơn hàng
  - POST `/api/customers` - Tạo khách hàng mới
  - PUT `/api/customers/:id` - Cập nhật thông tin
  - DELETE `/api/customers/:id` - Xóa khách hàng

## 🚀 Cách Chạy

### 1. Start Backend Server

```bash
cd server
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

### 2. Start Admin Panel

```bash
cd admin
npm run dev
```

Admin panel sẽ chạy tại: `http://localhost:5174` (hoặc port khác nếu 5174 đang dùng)

### 3. Đảm bảo MongoDB đang chạy

- Local MongoDB: `mongodb://localhost:27017`
- Hoặc MongoDB Atlas (cloud)

### 4. Kiểm tra .env của server

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 5. Login vào Admin Panel

Sử dụng tài khoản admin đã có hoặc tạo mới:

```javascript
// Endpoint: POST /api/auth/login
{
  "email": "admin@devenir.com",
  "password": "your_password"
}
```

## 📊 Tính Năng Đã Tích Hợp

### Overview Metrics

- Tổng khách hàng + growth %
- Khách mới tháng này + growth %
- Repeat Customer Rate
- Average Order Value (AOV)

### Customer List

- **Filtering**: Segment, Tier, Status, Channel, Tags, Marketing Opt-in, RFM, Spend/Orders range, City/Province
- **Sorting**: Recent, Value DESC, Orders DESC, Engagement DESC
- **Pagination**: 10/25/50/100 items per page
- **Search**: Tìm theo tên, email, phone, địa chỉ

### Customer Detail Drawer

- **Thông tin cơ bản**: Avatar, Name, Email, Phone, Địa chỉ
- **Stats**: Tổng chi tiêu, Số đơn hàng, AOV, Lần mua cuối
- **Tabs**:
  - **Tổng quan**: Liên hệ, Tags, Notes, Insights, Hoạt động gần đây
  - **Đơn hàng**: Địa chỉ giao hàng + danh sách đơn hàng
  - **Địa chỉ**: Tất cả địa chỉ đã lưu

### Real-time Features

- **React Query Caching**:
  - Overview: staleTime 60s
  - Customer list: placeholderData (keepPreviousData) - mượt mà khi đổi page
  - Customer detail: auto-refetch khi mở drawer
- **Optimistic Updates**: Sẵn sàng cho Create/Update/Delete operations

## 🔧 Troubleshooting

### Lỗi: "Network Error" hoặc "Failed to fetch"

**Nguyên nhân**: Backend chưa chạy hoặc CORS chưa config đúng

**Giải pháp**:

1. Kiểm tra server đang chạy: `http://localhost:5000/api/customers/overview`
2. Kiểm tra CORS trong `server/server.js`:

```javascript
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // Admin panel ports
    credentials: true,
  })
);
```

### Lỗi: "401 Unauthorized"

**Nguyên nhân**: Chưa login hoặc token hết hạn

**Giải pháp**:

1. Login lại qua `/login` page
2. Token JWT được lưu trong localStorage, check:

```javascript
localStorage.getItem("accessToken");
```

### Lỗi: "Empty data" hoặc "No customers found"

**Nguyên nhân**: Database chưa có dữ liệu

**Giải pháp**:

1. Tạo users mới qua signup
2. Hoặc seed data bằng script:

```bash
cd server
node scripts/seedCustomers.js
```

### Performance Optimization

Nếu danh sách khách hàng > 1000 records:

1. Backend đã có pagination, đảm bảo `limit` không quá 100
2. Thêm indexes trong MongoDB:

```javascript
// In UserModel
userSchema.index({ email: 1, customerProfile.status: 1 })
userSchema.index({ 'customerProfile.loyaltyTier': 1 })
userSchema.index({ totalSpent: -1, totalOrders: -1 })
```

## 📝 Next Steps

### Features cần thêm:

1. **Bulk Actions**: Gộp khách trùng, thêm tags hàng loạt, export CSV
2. **Advanced Analytics**: RFM analysis, cohort analysis, churn prediction
3. **Customer Journey**: Timeline của customer interactions
4. **Email Campaigns**: Tích hợp gửi email marketing
5. **Notifications**: Real-time alerts cho VIP customers, at-risk customers

### Performance Optimizations:

1. **Redis Caching**: Cache overview metrics (60s TTL)
2. **Elasticsearch**: Full-text search cho email/phone/name
3. **Virtual Scrolling**: Cho danh sách > 500 items
4. **Background Jobs**: Tính toán RFM scores, engagement scores ngoài request cycle

## 🎉 Kết Quả

Customer Management giờ đã:

- ✅ Kết nối dữ liệu thật từ MongoDB
- ✅ Real-time updates qua React Query
- ✅ Mượt mà với pagination & filtering
- ✅ Caching thông minh để giảm API calls
- ✅ UI/UX premium với loading states & error handling
