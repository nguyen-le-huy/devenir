# Event Tracking Testing Guide

## 📋 Overview

Hướng dẫn kiểm tra hệ thống Event Tracking & Customer Intelligence đã implement trong Phase 1 và Phase 2.

---

## ✅ Phase 1: Event Infrastructure (COMPLETED)

### Backend Components Created:

1. **EventLogModel** - `server/models/EventLogModel.js`

   - 14 event types với TTL 90 days
   - Compound indexes: userId+timestamp, type+timestamp, sessionId+timestamp

2. **EventController** - `server/controllers/EventController.js`

   - EventProcessor với 8 handlers:
     - `handleProductView()` - Track category interest
     - `handleAddToCart()` - Extract product attributes
     - `handlePurchase()` - Analyze purchase patterns
     - `handleSearch()` - Detect repeated searches
     - `handleFilterApply()` - Track filter preferences
     - `handleChatMessage()` - Consultation needs detection
     - `handleWishlistAdd()` - Wishlist behavior

3. **Event Routes** - `server/routes/eventRoutes.js`

   - `POST /api/events/track` - Public (no auth required)
   - `GET /api/events/stats/:userId` - Admin only

4. **Client Tracker** - `client/src/utils/eventTracker.js`

   - Auto-flush queue: 5s interval hoặc 20 events
   - Immediate flush cho critical events (purchase, add_to_cart)
   - Lifecycle hooks: beforeunload, visibilitychange

5. **Database Schema Updates**
   - UserModel: Added `notesList` array schema
   - EventLog: TTL index + compound indexes

---

## ✅ Phase 2: UI Integration (COMPLETED)

### Integrated Tracking Events:

#### 1. ProductDetailPage - Product View

- **File:** `client/src/pages/ProductDetail/ProductDetail.jsx`
- **Event:** `product_view`
- **Trigger:** Khi variant data được load thành công
- **Data:** productId, productName, variantId, category, brand, color, size, price, sku

#### 2. Cart Actions - Add/Remove

- **File:** `client/src/hooks/useCart.js`
- **Events:**
  - `add_to_cart` - Khi mutation thành công
  - `remove_from_cart` - Khi xóa item
- **Data:** productId, productName, variantId, category, brand, color, size, price, quantity

#### 3. ChatWindow - Conversation Tracking

- **File:** `client/src/components/Chat/ChatWindow.jsx`
- **Events:**
  - `chat_start` - First message trong session
  - `chat_message` - Mỗi message với intent detection
- **Intent Detection:** size-help, product-recommendation, styling-advice, order-inquiry, consultation, general

#### 4. Search - Query Tracking

- **File:** `client/src/components/Search/Search.jsx`
- **Event:** `search`
- **Trigger:** Sau khi fetch results thành công
- **Data:** query, resultsCount

#### 5. Filter - Preference Tracking

- **File:** `client/src/components/Filter/Filter.jsx`
- **Event:** `filter_apply`
- **Trigger:** Khi user chọn sort hoặc color
- **Data:** filterType (sort/color), sortBy, selectedColors

---

## 🧪 Testing Checklist

### Step 1: Backend Health Check

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Server
cd server
npm run dev
```

**Verify:**

- [ ] Server starts without errors
- [ ] EventLog collection created với TTL index
- [ ] Event routes registered: `/api/events/track`, `/api/events/stats/:userId`

### Step 2: Client Health Check

```bash
# Terminal 3: Start Client
cd client
npm run dev
```

**Verify:**

- [ ] Client builds without errors
- [ ] eventTracker.js loads successfully
- [ ] No console errors on homepage

### Step 3: End-to-End Event Flow Test

#### Test Scenario 1: Product Browsing

1. **Navigate to Product Detail Page**

   - Chọn bất kỳ product nào từ homepage
   - Expected: `product_view` event được ghi vào EventLog

2. **Check Database**

   ```javascript
   // MongoDB Shell
   use devenir_db;
   db.eventlogs.find({ type: 'product_view' }).sort({ createdAt: -1 }).limit(1);
   ```

   **Expected Output:**

   ```json
   {
     "type": "product_view",
     "userId": "...",
     "sessionId": "...",
     "data": {
       "productId": "...",
       "productName": "...",
       "category": "Shirts",
       "brand": "Burberry",
       "color": "Black",
       "size": "M",
       "price": 1500000
     },
     "timestamp": ISODate("..."),
     "createdAt": ISODate("...")
   }
   ```

3. **Check Auto-Tags (after 5+ views of same category)**

   ```javascript
   db.users.findOne({ _id: ObjectId("...") }, { tags: 1 });
   ```

   **Expected:** `interested:shirts` tag được thêm vào

#### Test Scenario 2: Add to Cart

1. **Add Product to Cart**

   - Click "Add to Bag" button
   - Expected: `add_to_cart` event + success notification

2. **Check EventLog**

   ```javascript
   db.eventlogs.find({ type: "add_to_cart" }).sort({ createdAt: -1 }).limit(1);
   ```

3. **Check Auto-Tags**
   - Expected: `category:shirts`, `brand:burberry`, `color:black`, `size:m` tags

#### Test Scenario 3: Search Behavior

1. **Perform Search**

   - Mở Search modal
   - Type "cashmere scarf"
   - Expected: `search` event sau khi results load

2. **Repeat Same Search 3 Times**

   - Search "cashmere scarf" 3 lần trong 5 phút

3. **Check Auto-Notes**

   ```javascript
   db.users.findOne({ _id: ObjectId("...") }, { notesList: 1 });
   ```

   **Expected:** Note type `opportunity` với content chứa "cashmere scarf"

#### Test Scenario 4: Chat Interaction

1. **Start Chat**

   - Click chat icon
   - Type first message: "Xin chào"
   - Expected: `chat_start` event

2. **Send Message with Intent**

   - Type: "Tôi muốn tìm áo sơ mi phù hợp với dáng người gầy"
   - Expected: `chat_message` event với intent `consultation` hoặc `product-recommendation`

3. **Check EventLog**
   ```javascript
   db.eventlogs
     .find({
       type: { $in: ["chat_start", "chat_message"] },
     })
     .sort({ createdAt: -1 })
     .limit(5);
   ```

#### Test Scenario 5: Filter Usage

1. **Apply Filter**

   - Mở Filter modal
   - Chọn color: "Black"
   - Chọn sort: "Price Low"

2. **Check EventLog**

   ```javascript
   db.eventlogs.find({ type: "filter_apply" }).sort({ createdAt: -1 }).limit(1);
   ```

   **Expected:**

   ```json
   {
     "type": "filter_apply",
     "data": {
       "filterType": "color",
       "selectedColors": ["Black"],
       "sortBy": "Price Low"
     }
   }
   ```

#### Test Scenario 6: Purchase Flow (Already Integrated)

1. **Complete Purchase**
   - Add items to cart
   - Go to checkout
   - Complete payment via PayOS
2. **Check EventLog**

   ```javascript
   db.eventlogs.find({ type: "purchase" }).sort({ createdAt: -1 }).limit(1);
   ```

3. **Check Purchase Pattern Tags**
   - Expected: `behavior:premium_buyer` hoặc `behavior:sale_hunter`
   - Browsing tags (interested:\*) should be removed

---

## 🔍 Debug Tools

### Check Queue Status (Client)

```javascript
// Browser Console
console.log(tracker.queue); // Should be empty if auto-flush works
tracker.flush(); // Manual flush
```

### Monitor Event Emissions (Server)

```javascript
// Add to EventController.js handleProductView()
console.log("[EventProcessor] Product view:", { userId, productId });
```

### Check Background Processing

```javascript
// server/controllers/EventController.js
// All handlers run in setImmediate() - check logs for async processing
```

---

## ⚠️ Known Issues & Troubleshooting

### Issue 1: Events không được ghi vào database

**Symptoms:** EventLog collection trống
**Debug Steps:**

1. Check network tab: POST /api/events/track có response 200?
2. Check server logs: EventController có receive events?
3. Check MongoDB: Collection `eventlogs` có tồn tại?

**Solution:**

```bash
# Restart server để tạo indexes
cd server
npm run dev
```

### Issue 2: Auto-tags không được tạo

**Symptoms:** User.tags array không có tags mới
**Debug Steps:**

1. Check EventProcessor listeners: `setupListeners()` có được gọi?
2. Check threshold: Đủ 5+ views chưa?
3. Check async processing: `setImmediate()` có block main thread?

**Solution:**

```javascript
// Check trong MongoDB
db.eventlogs.aggregate([
  { $match: { userId: ObjectId("..."), type: "product_view" } },
  { $group: { _id: "$data.category", count: { $sum: 1 } } },
]);
```

### Issue 3: Client queue không flush

**Symptoms:** Events accumulate in queue, không gửi lên server
**Debug Steps:**

1. Check localStorage token: User đã login?
2. Check browser console: Có errors từ fetch API?
3. Check flush interval: 5s có trigger?

**Solution:**

```javascript
// Browser console
tracker.flush(); // Manual flush
localStorage.getItem("token"); // Check auth token
```

---

## 📊 Success Metrics

### Performance Targets:

- [ ] Event batch flush < 100ms
- [ ] EventLog insert < 50ms
- [ ] Auto-tag generation < 200ms (async)
- [ ] Client queue flush every 5s or 20 items

### Data Quality:

- [ ] 100% events có userId (nếu logged in)
- [ ] 100% events có sessionId
- [ ] Product events có đầy đủ category, brand, color, size
- [ ] Chat events có intent detection

### Intelligence Accuracy:

- [ ] Auto-tags chính xác với behavior (5+ category views → interested:category)
- [ ] Auto-notes trigger đúng (3+ repeated searches)
- [ ] Purchase pattern analysis (premium vs sale hunter)

---

## 🚀 Next Steps

### Phase 3: Customer Intelligence Service (Pending)

- [ ] Create `services/customerIntelligence.js`
- [ ] Implement `analyzeCustomerBehavior()`
- [ ] Add background cron jobs (hourly/daily)
- [ ] Create API endpoint `/api/customers/:id/intelligence`

### Phase 4: RAG Context Integration (Pending)

- [ ] Create `buildCustomerContext()` utility
- [ ] Modify RAGService.chat() to fetch customer context
- [ ] Enhance prompts with tags, notes, purchase history
- [ ] Test AI chatbot với customer context

---

## 📝 Testing Log Template

```markdown
## Test Session: [Date]

### Environment:

- MongoDB: Running ✅/❌
- Server: Running ✅/❌
- Client: Running ✅/❌

### Scenario 1: Product View

- Event logged: ✅/❌
- Auto-tags created: ✅/❌
- Notes: ...

### Scenario 2: Add to Cart

- Event logged: ✅/❌
- Auto-tags created: ✅/❌
- Notes: ...

### Scenario 3: Search

- Event logged: ✅/❌
- Auto-notes created: ✅/❌
- Notes: ...

### Scenario 4: Chat

- chat_start event: ✅/❌
- chat_message event: ✅/❌
- Intent detection: ✅/❌
- Notes: ...

### Scenario 5: Filter

- Event logged: ✅/❌
- Filter data accurate: ✅/❌
- Notes: ...

### Scenario 6: Purchase

- Event logged: ✅/❌
- Pattern analysis: ✅/❌
- Tags updated: ✅/❌
- Notes: ...

### Issues Found:

1. [Issue description]
2. [Issue description]

### Fixes Applied:

1. [Fix description]
2. [Fix description]
```

---

## 📚 References

- **EventLogModel Schema:** `server/models/EventLogModel.js`
- **EventProcessor Handlers:** `server/controllers/EventController.js`
- **Client Tracker API:** `client/src/utils/eventTracker.js`
- **Integration Examples:** See Phase 2 file modifications

---

**Last Updated:** December 19, 2025
**Status:** Phase 2 Complete - Ready for Testing
**Next:** Phase 3 - Customer Intelligence Service
