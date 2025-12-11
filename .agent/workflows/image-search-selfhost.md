---
description: Workflow tìm kiếm sản phẩm bằng hình ảnh (Visual Search) với Self-hosted FashionCLIP + Qdrant + Redis
---

# Visual Search Self-Hosted Workflow

## Architecture

```
┌────────────┐    ┌───────────┐    ┌──────────────┐    ┌─────────┐
│   Browser  │───►│  Node.js  │───►│ FashionCLIP  │    │  Redis  │
│   (React)  │    │  Backend  │    │  (Zalando)   │    │ (Cache) │
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
| **Model** | FashionCLIP (Zalando) |
| **Model ID** | `patrickjohncyh/fashion-clip` |
| **Model Size** | ~400MB |
| **Embedding Dims** | 512 |
| **Training Data** | 800K+ fashion images |
| **License** | MIT (Free for commercial use) |
| **Score Threshold** | 0.15 |
| **Inference Time** | ~200ms per image |

### Tại sao FashionCLIP?

| So sánh | OpenAI CLIP (ViT-L-14) | FashionCLIP |
|---------|------------------------|-------------|
| Training data | General images | **800K+ fashion** |
| Color accuracy | ⭐⭐ | ⭐⭐⭐⭐ |
| Fashion attributes | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Size | ~850MB | **~400MB** |
| Inference time | ~400ms | **~200ms** |
| Correct color ranking | ❌ Position #5-6 | ✅ **Position #1** |

---

## File Structure

### 📁 Docker Services

| File | Mục đích |
|------|----------|
| `docker-compose.visual-search.yml` | Docker Compose cho 3 services: Qdrant (6333), Redis (6379), CLIP (8899) |
| `clip-service/main.py` | FastAPI FashionCLIP server (512 dims) |
| `clip-service/requirements.txt` | Python dependencies (transformers, torch) |
| `clip-service/Dockerfile` | Docker build file cho CLIP service |

### 📁 Server - Services (`server/services/imageSearch/`)

| File | Mục đích |
|------|----------|
| `clipServiceClient.js` | HTTP client gọi FashionCLIP FastAPI để encode images → 512-dim embeddings |
| `qdrantVectorStore.js` | Qdrant client: init collection (512 dims), upsert vectors, search similar |
| `redisCache.js` | Redis client: cache search results (TTL 1 hour), giảm latency từ 200ms → 1ms |

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
| `client/src/pages/VisuallySimilar/VisuallySimilar.jsx` | Trang hiển thị kết quả tìm kiếm với grid sản phẩm |

---

## Docker Volumes

| Volume | Mục đích | Size |
|--------|----------|------|
| `devenir_qdrant_data` | Vector database storage | ~50MB |
| `devenir_redis_data` | Cache data | ~10MB |
| `devenir_clip_cache` | FashionCLIP model cache (persist after rebuild) | ~400MB |

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
      "score": 0.61,
      "similarity": 61,
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
    "cacheCheck": 1,
    "clipEncode": 200,
    "qdrantSearch": 6,
    "total": 210
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
│  2. Call FashionCLIP Service                            │
│     POST → localhost:8899/encode { image: base64 }      │
│     ⏱️ ~200ms (fashion-specialized)                     │
│     └─► embedding [512d]                                │
│                                                         │
│  3. Query Qdrant                                        │
│     POST → localhost:6333/search { vector, limit: 12 }  │
│     ⏱️ ~6ms                                             │
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
Response → Client navigate → /visually-similar
```

---

## Performance

| Loại ảnh | First Request | Cached Request |
|----------|---------------|----------------|
| **Product-only** (no background) | ~200ms, ~80% similarity | ~1ms |
| **With background** (người, nhà hàng, etc.) | ~200ms, ~60% similarity | ~1ms |

### Timing Breakdown (First Request)

| Step | Time |
|------|------|
| Cache Check | ~1ms |
| FashionCLIP Encode | ~200ms |
| Qdrant Search | ~6ms |
| **Total** | **~210ms** |

---

## Commands

```bash
# Start Docker services (Qdrant, Redis, FashionCLIP)
docker compose -f docker-compose.visual-search.yml up -d

# Stop Docker services
docker compose -f docker-compose.visual-search.yml down

# View logs
docker compose -f docker-compose.visual-search.yml logs -f

# Rebuild CLIP service (after model change)
docker compose -f docker-compose.visual-search.yml up -d --build clip-service

# Index products to Qdrant (first time or after product changes)
cd server && node scripts/ingestion/ingest-to-qdrant.js --force

# Clear Redis cache (after model upgrade)
docker exec devenir-redis redis-cli FLUSHDB

# Restart PM2 server
pm2 restart devenir-server

# Check FashionCLIP health
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

### Màu sắc sản phẩm không đúng ranking
- ✅ Đã fix: Dùng FashionCLIP thay vì OpenAI CLIP
- FashionCLIP được train trên 800K+ fashion images → hiểu màu sắc tốt hơn

### Cache trả về kết quả cũ sau khi đổi model
- Clear Redis cache: `docker exec devenir-redis redis-cli FLUSHDB`

### Re-indexing sau khi đổi model
- Phải chạy `--force` để xóa và tạo lại collection với dimension mới
- `cd server && node scripts/ingestion/ingest-to-qdrant.js --force`

### CLIP service chậm
- FashionCLIP encode ~200ms (on CPU)
- Cached requests chỉ ~1ms
- Có thể dùng GPU để tăng tốc (modify Dockerfile)
