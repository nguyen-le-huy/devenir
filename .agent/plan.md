## Feature Plan: Checkout Page Optimization

### Requirement Summary
- **Visual Excellence:** The Checkout page is the final step before conversion. It must be trustworthy, fast, and visually stable.
- **Current Issues:**
    - Images (payment icons, instructional images) are hardcoded and might cause layout shifts.
    - No image preloading strategy.
    - Inline SVG for Coinbase is bulky and cluttering the component.
- **Goal:** Refactor for clean code and implement visual-first loading.

### Architecture Design

#### 1. Visual-First Loading
- **Strategy:** Block main loader until critical checkout assets are loaded:
    - Product thumbnails in cart.
    - Trust badges (Payment icons, Instruction images).
- **Implementation:** Use `useImagePreloader`.

#### 2. Component Extraction
- **Coinbase Button:** Extract the complex SVG to `shared/components/icons/CoinbaseIcon.tsx`.
- **Checkout Summary:** Consider extracting the Right Column if it grows too complex, but for now, cleaning up the icon is priority.

### Implementation Steps (for Dev)

1.  **Extract Components**:
    - Create `CoinbaseIcon` component.
    
2.  **Implement Preloader**:
    - Import `useImagePreloader`.
    - Collect images to preload:
        - Product images from `cart.items`.
        - Static assets: `/images/instruction1.webp`, `/images/instruction2.webp`, payment icons.
    - Update `PageWrapper.isLoading`.

3.  **Code Cleanup**:
    - Replace inline SVG with `<CoinbaseIcon />`.
    - Ensure `cart.items` mapping is safe.

### Test Strategy (for QA)
- **Visual:**
    - Add item to cart -> Go to Checkout.
    - **Expectation:** Page loads with all product images and payment icons visible.
- **Functional:**
    - Remove item works.
    - Edit item works.
    - Checkout button navigates.

### Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Many items in cart = Slow Load** | Low | Medium | Only preload the first 3-4 product images if cart is huge. |

### Acceptance Criteria
- [x] Coinbase SVG extracted.
- [x] Critical images (products + trust badges) preloaded.
- [x] PageWrapper blocks until visual readiness.
