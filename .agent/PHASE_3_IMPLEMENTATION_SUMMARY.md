# Phase 3: Customer Intelligence Service - Implementation Complete

## 🎯 Overview

Đã implement thành công **AI-powered Customer Intelligence System** để analyze EventLog data và generate intelligent insights, tag suggestions, và behavioral patterns.

---

## 📦 Files Created (3 new files)

### 1. Customer Intelligence Service

**File:** `server/services/customerIntelligence.js` (650+ lines)

**Core Functions:**

#### `analyzeCustomerBehavior(userId, options)`

Phân tích toàn diện hành vi customer từ EventLog data (30 days default).

**Returns:**

```javascript
{
  userId, period, eventCounts, totalEvents,
  browsing: {
    totalViews, uniqueProducts, averageViewsPerProduct,
    topCategories: [{ name, count, confidence }],
    topBrands, topColors, preferredSizes
  },
  shopping: {
    cartActions: { itemsAdded, itemsRemoved, abandonmentRate },
    purchases: { count, totalSpent, averageOrderValue },
    priceSensitivity: { level, filterUsage, averagePurchasePrice },
    preferredCategories, preferredBrands
  },
  engagement: {
    searchCount, chatSessions, chatMessages,
    chatIntents: { 'size-help': 3, 'consultation': 5 },
    needsConsultation, engagementScore (0-100)
  },
  search: {
    totalSearches, uniqueQueries,
    repeatedQueries: [{ query, count }],
    noResultQueries, needsAssistance
  }
}
```

#### `getSuggestedTags(behavior)`

Generate auto-tag suggestions với confidence scores.

**Tag Types:**

- `interested:*` - Category interests (confidence >= 0.6)
- `brand:*` - Brand preferences (confidence >= 0.7)
- `color:*` - Color preferences (confidence >= 0.7)
- `size:*` - Size preferences
- `behavior:*` - Behavioral patterns (price_conscious, premium_buyer, cart_abandoner)
- `needs:*` - Detected needs (consultation)

**Output:**

```javascript
[
  {
    tag: "interested:shirts",
    reason: "Viewed Shirts products 8 times",
    confidence: 0.85,
    type: "interest",
  },
  {
    tag: "behavior:premium_buyer",
    reason: "Average purchase: 3,500,000đ",
    confidence: 0.9,
    type: "behavior",
  },
];
```

#### `getSuggestedNotes(behavior)`

Generate contextual notes với priority levels.

**Note Types:**

- `opportunity` - Action-required insights (repeated searches, cart abandonment)
- `consultation` - Customer needs detected from chat
- `feedback` - No-result searches, product gaps
- `context` - General insights (loyal customer, VIP candidate)

**Output:**

```javascript
[
  {
    type: "opportunity",
    content:
      'Khách hàng tìm kiếm "cashmere scarf" 5 lần - cần tư vấn sản phẩm phù hợp',
    confidence: 0.9,
    priority: "high",
  },
  {
    type: "consultation",
    content: "Khách hàng cần tư vấn size/fit - đã chat 7 lần",
    confidence: 0.9,
    priority: "high",
  },
];
```

#### `generateCustomerIntelligence(userId, options)`

Comprehensive intelligence report với tất cả insights.

**Returns:**

```javascript
{
  userId, user: { email, tier, currentTags, currentNotes },
  behavior: { /* full analysis */ },
  suggestions: {
    tags: [/* suggested tags */],
    notes: [/* suggested notes */],
    confidence: 85 // avg confidence %
  },
  insights: {
    customerType: 'VIP Premium' | 'Loyal Customer' | 'High-Intent Browser' | ...,
    nextBestAction: {
      action: 'offer_consultation',
      message: 'Offer personalized styling consultation',
      priority: 'high'
    },
    riskLevel: { level: 'low', reason: 'Active customer' }
  },
  generatedAt: Date
}
```

**Customer Types:**

- `VIP Premium` - 5+ purchases, AOV > 2M
- `Loyal Customer` - 3+ purchases
- `High-Intent Browser` - High engagement (70+) but no purchase
- `Price-Conscious Shopper` - Frequent "Price Low" filters
- `Window Shopper` - 10+ views but no purchase
- `New Visitor` - Default

**Helper Functions:**

- `analyzeBrowsingBehavior()` - Product views, category/brand/color preferences
- `analyzeShoppingBehavior()` - Cart actions, purchases, price sensitivity
- `analyzeEngagementBehavior()` - Search, chat, wishlist, intent analysis
- `analyzeSearchBehavior()` - Queries, repeated searches, no-results
- `analyzePriceSensitivity()` - Filter usage + purchase price analysis
- `determineCustomerType()` - AI classification
- `getNextBestAction()` - Recommendation engine
- `calculateRiskLevel()` - Churn prediction
- `calculateEngagementScore()` - 0-100 scoring

---

### 2. Customer Intelligence Controller

**File:** `server/controllers/CustomerIntelligenceController.js`

**Endpoints:**

#### `getCustomerIntelligence(req, res)`

**GET /api/customers/:userId/intelligence?days=30**

Generate full intelligence report.

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "...",
    "user": { "email": "...", "tier": "Gold" },
    "behavior": { /* full analysis */ },
    "suggestions": {
      "tags": [...],
      "notes": [...],
      "confidence": 85
    },
    "insights": {
      "customerType": "Loyal Customer",
      "nextBestAction": { ... },
      "riskLevel": { ... }
    }
  }
}
```

#### `getQuickInsights(req, res)`

**GET /api/customers/:userId/quick-insights**

Lightweight version cho dashboard widgets.

**Response:**

```json
{
  "success": true,
  "data": {
    "customerType": "VIP Premium",
    "engagementScore": 85,
    "riskLevel": "low",
    "topTags": [/* top 3 */],
    "topNotes": [/* top 2 */],
    "nextAction": { ... },
    "stats": {
      "totalViews": 42,
      "totalPurchases": 5,
      "totalSpent": 12500000,
      "cartAbandonment": 15
    }
  }
}
```

#### `applySuggestedTags(req, res)`

**POST /api/customers/:userId/apply-tags**

Apply AI-suggested tags to customer.

**Request Body:**

```json
{
  "tags": ["interested:shirts", "brand:burberry", "behavior:premium_buyer"]
}
```

#### `applySuggestedNotes(req, res)`

**POST /api/customers/:userId/apply-notes**

Apply AI-suggested notes to customer.

**Request Body:**

```json
{
  "notes": [
    {
      "type": "opportunity",
      "content": "Cần tư vấn về cashmere scarf",
      "priority": "high"
    }
  ]
}
```

---

### 3. Intelligence Routes

**File:** `server/routes/customerIntelligenceRoutes.js`

**Routes (All require Admin auth):**

```javascript
GET    /api/customers/:userId/intelligence       // Full report
GET    /api/customers/:userId/quick-insights     // Quick summary
POST   /api/customers/:userId/apply-tags         // Apply tags
POST   /api/customers/:userId/apply-notes        // Apply notes
```

**Middleware:** `authenticate` + `isAdmin`

---

### 4. Server Integration

**File:** `server/server.js` (Modified)

**Changes:**

- Import `customerIntelligenceRoutes`
- Register routes: `app.use('/api/customers', customerIntelligenceRoutes)`

---

## 🧠 Intelligence Features

### Auto-Tagging Logic

| Condition                   | Tag                        | Confidence |
| --------------------------- | -------------------------- | ---------- |
| 5+ category views           | `interested:category`      | 0.6 - 1.0  |
| 3+ brand views              | `brand:name`               | 0.7 - 1.0  |
| 3+ color views              | `color:name`               | 0.7 - 1.0  |
| Frequent "Price Low" filter | `behavior:price_conscious` | 0.85       |
| AOV > 1M + "Price High"     | `behavior:premium_buyer`   | 0.9        |
| Abandonment > 50%           | `behavior:cart_abandoner`  | 0.75       |
| Chat consultation intent    | `needs:consultation`       | 0.9        |

### Auto-Notes Logic

| Trigger                         | Note Type      | Priority |
| ------------------------------- | -------------- | -------- |
| 3+ repeated searches            | `opportunity`  | high     |
| No-result searches              | `feedback`     | medium   |
| Abandonment > 70% + 5+ items    | `opportunity`  | high     |
| Chat consultation (3+ messages) | `consultation` | high     |
| High engagement + no purchase   | `opportunity`  | high     |
| 3+ purchases                    | `context`      | medium   |

### Next Best Action Rules

1. **Needs consultation** → Offer personalized consultation (HIGH)
2. **Cart abandonment > 70%** → Send reminder + 10% discount (HIGH)
3. **Repeated searches** → Product recommendation email (MEDIUM)
4. **3+ purchases** → VIP program invitation (MEDIUM)
5. **15+ views, no purchase** → First-time buyer discount 15% (MEDIUM)
6. **Default** → Monitor behavior (LOW)

### Churn/Risk Detection

| Risk Level | Condition                               |
| ---------- | --------------------------------------- |
| **High**   | Previous customer, no activity 30+ days |
| **Medium** | Cart abandonment > 80% + 5+ items       |
| **Low**    | Active within 7 days OR 2+ purchases    |

---

## 📊 Analysis Metrics

### Browsing Analysis

- Total product views
- Unique products viewed
- Average views per product
- Top 5 categories (with confidence scores)
- Top 5 brands
- Top 5 colors
- Preferred sizes

### Shopping Analysis

- Cart actions (added/removed/abandonment rate %)
- Purchase count
- Total spent
- Average order value
- Price sensitivity (high/medium/low)
- Preferred categories/brands (from cart)

### Engagement Analysis

- Search count
- Chat sessions
- Chat messages count
- Chat intents breakdown (size-help, consultation, etc.)
- Wishlist items
- Engagement score (0-100)
- Needs consultation flag

### Search Analysis

- Total searches
- Unique queries
- Repeated queries (3+ times)
- No-result queries
- Needs assistance flag

---

## 🔧 Usage Examples

### Admin Dashboard - Get Customer Intelligence

```javascript
// GET /api/customers/507f1f77bcf86cd799439011/intelligence?days=30
const response = await fetch(
  "/api/customers/507f1f77bcf86cd799439011/intelligence",
  {
    headers: { Authorization: `Bearer ${adminToken}` },
  }
);

const { data } = await response.json();

console.log(data.insights.customerType); // "VIP Premium"
console.log(data.suggestions.tags); // [{ tag: 'interested:shirts', confidence: 0.85 }, ...]
console.log(data.insights.nextBestAction); // { action: 'vip_upgrade', ... }
```

### Apply Suggested Tags

```javascript
// POST /api/customers/507f1f77bcf86cd799439011/apply-tags
const tagsToApply = data.suggestions.tags
  .filter((t) => t.confidence >= 0.8)
  .map((t) => t.tag);

await fetch("/api/customers/507f1f77bcf86cd799439011/apply-tags", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ tags: tagsToApply }),
});
```

### Widget - Quick Insights

```javascript
// GET /api/customers/507f1f77bcf86cd799439011/quick-insights
const response = await fetch(
  "/api/customers/507f1f77bcf86cd799439011/quick-insights",
  {
    headers: { Authorization: `Bearer ${adminToken}` },
  }
);

const { data } = await response.json();

// Display in dashboard widget
return (
  <CustomerCard>
    <Badge>{data.customerType}</Badge>
    <Score>{data.engagementScore}/100</Score>
    <Tags>{data.topTags.map((t) => t.tag).join(", ")}</Tags>
    <NextAction>{data.nextAction.message}</NextAction>
  </CustomerCard>
);
```

---

## ✅ Testing Checklist

### API Testing

```bash
# 1. Get full intelligence report
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/customers/507f1f77bcf86cd799439011/intelligence

# 2. Get quick insights
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/customers/507f1f77bcf86cd799439011/quick-insights

# 3. Apply suggested tags
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags":["interested:shirts","brand:burberry"]}' \
  http://localhost:5000/api/customers/507f1f77bcf86cd799439011/apply-tags

# 4. Apply suggested notes
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":[{"type":"opportunity","content":"Cần tư vấn","priority":"high"}]}' \
  http://localhost:5000/api/customers/507f1f77bcf86cd799439011/apply-notes
```

### Expected Outputs

**Full Intelligence Response Structure:**

- ✅ `behavior` object với browsing/shopping/engagement/search analysis
- ✅ `suggestions.tags` array với confidence scores >= 0.6
- ✅ `suggestions.notes` array sorted by priority (high → low)
- ✅ `insights.customerType` in predefined types
- ✅ `insights.nextBestAction` với action + message + priority
- ✅ `insights.riskLevel` với level + reason

**Quick Insights Response:**

- ✅ Top 3 tags only
- ✅ Top 2 notes only
- ✅ Stats object với 4 metrics (views, purchases, spent, abandonment)

---

## 🔍 Intelligence Accuracy

### Confidence Scoring

Tags có confidence score dựa trên:

- **0.6 - 0.7:** Weak signal (5-7 category views)
- **0.7 - 0.85:** Medium confidence (brand/color patterns)
- **0.85 - 1.0:** High confidence (purchase behavior, clear patterns)

Notes có confidence dựa trên:

- **0.75:** Inferred patterns (cart abandonment)
- **0.8 - 0.9:** Strong signals (repeated searches, high engagement)
- **1.0:** Direct evidence (no-result searches, purchase history)

### Validation Rules

- Minimum 5 views để generate category interest tag
- Minimum 3 views cho brand/color tags
- Minimum 3 repeated searches để generate opportunity note
- Minimum 3 chat messages để detect consultation needs
- Abandonment rate calculated only if >= 3 items added to cart

---

## 🚀 Performance Optimization

### Query Optimization

- EventLog queries sử dụng compound indexes (userId+timestamp)
- Aggregation pipelines cho counting (efficient)
- Lean queries (no Mongoose overhead)

### Caching Strategy (Future)

```javascript
// Redis cache cho intelligence reports (TTL 1 hour)
const cacheKey = `intelligence:${userId}:${days}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const intelligence = await generateCustomerIntelligence(userId, { days });
await redis.setex(cacheKey, 3600, JSON.stringify(intelligence));
```

### Background Jobs (Future)

```javascript
// Daily cron job để pre-compute intelligence cho active customers
cron.schedule("0 2 * * *", async () => {
  const activeUsers = await User.find({
    /* active criteria */
  });
  for (const user of activeUsers) {
    await generateCustomerIntelligence(user._id);
    // Cache results in Redis
  }
});
```

---

## 📈 Next Steps

### Phase 4: RAG Context Integration (Pending)

1. Create `buildCustomerContext()` utility
2. Modify RAGService.chat() to inject customer intelligence
3. Enhance prompts với tags, notes, purchase history
4. Test chatbot với personalized context

### Admin Dashboard Widget (Task #8)

1. Create IntelligenceWidget component trong Admin
2. Display quick insights trong CustomerDrawer
3. UI cho approve/reject suggested tags/notes
4. One-click apply suggestions

### Advanced Features (Future)

- **Cohort Analysis:** Group customers by behavior patterns
- **Predictive Analytics:** ML model cho churn prediction
- **A/B Testing:** Test different next-best-actions
- **Real-time Scoring:** WebSocket updates khi behavior changes

---

## 🎓 Key Insights

1. **Confidence scores critical** - Admin cần thấy certainty level trước khi approve tags
2. **Priority-based notes** - High-priority notes need immediate action
3. **Next-best-action automation** - Reduce manual decision-making
4. **Engagement score** - Simple metric (0-100) easy to understand
5. **Customer type classification** - Fast segmentation cho marketing campaigns

---

**Implementation Date:** December 19, 2025  
**Status:** ✅ Phase 3 Complete - Intelligence service fully functional  
**Lines of Code:** ~650 (service) + ~200 (controller) + ~20 (routes) = 870 lines  
**Next:** Phase 4 - RAG Context Integration
