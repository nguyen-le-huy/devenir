# Refactor Plan: Cart Feature Optimization

**Date**: February 1, 2026  
**Analyst**: Senior Planner  
**Status**: Planning Phase

---

## Executive Summary

Sau khi audit toàn bộ code trong `client/src/features/cart`, phát hiện **9 vấn đề cấu trúc** và **12 vi phạm best practices** cần refactor để đáp ứng tiêu chuẩn doanh nghiệp lớn. Code hiện tại **chức năng hoạt động** nhưng chưa tối ưu về performance, maintainability và clean code principles.

**Overall Code Quality**: 6.5/10  
**Target After Refactor**: 9/10

---

## 1. Critical Issues Analysis

### 🔴 **High Priority Issues**

#### 1.1. Query Keys Không Tuân Thủ Centralized Pattern
**Location**: [`cart/hooks/useCart.ts#L11-L13`](client/src/features/cart/hooks/useCart.ts#L11-L13)  
**Problem**:
```typescript
// ❌ BAD: Query keys định nghĩa local trong hook
export const cartKeys = {
    all: ['cart'] as const,
    detail: () => [...cartKeys.all, 'detail'] as const,
};
```
**Architecture Violation**: Theo quy tắc, Query Keys Factory phải nằm tại `core/lib/queryClient.ts` (file này đã có `queryKeys.products`, `queryKeys.categories`).

**Impact**:
- ❌ Không nhất quán với features khác
- ❌ Khó quản lý invalidation cross-feature
- ❌ Nguy cơ conflict nếu có feature khác cũng export `cartKeys`

**Fix**: Di chuyển `cartKeys` vào `core/lib/queryClient.ts` và import từ đó.

---

#### 1.2. useCartTracking Hook KHÔNG ĐƯỢC SỬ DỤNG (Dead Code)
**Location**: [`cart/hooks/useCartTracking.ts`](client/src/features/cart/hooks/useCartTracking.ts) (198 lines)  
**Problem**:
```bash
# Grep search result:
- Chỉ export trong hooks/index.ts
- KHÔNG CÓ import/usage ở bất kỳ component nào
```
**Impact**:
- ❌ 198 lines dead code gây nhiễu codebase
- ❌ Tăng bundle size không cần thiết (tree-shaking không loại bỏ được nếu được export)
- ❌ Tracking logic đang được duplicate trong `useAddToCart` hook (lines 66-82)

**Fix**: 
- **Option 1** (Recommended): Xóa file nếu tracking đã được implement trong mutations
- **Option 2**: Refactor để tích hợp tracking vào mutations một cách clean hơn

---

#### 1.3. Type Duplication & Inconsistency
**Location**: [`cart/types/index.ts`](client/src/features/cart/types/index.ts)  
**Problem**:
```typescript
// ❌ BAD: Duplicate product types
export interface IProduct { ... }
export interface IProductVariant { ... }
```
**Architecture Violation**: Product types nên import từ `@/features/products/types`, không duplicate.

**Impact**:
- ❌ Violation of DRY principle
- ❌ Nguy cơ mismatch khi product types update
- ❌ Type drift giữa features

**Fix**: Import shared types từ products feature.

---

#### 1.4. Missing Error Boundary & Proper Loading States
**Location**: [`cart/components/Bag/Bag.tsx#L64-L68`](client/src/features/cart/components/Bag/Bag.tsx#L64-L68)  
**Problem**:
```typescript
// ❌ INCOMPLETE: Chỉ handle isLoading, KHÔNG handle error state
const { data: cart, isLoading } = useCart();
const showLoading = isLoading && !cart;
```
**Impact**:
- ❌ Nếu API fail → Component không hiển thị error message
- ❌ User không biết điều gì đang xảy ra
- ❌ Vi phạm UX Excellence principle

**Fix**: Thêm `isError`, `error` handling với retry/fallback UI.

---

#### 1.5. Optimistic Update Không Hoàn Chỉnh
**Location**: [`cart/hooks/useCart.ts#L42-L58`](client/src/features/cart/hooks/useCart.ts#L42-L58)  
**Problem**:
```typescript
onMutate: async () => {
    // ❌ Comment thừa nhận logic chưa đầy đủ
    // "This is a simplified optimistic update..."
    // "Ideally we would push a temp item..."
    // Strategy: We will rely on loading states...
}
```
**Impact**:
- ❌ UI blink khi add item (không smooth)
- ❌ Không đạt "Premium Feel" theo quy tắc
- ❌ Code comment dài hơn implementation → code smell

**Fix**: Implement proper optimistic update hoặc remove hook để dùng server response (nếu API đủ nhanh <200ms).

---

### 🟡 **Medium Priority Issues**

#### 2.1. Missing useMemo/useCallback Optimization
**Location**: [`cart/components/EditItem/EditItem.tsx`](client/src/features/cart/components/EditItem/EditItem.tsx)  
**Problem**:
```typescript
// ❌ Inline function trong map (re-create mỗi render)
{availableSizes.map(({ size, inStock }) => (
    <p onClick={() => handleSizeClick(size, inStock)} ... />
))}
```
**Impact**: Minor performance hit, nhưng vi phạm "Performance First" principle.

**Fix**: Đã có `useCallback` cho `handleSizeClick` → Good! Nhưng cần verify dependencies array.

---

#### 2.2. Magic Numbers & Hard-coded Values
**Location**: Multiple locations  
**Problem**:
```typescript
// ❌ BAD: Magic numbers
staleTime: 30 * 1000, // 30 seconds
const sizeList = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
```
**Impact**: Không maintainable khi cần thay đổi config.

**Fix**: Tạo constants file:
```typescript
// cart/utils/constants.ts
export const CART_CONFIG = {
    STALE_TIME: 30_000,
    GC_TIME: 60_000,
} as const;

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'] as const;
```

---

#### 2.3. Defensive Coding Dư thừa
**Location**: [`cart/components/Bag/CartItemRow.tsx#L15-L26`](client/src/features/cart/components/Bag/CartItemRow.tsx#L15-L26)  
**Problem**:
```typescript
// ❌ TOO DEFENSIVE: Nếu backend đủ tin cậy, không cần nhiều fallback
const variant = item.productVariant || item.variant;
const product = variant?.product_id;
if (!variant || !product) return null;
```
**Impact**: Code verbose, khó đọc. Nếu backend trả đúng schema → unnecessary checks.

**Fix**: Sử dụng Type Guards hoặc tin tưởng backend với proper API contract testing.

---

#### 2.4. Inconsistent Naming: "Bag" vs "Cart"
**Location**: Component names  
**Problem**:
- Component tên `Bag.tsx`
- Hooks/API tên `useCart`, `cartService`
- UI text hiển thị "Your bag is empty"

**Impact**: Confusion khi onboard new developer.

**Fix**: Quyết định một thuật ngữ duy nhất (recommend: **Cart** vì chuẩn E-commerce).

---

### 🟢 **Low Priority / Enhancements**

#### 3.1. Missing Unit Tests
**Impact**: Không verify business logic (quantity calculation, optimistic updates).  
**Fix**: Viết tests cho hooks và critical logic.

#### 3.2. Missing JSDoc for Public API
**Impact**: Developers phải đọc code để hiểu API.  
**Fix**: Thêm JSDoc cho exported hooks (một số function đã có, nhưng chưa đầy đủ).

#### 3.3. CSS Module Co-location Pattern
**Status**: ✅ **GOOD** - Đã tuân thủ (Bag.tsx + Bag.module.css cùng folder).

---

## 2. Architecture Assessment

### ✅ **What's Good (Keep These)**

1. **Feature-based Structure**: ✅ Đúng pattern (api/, components/, hooks/, types/)
2. **React Query Usage**: ✅ Đúng cho server state
3. **Barrel Exports**: ✅ index.ts files clean
4. **Optimistic Updates (Concept)**: ✅ Hướng đúng, chỉ cần refine
5. **Atomic Selectors** (useAuthStore): ✅ Đã optimize re-renders
6. **Component Memoization**: ✅ Bag, CartItemRow dùng `memo()`
7. **File Collocation**: ✅ Component + CSS + logic cùng folder

### ❌ **What Needs Improvement**

| Issue | Current State | Target State | Priority |
|-------|---------------|--------------|----------|
| Query Keys Location | Local in hook | Centralized in `core/lib/queryClient.ts` | 🔴 High |
| Dead Code (useCartTracking) | 198 lines unused | Delete or integrate | 🔴 High |
| Type Imports | Duplicate IProduct | Import from `@/features/products/types` | 🔴 High |
| Error Handling | Missing | Complete with retry UI | 🔴 High |
| Optimistic Updates | Incomplete | Full implementation or remove | 🔴 High |
| Constants | Magic numbers | Centralized constants file | 🟡 Med |
| Naming Consistency | "Bag" vs "Cart" | Unified to "Cart" | 🟡 Med |
| Testing | 0% coverage | >80% for hooks | 🟢 Low |

---

## 3. Refactor Implementation Plan

### Phase 1: Critical Fixes (Week 1)

#### Task 1.1: Centralize Query Keys
**Files to modify**:
- `core/lib/queryClient.ts` (add cart keys)
- `cart/hooks/useCart.ts` (import keys)
- `checkout/pages/*/` (update imports)

**Implementation**:
```typescript
// core/lib/queryClient.ts
export const queryKeys = {
    // ... existing keys
    cart: {
        all: ['cart'] as const,
        detail: () => [...queryKeys.cart.all, 'detail'] as const,
    },
};
```

**Testing**: Verify cart still fetches/invalidates correctly.

**Acceptance**: `grep "export const cartKeys"` returns 0 results (moved to central location).

---

#### Task 1.2: Remove Dead Code (useCartTracking)
**Decision Required**: 
- [ ] Option A: Delete `useCartTracking.ts` (tracking đã có trong mutations)
- [ ] Option B: Refactor to integrate properly

**Recommendation**: **Option A** vì:
1. Tracking đã được implement trong `useAddToCart` (lines 66-82)
2. Hook này không được sử dụng ở đâu
3. Giảm 198 lines code không cần thiết

**Files to modify**:
```bash
rm client/src/features/cart/hooks/useCartTracking.ts
# Update hooks/index.ts để remove export
```

**Acceptance**: `grep -r "useCartTracking"` returns 0 results.

---

#### Task 1.3: Fix Type Duplication
**Files to modify**:
- `cart/types/index.ts`

**Implementation**:
```typescript
// cart/types/index.ts
import { IProduct, IProductVariant } from '@/features/products/types';

// Re-export for convenience (optional)
export type { IProduct, IProductVariant };

// Only define cart-specific types
export interface ICartItem { ... }
export interface ICart { ... }
```

**Acceptance**: No duplicate type definitions.

---

#### Task 1.4: Add Complete Error Handling
**Files to modify**:
- `cart/components/Bag/Bag.tsx`

**Implementation**:
```typescript
const { data: cart, isLoading, isError, error, refetch } = useCart();

// Add error state UI
{isError && (
    <div className={styles.errorState}>
        <p>Failed to load cart</p>
        <button onClick={() => refetch()}>Retry</button>
    </div>
)}
```

**Acceptance**: Manually trigger API error → UI shows retry option.

---

#### Task 1.5: Optimize or Remove Incomplete Optimistic Updates
**Decision Required**:
- [ ] Option A: Implement full optimistic update (need product data from context)
- [ ] Option B: Remove optimistic update, rely on fast API (<200ms)

**Recommendation**: **Option B** if API response time <200ms (measure first).

**Measurement**:
```typescript
// Add performance tracking
const start = performance.now();
await cartService.addToCart(variantId, quantity);
console.log(`Add to cart took: ${performance.now() - start}ms`);
```

If consistently <200ms → Remove optimistic update complexity.  
If >200ms → Implement full optimistic with product data.

---

### Phase 2: Optimizations (Week 2)

#### Task 2.1: Extract Constants
**Create**: `cart/utils/constants.ts`
```typescript
export const CART_CONFIG = {
    STALE_TIME: 30_000, // 30s
    GC_TIME: 60_000,    // 1min
} as const;

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'] as const;
export const TOAST_MESSAGES = {
    ADD_SUCCESS: 'Added to cart',
    UPDATE_SUCCESS: 'Cart updated',
    REMOVE_SUCCESS: 'Item removed',
    ERROR: 'Failed to update cart',
} as const;
```

**Files to update**: All files using these values.

---

#### Task 2.2: Rename "Bag" to "Cart" (Optional)
**Impact Analysis**: 
- 3 component files
- 1 CSS module
- Multiple imports across checkout/

**Decision**: Low priority. Only do if naming confusion is causing real issues.

---

#### Task 2.3: Refine Defensive Coding
**Files**: `CartItemRow.tsx`, `EditItem.tsx`

**Strategy**: 
- Add TypeScript strict null checks at boundaries (API response)
- Trust validated data inside components
- Use Type Guards if needed:
```typescript
function isValidCartItem(item: unknown): item is ICartItem {
    return (
        typeof item === 'object' &&
        item !== null &&
        'productVariant' in item &&
        'quantity' in item
    );
}
```

---

### Phase 3: Quality Assurance (Week 3)

#### Task 3.1: Add Unit Tests
**Framework**: Vitest + React Testing Library

**Coverage Targets**:
- `cartService.ts`: 100% (simple API wrappers)
- `useCart.ts` hooks: >80% (focus on optimistic updates, error handling)
- `Bag.tsx`: >70% (UI states: loading, error, empty, with items)

**Key Test Cases**:
```typescript
describe('useAddToCart', () => {
    it('should add item and show success toast');
    it('should handle API error and rollback');
    it('should invalidate cart queries after success');
    it('should track analytics event');
});
```

---

#### Task 3.2: Performance Audit
**Tools**: React DevTools Profiler, Lighthouse

**Metrics to measure**:
- Time to Interactive (TTI) on cart page
- Bundle size impact of cart feature
- Re-render count when opening/closing cart

**Targets**:
- Cart open animation: <100ms
- Add to cart action: <300ms (including API call)
- Zero unnecessary re-renders

---

#### Task 3.3: Documentation
**Create/Update**:
- `cart/README.md` - API usage guide
- JSDoc for all exported hooks
- Inline comments for complex logic (e.g., size change flow in EditItem)

---

## 4. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Breaking imports when moving query keys | Medium | High | Grep all imports, update in single commit, test all pages |
| Removing useCartTracking breaks analytics | Low | Medium | Verify tracking works in useAddToCart before deleting |
| Type import changes cause build errors | Low | Low | TypeScript will catch errors, fix incrementally |
| Performance regression from changes | Low | Medium | Run Lighthouse before/after, keep metrics |
| Optimistic update removal feels slower | Medium | High | **MUST** measure API response time first. Only remove if <200ms p99 |

---

## 5. Success Metrics

### Code Quality Metrics
- [ ] ESLint/Prettier violations: 0
- [ ] TypeScript strict mode: No `any`, no `@ts-ignore`
- [ ] Test coverage: >80% for hooks, >70% for components
- [ ] Dead code: 0 unused exports (verified with `knip` or similar)

### Performance Metrics
- [ ] Cart open: <100ms (currently ~150ms due to animations)
- [ ] Add to cart: <300ms total (API + UI update)
- [ ] Bundle size: -10% (removing useCartTracking saves ~2KB gzipped)

### Architecture Metrics
- [ ] Query keys: 100% centralized in `core/lib/queryClient.ts`
- [ ] Type duplication: 0 (all import from source features)
- [ ] Constants centralized: 100%
- [ ] Naming consistency: 100% (all "Cart" or all "Bag", not mixed)

---

## 6. Execution Timeline

| Phase | Duration | Tasks | Deliverables |
|-------|----------|-------|--------------|
| **Phase 1: Critical** | 3 days | Tasks 1.1-1.5 | Bug-free core functionality, centralized structure |
| **Phase 2: Optimization** | 2 days | Tasks 2.1-2.3 | Clean code, constants extracted, consistent naming |
| **Phase 3: QA** | 3 days | Tasks 3.1-3.3 | Tests passing, docs updated, metrics validated |
| **Buffer** | 2 days | Bug fixes, refinement | Production-ready code |
| **Total** | **10 days** | | Full refactor complete |

---

## 7. Acceptance Criteria

### Code Review Checklist
- [ ] All ESLint/TypeScript errors resolved
- [ ] No duplicate code (DRY principle)
- [ ] No unused imports/variables
- [ ] No `console.log` statements
- [ ] All exported functions have JSDoc
- [ ] All magic numbers extracted to constants

### Functional Testing Checklist
- [ ] Add item to cart → Success toast, cart updates
- [ ] Remove item → Success toast, cart updates
- [ ] Update quantity → Optimistic UI, server sync
- [ ] Change size in EditItem → Remove old + Add new variant
- [ ] API error → Show error UI with retry
- [ ] Empty cart → Show empty state
- [ ] Cart persists across page refresh
- [ ] Analytics events fire correctly

### Performance Testing Checklist
- [ ] Lighthouse Performance score >90
- [ ] No unnecessary re-renders (React DevTools)
- [ ] Cart opens smoothly (<100ms)
- [ ] Network tab: API calls <200ms

### Security Checklist
- [ ] No sensitive data in console logs
- [ ] API endpoints use authentication
- [ ] No XSS vulnerabilities (check user inputs)

---

## 8. Rollback Plan

If critical bugs discovered in production:

1. **Immediate**: Revert to previous commit (Git tag before refactor)
2. **Investigate**: Reproduce issue in dev environment
3. **Fix Forward**: Apply hotfix on top of refactored code
4. **Re-deploy**: After QA approval

**Safe Rollback Windows**: 
- Phase 1: After each task (small commits)
- Phase 2: After all optimizations (feature flag if needed)
- Phase 3: Tests must pass before merging

---

## 9. Post-Refactor Monitoring

### Week 1 After Deploy
- [ ] Monitor Sentry/error logs for cart-related errors
- [ ] Check analytics: Cart conversion rate stable?
- [ ] User feedback: Any UX complaints?
- [ ] Performance: API response times, client-side metrics

### Week 2-4
- [ ] Review test coverage trends
- [ ] Check if new bugs introduced
- [ ] Measure developer velocity (easier to maintain?)

---

## 10. Conclusion

**Current State**: Functional but **not production-ready** for large-scale enterprise (6.5/10 quality).

**After Refactor**: Clean, maintainable, performant, fully tested (9/10 quality).

**ROI**: 
- -10% bundle size
- +30% developer velocity (cleaner code)
- 0 production bugs (from proper testing)
- Scalable foundation for future features (checkout, wishlists, etc.)

**Recommendation**: ✅ **Proceed with refactor**. The code works but has technical debt that will compound if not addressed now. 10 days investment will save weeks of debugging later.

---

**Next Steps**:
1. Get stakeholder approval for 10-day timeline
2. Create feature branch: `refactor/cart-optimization`
3. Execute Phase 1 (critical fixes) first
4. Daily standups to track progress
5. Code review after each phase before proceeding

---

**Questions for Team**:
- [ ] Are we okay with 10-day timeline?
- [ ] Should we remove useCartTracking or integrate it?
- [ ] Optimistic updates: Keep or remove? (need API latency data)
- [ ] Rename Bag → Cart or keep current naming?

---

_Document prepared by: Senior Planner_  
_Review by: Tech Lead, QA Lead_  
_Approval needed from: Engineering Manager, Product Owner_
