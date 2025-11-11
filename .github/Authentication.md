# Tài liệu Hướng dẫn Copilot: Xây dựng Luồng Xác thực (Authentication) cho Dự án Devenir

Dưới đây là mô tả chi tiết, từng bước về luồng xác thực và phân quyền cho dự án E-commerce Devenir, sử dụng MERN Stack.

## 1. Bối cảnh và Công nghệ

* [cite_start]**Mục tiêu:** Xây dựng API xác thực an toàn cho cả `User` (khách hàng) và `Admin` (quản trị viên)[cite: 146].
* [cite_start]**Stack:** Node.js, Express.js, MongoDB[cite: 25, 55].
* **Công nghệ chính:**
    * [cite_start]**JWT (JSON Web Token):** Dùng để xác thực các phiên đăng nhập[cite: 88, 98, 117].
    * [cite_start]**Bcrypt:** Dùng để mã hóa (hash) và kiểm tra mật khẩu[cite: 98, 144].
    * [cite_start]**Google OAuth 2.0:** Dùng để đăng nhập nhanh qua Google (sử dụng Google Identity API)[cite: 88, 98].
    * [cite_start]**Email Service:** Dùng cho tính năng quên mật khẩu (ví dụ: EmailJS hoặc Resend API)[cite: 98].
* **Database Model (`users`):**
    * [cite_start]`email`: String, required, unique[cite: 143].
    * [cite_start]`password`: String, required (nếu không dùng Google OAuth), đã được hash bằng bcrypt[cite: 144].
    * [cite_start]`googleId`: String (lưu ID từ Google)[cite: 145].
    * [cite_start]`role`: String, Enum: ["user", "admin"], default: "user"[cite: 146].

## 2. Luồng Đăng ký (Registration Flow)

1.  [cite_start]**Input (Request Body):** Nhận `email` và `password` từ người dùng[cite: 98]. [cite_start](Có thể thêm `username` [cite: 142]).
2.  [cite_start]**Validation:** Kiểm tra xem `email` đã tồn tại trong collection `users` chưa (kiểm tra trùng lặp)[cite: 98].
    * Nếu email đã tồn tại, trả về lỗi 400 (Bad Request) với thông báo "Email đã được sử dụng".
3.  [cite_start]**Password Hashing:** Mã hóa `password` (dạng plain text) của người dùng bằng `bcrypt.hash()`[cite: 98, 144].
4.  [cite_start]**Create User:** Tạo một document `user` mới trong collection `users` với `email`, `password` (đã hash), và gán `role: "user"`[cite: 146].
5.  **Response:** Trả về thông báo đăng ký thành công (status 201 Created).

## 3. Luồng Đăng nhập Truyền thống (Traditional Login Flow)

1.  [cite_start]**Input (Request Body):** Nhận `email` và `password`[cite: 98].
2.  [cite_start]**Find User:** Tìm `user` trong database dựa trên `email`[cite: 143].
    * Nếu không tìm thấy `user`, trả về lỗi 401 (Unauthorized) với thông báo "Email hoặc mật khẩu không đúng".
3.  **Check Password:** So sánh `password` (plain text) mà người dùng nhập vào với `password` (đã hash) trong database bằng hàm `bcrypt.compare()`.
    * Nếu mật khẩu không khớp, trả về lỗi 401 (Unauthorized) với thông báo "Email hoặc mật khẩu không đúng".
4.  [cite_start]**Generate Token:** Nếu mật khẩu khớp, tạo một JWT (JSON Web Token)[cite: 98].
    * [cite_start]**JWT Payload:** Phải chứa `userId: user._id` và `role: user.role`[cite: 146].
5.  [cite_start]**Response:** Trả về JWT cho client[cite: 98].
    * [cite_start]*Ghi chú cho Client (Frontend):* Client sẽ lưu token này vào `localStorage` để sử dụng cho các yêu cầu (API requests) tiếp theo[cite: 98].

## 4. Luồng Đăng nhập Google (Google OAuth 2.0 Flow)

1.  [cite_start]**Input (Request Body):** Nhận `credential` (token) từ Google Identity API (do client gửi lên)[cite: 98].
2.  **Verify Token (Backend):** Server xác thực `credential` này với Google để lấy thông tin (profile) của người dùng (bao gồm email, name, và `googleId`).
3.  **Find or Create User:**
    * [cite_start]**Kiểm tra:** Tìm `user` trong database bằng `googleId`[cite: 145].
    * **Nếu user tồn tại (với googleId):** Chuyển sang Bước 4 (Generate Token).
    * **Nếu user không tồn tại:**
        * Kiểm tra xem `email` từ Google đã tồn tại trong database (đăng ký truyền thống) chưa.
        * Nếu email đã tồn tại (nhưng chưa có `googleId`), cập nhật `googleId` cho user này.
        * [cite_start]Nếu cả email và `googleId` đều chưa tồn tại, tạo một `user` mới với `email`, `googleId` nhận được, và `role: "user"` (trường `password` có thể để trống hoặc null vì đây là tài khoản OAuth)[cite: 144, 145].
4.  **Generate Token:** Tạo một JWT với payload chứa `userId` và `role` của user vừa tìm thấy hoặc vừa tạo.
5.  [cite_start]**Response:** Trả về JWT cho client (tương tự luồng đăng nhập truyền thống)[cite: 98].

## 5. Luồng Quên Mật khẩu (Forgot/Reset Password Flow)

1.  **Request (POST /api/auth/forgot-password):**
    * **Input:** Nhận `email` của người dùng.
    * **Logic:** Tìm user bằng `email`. Nếu tìm thấy, tạo một token reset mật khẩu (có thể là JWT ngắn hạn hoặc một chuỗi ngẫu nhiên) và lưu vào database (ví dụ: trong user document, cùng với thời gian hết hạn).
    * [cite_start]**Action:** Gửi email cho người dùng (qua EmailJS hoặc Resend API) [cite: 98] chứa một đường link đặc biệt để reset (ví dụ: `YOUR_CLIENT_URL/reset-password/TOKEN`).
2.  **Reset (POST /api/auth/reset-password/:token):**
    * **Input:** Nhận `token` từ URL param và `newPassword` từ request body.
    * **Logic:** Xác thực `token` (tìm trong database, kiểm tra xem có hợp lệ và chưa hết hạn không).
    * **Action:** Nếu token hợp lệ, hash `newPassword` mới bằng bcrypt và cập nhật `password` mới cho user trong database. Vô hiệu hóa token đã sử dụng.
    * **Response:** Trả về thông báo thành công.

## 6. Luồng Middleware (Xác thực & Phân quyền)

Đây là các middleware của Express để bảo vệ các API routes.

### 6.1. Middleware Xác thực (Authenticate)

1.  **Get Token:** Lấy token JWT từ header `Authorization` của request (kiểm tra định dạng `Bearer TOKEN`).
2.  **Verify Token:** Dùng `jwt.verify()` để giải mã token.
    * Nếu token không hợp lệ hoặc hết hạn, trả về lỗi 401 (Unauthorized).
3.  **Attach User:** Nếu token hợp lệ, lấy `userId` từ payload, tìm `user` tương ứng trong database.
4.  **Forward:** Đính kèm thông tin user (ví dụ: `req.user = user`) vào đối tượng request và gọi `next()` để cho phép request tiếp tục.

### 6.2. Middleware Phân quyền Admin (isAdmin)

Middleware này phải được dùng *sau* middleware "Authenticate" ở trên.

1.  **Check Role:** Kiểm tra `req.user.role` (đã được đính kèm từ middleware trước).
2.  **Authorize:**
    * [cite_start]Nếu `req.user.role === "admin"`, gọi `next()`[cite: 117].
    * [cite_start]Nếu không (ví dụ: `role === "user"`), trả về lỗi 403 (Forbidden) - "Yêu cầu quyền Admin"[cite: 117].
3.  [cite_start]**Usage:** Middleware `isAdmin` này sẽ được dùng để bảo vệ tất cả các API quản trị (Admin Dashboard APIs)[cite: 81, 82, 117].

## Cấu trúc File Gợi ý (Trong thư mục `server/`)