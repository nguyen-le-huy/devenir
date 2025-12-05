<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 🔄 Luồng Hoạt động Chi tiết của Kiến trúc RAG

## 📊 Tổng quan Kiến trúc

```
┌─────────────┐
│   User      │ "Tôi muốn áo thun cotton thoải mái"
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  1. INTENT CLASSIFICATION (GPT-3.5)            │    │
│  │     Input: "Tôi muốn áo thun cotton..."        │    │
│  │     Output: intent="product_advice"            │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  2. EMBEDDING (text-embedding-3-small)         │    │
│  │     Input: "Tôi muốn áo thun cotton..."        │    │
│  │     Output: [0.023, -0.014, ...] (1536 dims)   │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  3. VECTOR SEARCH (Pinecone)                   │    │
│  │     Query: embedding vector                     │    │
│  │     Return: Top 50 similar propositions         │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  4. RERANKING (Cohere)                         │    │
│  │     Input: 50 propositions                      │    │
│  │     Output: Top 5 most relevant                 │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  5. MONGODB LOOKUP                             │    │
│  │     Get full product details + variants         │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  6. CONTEXT BUILDING                           │    │
│  │     Combine propositions + product details      │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  7. LLM GENERATION (GPT-4)                     │    │
│  │     System: CoVe prompt                         │    │
│  │     Context: Top 5 products info                │    │
│  │     User: Original query                        │    │
│  │     Output: Natural language answer             │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  8. SAVE TO CHATLOG (MongoDB)                  │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Response to   │
              │  User          │
              └────────────────┘
```


***

## 🔍 Chi tiết từng Bước

### **Bước 1: Intent Classification** 🎯

**Mục đích:** Hiểu user muốn gì

**Input:**

```javascript
{
  message: "Tôi muốn áo thun cotton thoải mái"
}
```

**Process:**

```javascript
// services/rag/orchestrators/intent-classifier.js
const { intent, confidence } = await classifyIntent(message);

// Gọi GPT-3.5-turbo với prompt:
"Phân loại ý định: product_advice, size_recommendation, style_matching..."
```

**Output:**

```javascript
{
  intent: "product_advice",
  confidence: 0.95,
  extracted_info: {
    product_type: "áo thun",
    material: "cotton",
    style: "thoải mái"
  }
}
```

**Tại sao quan trọng:**

- Routing đúng service (product advice vs order lookup)
- Tối ưu prompt cho từng loại câu hỏi

***

### **Bước 2: Embedding Query** 🔢

**Mục đích:** Chuyển text thành vector số để tìm kiếm ngữ nghĩa

**Input:**

```
"Tôi muốn áo thun cotton thoải mái"
```

**Process:**

```javascript
// services/rag/embeddings/embedding.service.js
const queryVector = await getEmbedding(message);

// Gọi OpenAI Embedding API
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: message,
  dimensions: 1536
});
```

**Output:**

```javascript
[
  0.023451,
  -0.014532,
  0.008912,
  -0.031245,
  ... // 1536 số
]
```

**Tại sao dùng embedding:**

- Tìm kiếm theo **ngữ nghĩa** thay vì từ khóa
- "áo cotton" ≈ "áo chất liệu cotton" ≈ "áo vải cotton"
- Cosine similarity để so sánh độ tương đồng

***

### **Bước 3: Vector Search trong Pinecone** 🔎

**Mục đích:** Tìm top 50 propositions gần nhất về mặt ngữ nghĩa

**Input:**

```javascript
{
  vector: [0.023, -0.014, ...], // 1536 dims
  topK: 50,
  filter: { type: 'product_info' }
}
```

**Process trong Pinecone:**

```
1. So sánh query vector với TẤT CẢ vectors trong index
2. Tính cosine similarity:
   similarity = (A · B) / (||A|| × ||B||)
3. Sắp xếp theo score cao → thấp
4. Lấy top 50
```

**Output:**

```javascript
[
  {
    id: "prod_673abc_prop_2",
    score: 0.89,  // Very similar!
    metadata: {
      product_id: "673abc...",
      product_name: "Áo Thun Nam Basic Cotton",
      proposition_text: "Áo Thun Nam Basic Cotton có chất liệu cotton 100% thoải mái",
      category: "Áo thun",
      ...
    }
  },
  {
    id: "prod_674def_prop_5",
    score: 0.85,
    metadata: {
      product_name: "Áo Thun Cotton Form Rộng",
      proposition_text: "Áo Thun Cotton Form Rộng phù hợp mặc hàng ngày...",
      ...
    }
  },
  ... // 48 more results
]
```

**Tại sao lấy 50 (không phải 5):**

- Cast a wide net → nhiều candidates
- Sau đó dùng Reranking để lọc chính xác hơn

***

### **Bước 4: Reranking với Cohere** 🎯

**Mục đích:** Lọc lại 50 → 5 results THỰC SỰ relevant nhất

**Tại sao cần Reranking:**

- Vector search chỉ dựa vào **similarity** (toán học)
- Reranking model hiểu **ngữ cảnh** và **intent** sâu hơn

**Input:**

```javascript
{
  query: "Tôi muốn áo thun cotton thoải mái",
  documents: [
    "Áo Thun Nam Basic Cotton có chất liệu cotton 100%...",
    "Áo Thun Cotton Form Rộng phù hợp...",
    "Quần Jean Slim Fit form ôm...", // Không liên quan!
    ... // 50 docs
  ],
  topN: 5
}
```

**Process:**

```javascript
// services/rag/retrieval/reranking.service.js
const reranked = await cohere.rerank({
  model: 'rerank-multilingual-v3.0',
  query,
  documents,
  topN: 5
});
```

**Output:**

```javascript
[
  {
    index: 0,  // Index trong 50 docs gốc
    relevance_score: 0.98,  // Cao hơn nhiều!
    document: "Áo Thun Nam Basic Cotton có chất liệu cotton 100%..."
  },
  {
    index: 1,
    relevance_score: 0.94,
    document: "Áo Thun Cotton Form Rộng phù hợp..."
  },
  {
    index: 7,
    relevance_score: 0.89,
    document: "Áo Polo Cotton cao cấp thoáng mát..."
  },
  ... // Top 5
]
```

**So sánh trước/sau Reranking:**


| Rank | Before (Vector Search) | Score | After (Reranking) | Score |
| :-- | :-- | :-- | :-- | :-- |
| 1 | Áo Thun Cotton | 0.89 | Áo Thun Cotton | 0.98 ✅ |
| 2 | Áo Form Rộng | 0.85 | Áo Polo Cotton | 0.94 |
| 3 | Quần Jean | 0.83 ❌ | Áo Thun Basic | 0.91 |

→ Lọc bỏ noise, giữ lại chính xác hơn!

***

### **Bước 5: MongoDB Lookup** 💾

**Mục đích:** Lấy thông tin ĐẦY ĐỦ của sản phẩm

**Tại sao cần:**

- Pinecone chỉ lưu metadata (lightweight)
- MongoDB có full data: description, reviews, variants...

**Input:**

```javascript
const productIds = [
  "673abc...",
  "674def...",
  "675ghi..."
];
```

**Process:**

```javascript
// Get products with full relations
const products = await Product.find({ 
  _id: { $in: productIds } 
})
  .populate('category brand')
  .lean();

// Get all variants for each product
for (const product of products) {
  const variants = await ProductVariant.find({
    product_id: product._id,
    isActive: true,
    quantity: { $gt: 0 }  // Only in-stock
  }).lean();
  
  product.variants = variants;
}
```

**Output:**

```javascript
[
  {
    _id: "673abc...",
    name: "Áo Thun Nam Basic Cotton",
    description: "Áo thun nam chất liệu cotton 100%, form regular fit...",
    category: { name: "Áo thun", slug: "ao-thun" },
    brand: { name: "Local Brand" },
    tags: ["basic", "casual", "cotton"],
    averageRating: 4.5,
    variants: [
      { size: "M", color: "Đen", price: 180000, quantity: 25 },
      { size: "M", color: "Trắng", price: 180000, quantity: 30 },
      { size: "L", color: "Đen", price: 190000, quantity: 15 },
      ...
    ]
  },
  ... // More products
]
```


***

### **Bước 6: Context Building** 📝

**Mục đích:** Tổng hợp thông tin thành context cho LLM

**Input:**

- Top 5 propositions (from reranking)
- Full product details (from MongoDB)

**Process:**

```javascript
// services/rag/specialized/product-advisor.service.js
let contextText = "## Thông tin sản phẩm liên quan:\n\n";

reranked.forEach((r, idx) => {
  const product = products[...];
  
  contextText += `### ${idx + 1}. ${product.name}\n`;
  contextText += `- **Danh mục:** ${product.category.name}\n`;
  contextText += `- **Mô tả:** ${product.description}\n`;
  
  const sizes = [...new Set(product.variants.map(v => v.size))];
  const colors = [...new Set(product.variants.map(v => v.color))];
  const prices = product.variants.map(v => v.price);
  
  contextText += `- **Sizes:** ${sizes.join(', ')}\n`;
  contextText += `- **Màu:** ${colors.join(', ')}\n`;
  contextText += `- **Giá:** ${Math.min(...prices)}đ - ${Math.max(...prices)}đ\n\n`;
});
```

**Output:**

```markdown
## Thông tin sản phẩm liên quan:

### 1. Áo Thun Nam Basic Cotton
- **Danh mục:** Áo thun
- **Thương hiệu:** Local Brand
- **Mô tả:** Áo thun nam chất liệu cotton 100%, form regular fit thoải mái. Phù hợp mặc hàng ngày, đi chơi. Thấm hút mồ hôi tốt, thoáng mát.
- **Đánh giá:** 4.5/5 ⭐
- **Sizes:** M, L, XL
- **Màu:** Đen, Trắng, Xám
- **Giá:** 180,000đ - 220,000đ

### 2. Áo Thun Cotton Form Rộng
- **Danh mục:** Áo thun
- **Mô tả:** Áo thun oversize cotton 100%, phong cách streetwear...
- **Sizes:** L, XL, XXL
- **Màu:** Đen, Xanh Navy
- **Giá:** 250,000đ - 280,000đ

...
```


***

### **Bước 7: LLM Generation với GPT-4** 🤖

**Mục đích:** Tạo câu trả lời tự nhiên, dễ hiểu cho user

**Input:**

```javascript
const messages = [
  {
    role: 'system',
    content: `
Bạn là chuyên gia tư vấn thời trang.
CHỈ sử dụng thông tin từ [Context].
KHÔNG bịa đặt.

Quy trình (Chain of Verification):
1. Draft: Viết bản nháp
2. Verify: Kiểm tra size, giá, màu
3. Final: Câu trả lời chính xác

[Context]
${contextText}
[End Context]
    `
  },
  {
    role: 'user',
    content: "Tôi muốn áo thun cotton thoải mái"
  }
];
```

**Process:**

```javascript
// services/rag/generation/response-generator.js
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages,
  temperature: 0.3,  // Low = more factual
  max_tokens: 800
});
```

**Output:**

```
Tôi gợi ý cho bạn 2 sản phẩm áo thun cotton phù hợp:

1. **Áo Thun Nam Basic Cotton** 👕
   - Chất liệu cotton 100%, form regular fit rất thoải mái
   - Phù hợp mặc hàng ngày, thấm hút mồ hôi tốt
   - Có sizes M, L, XL với 3 màu: Đen, Trắng, Xám
   - Giá: 180,000đ - 220,000đ
   - Đánh giá: 4.5⭐

2. **Áo Thun Cotton Form Rộng**
   - Cotton 100%, phong cách oversize thoải mái hơn
   - Sizes: L, XL, XXL (phù hợp nếu bạn thích rộng)
   - Màu: Đen, Xanh Navy
   - Giá: 250,000đ - 280,000đ

Bạn muốn tư vấn size cụ thể cho sản phẩm nào? 😊
```

**Tại sao dùng CoVe (Chain of Verification):**

- LLM có xu hướng "hallucinate" (bịa đặt)
- CoVe buộc LLM verify trước khi trả lời
- Giảm sai sót về giá, size, màu sắc

***

### **Bước 8: Save to ChatLog** 💾

**Mục đích:** Lưu lịch sử hội thoại

**Process:**

```javascript
// Save user message
await ChatLog.create({
  user_id: userId,
  role: 'user',
  content: "Tôi muốn áo thun cotton thoải mái",
  intent: "product_advice",
  metadata: { confidence: 0.95 }
});

// Save bot response
await ChatLog.create({
  user_id: userId,
  role: 'assistant',
  content: "Tôi gợi ý cho bạn 2 sản phẩm...",
  intent: "product_advice",
  metadata: {
    sources: [...],
    suggested_products: [...]
  }
});
```

**Tại sao quan trọng:**

- Conversation context cho câu hỏi tiếp theo
- Analytics: intent distribution, success rate
- Training data cho fine-tuning sau này

***

## 🔄 Luồng Dữ liệu Hoàn chỉnh

### **Offline Phase (Chạy 1 lần):**

```
┌────────────┐
│  MongoDB   │
│  Products  │ (5 products)
└─────┬──────┘
      │
      ▼
┌─────────────────────┐
│  Proposition        │ → "Áo Thun Cotton có chất liệu cotton 100%"
│  Extraction (GPT-4) │ → "Áo Thun Cotton phù hợp mặc hàng ngày"
└─────────┬───────────┘ → "Áo Thun Cotton có sizes M, L, XL"
          │              (10 propositions/product)
          ▼
┌─────────────────────┐
│  Embedding          │ → [0.023, -0.014, ...] (1536 dims)
│  (OpenAI)           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Pinecone Index     │ (55 vectors total)
│  - prod_1_prop_0    │
│  - prod_1_prop_1    │
│  - prod_2_prop_0    │
│  ...                │
└─────────────────────┘
```


### **Online Phase (Mỗi câu hỏi):**

```
User Query: "áo thun cotton"
     │
     ▼
[Intent] → product_advice (0.95)
     │
     ▼
[Embed] → [0.012, -0.031, ...] (1536 dims)
     │
     ▼
[Pinecone] → 50 propositions
     │          (score 0.85 - 0.71)
     ▼
[Rerank] → 5 propositions
     │        (relevance 0.98 - 0.85)
     ▼
[MongoDB] → Full product data
     │         + variants
     ▼
[Context] → Markdown format
     │
     ▼
[GPT-4] → Natural answer
     │
     ▼
Response to User
```


***

## ⚡ Tối ưu Hiệu năng

### **Latency Breakdown:**

| Bước | Thời gian | Cách tối ưu |
| :-- | :-- | :-- |
| Intent Classification | ~300ms | Cache common intents |
| Embedding | ~200ms | Batch multiple queries |
| Vector Search | ~100ms | Optimize index |
| Reranking | ~500ms | Skip if high confidence |
| MongoDB Lookup | ~150ms | Add indexes, use lean() |
| LLM Generation | ~2000ms | Stream responses |
| **Total** | **~3250ms** | Target < 3s |

### **Caching Strategy:**

```javascript
// Cache phổ biến queries
const cache = new Map();

async function chatWithCache(message) {
  const cacheKey = message.toLowerCase().trim();
  
  if (cache.has(cacheKey)) {
    console.log('💨 Cache hit!');
    return cache.get(cacheKey);
  }
  
  const result = await ragService.chat(userId, message);
  cache.set(cacheKey, result);
  
  return result;
}
```


***

## 🎓 Các Khái niệm Quan trọng

### **1. Semantic Search vs Keyword Search**

**Keyword Search (Cũ):**

```
Query: "áo cotton thoải mái"
→ Tìm docs chứa CHÍNH XÁC "cotton" và "thoải mái"
→ Miss: "áo vải cotton", "áo thoáng mát"
```

**Semantic Search (RAG):**

```
Query: "áo cotton thoải mái"
→ Embedding: [0.023, -0.014, ...]
→ Tìm docs có vector GẦN với query vector
→ Found: "áo vải cotton", "áo thoáng mát", "áo chất liệu tự nhiên"
```


### **2. Why Propositions (Chunking)?**

**Bad (Lưu nguyên description):**

```
"Áo thun nam cotton 100%, form regular fit, thấm hút mồ hôi, 
phù hợp mặc hàng ngày, giá 180k, sizes S M L XL, màu đen trắng xám"
```

→ Quá nhiều info, khó match chính xác

**Good (Propositions):**

```
1. "Áo Thun Cotton có chất liệu cotton 100%"
2. "Áo Thun Cotton form regular fit"
3. "Áo Thun Cotton thấm hút mồ hôi tốt"
4. "Áo Thun Cotton phù hợp mặc hàng ngày"
5. "Áo Thun Cotton có sizes S, M, L, XL"
```

→ Mỗi proposition = 1 fact → Match chính xác hơn!

### **3. Why Reranking?**

**Vector Search:** "Similar in embedding space"
**Reranking:** "Truly relevant to user intent"

Example:

```
Query: "áo thun cotton mặc đi làm"

Vector Search thinks:
- "áo thun cotton" ✅ (similar!)
- "áo cotton form đẹp" ✅ (similar!)

Reranking thinks:
- "áo thun cotton" → Hmm, casual, not good for work ❌
- "áo sơ mi cotton" → Perfect for work! ✅
```


***

## 🔧 Debug Tips

### **Test từng bước:**

```bash
# 1. Test embedding
node scripts/test-embedding.js

# 2. Test proposition
node scripts/test-proposition.js

# 3. Test retrieval
node scripts/test-retrieval.js

# 4. Test intent
node scripts/test-intent.js

# 5. Test complete flow
node scripts/test-complete-flow.js
```


### **Log quan trọng:**

```javascript
console.log('[RAG] Intent:', intent, confidence);
console.log('[RAG] Vector search:', results.length);
console.log('[RAG] After rerank:', reranked.length);
console.log('[RAG] Products found:', products.length);
console.log('[RAG] Context length:', contextText.length);
```


***

Bạn có thắc mắc về bước nào cụ thể không? 🤔

