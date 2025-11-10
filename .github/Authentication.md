## 5. Flow Authentication (Luồng Xác thực)

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