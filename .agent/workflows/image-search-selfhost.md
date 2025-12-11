---
description: Workflow tìm kiếm sản phẩm bằng hình ảnh (Visual Search) với Self-hosted CLIP + Qdrant - Optimized Version
---

# Visual Search Workflow

## Architecture

```
┌────────────┐    ┌───────────┐    ┌──────────────┐    ┌─────────┐
│   Browser  │───►│  Node.js  │───►│ CLIP Service │    │  Redis  │
│            │    │  Backend  │    │ (ONNX+INT8)  │    │ (Cache) │
└────────────┘    └─────┬─────┘    └──────────────┘    └────▲────┘
                        │                                    │
                        │          ┌──────────────┐          │
                        └─────────►│    Qdrant    │──────────┘
                                   │  Vector DB   │
                                   └──────────────┘
```

---

## 1. Ingestion Flow (Chạy 1 lần)

```
Admin chạy script
    │
    ├─► Fetch 119 variants từ MongoDB
    │
    ├─► Batch encode images (5 items/batch)
    │   POST → CLIP /encode-batch
    │   └─► Response: 5 embeddings [512d]
    │
    ├─► Upsert vào Qdrant với RICH PAYLOAD
    │   {
    │     variantId, productName, color, price,
    │     mainImage, urlSlug, inStock, ...
    │   }
    │
    └─► ✅ 119 vectors stored (~30 seconds)
```

---

## 2. Search Flow

```
User upload ảnh
    │
    ├─► POST /api/image-search/find-similar
    │   Body: { image: "base64...", topK: 12 }
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ Node.js Backend                                          │
│                                                          │
│  1. Check Redis Cache (image hash)                       │
│     ├─ HIT  → Return cached results (5-10ms) ────────►  │
│     └─ MISS → Continue                                   │
│                                                          │
│  2. Call CLIP Service                                    │
│     POST → /encode { image: base64 }                     │
│     ⏱️ 200-300ms (ONNX optimized)                       │
│     └─► embedding [512d]                                 │
│                                                          │
│  3. Query Qdrant                                         │
│     POST → /search { vector, limit: 12 }                 │
│     ⏱️ 30-50ms                                          │
│     └─► 12 results with scores + payloads               │
│                                                          │
│  4. Format Results (NO MongoDB needed)                   │
│     └─► Payload đã có đủ data để hiển thị               │
│                                                          │
│  5. Cache to Redis (async)                               │
│     TTL: 1 hour                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
    │
    ▼
Response: {
  data: [12 products with similarity %],
  timing: { total: 350ms }
}
    │
    ▼
Frontend hiển thị grid sản phẩm tương tự
```

---

## 3. Timeline

| Step | First Request | Cached |
|------|---------------|--------|
| Check cache | 5ms | 5ms |
| CLIP encode | 250ms | - |
| Qdrant search | 40ms | - |
| Format | 5ms | - |
| **Total** | **~350ms** | **~10ms** |

---

## 4. Key Optimizations

| Optimization | Impact |
|--------------|--------|
| ONNX + INT8 | 500ms → 250ms |
| Rich Qdrant Payload | Skip MongoDB |
| Redis Cache | Repeat = 10ms |
| Score Threshold | Filter noise |
