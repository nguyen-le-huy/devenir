# 🚀 Hướng dẫn Setup Auth System cho Client

## 📋 Các files đã tạo:

### Form Components

```
client/src/components/form/
├── FormInput.jsx + FormInput.module.css
├── FormButton.jsx + FormButton.module.css
├── FormError.jsx + FormError.module.css
├── RegisterForm.jsx + RegisterForm.module.css
├── LoginForm.jsx + LoginForm.module.css
└── ForgotPasswordForm.jsx + ForgotPasswordForm.module.css
```

### Auth Page

```
client/src/pages/auth/
└── AuthPage.jsx + AuthPage.module.css
```

### Services & Contexts

```
client/src/
├── services/
│   ├── api.js (Axios configuration + interceptors)
│   └── authService.js (API calls for auth)
├── contexts/
│   └── AuthContext.jsx (Authentication state management)
└── components/
    └── ProtectedRoute.jsx (Route protection)
```

---

## ⚙️ Installation Steps:

### 1. Cài đặt Dependencies

```bash
cd client
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Backend URL

Đảm bảo backend server đang chạy trên `http://localhost:5000`

---

## 🔗 Routing Setup

Các routes hiện tại:

- **GET** `/auth` - Trang Auth (Login, Register, Forgot Password)
- **GET** `/` - Home page (Public)
- **GET** `/scarves` - Product by category (Public)

---

## 📝 Sử dụng AuthContext

Trong bất kỳ component nào:

```jsx
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <p>Vui lòng đăng nhập</p>;
  }

  return (
    <div>
      <p>Xin chào, {user.username}!</p>
      {isAdmin() && <p>Bạn là Admin</p>}
      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
}
```

---

## 🔐 Tính năng Auth đã có:

✅ **Register** - Đăng ký tài khoản mới
✅ **Login** - Đăng nhập với email/password
✅ **Forgot Password** - Yêu cầu reset password
✅ **JWT Token Management** - Lưu & gửi token với mỗi request
✅ **Role-based Redirect** - Admin → `/admin-dashboard`, User → `/`
✅ **Protected Routes** - ProtectedRoute & AdminRoute components
✅ **Auto logout** - Logout khi token hết hạn (401)
✅ **Form Validation** - Client-side validation
✅ **Error Handling** - Thông báo lỗi chi tiết

---

## 🧪 Testing Auth

### 1. Test Register

1. Truy cập `http://localhost:5173/auth`
2. Chuyển sang "Đăng ký"
3. Điền thông tin:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click "Đăng ký"
5. Nếu thành công, redirect tới home

### 2. Test Login

1. Truy cập `/auth`
2. Điền email & password đã đăng ký
3. Click "Đăng nhập"
4. Check localStorage:
   - `token` - JWT token
   - `user` - User info (id, email, username, role)

### 3. Test Forgot Password

1. Truy cập `/auth`
2. Click "Quên mật khẩu?"
3. Nhập email
4. Check email để nhận link reset password

---

## 📦 Dependencies thêm vào:

- `axios` - HTTP client

---

## 🔗 Backend Requirements

Server phải có các endpoints này:

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/logout` - Logout (Protected)

---

## ⚠️ Chú ý:

1. **JWT Token** được lưu trong localStorage (không an toàn cho production)

   - Để an toàn hơn, nên dùng httpOnly cookies

2. **Google OAuth** chưa hoàn toàn setup

   - Cần cài đặt Google Identity Library
   - Cần config Google Client ID

3. **Reset Password** chưa có page
   - Cần tạo `ResetPasswordPage` để user reset password bằng link từ email

---

## ✅ Tiếp theo:

1. Tạo `ResetPasswordPage` - Page để reset password từ email link
2. Setup Admin Dashboard
3. Google OAuth Integration (Frontend)
4. Setup Server APIs (đã có hướng dẫn)

---

**Sẵn sàng test chưa? 🚀**
