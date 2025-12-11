---
description: Workflow tìm kiếm sản phẩm bằng hình ảnh (Visual Search) với Self-hosted CLIP + Qdrant + Redis
---

# Visual Search Self-Hosted Workflow

## Architecture

```
┌────────────┐    ┌───────────┐    ┌──────────────┐    ┌─────────┐
│   Browser  │───►│  Node.js  │───►│ CLIP Service │    │  Redis  │
│   (React)  │    │  Backend  │    │ (Python/ONNX)│    │ (Cache) │
└────────────┘    └─────┬─────┘    └──────────────┘    └────▲────┘
                        │                                    │
                        │          ┌──────────────┐          │
                        └─────────►│    Qdrant    │──────────┘
                                   │  Vector DB   │
                                   └──────────────┘
```

---

## File Structure

### 📁 Docker Services

| File | Mục đích |
|------|----------|
| `docker-compose.visual-search.yml` | Docker Compose cho 3 services: Qdrant (6333), Redis (6379), CLIP (8899) |
| `clip-service/main.py` | FastAPI CLIP server với ViT-B-32 model (512 dims) |
| `clip-service/requirements.txt` | Python dependencies cho CLIP service |
| `clip-service/Dockerfile` | Docker build file cho CLIP service |

### 📁 Server - Services (`server/services/imageSearch/`)

| File | Mục đích |
|------|----------|
| `clipServiceClient.js` | HTTP client gọi CLIP FastAPI để encode images → 512-dim embeddings |
| `qdrantVectorStore.js` | Qdrant client: init collection, upsert vectors, search similar |
| `redisCache.js` | Redis client: cache search results (TTL 1 hour), giảm latency từ 350ms → 10ms |

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

## API Endpoints

| Endpoint | Method | Mục đích |
|----------|--------|----------|
| `/api/image-search/find-similar` | POST | Tìm sản phẩm tương tự từ ảnh base64 |
| `/api/image-search/health` | GET | Health check (CLIP, Qdrant, Redis status) |
| `/api/image-search/stats` | GET | Thống kê Qdrant (Admin only) |

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
│     ├─ HIT  → Return cached results (~10ms) ─────────►  │
│     └─ MISS → Continue                                  │
│                                                         │
│  2. Call CLIP Service                                   │
│     POST → localhost:8899/encode { image: base64 }      │
│     ⏱️ ~100ms (ONNX optimized)                         │
│     └─► embedding [512d]                                │
│                                                         │
│  3. Query Qdrant                                        │
│     POST → localhost:6333/search { vector, limit: 12 }  │
│     ⏱️ ~35ms                                           │
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
  timing: { cacheCheck: 2, clipEncode: 100, qdrantSearch: 35, total: 140 }
}
    │
    ▼
Client navigate → /visually-similar (hiển thị grid sản phẩm)
```

---

## Performance

| Request Type | First Request | Cached Request |
|--------------|---------------|----------------|
| Cache Check | 2ms | 2ms |
| CLIP Encode | ~100ms | - |
| Qdrant Search | ~35ms | - |
| Total | **~140ms** | **~10ms** |

---

## Commands

```bash
# Start Docker services (Qdrant, Redis, CLIP)
docker compose -f docker-compose.visual-search.yml up -d

# Stop Docker services
docker compose -f docker-compose.visual-search.yml down

# View logs
docker compose -f docker-compose.visual-search.yml logs -f

# Index products to Qdrant (first time or after product changes)
cd server && node scripts/ingestion/ingest-to-qdrant.js --force

# Start Node.js server
cd server && npm run dev
```

---

## Environment Variables

Thêm vào `server/.env`:

```env
# Self-hosted Visual Search (optional - có defaults)
CLIP_SERVICE_URL=http://localhost:8899
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
```
