<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# tôi sử dụng phương pháp gộp chung, hãy cho tôi cấu trúc thư mục đầy đủ cho rag

Tuyệt! Đây là cấu trúc thư mục đầy đủ cho RAG gộp chung với MERN stack, tối ưu cho đồ án của bạn:

## 🗂️ Cấu trúc Thư mục Đầy đủ

```
clothing-store/
│
├── client/                                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── SizeAdvisorModal.tsx
│   │   │   │   └── ProductSuggestions.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── ProductDetail.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── chatApi.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── server/                                 # Node.js Backend (Unified)
    │
    ├── config/
    │   ├── database.js                     # MongoDB connection
    │   ├── pinecone.js                     # Pinecone config
    │   ├── openai.js                       # OpenAI config
    │   └── env.js                          # Environment variables
    │
    ├── models/                             # Mongoose Models
    │   ├── Product.js                      # ✅ Schema bạn đã có
    │   ├── ProductVariant.js               # ✅ Schema bạn đã có
    │   ├── Category.js
    │   ├── Brand.js
    │   ├── Order.js
    │   ├── User.js
    │   ├── Review.js
    │   └── ChatLog.js                      # 🆕 Lưu lịch sử chat
    │
    ├── routes/                             # API Routes
    │   ├── products.routes.js              # CRUD products
    │   ├── orders.routes.js                # CRUD orders
    │   ├── users.routes.js                 # Auth & users
    │   ├── chat.routes.js                  # 🆕 RAG endpoints
    │   └── index.js                        # Route aggregator
    │
    ├── services/                           # Business Logic
    │   │
    │   ├── product.service.js              # Product CRUD logic
    │   ├── order.service.js                # Order logic
    │   │
    │   └── rag/                            # 🤖 RAG Services (Encapsulated)
    │       │
    │       ├── core/                       # Core RAG Components
    │       │   ├── RAGService.js           # Main RAG orchestrator
    │       │   ├── VectorStore.js          # Pinecone wrapper
    │       │   └── LLMProvider.js          # OpenAI wrapper
    │       │
    │       ├── embeddings/                 # Embedding Services
    │       │   ├── embedding.service.js    # Generate embeddings
    │       │   └── proposition.service.js  # Chunking logic
    │       │
    │       ├── retrieval/                  # Retrieval Logic
    │       │   ├── vector-search.service.js
    │       │   └── reranking.service.js    # Cohere reranking
    │       │
    │       ├── generation/                 # LLM Generation
    │       │   ├── prompt-builder.js       # CoVe prompts
    │       │   └── response-generator.js   # Call LLM
    │       │
    │       ├── orchestrators/              # Intent & Routing
    │       │   ├── intent-classifier.js    # Classify user intent
    │       │   └── conversation-manager.js # Manage context
    │       │
    │       ├── specialized/                # Specialized Services
    │       │   ├── size-advisor.service.js # Size recommendations
    │       │   ├── style-matcher.service.js # Outfit suggestions
    │       │   └── order-lookup.service.js  # Order tracking
    │       │
    │       └── index.js                    # Export all RAG services
    │
    ├── scripts/                            # Utility Scripts
    │   ├── ingestion/
    │   │   ├── ingest-products.js          # Main ingestion script
    │   │   ├── update-single-product.js    # Update 1 product
    │   │   └── clear-index.js              # Clear Pinecone index
    │   │
    │   ├── evaluation/
    │   │   ├── test-rag.js                 # Test RAG quality
    │   │   └── benchmark.js                # Performance tests
    │   │
    │   └── migration/
    │       └── migrate-to-pinecone.js      # One-time migration
    │
    ├── utils/                              # Shared Utilities
    │   ├── logger.js                       # Winston logger
    │   ├── errorHandler.js                 # Error middleware
    │   ├── validators.js                   # Input validation
    │   └── constants.js                    # Constants
    │
    ├── middlewares/                        # Express Middlewares
    │   ├── auth.middleware.js              # JWT auth
    │   ├── rateLimit.middleware.js         # Rate limiting
    │   └── error.middleware.js             # Error handling
    │
    ├── tests/                              # Tests
    │   ├── unit/
    │   │   └── rag/
    │   │       ├── embedding.test.js
    │   │       └── intent-classifier.test.js
    │   │
    │   └── integration/
    │       └── chat-flow.test.js
    │
    ├── docs/                               # Documentation
    │   ├── RAG_ARCHITECTURE.md             # RAG system design
    │   ├── API_ENDPOINTS.md                # API documentation
    │   └── DEPLOYMENT.md                   # Deploy guide
    │
    ├── .env.example                        # Environment template
    ├── .gitignore
    ├── package.json
    └── server.js                           # Main entry point
```


***

## 📁 Chi tiết từng File quan trọng

### 1. **Main Entry Point**

```javascript
// server/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Config
import { connectDatabase } from './config/database.js';
import './config/pinecone.js'; // Initialize Pinecone

// Routes
import routes from './routes/index.js';

// Middlewares
import { errorHandler } from './middlewares/error.middleware.js';
import { rateLimiter } from './middlewares/rateLimit.middleware.js';

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/chat', rateLimiter); // Limit RAG endpoints

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    services: {
      mongodb: 'connected',
      pinecone: 'ready'
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🤖 RAG Service: Active`);
  });
});
```


***

### 2. **Config Files**

```javascript
// server/config/database.js
import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
```

```javascript
// server/config/pinecone.js
import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;
let pineconeIndex = null;

export const initializePinecone = async () => {
  if (pineconeClient) return { client: pineconeClient, index: pineconeIndex };

  try {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX_NAME || 'clothing-store');

    console.log('✅ Pinecone initialized');
    return { client: pineconeClient, index: pineconeIndex };
  } catch (error) {
    console.error('❌ Pinecone initialization error:', error);
    throw error;
  }
};

export const getPineconeIndex = () => {
  if (!pineconeIndex) {
    throw new Error('Pinecone not initialized. Call initializePinecone() first.');
  }
  return pineconeIndex;
};

// Auto-initialize
initializePinecone();
```

```javascript
// server/config/openai.js
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODELS = {
  EMBEDDING: 'text-embedding-3-small',
  CHAT: 'gpt-4o-mini-2024-07-18',
  CHAT_FAST: 'gpt-3.5-turbo',
};
```


***

### 3. **RAG Core Services**

```javascript
// server/services/rag/core/RAGService.js
import { classifyIntent } from '../orchestrators/intent-classifier.js';
import { productAdvice } from '../specialized/product-advisor.service.js';
import { sizeRecommendation } from '../specialized/size-advisor.service.js';
import { orderLookup } from '../specialized/order-lookup.service.js';
import { ConversationManager } from '../orchestrators/conversation-manager.js';

export class RAGService {
  constructor() {
    this.conversationManager = new ConversationManager();
  }

  /**
   * Main chat handler - routes to appropriate service
   */
  async chat(userId, message, conversationHistory = []) {
    try {
      // 1. Classify intent
      const { intent, confidence, extracted_info } = await classifyIntent(message);

      // 2. Get conversation context
      const context = await this.conversationManager.getContext(userId, conversationHistory);

      let result;

      // 3. Route to appropriate service
      switch (intent) {
        case 'product_advice':
          result = await productAdvice(message, context);
          break;

        case 'size_recommendation':
          result = await sizeRecommendation(message, extracted_info, context);
          break;

        case 'style_matching':
          result = await productAdvice(`${message} (phối đồ)`, context);
          break;

        case 'order_lookup':
          result = await orderLookup(message, extracted_info, userId);
          break;

        default:
          result = {
            answer: "Tôi có thể giúp bạn:\n✨ Tư vấn sản phẩm\n📏 Tư vấn size\n🎨 Gợi ý phối đồ\n📦 Tra cứu đơn hàng",
            intent: 'general'
          };
      }

      // 4. Save to conversation history
      await this.conversationManager.addMessage(userId, {
        role: 'user',
        content: message,
        intent,
        timestamp: new Date()
      });

      await this.conversationManager.addMessage(userId, {
        role: 'assistant',
        content: result.answer,
        metadata: result,
        timestamp: new Date()
      });

      return {
        intent,
        confidence,
        ...result,
        conversation_id: context.conversation_id
      };

    } catch (error) {
      console.error('RAGService Error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a user
   */
  async getHistory(userId, limit = 20) {
    return this.conversationManager.getHistory(userId, limit);
  }

  /**
   * Clear conversation context
   */
  async clearContext(userId) {
    return this.conversationManager.clearContext(userId);
  }
}
```

```javascript
// server/services/rag/core/VectorStore.js
import { getPineconeIndex } from '../../../config/pinecone.js';
import { getEmbedding } from '../embeddings/embedding.service.js';

export class VectorStore {
  constructor() {
    this.index = getPineconeIndex();
  }

  /**
   * Search vectors by query
   */
  async search(query, options = {}) {
    const {
      topK = 50,
      filter = {},
      includeMetadata = true
    } = options;

    // Generate embedding for query
    const queryVector = await getEmbedding(query);

    // Search in Pinecone
    const results = await this.index.query({
      vector: queryVector,
      topK,
      filter,
      includeMetadata
    });

    return results.matches;
  }

  /**
   * Upsert vectors
   */
  async upsert(vectors) {
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < vectors.length; i += batchSize) {
      batches.push(vectors.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await this.index.upsert(batch);
    }

    return { upserted: vectors.length };
  }

  /**
   * Delete vectors by filter
   */
  async delete(filter) {
    await this.index.deleteMany(filter);
    return { deleted: true };
  }

  /**
   * Get vector by ID
   */
  async fetch(ids) {
    return this.index.fetch(ids);
  }
}
```


***

### 4. **Embedding Services**

```javascript
// server/services/rag/embeddings/embedding.service.js
import { openai, MODELS } from '../../../config/openai.js';

/**
 * Generate embedding for text
 * @param {String} text - Text to embed
 * @param {Number} dimensions - Embedding dimensions (default: 1536)
 */
export async function getEmbedding(text, dimensions = 1536) {
  try {
    const response = await openai.embeddings.create({
      model: MODELS.EMBEDDING,
      input: text,
      dimensions,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding Error:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Batch generate embeddings
 * @param {Array<String>} texts - Array of texts
 */
export async function getBatchEmbeddings(texts, dimensions = 1536) {
  try {
    const response = await openai.embeddings.create({
      model: MODELS.EMBEDDING,
      input: texts,
      dimensions,
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Batch Embedding Error:', error);
    throw new Error('Failed to generate batch embeddings');
  }
}
```

```javascript
// server/services/rag/embeddings/proposition.service.js
import { openai, MODELS } from '../../../config/openai.js';

/**
 * Create propositions from product data
 */
export async function createProductPropositions(product, variants = []) {
  const categoryName = product.category?.name || 'N/A';
  const brandName = product.brand?.name || 'N/A';
  
  const availableSizes = [...new Set(variants.map(v => v.size))];
  const availableColors = [...new Set(variants.map(v => v.color))];
  
  const priceRange = variants.length > 0 
    ? {
        min: Math.min(...variants.map(v => v.price)),
        max: Math.max(...variants.map(v => v.price))
      }
    : null;

  const prompt = `
Phân tích sản phẩm thời trang sau thành các mệnh đề nguyên tử, độc lập.

Thông tin:
- Tên: ${product.name}
- Mô tả: ${product.description}
- Danh mục: ${categoryName}
- Thương hiệu: ${brandName}
- Tags: ${product.tags?.join(', ') || 'N/A'}
- Sizes: ${availableSizes.join(', ')}
- Màu sắc: ${availableColors.join(', ')}
- Giá: ${priceRange ? `${priceRange.min.toLocaleString()}-${priceRange.max.toLocaleString()} VNĐ` : 'N/A'}

Tạo 8-12 mệnh đề hữu ích cho tư vấn khách hàng.
Trả về JSON: {"propositions": ["...", "..."]}
`;

  const response = await openai.chat.completions.create({
    model: MODELS.CHAT,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result.propositions || [];
}
```


***

### 5. **Retrieval Services**

```javascript
// server/services/rag/retrieval/vector-search.service.js
import { VectorStore } from '../core/VectorStore.js';

const vectorStore = new VectorStore();

/**
 * Search products by semantic similarity
 */
export async function searchProducts(query, options = {}) {
  const filter = {
    type: { $eq: 'product_info' },
    ...options.filter
  };

  const results = await vectorStore.search(query, {
    topK: options.topK || 50,
    filter,
    includeMetadata: true
  });

  return results;
}

/**
 * Search by category
 */
export async function searchByCategory(query, categoryName) {
  return searchProducts(query, {
    filter: { category: { $eq: categoryName } }
  });
}

/**
 * Search in-stock products
 */
export async function searchInStock(query) {
  return searchProducts(query, {
    filter: { in_stock: { $eq: true } }
  });
}
```

```javascript
// server/services/rag/retrieval/reranking.service.js
import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

/**
 * Rerank documents using Cohere
 */
export async function rerankDocuments(query, documents, topN = 5) {
  try {
    if (!process.env.COHERE_API_KEY) {
      console.warn('⚠️ Cohere API key not found. Skipping reranking.');
      return documents.slice(0, topN).map((doc, index) => ({
        index,
        relevance_score: 1.0 - (index * 0.1),
        document: doc
      }));
    }

    const response = await cohere.rerank({
      model: 'rerank-multilingual-v3.0',
      query,
      documents,
      topN,
      returnDocuments: false
    });

    return response.results;
  } catch (error) {
    console.error('Reranking Error:', error);
    // Fallback: return top N without reranking
    return documents.slice(0, topN).map((doc, index) => ({
      index,
      relevance_score: 1.0,
      document: doc
    }));
  }
}
```


***

### 6. **Generation Services**

```javascript
// server/services/rag/generation/prompt-builder.js

/**
 * Build CoVe (Chain of Verification) prompt
 */
export function buildCoVePrompt(context, conversationHistory = []) {
  return `
Bạn là chuyên gia tư vấn thời trang của cửa hàng quần áo online.

## Nguyên tắc:
- CHỈ sử dụng thông tin từ [Context]
- KHÔNG bịa đặt thông tin
- Nếu không biết, nói: "Tôi cần kiểm tra lại"

## Quy trình (Chain of Verification):
1. **Draft**: Viết bản nháp từ context
2. **Verify**: Kiểm tra 2-3 chi tiết:
   - Size có đúng?
   - Giá có chính xác?
   - Màu sắc có khớp?
3. **Final**: Câu trả lời cuối sau khi xác minh

## Hướng dẫn:

### Tư vấn Size:
- Hỏi: chiều cao, cân nặng
- Đề xuất size dựa trên context
- Giải thích lý do

### Tư vấn Phối đồ:
- Xem category, tags, màu
- Đề xuất combo từ products có sẵn
- Giải thích style

### Format:
- Thân thiện, chuyên nghiệp
- Dùng emoji phù hợp 👕 ✨
- Kết thúc = câu hỏi mở

[Context]
${context}
[End Context]
`;
}

/**
 * Build system prompt for intent classification
 */
export function buildIntentClassificationPrompt() {
  return `
Phân loại ý định khách hàng:

**Intents:**
- "product_advice": Tư vấn sản phẩm, tìm quần áo
- "size_recommendation": Hỏi về size, số đo
- "style_matching": Phối đồ, mix & match
- "order_lookup": Tra đơn hàng, vận chuyển
- "return_exchange": Đổi trả, hoàn tiền
- "general": Khác

Trả về: {"intent": "...", "confidence": 0.0-1.0, "extracted_info": {...}}
`;
}
```

```javascript
// server/services/rag/generation/response-generator.js
import { openai, MODELS } from '../../../config/openai.js';
import { buildCoVePrompt } from './prompt-builder.js';

/**
 * Generate response using LLM
 */
export async function generateResponse(query, context, conversationHistory = []) {
  const systemPrompt = buildCoVePrompt(context, conversationHistory);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4), // Last 4 messages
    { role: 'user', content: query }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages,
      temperature: 0.3,
      max_tokens: 800,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('LLM Generation Error:', error);
    throw new Error('Failed to generate response');
  }
}
```


***

### 7. **Orchestrators**

```javascript
// server/services/rag/orchestrators/intent-classifier.js
import { openai, MODELS } from '../../../config/openai.js';
import { buildIntentClassificationPrompt } from '../generation/prompt-builder.js';

/**
 * Classify user intent
 */
export async function classifyIntent(message) {
  const systemPrompt = buildIntentClassificationPrompt();

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT_FAST, // Use faster model for classification
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      intent: result.intent || 'general',
      confidence: result.confidence || 0.5,
      extracted_info: result.extracted_info || {}
    };
  } catch (error) {
    console.error('Intent Classification Error:', error);
    return {
      intent: 'general',
      confidence: 0,
      extracted_info: {}
    };
  }
}
```

```javascript
// server/services/rag/orchestrators/conversation-manager.js
import ChatLog from '../../../models/ChatLog.js';

export class ConversationManager {
  /**
   * Get conversation context for user
   */
  async getContext(userId, recentMessages = []) {
    // Get recent chat history from DB
    const history = await ChatLog.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    return {
      conversation_id: userId,
      history: history.reverse(),
      recent_messages: recentMessages
    };
  }

  /**
   * Add message to conversation
   */
  async addMessage(userId, message) {
    const chatLog = await ChatLog.create({
      user_id: userId,
      role: message.role,
      content: message.content,
      intent: message.intent,
      metadata: message.metadata,
      created_at: message.timestamp
    });

    return chatLog;
  }

  /**
   * Get conversation history
   */
  async getHistory(userId, limit = 20) {
    return ChatLog.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Clear conversation context
   */
  async clearContext(userId) {
    await ChatLog.deleteMany({ user_id: userId });
    return { cleared: true };
  }
}
```


***

### 8. **Specialized Services**

```javascript
// server/services/rag/specialized/product-advisor.service.js
import Product from '../../../models/Product.js';
import ProductVariant from '../../../models/ProductVariant.js';
import { searchProducts } from '../retrieval/vector-search.service.js';
import { rerankDocuments } from '../retrieval/reranking.service.js';
import { generateResponse } from '../generation/response-generator.js';

/**
 * Product advice using RAG
 */
export async function productAdvice(query, context = {}) {
  try {
    // 1. Vector search
    const searchResults = await searchProducts(query, { topK: 50 });

    if (searchResults.length === 0) {
      return {
        answer: "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp. Bạn có thể mô tả chi tiết hơn?",
        sources: []
      };
    }

    // 2. Rerank
    const documents = searchResults.map(r => r.metadata.proposition_text);
    const reranked = await rerankDocuments(query, documents, 5);

    // 3. Get product details from MongoDB
    const productIds = [
      ...new Set(
        reranked.map(r => searchResults[r.index].metadata.product_id)
      )
    ];

    const products = await Product.find({ _id: { $in: productIds } })
      .populate('category brand')
      .lean();

    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const variants = await ProductVariant.find({
          product_id: product._id,
          isActive: true,
          quantity: { $gt: 0 }
        }).lean();
        return { ...product, variants };
      })
    );

    // 4. Build context
    let contextText = "## Sản phẩm liên quan:\n\n";
    
    reranked.forEach((r, idx) => {
      const match = searchResults[r.index];
      const product = productsWithVariants.find(
        p => p._id.toString() === match.metadata.product_id
      );

      if (product) {
        contextText += `### ${idx + 1}. ${product.name}\n`;
        contextText += `- Danh mục: ${product.category?.name}\n`;
        contextText += `- Mô tả: ${product.description.substring(0, 200)}...\n`;
        
        if (product.variants.length > 0) {
          const sizes = [...new Set(product.variants.map(v => v.size))];
          const colors = [...new Set(product.variants.map(v => v.color))];
          const prices = product.variants.map(v => v.price);
          
          contextText += `- Sizes: ${sizes.join(', ')}\n`;
          contextText += `- Màu: ${colors.join(', ')}\n`;
          contextText += `- Giá: ${Math.min(...prices).toLocaleString()}-${Math.max(...prices).toLocaleString()}đ\n`;
        }
        
        contextText += `\n`;
      }
    });

    // 5. Generate response
    const answer = await generateResponse(query, contextText, context.recent_messages);

    // 6. Return result
    return {
      answer,
      sources: reranked.map(r => {
        const match = searchResults[r.index];
        const product = productsWithVariants.find(
          p => p._id.toString() === match.metadata.product_id
        );
        
        return {
          product_id: match.metadata.product_id,
          product_name: match.metadata.product_name,
          relevance_score: r.relevance_score,
          url_slug: product?.urlSlug,
        };
      }),
      suggested_products: productsWithVariants.slice(0, 3).map(p => ({
        _id: p._id,
        name: p.name,
        urlSlug: p.urlSlug,
        averageRating: p.averageRating,
        minPrice: p.variants.length > 0 ? Math.min(...p.variants.map(v => v.price)) : 0,
        mainImage: p.variants[0]?.mainImage || ''
      }))
    };

  } catch (error) {
    console.error('Product Advice Error:', error);
    throw error;
  }
}
```

```javascript
// server/services/rag/specialized/size-advisor.service.js
import { openai, MODELS } from '../../../config/openai.js';
import Product from '../../../models/Product.js';
import ProductVariant from '../../../models/ProductVariant.js';

/**
 * Size recommendation service
 */
export async function sizeRecommendation(query, extractedInfo, context) {
  // Extract product info from query or context
  const productId = extractedInfo.product_id || context.recent_product_id;

  if (!productId) {
    return {
      answer: "Để tư vấn size, bạn vui lòng cho biết:\n- Sản phẩm bạn quan tâm\n- Chiều cao (cm)\n- Cân nặng (kg) 📏"
    };
  }

  const product = await Product.findById(productId).populate('category').lean();
  const variants = await ProductVariant.find({
    product_id: productId,
    isActive: true,
    quantity: { $gt: 0 }
  }).lean();

  const availableSizes = [...new Set(variants.map(v => v.size))];

  // Build prompt for size recommendation
  const prompt = `
Tư vấn size cho sản phẩm:

**Sản phẩm:** ${product.name}
**Danh mục:** ${product.category.name}
**Sizes có sẵn:** ${availableSizes.join(', ')}

**Câu hỏi khách hàng:** ${query}

Dựa vào thông tin, hãy:
1. Đề xuất size (CHỈ từ sizes có sẵn)
2. Giải thích lý do
3. Gợi ý size dự phòng

Trả về JSON: 
{
  "recommended_size": "...",
  "reason": "...",
  "alternative_size": "...",
  "fit_note": "..."
}
`;

  const response = await openai.chat.completions.create({
    model: MODELS.CHAT,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Get variants of recommended size
  const recommendedVariants = variants.filter(v => v.size === result.recommended_size);

  return {
    answer: `
📏 **Size đề xuất: ${result.recommended_size}**

${result.reason}

💡 ${result.fit_note}

${result.alternative_size ? `✨ Size dự phòng: ${result.alternative_size}` : ''}

**Sản phẩm có sẵn:**
${recommendedVariants.map(v => 
  `- Màu ${v.color}: ${v.price.toLocaleString()}đ (Còn ${v.quantity})`
).join('\n')}
    `.trim(),
    size_recommendation: result,
    available_variants: recommendedVariants
  };
}
```

```javascript
// server/services/rag/specialized/order-lookup.service.js
import { openai, MODELS } from '../../../config/openai.js';
import Order from '../../../models/Order.js';

/**
 * Order lookup service
 */
export async function orderLookup(query, extractedInfo, userId) {
  // Extract order info
  const extractPrompt = `
Trích xuất thông tin tra cứu đơn hàng:

Câu hỏi: ${query}

Trả về JSON: {"order_number": "...", "phone": "...", "email": "..."}
`;

  const extractResponse = await openai.chat.completions.create({
    model: MODELS.CHAT_FAST,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: extractPrompt }]
  });

  const extracted = JSON.parse(extractResponse.choices[0].message.content);

  // Query MongoDB
  const order = await Order.findOne({
    $or: [
      { order_number: extracted.order_number },
      { user_id: userId }
    ]
  })
    .sort({ created_at: -1 })
    .lean();

  if (!order) {
    return {
      answer: "❌ Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hoặc liên hệ hotline."
    };
  }

  return {
    answer: `
📦 **Đơn hàng ${order.order_number}**

✅ Trạng thái: ${order.status}
🚚 Mã vận đơn: ${order.tracking_number || 'Đang chuẩn bị'}
📅 Ngày đặt: ${new Date(order.created_at).toLocaleDateString('vi-VN')}
💰 Tổng tiền: ${order.total_amount.toLocaleString()}đ

${order.status === 'processing' ? '⏳ Đơn hàng đang được xử lý' : ''}
${order.status === 'shipped' ? '🚀 Đơn hàng đã gửi đi' : ''}
${order.status === 'delivered' ? '✨ Đơn hàng đã giao thành công' : ''}
    `.trim(),
    order_info: order
  };
}
```


***

### 9. **Index File (Export tất cả)**

```javascript
// server/services/rag/index.js
export { RAGService } from './core/RAGService.js';
export { VectorStore } from './core/VectorStore.js';

export { getEmbedding, getBatchEmbeddings } from './embeddings/embedding.service.js';
export { createProductPropositions } from './embeddings/proposition.service.js';

export { searchProducts, searchByCategory, searchInStock } from './retrieval/vector-search.service.js';
export { rerankDocuments } from './retrieval/reranking.service.js';

export { generateResponse } from './generation/response-generator.js';
export { buildCoVePrompt, buildIntentClassificationPrompt } from './generation/prompt-builder.js';

export { classifyIntent } from './orchestrators/intent-classifier.js';
export { ConversationManager } from './orchestrators/conversation-manager.js';

export { productAdvice } from './specialized/product-advisor.service.js';
export { sizeRecommendation } from './specialized/size-advisor.service.js';
export { orderLookup } from './specialized/order-lookup.service.js';
```


***

### 10. **Routes**

```javascript
// server/routes/chat.routes.js
import express from 'express';
import { RAGService } from '../services/rag/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import ChatLog from '../models/ChatLog.js';

const router = express.Router();
const ragService = new RAGService();

/**
 * POST /api/chat
 * Main chat endpoint
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { message, conversation_history = [] } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Call RAG service
    const result = await ragService.chat(userId, message, conversation_history);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat Route Error:', error);
    res.status(500).json({
      success: false,
      error: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/chat/history
 * Get conversation history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const history = await ragService.getHistory(userId, limit);

    res.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('History Route Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/chat/clear
 * Clear conversation context
 */
router.delete('/clear', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    await ragService.clearContext(userId);

    res.json({
      success: true,
      message: 'Conversation cleared'
    });

  } catch (error) {
    console.error('Clear Route Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

```javascript
// server/routes/index.js
import express from 'express';
import productRoutes from './products.routes.js';
import orderRoutes from './orders.routes.js';
import userRoutes from './users.routes.js';
import chatRoutes from './chat.routes.js';

const router = express.Router();

// Traditional CRUD routes
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);

// RAG routes
router.use('/chat', chatRoutes);

export default router;
```


***

### 11. **Models**

```javascript
// server/models/ChatLog.js
import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    intent: {
      type: String,
      enum: ['product_advice', 'size_recommendation', 'style_matching', 'order_lookup', 'return_exchange', 'general']
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

// Index for efficient queries
chatLogSchema.index({ user_id: 1, created_at: -1 });

const ChatLog = mongoose.model('ChatLog', chatLogSchema);

export default ChatLog;
```


***

### 12. **Ingestion Script**

```javascript
// server/scripts/ingestion/ingest-products.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../../models/Product.js';
import ProductVariant from '../../models/ProductVariant.js';
import { VectorStore } from '../../services/rag/core/VectorStore.js';
import { createProductPropositions } from '../../services/rag/embeddings/proposition.service.js';
import { getEmbedding } from '../../services/rag/embeddings/embedding.service.js';
import { initializePinecone } from '../../config/pinecone.js';

dotenv.config();

const vectorStore = new VectorStore();

async function ingestAllProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Initialize Pinecone
    await initializePinecone();
    console.log('✅ Pinecone initialized');

    // Get all active products
    const products = await Product.find({
      isActive: true,
      status: 'published'
    })
      .populate('category brand')
      .lean();

    console.log(`📦 Found ${products.length} products to ingest\n`);

    let totalVectors = 0;

    for (const product of products) {
      console.log(`Processing: ${product.name}`);

      // Get variants
      const variants = await ProductVariant.find({
        product_id: product._id,
        isActive: true
      }).lean();

      // Create propositions
      const propositions = await createProductPropositions(product, variants);
      console.log(`  └─ Generated ${propositions.length} propositions`);

      // Prepare vectors
      const vectors = [];

      for (let i = 0; i < propositions.length; i++) {
        const propText = propositions[i];
        const embedding = await getEmbedding(propText);

        vectors.push({
          id: `prod_${product._id}_prop_${i}`,
          values: embedding,
          metadata: {
            type: 'product_info',
            product_id: product._id.toString(),
            product_name: product.name,
            category: product.category?.name || 'N/A',
            brand: product.brand?.name || 'N/A',
            tags: product.tags || [],
            average_rating: product.averageRating || 0,
            proposition_text: propText,
            url_slug: product.urlSlug || ''
          }
        });
      }

      // Variant info vector
      if (variants.length > 0) {
        const sizeColorInfo = `${product.name} có sizes ${[...new Set(variants.map(v => v.size))].join(', ')} và màu ${[...new Set(variants.map(v => v.color))].join(', ')}`;
        const sizeColorEmbedding = await getEmbedding(sizeColorInfo);

        vectors.push({
          id: `prod_${product._id}_variants_info`,
          values: sizeColorEmbedding,
          metadata: {
            type: 'variant_info',
            product_id: product._id.toString(),
            product_name: product.name,
            available_sizes: [...new Set(variants.map(v => v.size))],
            available_colors: [...new Set(variants.map(v => v.color))],
            in_stock: variants.some(v => v.quantity > 0),
            min_price: Math.min(...variants.map(v => v.price)),
            max_price: Math.max(...variants.map(v => v.price)),
            proposition_text: sizeColorInfo
          }
        });
      }

      // Upsert to Pinecone
      await vectorStore.upsert(vectors);
      console.log(`  ✅ Upserted ${vectors.length} vectors\n`);

      totalVectors += vectors.length;

      // Delay to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 Ingestion completed!`);
    console.log(`📊 Total vectors: ${totalVectors}`);

  } catch (error) {
    console.error('❌ Ingestion Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run
ingestAllProducts();
```


***

### 13. **Environment Variables**

```bash
# server/.env.example

# Server
NODE_ENV=development
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/clothing-store

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=clothing-store

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Cohere (Optional - for reranking)
COHERE_API_KEY=your_cohere_api_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
```


***

### 14. **Package.json Scripts**

```json
{
  "name": "clothing-store-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "ingest": "node scripts/ingestion/ingest-products.js",
    "test": "jest",
    "test:rag": "node scripts/evaluation/test-rag.js"
  },
  "dependencies": {
    "@pinecone-database/pinecone": "^2.0.0",
    "cohere-ai": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "morgan": "^1.10.0",
    "openai": "^4.20.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}
```


***

## 🎯 Tóm tắt Kiến trúc

✅ **Encapsulation**: Tất cả RAG logic nằm trong `services/rag/`
✅ **Modularity**: Mỗi service có trách nhiệm rõ ràng
✅ **Scalability**: Dễ dàng thêm tính năng mới (thêm service trong `specialized/`)
✅ **Maintainability**: Code organized, dễ debug
✅ **Future-proof**: Sẵn sàng tách thành microservice nếu cần


