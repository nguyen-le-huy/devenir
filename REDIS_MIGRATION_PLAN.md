# Redis Migration Plan - Devenir E-commerce

## 📊 Current State: Node-Cache (In-Memory)

### Pros:

- ✅ Zero cost
- ✅ Ultra-fast (local RAM)
- ✅ Simple setup
- ✅ Sufficient for current traffic

### Cons:

- ❌ Data lost on restart
- ❌ Cannot share across servers
- ❌ RAM limited to single server

---

## 🎯 When to Migrate to Redis

### Triggers for Migration:

1. **Traffic** > 5,000 requests/hour
2. **Multi-server** deployment needed
3. **Persistent cart/session** required
4. **Real-time features** (chat, live updates)
5. **Budget** available ($10-50/month)

### Current Status: **❌ NOT YET**

- Traffic: ~100-500 req/hour (estimated)
- Deployment: Single server
- Budget: Minimizing costs

---

## 🔄 Redis Use Cases (When Ready)

### 1. API Response Caching (Current)

```javascript
// Node-Cache (Current)
cache.set("products:category:123", data, 300);

// Redis (Future)
redis.setex("products:category:123", 300, JSON.stringify(data));
```

### 2. Session Management

```javascript
// Store user sessions
redis.setex(`session:${userId}`, 86400, JSON.stringify(session));

// Get session
const session = JSON.parse(await redis.get(`session:${userId}`));
```

### 3. Shopping Cart (Persistent)

```javascript
// Add to cart
redis.hset(`cart:${userId}`, productId, quantity);

// Get cart
const cart = await redis.hgetall(`cart:${userId}`);

// Remove item
redis.hdel(`cart:${userId}`, productId);
```

### 4. Rate Limiting

```javascript
// Prevent spam/abuse
const key = `ratelimit:${ip}:${endpoint}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 60);

if (count > 100) {
  throw new Error("Rate limit exceeded");
}
```

### 5. Product Analytics

```javascript
// View counter
redis.zincrby("trending:products", 1, productId);

// Get trending products
const trending = await redis.zrevrange("trending:products", 0, 9);

// Recently viewed
redis.lpush(`recent:${userId}`, productId);
redis.ltrim(`recent:${userId}`, 0, 9);
```

### 6. Inventory Updates (Real-time)

```javascript
// Pub/Sub pattern
// Publisher (when stock changes)
redis.publish(
  "inventory:update",
  JSON.stringify({
    sku: "ABC-M-001",
    quantity: 5,
  })
);

// Subscriber (admin dashboard)
redis.subscribe("inventory:update", (message) => {
  const update = JSON.parse(message);
  updateDashboard(update);
});
```

---

## 💰 Cost Analysis

### Node-Cache (Current)

- **Cost**: $0
- **Infrastructure**: None
- **Maintenance**: Minimal

### Redis Cloud Options

#### 1. Redis Labs (Recommended)

- **Free Tier**: 30MB, perfect for testing
- **Paid**: $5-10/month for 250MB-1GB
- **Pros**: Managed, reliable, auto-backup

#### 2. AWS ElastiCache

- **Cost**: ~$15/month (t3.micro)
- **Pros**: AWS integration, scalable
- **Cons**: More expensive

#### 3. Azure Cache for Redis

- **Cost**: ~$16/month (Basic C0)
- **Pros**: Azure integration
- **Cons**: Requires Azure account

#### 4. Self-hosted (DigitalOcean/Linode)

- **Cost**: $5/month (shared droplet)
- **Pros**: Full control, cheapest
- **Cons**: Need to manage yourself

---

## 🚀 Migration Strategy

### Phase 1: Testing (Week 1-2)

```bash
# Use Redis Labs free tier
1. Create free Redis instance
2. Test locally with docker
3. Migrate 1-2 endpoints
4. Compare performance
```

### Phase 2: Parallel Run (Week 3-4)

```javascript
// Dual cache strategy
const getData = async (key) => {
  // Try Redis first
  let data = await redis.get(key);

  if (!data) {
    // Fallback to node-cache
    data = cache.get(key);
  }

  if (!data) {
    // Fetch from DB
    data = await fetchFromDB();

    // Store in both
    await redis.setex(key, 300, JSON.stringify(data));
    cache.set(key, data, 300);
  }

  return data;
};
```

### Phase 3: Full Migration (Week 5-6)

```bash
1. Switch all endpoints to Redis
2. Remove node-cache dependency
3. Monitor performance
4. Document new patterns
```

---

## ⚠️ Risk Mitigation

### Problem: Server loses power

**Node-Cache Impact:**

- ❌ All cache lost
- ✅ MongoDB still has all data
- ✅ Cache rebuilds on first requests
- ⏱️ Slight slowdown for ~1-5 minutes

**Solution (Current):**

```javascript
// Smart cache warming on server start
app.on("ready", async () => {
  await warmUpCache(); // Pre-load critical data
});
```

**Redis Impact (Future):**

- ✅ Data persists (if persistence enabled)
- ✅ Faster recovery
- ✅ Multi-server redundancy

---

## 📈 Performance Comparison

### Current Setup (Node-Cache)

```
Cache Hit:  <1ms   (in-memory)
Cache Miss: 50ms   (MongoDB query)
Cold Start: 5-30s  (cache warming)
```

### With Redis

```
Cache Hit:  2-5ms  (network + Redis)
Cache Miss: 50ms   (MongoDB query)
Cold Start: 1-2s   (Redis persistent)
Benefit:    Distributed, persistent
```

---

## 🎯 Recommendation for Devenir

### Current Stage (MVP): ✅ **KEEP Node-Cache**

**Reasons:**

1. Traffic is manageable
2. Cost = $0
3. Simplicity = high productivity
4. MongoDB is source of truth

### Enhanced Strategy (Implement Now):

```javascript
// 1. Cache warming on startup
await warmUpCache();

// 2. Smart cache invalidation
productController.create = async (req, res) => {
  const product = await Product.create(req.body);

  // Invalidate related caches
  SmartCache.invalidate("products:");
  SmartCache.invalidate(`category:${product.category}`);

  res.json(product);
};

// 3. Graceful degradation
const getData = async (key, fetchFn) => {
  try {
    return await SmartCache.getOrFetch(key, fetchFn);
  } catch (error) {
    // Cache fails? Go directly to DB
    return await fetchFn();
  }
};
```

### Future Migration (When traffic grows):

- Month 3-6: Evaluate traffic patterns
- If traffic > 5K/hour: Start Redis testing
- Month 6-12: Full Redis migration if needed

---

## ✅ Action Items

### Immediate (This Week):

- [x] Implement SmartCache with warming
- [x] Add cache invalidation on mutations
- [x] Document current cache strategy

### Short-term (1-3 months):

- [ ] Monitor traffic patterns
- [ ] Set up Redis test environment
- [ ] Create migration scripts

### Long-term (6-12 months):

- [ ] Evaluate Redis migration
- [ ] Plan multi-server deployment
- [ ] Implement Redis gradually

---

## 💡 Key Takeaway

**For Devenir NOW:**

> Node-Cache is PERFECT for current stage. Focus on features, not premature optimization. Redis when you actually need it (traffic > 5K/hour).

**Power outage risk:**

> Not a problem! Cache rebuilds automatically. MongoDB is source of truth. Downtime: ~5-30 seconds.

**Future-proof:**

> Architecture ready for Redis when needed. Migration will be smooth and gradual.
