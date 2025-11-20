# 🛍️ Devenir - Men's Fashion E-commerce Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)](https://www.mongodb.com/mern-stack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Devenir** là nền tảng thương mại điện tử cao cấp chuyên về thời trang nam, được xây dựng trên **MERN Stack** với tích hợp AI Chatbot (RAG), tự động hóa n8n, và thanh toán đa kênh.

---

## 📋 Menu

- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
- [Biến môi trường](#-biến-môi-trường)
- [API Documentation](#-api-documentation)

---

## ✨ Tính năng chính

### Cho Khách hàng:
- 🔐 Xác thực: Email/Password + Google OAuth
- 🛍️ Duyệt sản phẩm với bộ lọc thông minh (size, màu, giá)
- 🤖 AI Chatbot (RAG): Tư vấn size, phối đồ, tra cứu đơn hàng
- 💳 Thanh toán đa kênh: Ngân hàng (PayOS/VNPAY) + Crypto (Coinbase Commerce)
- 📦 Quản lý tài khoản & lịch sử đơn hàng

### Cho Admin:
- 📊 Dashboard tổng quan (doanh thu, top sản phẩm)
- 📦 CRUD Sản phẩm, Variants (SKU, size, màu, tồn kho)
- 🎯 Quản lý Đơn hàng, Khuyến mãi, Khách hàng
- 🤖 AI Admin Assistant: Truy vấn dữ liệu vận hành
- 🔄 Tự động hóa n8n: Xác nhận đơn, cảnh báo tồn kho

---

## 🛠 Công nghệ sử dụng

| Layer | Tech Stack |
|-------|-----------|
| **Frontend (Client)** | React 18, Vite, CSS Modules, GSAP, Axios, React Query |
| **Frontend (Admin)** | React 18, Vite, TailwindCSS, Shadcn/ui, React Query |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **Authentication** | JWT, bcrypt, Google OAuth |
| **AI** | OpenAI API, LangChain (RAG) |
| **Payment** | PayOS, VNPAY, Coinbase Commerce |
| **Storage** | Cloudinary (Images/Videos) |
| **Automation** | n8n |
| **Deployment** | Vercel (Frontend), Self-host (Backend) |

---

## 📁 Cấu trúc dự án

```
devenir/
├── server/           # Backend API (Node.js/Express)
│   ├── config/       # Database, Cloudinary, PayOS config
│   ├── controllers/  # Business logic
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API endpoints
│   ├── middleware/   # Auth, error handling
│   ├── rag/          # AI Chatbot (RAG)
│   └── server.js     # Entry point
│
├── client/           # Frontend cho khách hàng
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API calls (axios)
│   │   └── assets/       # Images, fonts
│   └── vite.config.js
│
├── admin/            # Frontend cho admin
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Dashboard, Products, Orders
│   │   └── services/     # API calls
│   └── tailwind.config.js
│
└── .github/          # Documentation & CI/CD
```

---

## 🚀 Cài đặt & Chạy dự án

### 1️⃣ Yêu cầu hệ thống:
- Node.js >= 18.x
- MongoDB Atlas account (hoặc local MongoDB)
- npm hoặc yarn

### 2️⃣ Clone repository:
```bash
git clone https://github.com/yourusername/devenir.git
cd devenir
```

### 3️⃣ Cài đặt dependencies:

**Backend:**
```bash
cd server
npm install
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn
npm run dev
```

**Client:**
```bash
cd ../client
npm install
cp .env.example .env
npm run dev
```

**Admin:**
```bash
cd ../admin
npm install
cp .env.example .env
npm run dev
```

### 4️⃣ Truy cập:
- **Client:** http://localhost:5173
- **Admin:** http://localhost:5174
- **Server:** http://localhost:5000

---

## 🔑 Biến môi trường

### Server (.env)
```bash
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=...
PAYOS_API_KEY=...
OPENAI_API_KEY=...
```

### Client & Admin (.env)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=...
```

📖 Xem chi tiết trong các file `.env.example`

---

## 📚 API Documentation

### Authentication
```
POST /api/auth/register       # Đăng ký
POST /api/auth/login          # Đăng nhập
POST /api/auth/google         # Google OAuth
```

### Products
```
GET    /api/products          # Lấy danh sách sản phẩm
GET    /api/products/:id      # Chi tiết sản phẩm
POST   /api/products          # Thêm sản phẩm (Admin)
PUT    /api/products/:id      # Cập nhật (Admin)
DELETE /api/products/:id      # Xóa (Admin)
```

### Orders
```
GET  /api/orders/my-orders    # Lịch sử đơn hàng
POST /api/orders              # Tạo đơn hàng
PUT  /api/orders/:id/pay      # Cập nhật thanh toán
```

📄 **Full API Docs:** [Xem tại đây](.github/ARCHITECTURE.md)

---

## 🤝 Contributing

1. Fork repository
2. Tạo branch: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add AmazingFeature'`
4. Push: `git push origin feature/AmazingFeature`
5. Tạo Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👥 Team

- **Your Name** - [GitHub](https://github.com/yourusername)

---

## 📞 Contact

Project Link: [https://github.com/yourusername/devenir](https://github.com/yourusername/devenir)

---

⭐ Nếu thấy dự án hữu ích, hãy cho một **star** nhé!
