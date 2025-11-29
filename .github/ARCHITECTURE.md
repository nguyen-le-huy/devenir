# Kiến trúc Hệ thống (System Architecture)

Dự án này được xây dựng theo kiến trúc MERN Stack (MongoDB, Express.js, React, Node.js) và được tổ chức theo cấu trúc "multi-package" (monorepo-like) để tách biệt rõ ràng các thành phần.

Hệ thống bao gồm ba phần chính:

1.  **`server`**: Backend API (Node.js/Express)
2.  **`client`**: Ứng dụng React cho khách hàng (Sử dụng CSS Modules & CSS thuần)
3.  **`admin`**: Ứng dụng React cho quản trị viên (Sử dụng TailwindCSS và Shadcn/ui)

## 1. Server (Backend)

Backend được xây dựng bằng Node.js và Express, chịu trách nhiệm xử lý logic nghiệp vụ, xác thực, và giao tiếp với cơ sở dữ liệu MongoDB - mongoose.

- **`config/`**: Chứa các file cấu hình kết nối (MongoDB, Cloudinary, OpenAI, PayOS).
- **`controllers/`**: Chứa logic nghiệp vụ. Mỗi controller xử lý các yêu cầu (request) và tạo phản hồi (response) (ví dụ: `productController.js`, `userController.js`).
- **`middleware/`**: Chứa các "trạm kiểm soát" trung gian, như `authMiddleware.js` (xác thực token JWT) hoặc middleware xử lý lỗi.
- **`models/`**: Định nghĩa các Mongoose Schema cho cơ sở dữ liệu MongoDB. Đây là nơi cấu trúc data được định nghĩa.
- **`routes/`**: Định nghĩa các điểm cuối (endpoints) của API. Các file route sẽ liên kết một đường dẫn (ví dụ: `/api/products`) với hàm xử lý tương ứng trong `controllers`.
- **`rag/`**: Chứa logic chuyên biệt cho tính năng AI Chatbot (Retrieval-Augmented Generation), bao gồm xử lý vector và truy vấn kiến thức.
- **`server.js`**: File khởi chạy chính của server, khởi tạo Express và kết nối database.
- **`.env`**: (Không commit) Chứa các biến môi trường và khóa bí mật (API keys, connection strings).

## 2. Client (Web Khách hàng)

Ứng dụng React (khởi tạo bằng Vite) dành cho khách hàng.

- **Styling**: Dự án này sử dụng **CSS Modules** (`*.module.css`) cho từng component và **CSS thuần** (`global.css`) cho các style chung.
- **`src/components/`**: Chứa các component React tái sử dụng (ví dụ: `Header`, `Footer`, `ProductCard`). Mỗi component có file `.jsx` và `.module.css` riêng.
- **`src/pages/`**: Chứa các component ứng với từng trang (ví dụ: `HomePage`, `ProductDetailPage`).
- **`src/assets/`**: Chứa các tài nguyên tĩnh như fonts, images,...
- **`src/services/`**: Chứa logic gọi API (sử dụng `axios`) để giao tiếp với `server`.
- **`src/global.css/`**: File css chung.

## 3. Admin (Trang Quản trị)

Ứng dụng React (khởi tạo bằng Vite) dành riêng cho quản trị viên.

- **Styling**: Dự án này sử dụng **TailwindCSS** và **Shadcn/ui** để xây dựng giao diện nhanh chóng.
- **`src/components/`**: Chứa các component giao diện (UI) cho dashboard (ví dụ: `Sidebar`, `StatsCard`).
- **`src/pages/`**: Chứa các trang quản lý chính (ví dụ: `Dashboard`, `ProductList`, `OrderManagement`).
- **`tailwind.config.js`**: File cấu hình cho TailwindCSS.

---

# Lược đồ Database (Database Schema)

Hệ thống sử dụng MongoDB làm cơ sở dữ liệu. Dưới đây là cấu trúc của các collections:

### users

- \_id (ObjectId): ID duy nhất
- username (String): Tên người dùng, required
- email (String): Email, required, unique
- password (String): Hashed password (Mã hóa bằng bcrypt), required (nếu không dùng Google OAuth)
- googleId (String): ID từ Google (Hỗ trợ Google OAuth)
- role (String): "user" | "admin" (Phân quyền admin/user)
- lastLogin (Date): Thời điểm đăng nhập gần nhất
- loginAttempts (Number): Số lần đăng nhập thất bại, default: 0
- lockUntil (Date): Thời điểm hết khóa tài khoản (sau 5 lần thất bại, khóa 2 giờ)
- addresses (Array): Mảng các đối tượng địa chỉ:
  - fullName (String): Họ tên người nhận
  - phone (String): Số điện thoại (validation Vietnam format)
  - street (String): Địa chỉ chi tiết
  - district (String): Quận/Huyện
  - city (String): Thành phố/Tỉnh
  - postalCode (String): Mã bưu điện
  - isDefault (Boolean): Địa chỉ mặc định
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### categories

- \_id (ObjectId): ID duy nhất
- name (String): Tên danh mục (VD: Áo sơ mi), required, unique
- description (String): Mô tả danh mục
- parentCategory (ObjectId): Reference categories.\_id (Hỗ trợ danh mục đa cấp)

### brands

- \_id (ObjectId): ID duy nhất
- name (String): Tên thương hiệu (VD: Devenir Collection), required, unique
- logoUrl (String): URL logo thương hiệu
- description (String): Mô tả thương hiệu

### colors

- \_id (ObjectId): ID duy nhất
- name (String): Tên màu (VD: Đen, Trắng, Xanh Navy), required, unique, trim
- hex (String): Mã màu hex (VD: #000000, #FFFFFF), required, uppercase, trim (Validation: phải đúng định dạng hex color)
- isActive (Boolean): Trạng thái hoạt động, default: true
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### products

- \_id (ObjectId): ID duy nhất
- name (String): Tên sản phẩm chung, required
- description (String): Mô tả chi tiết, required
- category (ObjectId): Reference categories.\_id, required
- brand (ObjectId): Reference brands.\_id (Đã đổi từ String sang ObjectId)
- tags (Array): Mảng các tags (String) (VD: 'công sở', 'thoáng mát')
- reviews (Array): Mảng các ObjectId (Reference reviews.\_id)
- averageRating (Number): Điểm đánh giá trung bình, default: 0
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### productVariants

- \_id (ObjectId): ID duy nhất
- product_id (ObjectId): Reference products.\_id (Liên kết sản phẩm cha), required
- sku (String): Mã SKU (VD: 'AOS-L-DEN'), required, unique, uppercase, trim (Tự động sinh nếu không cung cấp)
- color (String): Tên màu (VD: 'Đen', 'Trắng'), required, trim
- size (String): Kích cỡ, required, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'Free Size']
- price (Number): Giá của biến thể này, required, min: 0
- quantity (Number): Số lượng tồn kho thực tế, required, min: 0, default: 0
- stock (Virtual): Alias cho quantity (getter/setter)
- inStock (Virtual): Boolean, kiểm tra quantity > 0
- mainImage (String): URL ảnh chính của variant, trim
- hoverImage (String): URL ảnh hover của variant, trim
- images (Array): Mảng các URLs ảnh bổ sung, default: []
- isActive (Boolean): Trạng thái hoạt động, default: true
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### carts

- \_id (ObjectId): ID duy nhất
- user (ObjectId): Reference users.\_id, required, unique
- items (Array): Mảng các đối tượng ({ productVariant (ObjectId), quantity (Number) })
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### orders

- \_id (ObjectId): ID duy nhất
- user (ObjectId): Reference users.\_id, required
- orderItems (Array): Mảng các đối tượng **snapshot** tại thời điểm đặt hàng:
  - name (String): Tên sản phẩm, required
  - sku (String): Mã SKU, required
  - color (String): Màu sắc (snapshot), required
  - size (String): Kích cỡ (snapshot), required
  - quantity (Number): Số lượng, required, min: 1
  - price (Number): Giá tại thời điểm đặt hàng, required, min: 0
  - image (String): URL ảnh chính, required
  - mainImage (String): URL ảnh chính của variant (snapshot)
  - hoverImage (String): URL ảnh hover (snapshot)
  - productVariant (ObjectId): Reference ProductVariant.\_id (optional - chỉ để tracking)
  - product (ObjectId): Reference Product.\_id (optional - chỉ để tracking)
- shippingAddress (Object): { street (String), city (String), postalCode (String), phone (String - validation Vietnam format) }, required
- paymentMethod (String): "Bank" | "Crypto" | "COD", required, enum
- paymentResult (Object): { id (String), status (String), update_time (String), email_address (String) } (Kết quả từ PayOS/Coinbase)
- totalPrice (Number): Tổng tiền đơn hàng, required, min: 0
- shippingPrice (Number): Phí vận chuyển, required, min: 0, default: 0
- status (String): "pending" | "paid" | "shipped" | "delivered" | "cancelled", required, default: 'pending', enum
- paidAt (Date): Ngày thanh toán
- deliveredAt (Date): Ngày giao hàng
- cancelledAt (Date): Ngày hủy đơn
- subtotal (Virtual): totalPrice - shippingPrice
- totalItems (Virtual): Tổng số lượng sản phẩm
- isPaid (Virtual): Boolean, kiểm tra status === 'paid' || paidAt tồn tại
- isDelivered (Virtual): Boolean, kiểm tra status === 'delivered' && deliveredAt tồn tại
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### reviews

- \_id (ObjectId): ID duy nhất
- user (ObjectId): Reference users.\_id, required
- product (ObjectId): Reference products.\_id, required
- rating (Number): Điểm đánh giá (1-5 sao), required
- comment (String): Nội dung bình luận, required
- isVerifiedPurchase (Boolean): Đánh giá từ người đã mua, default: false
- images (Array): Mảng URLs ảnh đính kèm (tối đa 5 ảnh), default: []
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### promotions

- \_id (ObjectId): ID duy nhất
- code (String): Mã voucher (VD: 'SALE10'), required, unique
- description (String): Mô tả khuyến mãi
- discountType (String): "percentage" | "fixed", required
- discountValue (Number): Giá trị khuyến mãi, required (nếu percentage thì <= 100)
- minOrderValue (Number): Giá trị đơn hàng tối thiểu, default: 0
- maxDiscountAmount (Number): Số tiền giảm tối đa (cho percentage)
- usageLimit (Number): Giới hạn số lần sử dụng tổng thể
- userUsageLimit (Number): Giới hạn số lần mỗi user được dùng, default: 1
- usedCount (Number): Số lần đã sử dụng, default: 0
- userUsageTracking (Map): Track số lần sử dụng của từng user { userId: count }
- startDate (Date): Ngày bắt đầu, required
- endDate (Date): Ngày kết thúc, required
- isActive (Boolean): Trạng thái, default: true
- applicableProducts (Array): Mảng ObjectId sản phẩm áp dụng
- applicableCategories (Array): Mảng ObjectId danh mục áp dụng
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

Tổng hợp các điểm cần cải thiện hệ thống MERN E-commerce

1. Redis caching layer
   Tích hợp Redis đặt làm cache trung gian song song với MongoDB để tăng tốc độ truy xuất, giảm tải truy vấn lặp lại cho DB.

Cấu hình Redis với hybrid persistence (AOF + RDB): đảm bảo khi server hay Redis restart, cache vẫn phục hồi nhanh và giảm tối đa risk mất dữ liệu cache.

Xây dựng cơ chế quản lý cache đa tầng: L1 (in-memory process), L2 (Redis), L3 (DB), kèm quy trình xóa cache (cache invalidation) sau các thao tác ghi dữ liệu.

2. Tối ưu Database Index
   Rà soát, bổ sung các compound/covered index đa trường cho những field hay search, filter, sort để giảm full scan, tăng tốc các truy vấn lớn.

Quan tâm đặc biệt tới các bảng orders (user, status, ngày), products (category, price, status), carts (user), reviews (product, user).

Định kỳ kiểm thử các truy vấn lớn với explain plan để chắc chắn index phát huy tác dụng.

3. Connection Pooling
   Cấu hình số lượng kết nối tối đa tuỳ theo server, giám sát khi vận hành và báo động khi pool đầy/chậm.

4. Giám sát/Logging
   Setup hệ thống monitor delay API, thời gian DB query, tỉ lệ cache hit/miss.

Bổ sung alert sớm khi truy vấn chậm, error tăng bất thường hoặc memory leak.

Ghi lại tất cả lỗi/sự cố vào log file/remote để dễ truy dấu và khắc phục.

5. Centralized error handling
   Thêm middleware tổng xử lý lỗi (standardize response dữ liệu lỗi, log lại mọi lỗi phát sinh, trả thông điệp rõ ràng cho phía client).

6. Input validation/sanitization
   Toàn bộ input từ phía người dùng/api đều đi qua lớp kiểm tra nhập liệu chặt chẽ trước khi ghi xuống DB bằng express-validator hoặc tương tự.

7. Frontend & Admin UI
   Tiếp tục tận dụng React Query, thiết lập cache policies hợp lý cho từng loại dữ liệu (staleTime, cacheTime,…).

Sử dụng code splitting, lazy loading, prefetch và image optimization triệt để.

Quản lý state, search/filter/pagination qua URL để không làm mất context khi quay lại/trở về trang trước.

Client-side filtering hợp lý với dữ liệu nhỏ, giảm số lần gọi API.

8. Admin UX
   Bổ sung prefetch/cache cho thao tác bulkedit, detail/modal, và invalidate cache đúng lúc sau khi tạo/sửa/xóa.

Tối ưu UX với giao diện mượt, hiếm khi xuất hiện loading spinner nhỏ.

9. Security & Rate limiting
   Thiết lập express-rate-limit trên toàn bộ API và đặc biệt nghiêm ngặt với các endpoint đăng nhập, thao tác nhạy cảm.

Bổ sung header bảo mật: Helmet, cấu hình Content Security Policy, HSTS, XSS filter, whitelist domain cho CORS.

10. Chiến lược triển khai & tối ưu chi phí
    Giai đoạn khởi đầu/MVP: self-host Redis trên cùng backend (chi phí = 0).

Khi mở rộng: chuyển qua Redis cloud hoặc VPS/hosting riêng.

Giới hạn dung lượng cache lưu những gì thực sự cần, chọn TTL hợp lý để tiết kiệm tài nguyên/free tier.

Đo lường hiệu suất/thời gian mỗi phase, chỉ mở rộng khi đúng nhu cầu.

Lưu ý: Ưu tiên hoàn thiện các nhóm bảo mật, cache, index, giám sát sớm nhất để hệ thống production ổn định, dễ scale cùng lúc và dễ bảo trì.
