# 🧪 AI Intelligence Testing Guide

## Quick Test Commands

### 1. Test API Endpoint Directly

```bash
# Get quick insights for a user
curl -X GET http://localhost:3111/api/customers/{userId}/quick-insights \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected Response:
{
  "success": true,
  "data": {
    "customerType": "VIP Premium" | "Window Shopper" | ...,
    "engagementScore": 0-100,
    "riskLevel": "low" | "medium" | "high",
    "stats": {
      "totalViews": 13,
      "totalPurchases": 1,      // ✅ From Orders collection
      "totalSpent": 150000,      // ✅ From Orders collection
      "cartAbandonment": 15      // Calculated from EventLog
    },
    "topTags": [...],
    "topNotes": [...],
    "dataSource": "hybrid"       // ✅ NEW: Shows data source
  }
}
```

---

## 2. Test Scenarios

### **Scenario A: User Dung (Window Shopper → Buyer)**

**Before Fix:**
```json
{
  "stats": {
    "totalViews": 13,
    "totalPurchases": 0,    // ❌ WRONG
    "totalSpent": 0,        // ❌ WRONG
    "cartAbandonment": 0
  },
  "dataSource": "eventlog"
}
```

**After Fix:**
```json
{
  "stats": {
    "totalViews": 13,
    "totalPurchases": 1,    // ✅ CORRECT (from Orders)
    "totalSpent": 150000,   // ✅ CORRECT (from Orders)
    "cartAbandonment": 15   // ✅ Calculated
  },
  "dataSource": "hybrid"    // ✅ NEW
}
```

### **Scenario B: User Huy (VIP Premium)**

**Before Fix:**
```json
{
  "stats": {
    "totalViews": 57,       // From Orders estimate
    "totalPurchases": 19,
    "totalSpent": 88211500,
    "cartAbandonment": 0    // ❌ Not available
  },
  "dataSource": "orders"
}
```

**After Fix:**
```json
{
  "stats": {
    "totalViews": 57,       // From EventLog (if available)
    "totalPurchases": 19,   // ✅ CORRECT (from Orders)
    "totalSpent": 88211500, // ✅ CORRECT (from Orders)
    "cartAbandonment": 0    // ✅ N/A for orders-only data
  },
  "dataSource": "hybrid" or "orders"
}
```

---

## 3. Verify Data Sources

### Check which data source is being used:

```javascript
// In Admin UI - Add debug info
console.log('Data Source:', insightsData.dataSource)

// Expected values:
// - "hybrid"    ✅ Best: EventLog behavior + Orders transactions
// - "eventlog"  ⚠️  Rare: EventLog only, no orders yet
// - "orders"    📊 Fallback: No EventLog, Orders only
```

---

## 4. Manual Database Checks

### Check if user has EventLog data:

```javascript
// MongoDB query
db.eventlogs.find({ 
  userId: "USER_ID",
  timestamp: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
}).count()

// If > 0: Should use hybrid or eventlog
// If = 0: Will fallback to orders
```

### Check if user has Orders:

```javascript
// MongoDB query
db.orders.find({ 
  user: "USER_ID",
  status: { $nin: ['cancelled', 'failed'] }
}).count()

// This count should match stats.totalPurchases
```

---

## 5. Frontend Testing

### In CustomerDetailDrawer.tsx:

1. Open a customer detail
2. Go to "AI Insights" tab
3. Check the stats card:
   - ✅ Views should be > 0 (if user browsed)
   - ✅ Orders should match actual orders count
   - ✅ Spent should match total order value
   - ✅ Abandon should be calculated (if EventLog available)

### Expected Behavior:

- **New User:** All zeros
- **Browser Only:** Views > 0, Orders = 0
- **Buyer:** Views > 0, Orders > 0, Spent > 0
- **Old Customer:** May have Orders but no recent Views

---

## 6. Debug Logs

### Server logs to watch for:

```bash
# Good: Using hybrid approach
✅ No log message (silent success)

# Warning: Fallback to orders
⚠️ No EventLog found, using Order data fallback...

# Error: Something went wrong
❌ [CustomerIntelligence] Error: ...
```

---

## 7. Common Issues & Fixes

### **Issue 1: Stats still showing 0 after purchase**

**Possible Causes:**
- Order status is 'cancelled' or 'failed' (excluded)
- User ID mismatch
- Cache not invalidated

**Fix:**
```javascript
// Verify order exists
const order = await Order.findOne({ user: userId, _id: orderId })
console.log('Order status:', order.status)

// Force refetch in frontend
queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.detail(userId) })
```

### **Issue 2: dataSource always shows "orders"**

**Possible Causes:**
- EventLog collection is empty
- EventLog TTL expired (90 days)
- userId not matching

**Fix:**
```javascript
// Check EventLog
const eventCount = await EventLog.countDocuments({ 
  userId,
  timestamp: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
})
console.log('EventLog count:', eventCount)
```

### **Issue 3: Abandonment rate always 0**

**Expected Behavior:**
- Only calculated when `dataSource === 'hybrid'`
- Requires both EventLog cart data + Orders
- If Orders-only fallback: Abandonment = 0 (not available)

---

## 8. Performance Monitoring

### Check query performance:

```javascript
// In customerIntelligence.js, add timing
const start = Date.now()
const behavior = await analyzeCustomerBehavior(userId, options)
console.log(`analyzeCustomerBehavior: ${Date.now() - start}ms`)

const orderStats = await getOrderStats(userId)
console.log(`getOrderStats: ${Date.now() - start}ms`)
```

**Expected Times:**
- `analyzeCustomerBehavior`: < 200ms
- `getOrderStats`: < 100ms
- **Total:** < 300ms

---

## ✅ Success Criteria

- [ ] User Dung shows correct order count and spent
- [ ] User Huy shows consistent data
- [ ] All users have `dataSource` field in response
- [ ] No errors in server logs
- [ ] API response time < 500ms
- [ ] Frontend displays all stats correctly

---

## 📞 Need Help?

If you see unexpected results:

1. Check server logs for warnings/errors
2. Verify database has Orders and/or EventLogs
3. Check `dataSource` field in API response
4. Compare with manual database queries
5. Clear cache and refetch data
