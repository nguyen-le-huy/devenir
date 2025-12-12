---
description: Workflow đăng bài sản phẩm lên Facebook tự động qua n8n
---

# Social Media Auto-Posting Workflow

Hướng dẫn tổng quan về hệ thống đăng bài sản phẩm lên Facebook tự động từ Admin Panel thông qua n8n.

---

## 📁 CẤU TRÚC FILE

### **Admin Panel** (`/admin/src/`)
| File | Mô tả |
|------|-------|
| `pages/content/SocialPostsPage.tsx` | Trang quản lý Social Media - hiển thị danh sách sản phẩm, trạng thái đăng, nút Post |
| `components/app-sidebar.tsx` | Sidebar navigation - chứa menu item "Social Posts" |
| `App.tsx` | Router - định nghĩa route `/admin/social-posts` |

### **Backend Server** (`/server/`)
| File | Mô tả |
|------|-------|
| `routes/socialRoutes.js` | Proxy endpoint `/api/social/webhook-proxy` - chuyển tiếp request đến n8n (tránh CORS) |
| `server.js` | Import và register route `socialRoutes` |

### **n8n Workflow** (Self-hosted)
| Node | Mô tả |
|------|-------|
| Webhook | Nhận request từ Backend Server |
| MongoDB (Aggregate) | Lấy thông tin sản phẩm + variants từ database |
| OpenAI (Message a model) | Tạo nội dung bài viết bằng AI |
| Code (JavaScript) | Xử lý dữ liệu, tách ảnh thành nhiều items |
| HTTP Request (Upload) | Upload từng ảnh lên Facebook (published: false) |
| Code (Aggregate) | Gom tất cả Media ID lại |
| HTTP Request (Publish) | Đăng bài với nhiều ảnh lên Facebook Page |
| Respond to Webhook | Trả kết quả về Backend Server |

---

## 🔄 LUỒNG HOẠT ĐỘNG

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  ADMIN PANEL    │      │  BACKEND SERVER │      │       n8n       │
│  (React)        │      │  (Express)      │      │  (Self-hosted)  │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │  1. User bấm "Post"    │                        │
         │ ─────────────────────> │                        │
         │  POST /api/social/     │                        │
         │  webhook-proxy         │                        │
         │                        │  2. Chuyển tiếp        │
         │                        │ ─────────────────────> │
         │                        │  POST /webhook/...     │
         │                        │                        │
         │                        │                   ┌────┴────┐
         │                        │                   │ MongoDB │
         │                        │                   │ Query   │
         │                        │                   └────┬────┘
         │                        │                        │
         │                        │                   ┌────┴────┐
         │                        │                   │ OpenAI  │
         │                        │                   │ Caption │
         │                        │                   └────┬────┘
         │                        │                        │
         │                        │                   ┌────┴────┐
         │                        │                   │ Code    │
         │                        │                   │ Process │
         │                        │                   └────┬────┘
         │                        │                        │
         │                        │                   ┌────┴────┐
         │                        │                   │Facebook │
         │                        │                   │ API     │
         │                        │                   └────┬────┘
         │                        │                        │
         │                        │  3. Kết quả           │
         │                        │ <───────────────────── │
         │                        │  {success, post_id}   │
         │                        │                        │
         │  4. Response           │                        │
         │ <───────────────────── │                        │
         │  "Posted successfully" │                        │
         │                        │                        │
    ┌────┴────┐                   │                        │
    │ Update  │                   │                        │
    │ UI/Toast│                   │                        │
    └─────────┘                   │                        │
```

---

## 📋 CHI TIẾT TỪNG BƯỚC

### **Bước 1: User tương tác trên Admin Panel**
- Vào trang **Social Media Management** (`/admin/social-posts`)
- Cấu hình **Webhook URL** và **Page ID** trong Settings (lưu vào localStorage)
- Xem danh sách sản phẩm với trạng thái Posted/Pending
- Bấm nút **Post** hoặc **Repost** trên sản phẩm muốn đăng

### **Bước 2: Admin gửi request đến Backend**
- `SocialPostsPage.tsx` gọi API: `POST /api/social/webhook-proxy`
- Payload gửi đi:
  ```json
  {
    "webhookUrl": "https://n8n.example.com/webhook/abc123",
    "productId": "693783d052b92c9c2f83658f",
    "postType": "multi_image",
    "pageId": "905478369317354"
  }
  ```

### **Bước 3: Backend chuyển tiếp đến n8n**
- `socialRoutes.js` nhận request
- Trích xuất `webhookUrl` từ body
- Gọi `fetch(webhookUrl, { productId, postType, pageId })`
- Nhận response từ n8n và trả về cho Admin Panel

### **Bước 4: n8n xử lý workflow**

| Thứ tự | Node | Hành động |
|--------|------|-----------|
| 1 | **Webhook** | Nhận `productId`, `pageId` |
| 2 | **MongoDB (Aggregate)** | Lấy product + variants từ DB dựa trên `productId` |
| 3 | **OpenAI** | Tạo caption hấp dẫn từ tên + mô tả sản phẩm |
| 4 | **Code** | Xử lý: Lấy tất cả ảnh, tạo link sản phẩm, format message |
| 5 | **HTTP Request (Upload)** | Upload từng ảnh lên Facebook với `published: false` |
| 6 | **Code (Aggregate)** | Gom tất cả `media_fbid` vào mảng `attached_media` |
| 7 | **HTTP Request (Publish)** | POST `/pageId/feed` với `message` và `attached_media` |
| 8 | **Respond to Webhook** | Trả `{success: true, post_id: "..."}` |

### **Bước 5: Kết quả trả về Admin**
- Admin nhận response từ Backend
- Hiển thị Toast thông báo thành công/thất bại
- Cập nhật trạng thái sản phẩm thành "Posted" (lưu localStorage)
- Hiển thị thời gian đăng bài

---

## ⚙️ CẤU HÌNH CẦN THIẾT

### **Facebook App & Token**
1. Tạo Facebook App loại **Business** tại [developers.facebook.com](https://developers.facebook.com)
2. Kết nối Business Portfolio với App
3. Thêm Use Case: **Facebook Login for Business**
4. Customize → Add permissions: `pages_manage_posts`, `pages_show_list`, `pages_read_engagement`
5. Vào Graph API Explorer → Chọn App → Chọn Page → Generate Access Token
6. Gia hạn Token (60 ngày): Dùng Access Token Debugger → Extend

### **n8n Credentials**
- **MongoDB**: Connection string từ MongoDB Atlas
- **OpenAI**: API Key từ platform.openai.com
- **Facebook**: Header Auth với `Authorization: Bearer <PAGE_ACCESS_TOKEN>`

### **Admin Settings (localStorage)**
- `webhookUrl`: URL Production của n8n Webhook (không có `-test`)
- `pageId`: Facebook Page ID

---

## 🔧 XỬ LÝ LỖI PHỔ BIẾN

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| CORS blocked | Admin gọi trực tiếp webhook | Sử dụng Backend proxy `/api/social/webhook-proxy` |
| Webhook not registered | Dùng URL Test hoặc Workflow chưa Active | Bật Activate workflow, dùng URL Production |
| Invalid Page ID | Token không khớp với Page | Lấy Token từ đúng Page muốn đăng |
| `pages_manage_posts` not found | Facebook App thiếu permission | Thêm Use Case Facebook Login → Customize → Add permission |

---

## 📝 GHI CHÚ

- **Token Facebook**: Page Access Token từ Graph Explorer chỉ sống 1-2 giờ. Để dùng lâu dài (60 ngày), cần Extend qua Access Token Debugger.
- **Multi-Image Post**: Để đăng dạng Album/Grid, cần upload ảnh với `published: false` trước, sau đó gọi `/feed` với `attached_media`.
- **Trạng thái Posted**: Hiện tại lưu ở localStorage. Để persist, có thể thêm trường `posted_to_facebook` vào Product model trong MongoDB.