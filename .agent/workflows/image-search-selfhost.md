---
description: Workflow tìm kiếm sản phẩm bằng hình ảnh (Visual Search) với Self-hosted CLIP + Qdrant + Redis
---

# Visual Search Self-Hosted Workflow

## Architecture

```
┌────────────┐    ┌───────────┐    ┌──────────────┐    ┌─────────┐
│   Browser  │───►│  Node.js  │───►│ CLIP Service │    │  Redis  │
│   (React)  │    │  Backend  │    │ (ViT-L-14)   │    │ (Cache) │
└────────────┘    └─────┬─────┘    └──────────────┘    └────▲────┘
                        │                                    │
                        │          ┌──────────────┐          │
                        └─────────►│    Qdrant    │──────────┘
                                   │  Vector DB   │
                                   └──────────────┘
```

---

## Model Configuration

| Thông số | Giá trị |
|----------|---------|
| **Model** | ViT-L-14 (OpenAI CLIP) |
| **Model Size** | ~850MB |
| **Embedding Dims** | 768 |
| **Score Threshold** | 0.15 (giảm để detect ảnh có background) |
| **Inference Time** | ~300-400ms per image |

---

## File Structure

### 📁 Docker Services

| File | Mục đích |
|------|----------|
| `docker-compose.visual-search.yml` | Docker Compose cho 3 services: Qdrant (6333), Redis (6379), CLIP (8899) |
| `clip-service/main.py` | FastAPI CLIP server với ViT-L-14 model (768 dims) |
| `clip-service/requirements.txt` | Python dependencies cho CLIP service |
| `clip-service/Dockerfile` | Docker build file cho CLIP service |

### 📁 Server - Services (`server/services/imageSearch/`)

| File | Mục đích |
|------|----------|
| `clipServiceClient.js` | HTTP client gọi CLIP FastAPI để encode images → 768-dim embeddings |
| `qdrantVectorStore.js` | Qdrant client: init collection (768 dims), upsert vectors, search similar |
| `redisCache.js` | Redis client: cache search results (TTL 1 hour), giảm latency từ 400ms → 1ms |

### 📁 Server - Controller & Routes

| File | Mục đích |
|------|----------|
| `server/controllers/ImageSearchController.js` | Controller xử lý API requests (find-similar, health, stats) |
| `server/routes/imageSearchRoutes.js` | Express routes cho `/api/image-search/*` |

### 📁 Server - Scripts

| File | Mục đích |
|------|----------|
| `server/scripts/ingestion/ingest-to-qdrant.js` | Script index tất cả product variants vào Qdrant với rich payload |

### 📁 Client - Components

| File | Mục đích |
|------|----------|
| `client/src/services/imageSearchService.js` | API service gọi `/api/image-search/find-similar` |
| `client/src/components/VisualSearch/VisualSearch.jsx` | Modal upload ảnh, drag & drop, gọi API search |
| `client/src/components/VisualSearch/VisualSearch.module.css` | Styles cho VisualSearch modal |
| `client/src/pages/VisuallySimilar/VisuallySimilar.jsx` | Trang hiển thị kết quả tìm kiếm với grid sản phẩm |
| `client/src/pages/VisuallySimilar/VisuallySimilar.module.css` | Styles cho trang kết quả |

---

## Docker Volumes

| Volume | Mục đích | Size |
|--------|----------|------|
| `devenir_qdrant_data` | Vector database storage | ~50MB |
| `devenir_redis_data` | Cache data | ~10MB |
| `devenir_clip_cache` | CLIP model cache (persist after rebuild) | ~850MB |

---

## API Endpoints

| Endpoint | Method | Mục đích |
|----------|--------|----------|
| `/api/image-search/find-similar` | POST | Tìm sản phẩm tương tự từ ảnh base64 |
| `/api/image-search/health` | GET | Health check (CLIP, Qdrant, Redis status) |
| `/api/image-search/stats` | GET | Thống kê Qdrant (Admin only) |

### Request Format

```json
POST /api/image-search/find-similar
{
  "image": "<base64 image>",
  "topK": 12,
  "scoreThreshold": 0.15
}
```

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "variantId": "...",
      "score": 0.55,
      "similarity": 55,
      "productName": "EKD Wool Cashmere Sweater",
      "color": "Wine red",
      "price": 450,
      "mainImage": "https://...",
      "hoverImage": "https://...",
      "urlSlug": "ekd-wool-cashmere-sweater"
    }
  ],
  "count": 6,
  "cached": false,
  "timing": {
    "cacheCheck": 2,
    "clipEncode": 350,
    "qdrantSearch": 35,
    "total": 390
  }
}
```

---

## Search Flow

```
User upload ảnh (base64)
    │
    ├─► POST /api/image-search/find-similar
    │   Body: { image: "base64...", topK: 12 }
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ Node.js Backend (ImageSearchController)                 │
│                                                         │
│  1. Check Redis Cache (image hash)                      │
│     ├─ HIT  → Return cached results (~1ms) ──────────►  │
│     └─ MISS → Continue                                  │
│                                                         │
│  2. Call CLIP Service (ViT-L-14)                        │
│     POST → localhost:8899/encode { image: base64 }      │
│     ⏱️ ~300-400ms                                       │
│     └─► embedding [768d]                                │
│                                                         │
│  3. Query Qdrant                                        │
│     POST → localhost:6333/search { vector, limit: 12 }  │
│     ⏱️ ~35ms                                            │
│     └─► 12 results with scores + payloads              │
│                                                         │
│  4. Format Results (NO MongoDB needed)                  │
│     └─► Payload từ Qdrant đã có đủ data                │
│                                                         │
│  5. Cache to Redis (async, TTL: 1 hour)                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Response: {
  success: true,
  data: [{ variantId, productName, color, price, mainImage, similarity, ... }],
  count: 12,
  cached: false,
  timing: { cacheCheck: 2, clipEncode: 350, qdrantSearch: 35, total: 390 }
}
    │
    ▼
Client navigate → /visually-similar (hiển thị grid sản phẩm)
```

---

## Performance

| Loại ảnh | First Request | Cached Request |
|----------|---------------|----------------|
| **Product-only** (no background) | ~400ms, ~80% similarity | ~1ms |
| **With background** (người, nhà hàng, etc.) | ~400ms, ~50-60% similarity | ~1ms |

### Timing Breakdown (First Request)

| Step | Time |
|------|------|
| Cache Check | ~2ms |
| CLIP Encode (ViT-L-14) | ~300-400ms |
| Qdrant Search | ~35ms |
| **Total** | **~400ms** |

---

## Commands

```bash
# Start Docker services (Qdrant, Redis, CLIP)
docker compose -f docker-compose.visual-search.yml up -d

# Stop Docker services
docker compose -f docker-compose.visual-search.yml down

# View logs
docker compose -f docker-compose.visual-search.yml logs -f

# Rebuild CLIP service (after model change)
docker compose -f docker-compose.visual-search.yml up -d --build clip-service

# Index products to Qdrant (first time or after product changes)
cd server && node scripts/ingestion/ingest-to-qdrant.js --force

# Start Node.js server
cd server && npm run dev

# Check CLIP health
curl http://localhost:8899/health

# Check API health
curl http://localhost:3111/api/image-search/health
```

---

## Environment Variables

Thêm vào `server/.env` (optional - có defaults):

```env
# Self-hosted Visual Search
CLIP_SERVICE_URL=http://localhost:8899
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
```

---

## Troubleshooting

### Ảnh có background không tìm được
- ✅ Đã fix: Dùng ViT-L-14 thay vì ViT-B-32
- ✅ Giảm scoreThreshold từ 0.3 → 0.15

### CLIP service chậm
- ViT-L-14 encode ~300-400ms (on CPU)
- Cached requests chỉ ~1ms
- Có thể dùng GPU để tăng tốc (modify Dockerfile)

### Re-indexing sau khi đổi model
- Phải chạy `--force` để xóa và tạo lại collection với dimension mới
- `node scripts/ingestion/ingest-to-qdrant.js --force`
