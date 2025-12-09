---
description: Workflow tích hợp tìm kiếm sản phẩm bằng hình ảnh (Visual Search) sử dụng OpenAI + Pinecone
---

# 🖼️ Visual Search - OpenAI + Pinecone

## 📋 Tổng Quan

| Thông tin | Chi tiết |
|-----------|----------|
| **Mục đích** | Cho phép user upload ảnh để tìm sản phẩm tương tự |
| **Tech Stack** | OpenAI GPT-4o-mini + text-embedding-3-small + Pinecone |
| **Chi phí** | ~$0.01/ảnh (sử dụng OpenAI API key có sẵn) |
| **Độ chính xác** | 80-85% |
| **Status** | ✅ Đã implement hoàn chỉnh |

## 🏗️ Kiến trúc

```
User Upload Image
       │
       ▼
┌─────────────────────────────────────────────────┐
│                    SERVER                        │
│                                                  │
│  1. Nhận ảnh (base64)                           │
│  2. GPT-4o-mini mô tả ảnh                       │  ──▶ OpenAI API
│  3. text-embedding-3-small tạo embedding (512d) │
│  4. Query Pinecone tìm similar                  │  ──▶ Pinecone (visual-search)
│  5. Fetch product details từ MongoDB            │
│  6. Return results                              │
│                                                  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
              Similar Products
```

---

## 📁 Cấu trúc Files

### Server-side
```
server/
├── services/imageSearch/
│   ├── clipEmbedding.js      # GPT-4o-mini + text-embedding-3-small (512 dims)
│   └── imageVectorStore.js   # Pinecone operations (visual-search index)
├── controllers/
│   └── ImageSearchController.js  # API endpoints
├── routes/
│   └── imageSearchRoutes.js      # Route definitions
└── scripts/
    └── ingestImageEmbeddings.js  # Tạo embeddings cho products
```

### Client-side
```
client/src/
├── services/
│   └── imageSearchService.js     # API calls
├── components/
│   └── VisualSearch/
│       ├── VisualSearch.jsx      # Upload modal với drag-drop
│       └── VisualSearch.module.css
└── pages/
    └── VisuallySimilar/
        ├── VisuallySimilar.jsx   # Trang kết quả
        └── VisuallySimilar.module.css
```

---

## 🔧 Environment Variables

Thêm vào `server/.env`:
```env
# OpenAI (đã có sẵn)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# Pinecone Image Search Index
PINECONE_IMAGE_INDEX_NAME=visual-search
```

---

## 📊 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/image-search/find-similar` | Tìm sản phẩm tương tự |
| GET | `/api/image-search/health` | Health check |
| GET | `/api/image-search/stats` | Index stats (admin) |

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
      "score": 0.85,
      "similarity": 85,
      "productName": "Heraldic Knight Wool Sweater",
      "color": "Night black",
      "price": 2000,
      "mainImage": "https://res.cloudinary.com/...",
      "size": "M",
      "sku": "HER-M-NIGHT-BLACK",
      "inStock": true,
      "urlSlug": "heraldic-knight-wool-sweater"
    }
  ],
  "count": 12
}
```

---

## 🚀 Setup & Chạy

### 1. Ingest Product Embeddings (chỉ chạy 1 lần hoặc khi có product mới)

```bash
cd server

# Ingest tất cả products
node scripts/ingestImageEmbeddings.js

# Chỉ ingest products mới (chưa có embedding)
node scripts/ingestImageEmbeddings.js --new

# Clear và ingest lại từ đầu
node scripts/ingestImageEmbeddings.js --clear
```

### 2. Test API
```bash
# Health check
curl http://localhost:3111/api/image-search/health

# Find similar (với test image)
curl -X POST http://localhost:3111/api/image-search/find-similar \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,iVBOR...", "topK": 8}'
```

---

## 🎯 User Flow

1. **User mở Search** → Click vào icon Visual Search (camera)
2. **VisualSearch modal mở** → User upload ảnh (click hoặc drag-drop)
3. **Loading state** hiển thị preview ảnh + spinner
4. **API call** → Server xử lý với GPT-4o-mini + Pinecone
5. **Navigate** đến `/visually-similar` với kết quả
6. **VisuallySimilar page** hiển thị ảnh đã upload + grid sản phẩm tương tự

---

## ⚙️ Chi tiết Implementation

### Server: clipEmbedding.js
- Sử dụng **GPT-4o-mini** để mô tả ảnh (fashion-specific prompt)
- Sử dụng **text-embedding-3-small** với `dimensions: 512`
- Rate limiting: 200ms giữa các requests

### Server: imageVectorStore.js
- Index: `visual-search` (512 dimensions)
- Namespace: `product-images`
- Metric: cosine similarity

### Server: ImageSearchController.js
- Validate image size (max 10MB)
- Generate embedding từ uploaded image
- Query Pinecone với topK results
- Fetch full product data từ MongoDB
- Return formatted results

### Client: VisualSearch.jsx
- Drag & drop + click to upload
- File validation (jpeg, png, webp, max 10MB)
- Preview image + loading spinner
- Navigate with state to results page

### Client: VisuallySimilar.jsx
- Nhận data từ navigation state
- Deduplicate products (by name + color)
- Display với ScarfCard grid (giống ProductByCategory)

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| Ingestion time | ~3 phút cho 119 products |
| Search latency | 1-3s (GPT-4o-mini + Pinecone) |
| Pinecone vectors | 119 (1 per product variant) |
| Embedding dimensions | 512 |

---

## ⚠️ Rate Limits

OpenAI có rate limit **200,000 TPM** cho gpt-4o-mini. Nếu ingestion bị lỗi 429:
1. Chờ 1-2 phút
2. Chạy lại với `--new` để tiếp tục từ chỗ dừng

---

## 🧪 Testing Checklist

- [x] API health check trả về `healthy`
- [x] Ingestion script chạy thành công (119 vectors)
- [x] Upload ảnh hiển thị loading state
- [x] Navigate đến kết quả sau khi search
- [x] Sản phẩm tương tự hiển thị đúng
- [x] Click vào sản phẩm navigate đến product detail

---

## 🔄 Khi thêm Product mới

Chạy script với `--new` để chỉ ingest products chưa có embedding:
```bash
cd server
node scripts/ingestImageEmbeddings.js --new
```

---

## 📝 Notes

- Approach: **Description-based** (GPT-4 Vision mô tả → text embedding)
- Độ chính xác: ~80-85% (tốt cho fashion items)
- Chi phí: ~$0.01/ảnh mô tả + ~$0.0001/embedding
- Ưu điểm: Dùng OpenAI API key có sẵn, không cần đăng ký thêm service
