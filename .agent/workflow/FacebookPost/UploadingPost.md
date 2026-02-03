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
| STT | Node | Mô tả |
|-----|------|-------|
| 1 | Webhook | Nhận request từ Backend Server |
| 2 | MongoDB (Aggregate) | Lấy thông tin sản phẩm + variants từ database |
| 3 | OpenAI (Message a model) | Tạo nội dung bài viết bằng AI |
| 4 | Code (Split Images) | Xử lý dữ liệu, tách ảnh thành nhiều items |
| 5 | HTTP Request (Upload) | Upload từng ảnh lên Facebook với `published: false` |
| 6 | **Code (Aggregate IDs)** | **Gom tất cả Media ID lại thành 1 item** |
| 7 | **HTTP Request (Publish)** | **Đăng 1 bài duy nhất với nhiều ảnh lên Facebook** |
| 8 | Respond to Webhook | Trả kết quả về Backend Server |

---

## 🔄 LUỒNG HOẠT ĐỘNG

### Sơ đồ tổng quan
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
         │                        │       [Xử lý n8n]      │
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

### Sơ đồ chi tiết trong n8n (Multi-Image Post)
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────┐
│ Webhook  │───>│ MongoDB  │───>│  OpenAI  │───>│ Code (Split)  │
└──────────┘    └──────────┘    └──────────┘    └───────┬───────┘
                                                        │
                                                        │ Output: 4 items
                                                        │ (1 item = 1 ảnh)
                                                        ▼
                                               ┌────────────────┐
                                               │ HTTP Request   │
                                               │ (Upload ẩn)    │
                                               │ published:false│
                                               └───────┬────────┘
                                                       │
                                                       │ Output: 4 items
                                                       │ (1 item = 1 media_id)
                                                       ▼
                                               ┌────────────────┐
                                               │ Code           │
                                               │ (Aggregate)    │◄── Execute Once!
                                               │ Gom 4 ID → 1   │
                                               └───────┬────────┘
                                                       │
                                                       │ Output: 1 item
                                                       │ {message, attached_media:[...]}
                                                       ▼
                                               ┌────────────────┐
                                               │ HTTP Request   │
                                               │ (Publish Feed) │
                                               │ POST /feed     │
                                               └───────┬────────┘
                                                       │
                                                       │ Output: 1 post
                                                       ▼
                                               ┌────────────────┐
                                               │ Respond to     │
                                               │ Webhook        │
                                               └────────────────┘
```

---

## 📋 CHI TIẾT TỪNG NODE TRONG n8n

### **Node 1: Webhook**
- **HTTP Method**: POST
- **Path**: `post-product` (hoặc tên bạn muốn)
- **Response Mode**: `Using 'Respond to Webhook' Node`

### **Node 2: MongoDB (Aggregate documents)**
- **Operation**: Aggregate
- **Collection**: `products`
- **Pipeline**: Lookup để join với `productvariants`

### **Node 3: OpenAI (Message a model)**
- **Model**: `gpt-3.5-turbo` hoặc `gpt-4o`
- **Prompt**: Viết caption hấp dẫn cho sản phẩm (lấy name, description từ MongoDB)

### **Node 4: Code (Split Images)** - Quan trọng!
- **Mode**: Run Once for All Items
- **Mục đích**: Tách tất cả ảnh của sản phẩm thành nhiều items riêng biệt
- **Output**: Mỗi item chứa `{pageId, message, imageUrl}`

```javascript
const product = $('Aggregate documents').first().json;
const aiContent = items[0].json.message.content;
const webhookData = $('Webhook').first().json.body;

const firstVariant = product.variants?.[0];
const price = firstVariant?.price || 0;
const variantId = firstVariant?._id || '';
const domain = "https://www.devenir.shop";
const productLink = variantId 
    ? `${domain}/product-detail?variant=${variantId}` 
    : `${domain}/home`;

const finalMessage = `${aiContent}\n\n------------------\n👉 Mua ngay tại: ${productLink}\n\n#Devenir #NewArrival`;

// Lấy tất cả ảnh
let imageUrls = [];
if (firstVariant) {
    if (firstVariant.mainImage) imageUrls.push(firstVariant.mainImage);
    if (firstVariant.images) imageUrls.push(...firstVariant.images);
}
imageUrls = [...new Set(imageUrls)].slice(0, 10);

// Trả về nhiều items (1 item = 1 ảnh)
return imageUrls.map(url => ({
    json: {
        pageId: webhookData.pageId,
        message: finalMessage,
        imageUrl: url
    }
}));
```

### **Node 5: HTTP Request (Upload Photos)**
- **Method**: POST
- **URL**: `https://graph.facebook.com/{{ $json.pageId }}/photos`
- **Authentication**: Header Auth (Bearer Token)
- **Query Parameters**:
  | Name | Value |
  |------|-------|
  | url | `{{ $json.imageUrl }}` |
  | published | `false` ← **QUAN TRỌNG: Phải là false!** |

### **Node 6: Code (Aggregate IDs)** - QUAN TRỌNG!
- **Mode**: Run Once for All Items ← **Bật option này!**
- **Mục đích**: Gom tất cả media ID thành 1 item duy nhất

```javascript
// Gom tất cả ID ảnh đã upload
const mediaIds = items.map(item => ({
    media_fbid: item.json.id
}));

// Lấy message và pageId từ node Code đầu tiên
const firstCodeData = $('Code in JavaScript').first().json;

return {
    json: {
        pageId: firstCodeData.pageId,
        message: firstCodeData.message,
        attached_media: mediaIds
    }
};
```

### **Node 7: HTTP Request (Publish Feed)**
- **Method**: POST
- **URL**: `https://graph.facebook.com/{{ $json.pageId }}/feed`
- **Authentication**: Header Auth (Bearer Token)
- **Query Parameters**:
  | Name | Value |
  |------|-------|
  | message | `{{ $json.message }}` |
  | attached_media | `{{ JSON.stringify($json.attached_media) }}` |

### **Node 8: Respond to Webhook**
- **Response Body**:
```json
{
    "success": true,
    "message": "Đã đăng bài thành công!",
    "post_id": "{{ $json.id }}"
}
```

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
- `webhookUrl`: URL **Production** của n8n Webhook (KHÔNG có chữ `-test`)
- `pageId`: Facebook Page ID

---

## 🔧 XỬ LÝ LỖI PHỔ BIẾN

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| CORS blocked | Admin gọi trực tiếp webhook | Sử dụng Backend proxy `/api/social/webhook-proxy` |
| Webhook not registered | Dùng URL Test hoặc Workflow chưa Active | Bật **Activate** workflow, dùng URL Production (bỏ `-test`) |
| Invalid Page ID | Token không khớp với Page | Lấy Token từ đúng Page muốn đăng |
| `pages_manage_posts` not found | Facebook App thiếu permission | Thêm Use Case Facebook Login → Customize → Add permission |
| **Đăng 4 ảnh = 4 post** | Thiếu node Aggregate | Thêm node **Code (Aggregate)** + **HTTP Request (Publish Feed)** |
| Multi-image không hiện Grid | `published` chưa set `false` | Đảm bảo HTTP Upload có `published: false` |

---

## 📝 GHI CHÚ QUAN TRỌNG

### Token Facebook
- Page Access Token từ Graph Explorer chỉ sống **1-2 giờ**
- Để dùng lâu dài (**60 ngày**), cần Extend qua Access Token Debugger

### Multi-Image Post (Album/Grid)
- **PHẢI** upload ảnh với `published: false` trước
- Sau đó gọi `/feed` với `attached_media` chứa danh sách `media_fbid`
- Nếu chỉ dùng `/photos` trực tiếp → Mỗi ảnh sẽ thành 1 post riêng

### Trạng thái Posted
- Hiện tại lưu ở localStorage trong Admin Panel
- Để persist lâu dài, có thể thêm trường `posted_to_facebook` vào Product model trong MongoDB

### URL Webhook
| Loại | Format | Điều kiện |
|------|--------|-----------|
| Test | `/webhook-test/abc123` | Chỉ khi bấm "Listen for Test Event" |
| **Production** | `/webhook/abc123` | Luôn hoạt động khi workflow **Activated** |