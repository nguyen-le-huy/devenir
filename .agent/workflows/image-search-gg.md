---
description: Google Cloud Vision API Product Search
---

````markdown
---
description: Workflow tích hợp tìm kiếm sản phẩm bằng hình ảnh (Visual Search) sử dụng Google Cloud Vision API
---

# 🖼️ Visual Search - Google Cloud Vision API

## 📋 Tổng Quan

| Thông tin | Chi tiết |
|-----------|----------|
| **Mục đích** | Cho phép user upload ảnh để tìm sản phẩm tương tự về mặt thị giác (kiểu dáng, màu sắc, hoa văn) |
| **Tech Stack** | Google Cloud Vision API (Product Search) + Google Cloud Storage |
| **Chi phí** | Free 1000 requests/tháng đầu tiên (sau đó tính phí theo usage) |
| **Độ chính xác** | 90-95% (Tối ưu cho Fashion với model `apparel-v2`) |
| **Status** | ✅ Đã implement hoàn chỉnh |

## 🏗️ Kiến trúc

```mermaid
graph TD
    User[User Upload Image] --> Server
    
    subgraph "Google Cloud Platform"
        GCS[Google Cloud Storage] -- Chứa ảnh gốc --> VisionAPI
        VisionAPI[Vision API Product Search] -- Search Index --> ProductSet[Product Set: fashion-set-01]
    end

    subgraph "Backend Server"
        Server -- 1. Gửi ảnh (base64) --> VisionAPI
        VisionAPI -- 2. Trả về List Product IDs + Score --> Server
        Server -- 3. Query chi tiết sản phẩm --> DB[(MongoDB)]
    end

    DB -- 4. Return Full Info --> Server
    Server -- 5. Return JSON --> User
````

-----

## 📁 Cấu trúc Files

### Server-side

```
server/
├── controllers/
│   └── ImageSearchController.js  # API endpoints (Gọi Google Vision)
├── routes/
│   └── imageSearchRoutes.js      # Route definitions
├── scripts/
│   └── ingestToGoogleVision.js   # Script upload ảnh lên GCS & Index vào Vision API
└── google-credentials.json       # Service Account Key (Không commit file này)
```

### Client-side (Không đổi)

```
client/src/
├── services/
│   └── imageSearchService.js     # API calls
├── components/
│   └── VisualSearch/
│       ├── VisualSearch.jsx      # Upload modal
│       └── VisualSearch.module.css
└── pages/
    └── VisuallySimilar/
        ├── VisuallySimilar.jsx   # Trang kết quả
```

-----

## 🔧 Environment Variables

Cập nhật `server/.env`:

```env
# Google Cloud Credentials
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Google Vision Configuration
GOOGLE_PROJECT_ID=dating-application-293c8
GOOGLE_LOCATION=us-west1
GOOGLE_PRODUCT_SET_ID=fashion-set-01
GOOGLE_STORAGE_BUCKET=staging.dating-application-293c8.appspot.com
```

-----

## 📊 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/image-search/find-similar` | Tìm sản phẩm tương tự |
| GET | `/api/image-search/health` | Health check |

### Request Body (find-similar)

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "topK": 12
}
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "variantId": "692db287e643bf4d59d9cbe4",
      "score": 0.92,  // Confidence score từ Google Vision
      "productName": "Heraldic Knight Wool Sweater",
      "price": 2000,
      "mainImage": "[https://res.cloudinary.com/](https://res.cloudinary.com/)...",
      "inStock": true
    }
  ],
  "count": 12
}
```

-----

## 🚀 Setup & Chạy

### 1\. Ingest Data (Đưa dữ liệu lên Google)

Chạy script này để upload ảnh sản phẩm từ DB lên Google Cloud Storage và đánh index.
*Lưu ý: Sau khi chạy xong, cần đợi 15-30 phút để Google train model.*

```bash
cd server
node scripts/ingestToGoogleVision.js
```

### 2\. Test API

```bash
# Health check
curl http://localhost:3111/api/image-search/health

# Find similar (với test image)
curl -X POST http://localhost:3111/api/image-search/find-similar \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,iVBOR..."}'
```

-----

## ⚙️ Chi tiết Implementation

### Server: ingestToGoogleVision.js

1.  Kết nối MongoDB lấy danh sách sản phẩm.
2.  Download ảnh từ URL hiện tại (Cloudinary/S3).
3.  Upload ảnh lên **Google Cloud Storage** (Bucket: `staging.dating-application-293c8...`).
4.  Gọi API `createProduct` và `createReferenceImage` để đăng ký với Google Vision.
5.  Thêm vào Product Set `fashion-set-01` với category `apparel-v2`.

### Server: ImageSearchController.js

  - Nhận ảnh Base64 từ Client.
  - Gọi `imageAnnotatorClient.productSearch`.
  - Google tự động detect vật thể (áo/quần/váy) và so sánh visual features.
  - Nhận về danh sách Product ID.
  - Map ngược lại với MongoDB để lấy thông tin chi tiết (Giá, Tên, Size).

-----

## 📈 Performance & Limits

| Metric | Value | Ghi chú |
|--------|-------|---------|
| **Indexing Time** | 15-30 phút | Độ trễ sau khi ingest dữ liệu mới |
| **Search Latency** | \< 1s | Nhanh hơn nhiều so với phương pháp cũ (GPT) |
| **Quota** | 1000 requests/tháng | Miễn phí (Free Tier) |
| **Accuracy** | Cao | Nhận diện tốt chất liệu, hoa văn, form dáng |

-----

## 📝 Notes

  - **Approach:** **Visual-based** (So sánh đặc điểm thị giác trực tiếp: pixel, edge, texture).
  - **Khác biệt với cũ:** Không còn dùng mô tả văn bản (Text Description). AI "nhìn" ảnh trực tiếp.
  - **Yêu cầu:** Ảnh gốc phải nằm trên Google Cloud Storage mới index được.
  - **Bounding Box:** Google hỗ trợ trả về toạ độ vật thể, có thể mở rộng tính năng vẽ khung lên ảnh user upload.

<!-- end list -->

```
```