# Kiến trúc Hệ thống (System Architecture)

Dự án này được xây dựng theo kiến trúc MERN Stack (MongoDB, Express.js, React, Node.js) và được tổ chức theo cấu trúc "multi-package" (monorepo-like) để tách biệt rõ ràng các thành phần.

Hệ thống bao gồm ba phần chính:
1.  **`server`**: Backend API (Node.js/Express)
2.  **`client`**: Ứng dụng React cho khách hàng (Sử dụng CSS Modules & CSS thuần)
3.  **`admin`**: Ứng dụng React cho quản trị viên (Sử dụng TailwindCSS và Shadcn/ui)

## 1. Server (Backend)

Backend được xây dựng bằng Node.js và Express, chịu trách nhiệm xử lý logic nghiệp vụ, xác thực, và giao tiếp với cơ sở dữ liệu MongoDB - mongoose.

-   **`config/`**: Chứa các file cấu hình kết nối (MongoDB, Cloudinary, OpenAI, PayOS).
-   **`controllers/`**: Chứa logic nghiệp vụ. Mỗi controller xử lý các yêu cầu (request) và tạo phản hồi (response) (ví dụ: `productController.js`, `userController.js`).
-   **`middleware/`**: Chứa các "trạm kiểm soát" trung gian, như `authMiddleware.js` (xác thực token JWT) hoặc middleware xử lý lỗi.
-   **`models/`**: Định nghĩa các Mongoose Schema cho cơ sở dữ liệu MongoDB. Đây là nơi cấu trúc data được định nghĩa.
-   **`routes/`**: Định nghĩa các điểm cuối (endpoints) của API. Các file route sẽ liên kết một đường dẫn (ví dụ: `/api/products`) với hàm xử lý tương ứng trong `controllers`.
-   **`rag/`**: Chứa logic chuyên biệt cho tính năng AI Chatbot (Retrieval-Augmented Generation), bao gồm xử lý vector và truy vấn kiến thức.
-   **`server.js`**: File khởi chạy chính của server, khởi tạo Express và kết nối database.
-   **`.env`**: (Không commit) Chứa các biến môi trường và khóa bí mật (API keys, connection strings).

## 2. Client (Web Khách hàng)

Ứng dụng React (khởi tạo bằng Vite) dành cho khách hàng.

-   **Styling**: Dự án này sử dụng **CSS Modules** (`*.module.css`) cho từng component và **CSS thuần** (`global.css`) cho các style chung.
-   **`src/components/`**: Chứa các component React tái sử dụng (ví dụ: `Header`, `Footer`, `ProductCard`). Mỗi component có file `.jsx` và `.module.css` riêng.
-   **`src/pages/`**: Chứa các component ứng với từng trang (ví dụ: `HomePage`, `ProductDetailPage`).
-   **`src/assets/`**: Chứa các tài nguyên tĩnh như fonts, images,...
-   **`src/services/`**: Chứa logic gọi API (sử dụng `axios`) để giao tiếp với `server`.
-   **`src/global.css/`**: File css chung.

## 3. Admin (Trang Quản trị)

Ứng dụng React (khởi tạo bằng Vite) dành riêng cho quản trị viên.

-   **Styling**: Dự án này sử dụng **TailwindCSS** và **Shadcn/ui** để xây dựng giao diện nhanh chóng.
-   **`src/components/`**: Chứa các component giao diện (UI) cho dashboard (ví dụ: `Sidebar`, `StatsCard`).
-   **`src/pages/`**: Chứa các trang quản lý chính (ví dụ: `Dashboard`, `ProductList`, `OrderManagement`).
-   **`tailwind.config.js`**: File cấu hình cho TailwindCSS.

---

# Lược đồ Database (Database Schema)

Hệ thống sử dụng MongoDB làm cơ sở dữ liệu. Dưới đây là cấu trúc của các collections:

### users
- _id (ObjectId): ID duy nhất
- username (String): Tên người dùng, required
- email (String): Email, required, unique
- password (String): Hashed password (Mã hóa bằng bcrypt), required (nếu không dùng Google OAuth)
- googleId (String): ID từ Google (Hỗ trợ Google OAuth)
- role (String): "user" | "admin" (Phân quyền admin/user)
- addresses (Array): Mảng các đối tượng địa chỉ (fullName, phone, street, city, postalCode, isDefault)
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### categories
- _id (ObjectId): ID duy nhất
- name (String): Tên danh mục (VD: Áo sơ mi), required, unique
- description (String): Mô tả danh mục
- parentCategory (ObjectId): Reference categories._id (Hỗ trợ danh mục đa cấp)

### brands
- _id (ObjectId): ID duy nhất
- name (String): Tên thương hiệu (VD: Devenir Collection), required, unique
- logoUrl (String): URL logo thương hiệu
- description (String): Mô tả thương hiệu

### products
- _id (ObjectId): ID duy nhất
- name (String): Tên sản phẩm chung, required
- description (String): Mô tả chi tiết, required
- basePrice (Number): Giá gốc của sản phẩm, required
- category (ObjectId): Reference categories._id, required
- brand (ObjectId): Reference brands._id
- images (Array): Mảng các URLs ảnh (từ Cloudinary)
- tags (Array): Mảng các tags (String) (VD: 'công sở', 'thoáng mát')
- reviews (Array): Mảng các ObjectId (Reference reviews._id)
- averageRating (Number): Điểm đánh giá trung bình, default: 0
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### productVariants
- _id (ObjectId): ID duy nhất
- product (ObjectId): Reference products._id (Liên kết sản phẩm cha), required
- sku (String): Mã SKU (VD: 'DEVENIR-AO-TRANG-L'), required, unique
- size (String): Kích cỡ (VD: 'M'), required
- color (Object): { name (String), code (String) } (VD: { name: "Trắng", code: "#FFFFFF" }), required
- price (Number): Giá của biến thể này, required
- stock (Number): Số lượng tồn kho, required, default: 0
- variantImages (Array): Mảng các URLs ảnh (cho biến thể màu này)

### carts
- _id (ObjectId): ID duy nhất
- user (ObjectId): Reference users._id, required, unique
- items (Array): Mảng các đối tượng ({ productVariant (ObjectId), quantity (Number) })
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### orders
- _id (ObjectId): ID duy nhất
- user (ObjectId): Reference users._id, required
- orderItems (Array): Mảng các đối tượng ({ name, sku, quantity, price, image, productVariant (ObjectId) })
- shippingAddress (Object): { street, city, postalCode, phone }
- paymentMethod (String): "Bank" | "Crypto" | "COD" (Hỗ trợ đa kênh), required
- paymentResult (Object): { id (String), status (String), update_time (String) } (Kết quả từ PayOS/Coinbase)
- totalPrice (Number): Tổng tiền đơn hàng, required
- shippingPrice (Number): Phí vận chuyển, required
- status (String): "pending" | "paid" | "shipped" | "delivered" | "cancelled", required, default: 'pending'
- paidAt (Date): Ngày thanh toán
- deliveredAt (Date): Ngày giao hàng
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### reviews
- _id (ObjectId): ID duy nhất
- user (ObjectId): Reference users._id, required
- product (ObjectId): Reference products._id, required
- rating (Number): Điểm đánh giá (1-5 sao), required
- comment (String): Nội dung bình luận, required
- createdAt (Date): Ngày tạo
- updatedAt (Date): Ngày cập nhật

### promotions
- _id (ObjectId): ID duy nhất
- code (String): Mã voucher (VD: 'SALE10'), required, unique
- description (String): Mô tả khuyến mãi
- discountType (String): "percentage" | "fixed", required
- discountValue (Number): Giá trị khuyến mãi, required
- startDate (Date): Ngày bắt đầu, required
- endDate (Date): Ngày kết thúc, required
- isActive (Boolean): Trạng thái, default: true