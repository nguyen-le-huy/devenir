# COPILOT CONTEXT - DEVENIR PROJECT

Tài liệu này cung cấp bối cảnh kỹ thuật toàn diện của dự án Devenir để GitHub Copilot có thể hỗ trợ hiệu quả nhất.

## 1\. Mô tả Succinct Dự án

[cite\_start]**Devenir** là một nền tảng E-commerce (thương mại điện tử) cao cấp, chuyên biệt cho phân khúc **thời trang nam**[cite: 26]. [cite\_start]Dự án được xây dựng trên kiến trúc **MERN Stack** (MongoDB, Express.js, React, Node.js) + **Vite**, với mục tiêu kiến tạo trải nghiệm mua sắm trực tuyến "visual-first" (lấy hình ảnh làm trung tâm) và liền mạch[cite: 26, 27].

Các tính năng đặc thù bao gồm:

  * [cite\_start]**AI Chatbot (RAG):** Tích hợp AI (Retrieval-Augmented Generation) để cá nhân hóa hỗ trợ khách hàng (tư vấn size, phối đồ) và hỗ trợ quản trị viên (truy vấn dữ liệu vận hành)[cite: 28, 32].
  * [cite\_start]**Tự động hóa (n8n):** Tối ưu hóa quy trình vận hành (xác nhận đơn hàng, cảnh báo tồn kho, báo cáo) thông qua n8n[cite: 28, 31, 54].
  * [cite\_start]**Thanh toán Đa kênh:** Hỗ trợ cả cổng thanh toán ngân hàng nội địa (PayOS/VNPAY) và tiền điện tử (Coinbase Commerce)[cite: 33, 81, 84].

## 2\. Danh sách Endpoint chính (API Endpoints)

[cite\_start]Dự án sử dụng kiến trúc RESTful API, được định tuyến trong `server/routes/`[cite: 288, 292]. Các nhóm endpoint chính bao gồm:

  * **Auth (`/api/auth`)**:
      * [cite\_start]`POST /api/auth/register`: Đăng ký tài khoản (email/password)[cite: 88, 92].
      * [cite\_start]`POST /api/auth/login`: Đăng nhập (email/password), trả về JWT[cite: 92].
      * [cite\_start]`POST /api/auth/google`: Đăng nhập bằng Google OAuth[cite: 92].
      * [cite\_start]`POST /api/auth/forgot-password`: Yêu cầu reset mật khẩu[cite: 92].
  * **Users (`/api/users`)**:
      * [cite\_start]`GET /api/users/me`: Lấy thông tin tài khoản (cần token)[cite: 101, 102].
      * [cite\_start]`PUT /api/users/me`: Cập nhật thông tin (địa chỉ, v.v.)[cite: 102].
      * [cite\_start]`GET /api/users/:id`: (Admin) Lấy thông tin user bất kỳ[cite: 131].
      * [cite\_start]`DELETE /api/users/:id`: (Admin) Xóa user[cite: 132].
  * **Products (`/api/products`)**:
      * [cite\_start]`GET /api/products`: Lấy danh sách sản phẩm (hỗ trợ filter, search)[cite: 93, 94].
      * `GET /api/products/:id`: Lấy chi tiết sản phẩm (bao gồm các variants).
      * [cite\_start]`POST /api/products`: (Admin) Thêm sản phẩm mới[cite: 116].
      * [cite\_start]`PUT /api/products/:id`: (Admin) Cập nhật sản phẩm[cite: 116].
  * **Orders (`/api/orders`)**:
      * [cite\_start]`POST /api/orders`: Tạo đơn hàng mới (checkout)[cite: 98].
      * [cite\_start]`GET /api/orders/my-orders`: Lấy lịch sử đơn hàng của user[cite: 105].
      * `GET /api/orders/:id`: Lấy chi tiết đơn hàng.
      * [cite\_start]`PUT /api/orders/:id/pay`: (Webhook) Cập nhật trạng thái thanh toán[cite: 130].
      * [cite\_start]`PUT /api/orders/:id/deliver`: (Admin) Cập nhật trạng thái giao hàng[cite: 130].
  * **Admin (`/api/admin`)**:
      * [cite\_start]`GET /api/admin/dashboard`: Lấy dữ liệu tổng quan (doanh thu, top sản phẩm)[cite: 140, 141].
      * (Các endpoint quản lý `categories`, `brands`, `promotions`...)
  * **AI (`/api/rag`)**:
      * [cite\_start]`POST /api/rag/chat`: Endpoint cho cả User và Admin Chatbot[cite: 99, 136].


## 3\. Sample Model (Ví dụ: `ProductModel.js`)

[cite\_start]Đây là cách một Mongoose model được định nghĩa trong `server/models/ProductModel.js`[cite: 291]:

```javascript
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    basePrice: { type: Number, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'categories',
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'brands',
    },
    images: [{ type: String }], // URLs từ Cloudinary
    tags: [{ type: String }],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reviews',
      },
    ],
    averageRating: { type: Number, default: 0 },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

const Product = mongoose.model('products', productSchema);
export default Product;
```

## 4\. Các chuẩn đặt tên (Naming Conventions)

  * **Database (MongoDB):**
      * [cite\_start]Collections: `plural` và `lowercase` (ví dụ: `users`, `products`, `orders`)[cite: 146, 169, 203].
      * [cite\_start]Fields: `camelCase` (ví dụ: `basePrice`, `productVariant`, `createdAt`)[cite: 173, 198, 155].
  * **Backend (Node.js/Express):**
      * [cite\_start]Files (Controllers, Models): `PascalCase` (ví dụ: `ProductModel.js`, `productController.js`)[cite: 283, 291].
      * [cite\_start]Files (Routes): `camelCase` (ví dụ: `productRoutes.js`)[cite: 289].
      * Biến: `camelCase`.
  * **Frontend (React):**
      * [cite\_start]Components (Files & Functions): `PascalCase` (ví dụ: `HomePage.jsx`, `Header.jsx`)[cite: 260, 264].
      * [cite\_start]CSS: **CSS Modules** (ví dụ: `HomePage.module.css`) [cite: 261, 265] để tránh xung đột class. 

## 5\. Flow Authentication (Luồng Xác thực)

1.  **Đăng nhập (Truyền thống):**
      * [cite\_start]Client gửi `email` + `password` đến `POST /api/auth/login`[cite: 92].
      * [cite\_start]Server kiểm tra email, so sánh mật khẩu đã hash (bằng **bcrypt**)[cite: 92].
      * Nếu hợp lệ, server tạo một **JWT (JSON Web Token)**.
      * Server trả về JWT cho client. [cite\_start]Client lưu token này vào **localStorage**[cite: 92].
2.  **Đăng nhập (Google OAuth):**
      * [cite\_start]Client sử dụng Google Identity API để lấy token từ Google[cite: 81, 92].
      * Client gửi token này đến `POST /api/auth/google`.
      * [cite\_start]Server xác thực token với Google, tìm hoặc tạo user mới (với `googleId`)[cite: 151], sau đó tạo và trả về JWT.
3.  **Truy cập tài nguyên (Authorized Request):**
      * Với mọi request cần xác thực (ví dụ: `GET /api/users/me`), client gửi JWT trong `Authorization` header (dạng `Bearer <token>`).
      * [cite\_start]Trên server, một **middleware (`authMiddleware.js`)** [cite: 285, 290] sẽ chặn request, xác thực JWT.
      * Nếu token hợp lệ, middleware gắn thông tin user (ví dụ: `req.user`) vào request và cho phép đi tiếp.
4.  **Phân quyền (Admin):**
      * [cite\_start]Middleware xác thực cũng kiểm tra `role` của user[cite: 152].
      * [cite\_start]Nếu một endpoint yêu cầu quyền "admin" (ví dụ: `POST /api/products`), middleware sẽ kiểm tra `req.user.role === 'admin'`[cite: 111]. Nếu không phải, server trả về lỗi 403 (Forbidden).

## 8\. Quy tắc Error Handling (Xử lý lỗi)

[cite\_start]Dự án sử dụng middleware xử lý lỗi tập trung của Express[cite: 290].

1.  **Trong Controllers (`server/controllers/`):**
      * Tất cả logic nghiệp vụ được bọc trong `try...catch` block (hoặc sử dụng `express-async-handler`).
      * Khi có lỗi, controller sẽ gọi `next(error)` để đẩy lỗi đến middleware xử lý lỗi.
      * Ví dụ: `catch (error) { next(error); }`
2.  **Middleware xử lý lỗi (trong `server/middleware/`):**
      * Một middleware đặc biệt (có 4 tham số: `(err, req, res, next)`) được định nghĩa cuối cùng trong `server.js`.
      * Middleware này sẽ "bắt" tất cả các lỗi được gọi bằng `next(error)`.
      * Nó chịu trách nhiệm định dạng phản hồi lỗi (JSON) và set HTTP status code (ví dụ: 400, 401, 404, 500) một cách nhất quán.

## 9\. Những "Requirement" Đặc thù

Đây là những điểm phức tạp nhất của dự án cần lưu ý:

1.  **AI RAG (`server/rag/`):**
      * Đây không phải là một chatbot thông thường. [cite\_start]Nó phải sử dụng **Retrieval-Augmented Generation**[cite: 53]. / Tạm thời bỏ qua phần này.
2.  **Tách biệt Product và ProductVariant:**
      * Data model rất quan trọng. [cite\_start]`products` [cite: 169] chỉ chứa thông tin chung (tên, mô tả).
      * [cite\_start]Toàn bộ thông tin `size`, `color`, `stock` (tồn kho), `price` (giá có thể khác nhau), và `SKU` phải nằm trong `productVariants`[cite: 184].
      * [cite\_start]Logic giỏ hàng và đơn hàng phải tham chiếu đến `productVariantId`, **không** phải `productId`[cite: 198, 206].
3.  **Tự động hóa n8n (Automation):**
      * Các quy trình nghiệp vụ cốt lõi không được xử lý thủ công.
      * [cite\_start]**Workflow 1 (Order):** Ngay khi thanh toán thành công (webhook từ PayOS/Coinbase), n8n phải được trigger để gửi email xác nhận cho khách [cite: 56, 139] [cite\_start]và thông báo cho admin (qua Telegram/Email)[cite: 139].
      * [cite\_start]**Workflow 2 (Inventory):** Khi đơn hàng `status` chuyển thành "delivered", n8n (hoặc logic server) phải tự động trừ `stock` trong `productVariants`[cite: 139].
      * [cite\_start]**Workflow 3 (Reporting):** n8n tự động chạy hàng tuần, tổng hợp dữ liệu và gửi báo cáo cho admin[cite: 139].
4.  **Thanh toán Đa kênh (Dual Payment):**
      * [cite\_start]Model `orders` [cite: 203] [cite\_start]phải lưu `paymentMethod` ("Bank" hoặc "Crypto")[cite: 208].
      * [cite\_start]Logic `paymentResult` [cite: 209] phải linh hoạt để xử lý cấu trúc data trả về khác nhau từ PayOS (ngân hàng) và Coinbase Commerce (crypto).
      * [cite\_start]Hệ thống phải lắng nghe webhook từ cả hai dịch vụ[cite: 130].