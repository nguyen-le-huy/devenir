---
description: Workflow chi tiết để tích hợp chức năng tìm kiếm sản phẩm bằng hình ảnh (Image Search) sử dụng Pinecone + CLIP - 100% miễn phí với HuggingFace
---

# 🖼️ Image Search với Pinecone + CLIP

## 📋 Tổng Quan

| Thông tin | Chi tiết |
|-----------|----------|
| **Mục đích** | Cho phép user upload ảnh để tìm sản phẩm tương tự |
| **Tech Stack** | HuggingFace CLIP API + Pinecone |
| **Chi phí** | $0 (free tier) |
| **Độ chính xác** | 85-95% |
| **Thời gian implement** | 3-4 giờ |

## 🏗️ Kiến trúc

```
User Upload Image
       │
       ▼
┌─────────────────┐
│     SERVER      │
│                 │
│  1. Nhận ảnh    │
│  2. Gọi CLIP    │──────▶ HuggingFace API (free)
│  3. Vector      │              │
│     Search      │◀─────────────┘
│                 │
│  4. Query       │──────▶ Pinecone (đã có)
│     Pinecone    │              │
│                 │◀─────────────┘
│  5. Return      │
│     Results     │
└────────┬────────┘
         │
         ▼
   Similar Products
```

## 📁 Files cần tạo

### Server
```
server/
├── services/imageSearch/
│   ├── clipEmbedding.js      # Gọi HuggingFace CLIP API
│   └── imageVectorStore.js   # Pinecone operations (512 dims)
├── controllers/
│   └── ImageSearchController.js
├── routes/
│   └── imageSearchRoutes.js
└── scripts/
    └── ingestImageEmbeddings.js  # Tạo embeddings cho products
```

### Client
```
client/src/
├── components/ImageSearch/
│   ├── ImageSearch.jsx       # UI upload + results
│   └── ImageSearch.module.css
├── hooks/
│   └── useImageSearch.js     # Hook xử lý search
└── services/
    └── imageSearchService.js # API calls
```

---

## 🔧 Implementation Steps

### Phase 1: Setup (15 phút)

1. **Lấy HuggingFace API Key**
   - Đăng ký https://huggingface.co/
   - Settings → Access Tokens → Create (read permission)

2. **Thêm env variables**
   ```env
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxx
   PINECONE_IMAGE_INDEX_NAME=devenir-images
   ```

### Phase 2: Server (1.5 giờ)

1. **Tạo CLIP Embedding Service** (`clipEmbedding.js`)
   - Function `getImageEmbedding(imageUrl)` → 512-dim vector
   - Function `getImageEmbeddingFromBase64(base64)` → 512-dim vector
   - Gọi HuggingFace API: `openai/clip-vit-base-patch32`

2. **Tạo Image Vector Store** (`imageVectorStore.js`)
   - Tạo Pinecone index mới với **512 dimensions** (CLIP)
   - Functions: `upsertImageEmbeddings()`, `searchSimilarImages()`

3. **Tạo Controller + Routes**
   - `POST /api/image-search/find-similar` - Nhận base64 image, trả về similar products
   - `GET /api/image-search/health` - Health check

4. **Tạo Ingestion Script** (`ingestImageEmbeddings.js`)
   - Lấy tất cả ProductVariant có mainImage
   - Tạo CLIP embedding cho mỗi ảnh
   - Upsert vào Pinecone với metadata (variantId, productName, price, etc.)

### Phase 3: Client (1 giờ)

1. **Tạo Service** (`imageSearchService.js`)
   - `findSimilarProducts(base64Image, topK)`

2. **Tạo Hook** (`useImageSearch.js`)
   - State: `isSearching`, `results`, `error`
   - Function: `searchByImage(file)`
   - Convert file → base64 → gọi API

3. **Tạo Component** (`ImageSearch.jsx`)
   - Drag & drop zone
   - Image preview
   - Results grid với similarity score
   - Loading/error states

### Phase 4: Integration (30 phút)

1. **Chạy ingestion script**
   ```bash
   node scripts/ingestImageEmbeddings.js
   ```

2. **Thêm nút camera vào Search component**
   - Icon camera bên cạnh search input
   - Mở modal ImageSearch khi click

3. **Test end-to-end**

---

## ⚠️ Lưu ý quan trọng

### Pinecone Index
- Index hiện tại dùng **1536 dims** (OpenAI)
- CLIP cần **512 dims** → Tạo index mới `devenir-images`

### HuggingFace Rate Limits
- Free tier: **30,000 requests/tháng**
- Ingestion 500 products = 500 requests
- Còn ~29,500 searches/tháng

### CLIP Model
- Model: `openai/clip-vit-base-patch32`
- Output: 512-dimensional vector
- Hỗ trợ cả image và text embedding (cùng embedding space)

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
  "image": "<base64_encoded_image>",
  "topK": 8
}
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "variantId": "...",
      "productName": "...",
      "color": "...",
      "price": 299,
      "mainImage": "https://...",
      "similarity": 92
    }
  ]
}
```

---

## 🧪 Testing Checklist

- [ ] HuggingFace API key hoạt động
- [ ] Pinecone index 512 dims được tạo
- [ ] Script ingestion chạy thành công
- [ ] API trả về kết quả đúng
- [ ] UI drag & drop hoạt động
- [ ] Mobile responsive
- [ ] Error handling

---

## 🎯 Kết quả mong đợi

| Metric | Target |
|--------|--------|
| Ingestion time | ~2-3 phút (500 products) |
| Search latency | 500ms - 1.5s |
| Accuracy | 85-95% |
| Monthly cost | $0 |
