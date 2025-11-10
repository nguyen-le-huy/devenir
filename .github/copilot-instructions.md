# Thông tin Dự án: Devenir

## 1. Bối cảnh & Mục tiêu Dự án (Project Context & Objectives)

**Devenir** là một nền tảng thương mại điện tử (E-commerce) chuyên biệt cho phân khúc **thời trang nam**[cite: 26]. Dự án được phát triển trên kiến trúc **MERN Stack** (MongoDB, Express.js, React, Node.js) và tối ưu hóa bởi Vite[cite: 26].

**Mục tiêu chính của dự án:**
* Kiến tạo một trải nghiệm mua sắm trực tuyến liền mạch, lấy trải nghiệm hình ảnh làm trung tâm (visual-first)[cite: 27].
* Cung cấp giao diện người dùng (UI/UX) trực quan, giàu tính thẩm mỹ với hiệu suất vượt trội[cite: 30].
* Tích hợp công nghệ **AI (RAG)** để cá nhân hóa hỗ trợ khách hàng và trợ lý quản trị[cite: 28, 32].
* Tự động hóa quy trình vận hành (xác nhận đơn hàng, quản lý tồn kho) bằng **n8n** để giảm can thiệp thủ công và nâng cao hiệu suất[cite: 28, 31].
* Tích hợp cổng thanh toán đa dạng, bao gồm giải pháp ngân hàng nội địa (PayOS/VNPAY) và tiền điện tử (Cryptocurrency)[cite: 33, 46, 62].

## 2. Nhóm Đối tượng sử dụng (User Roles)

Dự án có hai vai trò người dùng chính[cite: 63]:

1.  **Khách hàng (End-User):** [cite: 64]
    * Người mua sắm truy cập website để tìm kiếm, xem và mua sản phẩm[cite: 65, 86].
    * Sử dụng bộ lọc thông minh (size, màu sắc, giá...)[cite: 67].
    * Thực hiện quy trình thanh toán (checkout) an toàn[cite: 68].
    * Quản lý tài khoản cá nhân, lịch sử đơn hàng[cite: 69].
    * Tương tác với **AI chatbot** để được hỗ trợ (tư vấn size, phối đồ, tra cứu đơn hàng)[cite: 69, 99].

2.  **Quản trị viên (Administrator):** [cite: 70]
    * Truy cập Bảng điều khiển (Admin Dashboard) toàn diện[cite: 71].
    * Quản lý Sản phẩm: CRUD, danh mục, thương hiệu, và các biến thể phức tạp (SKUs, size, màu)[cite: 73].
    * Quản lý Đơn hàng: Xử lý, cập nhật trạng thái và theo dõi vòng đời đơn hàng[cite: 74].
    * Quản lý Khách hàng & Marketing (thiết lập khuyến mãi)[cite: 75].
    * Sử dụng **AI hỗ trợ (Admin Assistant)** để truy vấn dữ liệu vận hành (doanh thu, sản phẩm bán chạy)[cite: 76, 137].

## 3. Các Tính năng Cốt lõi (Core Features)

### A. Tính năng cho Khách hàng (End-User Features)
* **Xác thực:** Đăng ký/Đăng nhập truyền thống (Email/Password đã mã hóa) và đăng nhập nhanh bằng Google (Google OAuth)[cite: 81, 92].
* **Duyệt sản phẩm:** Xem danh mục (áo, quần, giày...), tìm kiếm nhanh (theo tên, SKU), và bộ lọc nâng cao (khoảng giá, thương hiệu, size, màu)[cite: 94].
* **Chi tiết sản phẩm:** Xem hình ảnh (Cloudinary), bảng size, mô tả, và gợi ý sản phẩm AI (phối đồ)[cite: 94].
* **Giỏ hàng & Thanh toán (Checkout):** [cite: 95]
    * Quản lý giỏ hàng (lưu trên localStorage hoặc database)[cite: 98].
    * **Thanh toán ngân hàng (Real):** Tích hợp API PayOS / VNPAY (thanh toán QR hoặc Internet Banking)[cite: 98].
    * **Thanh toán Crypto (Real):** Tích hợp API Coinbase Commerce (thanh toán bằng BTC, ETH, USDT)[cite: 98].
* **Hỗ trợ AI (RAG Chatbot):** [cite: 99]
    * Tư vấn sản phẩm, size, phong cách ("áo này phối với quần gì?")[cite: 100].
    * Tra cứu chính sách bảo quản, đổi trả và trạng thái đơn hàng[cite: 100].
* **Quản lý tài khoản:** Chỉnh sửa thông tin cá nhân, địa chỉ, xem lịch sử đơn hàng và viết đánh giá sản phẩm[cite: 102, 105].

### B. Tính năng cho Quản trị viên (Admin Features)
* **Dashboard tổng quan:** [cite: 140]
    * Biểu đồ doanh thu (Chart.js/Recharts/ShadcnUI)[cite: 141].
    * Thống kê top sản phẩm bán chạy, số lượng đơn hàng, và tỷ lệ thanh toán (Bank/Crypto)[cite: 144].
* **Quản lý (CRUD):**
    * **Sản phẩm:** Quản lý chi tiết (tên, mô tả, ảnh Cloudinary), danh mục, thương hiệu[cite: 116, 119].
    * **Biến thể (Variants):** Quản lý tồn kho (inventory) và giá theo từng SKU (size, màu sắc)[cite: 125, 184].
    * **Đơn hàng:** Xem danh sách, lọc theo trạng thái (chờ thanh toán, đã thanh toán, đang giao...), cập nhật trạng thái (thủ công hoặc tự động qua webhook)[cite: 130].
    * **Khuyến mãi:** Tạo mã voucher (theo % hoặc giá cố định), thiết lập thời gian[cite: 128, 229].
* **Hỗ trợ AI (Admin Assistant):** [cite: 136]
    * Chatbot RAG nội bộ để tra cứu nhanh (VD: "doanh thu tuần này?", "sản phẩm bán chạy nhất?", "tỷ lệ chuyển đổi?")[cite: 137].
* **Tự động hóa (n8n):** [cite: 138]
    * Tự động gửi email xác nhận khi đơn hàng được thanh toán[cite: 139].
    * Gửi thông báo (Telegram/Email) cho admin khi có đơn mới[cite: 139].
    * Tự động gửi báo cáo doanh thu định kỳ (hàng tuần)[cite: 139].

## 4. Bối cảnh Kỹ thuật (Technical Context & Stack)

* **Kiến trúc:** MERN Stack[cite: 26]. Dự án được cấu trúc thành 3 phần chính (monorepo-style): `admin/` (React App cho Admin), `client/` (React App cho Khách hàng), `server/` (Node.js/Express Backend)[cite: 239, 242, 252, 276].
* **Frontend (`client` & `admin`):** React + Vite (Build tool), axios, React Query (State Management)[cite: 81]. Trang Admin sử dụng thêm `shadcn/ui` và TailwindCSS (Styling)[cite: 81].
* **Backend (`server`):** Node.js + Express.js (Xây dựng RESTful API)[cite: 81].
* **Database:** MongoDB Atlas (NoSQL) [cite: 81], sử dụng Mongoose Schemas (trong `server/models/`)[cite: 286].
* **Authentication:** JWT (JSON Web Tokens) [cite: 81, 92] và Google OAuth (qua Google Identity API)[cite: 81].
* **Media Storage:** Cloudinary (Lưu trữ và tối ưu hình ảnh, video sản phẩm)[cite: 81].
* **Automation:** n8n (Xử lý các workflows tự động)[cite: 84].
* **AI:** OpenAI API + RAG (Retrieval-Augmented Generation) [cite: 84], được xử lý trong thư mục `server/rag/`[cite: 294, 295].
* **Hosting:** Vercel/Netlify (Frontend) và Render/Railway (Backend)[cite: 84].

## 5. Các chuẩn đặt tên (Naming Conventions)

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

## 6. Quy tắc Error Handling (Xử lý lỗi)

[cite\_start]Dự án sử dụng middleware xử lý lỗi tập trung của Express[cite: 290].

1.  **Trong Controllers (`server/controllers/`):**
      * Tất cả logic nghiệp vụ được bọc trong `try...catch` block (hoặc sử dụng `express-async-handler`).
      * Khi có lỗi, controller sẽ gọi `next(error)` để đẩy lỗi đến middleware xử lý lỗi.
      * Ví dụ: `catch (error) { next(error); }`
2.  **Middleware xử lý lỗi (trong `server/middleware/`):**
      * Một middleware đặc biệt (có 4 tham số: `(err, req, res, next)`) được định nghĩa cuối cùng trong `server.js`.
      * Middleware này sẽ "bắt" tất cả các lỗi được gọi bằng `next(error)`.
      * Nó chịu trách nhiệm định dạng phản hồi lỗi (JSON) và set HTTP status code (ví dụ: 400, 401, 404, 500) một cách nhất quán.