---
description: Workflow for implementing optimized shopping cart (add/remove/update items)
---

# Shopping Cart Implementation Workflow

This workflow guides you through implementing a full-featured, optimized shopping cart system for the Devenir e-commerce application.

## Architecture Overview

**Backend**: Cart model already exists with methods for add/remove/update
**Frontend**: Need to create services, hooks, context, and connect to UI
**State Management**: Use React Context + React Query for optimal caching

---

## Phase 1: Backend Setup (Cart Controller & Routes)

### 1. Create Cart Controller
**File**: `/server/controllers/CartController.js`

Create a controller with the following endpoints:
- `getCart` - Get user's cart (with populated product details)
- `addToCart` - Add item to cart
- `updateCartItem` - Update item quantity
- `removeFromCart` - Remove item from cart
- `clearCart` - Clear all items

**Key Points**:
- Always populate `productVariant` with product info (name, images, price)
- Return cart with `totalItems` and `totalPrice` virtuals
- Handle authentication (require logged-in user)
- Proper error handling for stock validation

### 2. Create Cart Routes
**File**: `/server/routes/cartRoutes.js`

Define routes:
```
GET    /api/cart              - Get cart
POST   /api/cart/items        - Add item
PUT    /api/cart/items/:variantId  - Update item quantity
DELETE /api/cart/items/:variantId  - Remove item
DELETE /api/cart              - Clear cart
```

**Important**: All routes require authentication middleware

### 3. Register Routes
**File**: `/server/server.js`

Import and register cart routes:
```javascript
import cartRoutes from './routes/cartRoutes.js';
app.use('/api/cart', cartRoutes);
```

---

## Phase 2: Frontend Services Layer

### 4. Create Cart Service
**File**: `/client/src/services/cartService.js`

Create service functions using `apiClient`:
- `getCart()` - Fetch cart
- `addToCart(variantId, quantity)` - Add item
- `updateCartItem(variantId, quantity)` - Update quantity
- `removeFromCart(variantId)` - Remove item
- `clearCart()` - Clear all items

**Pattern**: Follow same pattern as `productService.js`
- Use try/catch blocks
- Return response from apiClient (already unwrapped)
- Console.error on failures

---

## Phase 3: React Query Hooks

### 5. Create Cart Hooks
**File**: `/client/src/hooks/useCart.js`

Implement React Query hooks:

**`useCart()`** - Query hook
- Query key: `['cart']`
- Only enabled when user is authenticated
- Stale time: 30 seconds (cart changes frequently)
- Return cart data with items, totalItems, totalPrice

**`useAddToCart()`** - Mutation hook
- Optimistic updates for instant UI feedback
- Invalidate cart query on success
- Show toast notification on success/error

**`useUpdateCartItem()`** - Mutation hook
- Optimistic updates
- Invalidate cart query
- Handle quantity = 0 as removal

**`useRemoveFromCart()`** - Mutation hook
- Optimistic updates
- Invalidate cart query
- Confirmation before removal (optional)

**`useClearCart()`** - Mutation hook
- Invalidate cart query
- Confirmation required

**Optimization Tips**:
- Use `onMutate` for optimistic updates
- Use `onError` to rollback on failure
- Use `onSettled` to ensure query invalidation

---

## Phase 4: Cart Context (Optional but Recommended)

### 6. Create Cart Context
**File**: `/client/src/contexts/CartContext.jsx`

Provides:
- Cart data from useCart()
- Mutation functions (add, update, remove, clear)
- Derived state (itemCount, total, isInCart helper)
- Loading and error states

**Benefits**:
- Centralized cart logic
- Easy access from any component
- Avoid prop drilling

**Pattern**: Similar to AuthContext if you have one

---

## Phase 5: Update Bag Component

### 7. Connect Bag Component to Cart
**File**: `/client/src/components/Bag/Bag.jsx`

**Changes needed**:
1. Import `useCart` or `useCartContext`
2. Replace hardcoded products with real cart items
3. Map over `cart.items` to display products
4. Show `cart.totalPrice` as subtotal
5. Add remove button for each item (use `removeFromCart`)
6. Add quantity update (+ / - buttons, use `updateCartItem`)
7. Handle empty cart state (already exists)
8. Show loading state while fetching

**UI Improvements**:
- Add remove icon/button per item
- Add quantity selector (e.g., dropdown or +/- buttons)
- Show loading spinner during mutations
- Animate item removal

---

## Phase 6: Add to Cart from Product Pages

### 8. Update Product Detail Page
**File**: `/client/src/pages/ProductDetail/ProductDetail.jsx`

**Add to "Add to Bag" button**:
1. Import `useAddToCart` hook
2. Get selected variant ID (current variant being viewed)
3. On button click, call `addToCart(variantId, 1)`
4. Show loading state on button during mutation
5. Show success feedback (toast or temporary text change)
6. Disable button if out of stock

**Optional**: Add quantity selector before adding

### 9. Update Product Cards (Quick Add)
**File**: `/client/src/components/ProductCard/ScarfCard.jsx`

**Optional feature**: Quick add to cart from card
- Add mini "Add to Cart" icon on hover
- Clicking adds 1 item of that variant
- Show mini success indicator

---

## Phase 7: Header Cart Badge

### 10. Update Header Cart Count
**File**: `/client/src/components/layout/Header/Header.jsx`

**Update cart badge**:
1. Use `useCart()` to get cart data
2. Display `cart?.totalItems || 0` in the bag icon badge
3. Ensure badge updates when cart changes (React Query auto-updates)

---

## Phase 8: Optimizations & Polish

### 11. Implement Optimistic Updates

In mutation hooks, add optimistic updates:
```javascript
onMutate: async (newData) => {
  await queryClient.cancelQueries(['cart']);
  const previousCart = queryClient.getQueryData(['cart']);
  
  // Optimistically update
  queryClient.setQueryData(['cart'], (old) => {
    // Update cart optimistically
    return updatedCart;
  });
  
  return { previousCart };
},
onError: (err, variables, context) => {
  // Rollback on error
  queryClient.setQueryData(['cart'], context.previousCart);
}
```

### 12. Add Notifications/Toasts

Install a toast library (e.g., `react-hot-toast`):
```bash
npm install react-hot-toast
```

Add toasts for:
- ✅ Item added to cart
- ✅ Item removed from cart
- ✅ Quantity updated
- ❌ Stock insufficient
- ❌ Network errors

### 13. Local Storage Fallback (Guest Cart)

For non-authenticated users:
- Store cart in localStorage
- Implement `cartService.js` functions to work with localStorage
- Merge guest cart with user cart on login

### 14. Stock Validation

- Show "Out of Stock" badge if variant.quantity === 0
- Disable "Add to Cart" button
- In cart, show warning if stock < quantity
- Auto-update quantity if stock reduced

### 15. Cart Persistence

- Cart automatically persists on backend (per user)
- On login, fetch cart from server
- On logout, clear cart context (but server retains it)

---

## Testing Checklist

- [ ] Add item to cart from product detail page
- [ ] Add item to cart from product card (if implemented)
- [ ] Update item quantity in cart (increase/decrease)
- [ ] Remove item from cart
- [ ] Clear entire cart
- [ ] Cart badge shows correct count
- [ ] Cart total calculates correctly
- [ ] Out of stock items cannot be added
- [ ] Optimistic updates work (instant UI feedback)
- [ ] Error handling works (network errors, stock errors)
- [ ] Cart persists across page refreshes
- [ ] Cart persists after logout/login
- [ ] Multiple items in cart display correctly
- [ ] Empty cart state displays

---

## File Structure Summary

**Backend**:
```
server/
├── models/CartModel.js ✅ (already exists)
├── controllers/CartController.js ⚠️ (create this)
└── routes/cartRoutes.js ⚠️ (create this)
```

**Frontend**:
```
client/src/
├── services/cartService.js ⚠️ (create this)
├── hooks/useCart.js ⚠️ (create this)
├── contexts/CartContext.jsx ⚠️ (optional, create this)
├── components/Bag/Bag.jsx ⚠️ (update this)
├── pages/ProductDetail/ProductDetail.jsx ⚠️ (update this)
└── components/layout/Header/Header.jsx ⚠️ (update this)
```

---

## Best Practices

1. **Always validate stock** before adding/updating items
2. **Use optimistic updates** for better UX
3. **Invalidate queries** after mutations to keep data fresh
4. **Handle errors gracefully** with user-friendly messages
5. **Show loading states** during async operations
6. **Use React Query** for server state management
7. **Keep business logic in hooks/services**, not components
8. **TypeScript** (optional): Add types for cart data
9. **Accessibility**: Ensure cart is keyboard navigable
10. **Mobile**: Ensure cart works well on mobile

---

## Performance Considerations

- React Query caching reduces API calls
- Optimistic updates = instant UI feedback
- Debounce quantity updates (if user types)
- Lazy load cart data (only when needed)
- Paginate cart items if cart can be very large (unlikely for fashion)

---

## Security Considerations

- All cart endpoints require authentication
- Validate user owns the cart on backend
- Sanitize inputs (quantity must be positive integer)
- Rate limit cart operations to prevent abuse
- Never trust client-side stock validation (always validate on server)

---

## Next Steps After Cart Implementation

1. Implement Checkout page
2. Implement Order creation from cart
3. Implement Payment integration
4. Email notifications for orders
5. Order history page
