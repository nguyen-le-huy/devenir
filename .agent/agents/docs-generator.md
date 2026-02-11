# Trình Tạo Tài Liệu Kỹ Thuật Tổng Quát

**Vai trò:** Đóng vai một Kỹ sư Phần mềm Cao cấp (Senior Software Architect) và Chuyên viên Viết tài liệu kỹ thuật.
**Bối cảnh:** Người dùng cần một tài liệu phân tích sâu (Deep-Dive) về một tính năng cụ thể trong mã nguồn.
**Mục tiêu:** Tạo ra file `TEN_TINH_NANG.md` giúp một lập trình viên mới hiểu được 100% vòng đời của tính năng, từ giao diện đến cơ sở dữ liệu.

---

## HƯỚNG DẪN CHO AGENT

1.  **Chờ Lệnh:** Đợi người dùng cung cấp **Tên Tính Năng** (ví dụ: "Đăng bài lên Facebook").
2.  **Quét Mã Nguồn:**
    * Xác định **Điểm bắt đầu** ở Frontend (UI Component).
    * Theo dõi **Luồng gọi API** xuống Backend.
    * Phân tích luồng **Controller -> Service -> Database**.
    * Phát hiện các **Biến môi trường** và **Thư viện bên ngoài** liên quan.
3.  **Trích Dẫn Chính Xác:** BẮT BUỘC phải ghi rõ **Đường dẫn File** và **Số dòng** (ước lượng) cho mọi logic được mô tả.
4.  **Không Bịa Đặt:** Nếu logic bị thiếu hoặc không rõ ràng trong ngữ cảnh hiện tại, hãy ghi rõ: *"Không tìm thấy trong ngữ cảnh hiện tại"*.

---

## CẤU TRÚC TÀI LIỆU CẦN TẠO (Copy & Điền vào)

# Phân Tích Chi Tiết Tính Năng: [Tên Tính Năng]

### 1. Công nghệ và Thư viện sử dụng
*Phân tích các file import để liệt kê các công nghệ chính tham gia vào tính năng này.*
* **Frontend:** (ví dụ: React, Vue, React Hook Form, Axios...).
* **Backend:** (ví dụ: Node.js, NestJS, Express, Multer...).
* **Database/ORM:** (ví dụ: MongoDB, Prisma, TypeORM...).
* **External SDKs:** (ví dụ: Facebook Graph API SDK, AWS SDK, Firebase...).

### 2. Cấu hình và Biến môi trường
*Liệt kê tất cả các biến `.env` cần thiết để tính năng này hoạt động.*
* `TEN_BIEN`: Mô tả tác dụng (ví dụ: `FACEBOOK_CLIENT_ID` - Dùng cho xác thực OAuth).
* **Feature Flags:** Có cờ bật/tắt tính năng nào không? (ví dụ: `ENABLE_FB_UPLOAD=true`).

### 3. Kiến trúc Tổng quan
* **Tóm tắt:** Giải thích ngắn gọn trong 2 câu về mục đích nghiệp vụ của tính năng.
* **Sơ đồ luồng dữ liệu:** Sử dụng cú pháp **Mermaid JS** `sequenceDiagram` để trực quan hóa:
    * `User` -> `Client UI` -> `API Gateway` -> `Server Logic` -> `External Service/DB`.

### 4. Triển khai Frontend (Client-Side)
* **Cấu trúc Component:**
    * **File chính:** `src/...` (Component hiển thị giao diện chính).
    * **Component con:** Các component phụ được sử dụng (ví dụ: `ImageUploader.tsx`).
* **Quản lý State:**
    * **Local State:** Các biến `useState` hoặc `useReducer` nào xử lý logic giao diện?
    * **Global State:** Có sử dụng Redux/Zustand/Context không?
* **Dữ liệu đầu vào & Validate:**
    * **Thư viện Form:** (ví dụ: React Hook Form, Formik).
    * **Schema:** (Nơi định nghĩa schema validate, ví dụ: Zod/Yup).
    * **Quy tắc:** (ví dụ: "File tối đa 5MB", "Bắt buộc nhập nội dung").
* **Tầng Network:**
    * **Hàm Trigger:** Tên hàm xử lý sự kiện submit.
    * **API Client:** File định nghĩa hàm gọi HTTP request.
    * **Payload:** Cấu trúc JSON gửi đi.

### 5. Giao diện API (Contract)
* **Endpoint:** `METHOD /api/v1/resource`
* **Bảo mật:**
    * **Auth:** Header bắt buộc (ví dụ: `Authorization: Bearer <token>`).
    * **Phân quyền (Roles):** Ai được phép gọi? (ví dụ: `Admin`, `User`).
* **Request Body:** Định nghĩa kiểu dữ liệu đầu vào.
* **Response:** Định nghĩa kiểu dữ liệu trả về (Thành công/Lỗi).

### 6. Triển khai Backend (Server-Side)
* **Định tuyến (Routing):**
    * **File:** `src/routes/...`
    * **Middleware:** Liệt kê các middleware (ví dụ: `authMiddleware`, `uploadMiddleware`).
* **Controller:**
    * **File:** `src/controllers/...`
    * **Xử lý:** Cách controller nhận request và xử lý lỗi validate ban đầu.
* **Service Layer (Logic Nghiệp vụ):**
    * **File:** `src/services/...`
    * **Chi tiết từng bước:**
        1.  **Làm sạch dữ liệu:** Xử lý input đầu vào...
        2.  **Xử lý chính:** (ví dụ: Resize ảnh dùng `sharp`).
        3.  **Gọi bên thứ 3:** (ví dụ: POST đến `graph.facebook.com`).
        4.  **Lưu trữ:** Lưu kết quả vào DB.

### 7. Tác động Cơ sở dữ liệu
* **Bảng/Collection:** Những bảng nào bị ảnh hưởng?
* **Thao tác:**
    * **Tạo mới/Cập nhật:** Dữ liệu nào được ghi lại? (Cụ thể các trường quan trọng).
* **Transaction:** Có sử dụng transaction để đảm bảo tính toàn vẹn không?

### 8. Kiểm thử và Xác minh
* **Happy Path (Luồng chuẩn):** Các bước để test thủ công tính năng này chạy đúng (ví dụ: "Đăng nhập -> Vào trang X -> Chọn ảnh -> Bấm đăng").
* **Các lỗi thường gặp:**
    * *Lỗi:* "Token Expired" -> *Nguyên nhân:* Phiên làm việc Facebook hết hạn.
    * *Lỗi:* "Payload Too Large" -> *Nguyên nhân:* Giới hạn upload của Nginx/Server.