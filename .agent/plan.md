# Feature Refactor Plan: Home Feature Module

**Date Created:** 2026-02-01  
**Status:** 🔴 Pending  
**Priority:** High  
**Estimated Effort:** 2-3 days

---

## Executive Summary

Sau khi kiểm tra toàn bộ code trong folder `/client/src/features/home`, phát hiện **nhiều vi phạm nghiêm trọng** về cấu trúc Feature-Based Architecture, State Management Strategy và Best Practices doanh nghiệp. Code hiện tại có technical debt cao, không tuân thủ quy tắc tách biệt concerns và có nhiều vấn đề về performance.

---

## Phân tích Hiện trạng (Code Audit)

### ✅ Điểm Tốt (Strengths)
1. **Component Structure**: Đã tách components thành các phần riêng biệt (Hero, Introduction, NewArrivals, etc.)
2. **CSS Modules**: Sử dụng CSS Modules đúng cách để tránh conflicts
3. **TypeScript Types**: Đã có file types riêng (`types/index.ts`)
4. **Memoization**: Sử dụng `memo()` cho một số components (HomePage, Hero, etc.)
5. **Loading States**: Có xử lý loading states trong NewArrivals và Scarves
6. **Animation Quality**: GSAP animations implementation tốt với SplitText và ScrollTrigger

### ❌ Vấn đề Nghiêm trọng (Critical Issues)

#### 1. **VI PHẠM Feature-Based Architecture** ⚠️ CRITICAL
**Vấn đề:**
- **Thiếu hoàn toàn `hooks/` folder**: Không có custom hooks để tách logic khỏi components
- **Thiếu `api/` folder**: Không có API layer riêng cho home feature
- Mọi logic query nằm trực tiếp trong components

**Impact:**
- Code không reusable
- Khó test và maintain
- Vi phạm Single Responsibility Principle

**Evidence:**
```tsx
// ❌ NewArrivals.tsx - Query trực tiếp trong component
const { data: variantsData, isLoading } = useLatestVariants(4);

// ❌ Scarves.tsx - Logic nghiệp vụ phức tạp trong component
const { scarvesCategory, allCategoryIds } = useMemo(() => {
  // ... 40+ lines logic tìm category và subcategories
}, [categoriesResponse]);
```

**Expected Structure:**
```
home/
├── api/           # API calls (THIẾU)
├── hooks/         # Custom hooks (THIẾU)
├── components/
├── pages/
└── types/
```

---

#### 2. **VI PHẠM State Management Strategy** ⚠️ CRITICAL

**Vấn đề:**
- Dùng hooks từ feature khác (`useLatestVariants`, `useCategories`) trực tiếp
- Không có layer abstraction cho home-specific data fetching
- Cross-feature dependencies không kiểm soát

**Vi phạm Rule:**
> "Mỗi feature phải self-contained. API calls và hooks phải nằm trong `features/*/api` và `features/*/hooks`"

**Evidence:**
```tsx
// ❌ NewArrivals.tsx
import { useLatestVariants } from '@/features/products/hooks/useProducts';

// ❌ Scarves.tsx
import { useCategories } from '@/features/products/hooks/useCategories.js';
import { useQuery } from '@tanstack/react-query';
```

**Correct Approach:**
- Tạo `home/hooks/useHomeData.ts` để wrap và customize queries
- Tạo `home/api/homeService.ts` nếu cần logic riêng

---

#### 3. **Performance Issues** ⚠️ HIGH

**3.1. Không Lazy Load Components**
```tsx
// ❌ HomePage.tsx - Load tất cả components ngay lập tức
import Hero from '@/features/home/components/Hero/Hero';
import Introduction from '@/features/home/components/Introduction/Introduction';
import NewArrivals from '@/features/home/components/NewArrivals/NewArrivals';
// ... 7 components load cùng lúc
```

**Expected:** Lazy load các components dưới fold:
```tsx
const NewArrivals = lazy(() => import('@/features/home/components/NewArrivals/NewArrivals'));
const CategoryBox = lazy(() => import('@/features/home/components/CategoryBox/CategoryBox'));
```

**3.2. Không Optimize Images**
```tsx
// ❌ CategoryBox.tsx - Hard-coded image paths, no optimization
<div style={{ backgroundImage: `url('/images/category2.webp')` }}>

// ❌ Introduction.tsx - Không có lazy loading cho images
<img src="images/introCard1.webp" alt="Intro card 1" />
```

**Expected:**
- Sử dụng `loading="lazy"` cho images below fold
- Cloudinary URLs với `f_auto,q_auto` nếu dùng CDN

**3.3. Heavy GSAP Animations Blocking Render**
```tsx
// ❌ Hero.tsx - Animation chạy ngay khi mount
useEffect(() => {
  document.fonts.ready.then(() => {
    // Heavy SplitText operations
  });
}, [shouldAnimate]);
```

**Risk:** Block main thread, ảnh hưởng First Contentful Paint (FCP)

---

#### 4. **Code Quality Issues** ⚠️ MEDIUM

**4.1. Thiếu Error Handling**
```tsx
// ❌ Scarves.tsx - No error state handling
const { data: allVariants, isLoading } = useQuery({
  queryFn: async () => { /* ... */ },
  enabled: !!scarvesCategory?._id,
});
// Không xử lý isError
```

**4.2. Inconsistent Naming**
```tsx
// ❌ Mix .tsx và .jsx imports
import ProductCarousel from '@/features/products/components/ProductCarousel/ProductCarousel.jsx';
import { useCategories } from '@/features/products/hooks/useCategories.js';
```

**4.3. Hardcoded Data**
```tsx
// ❌ CategoryBox.tsx - Hardcoded content
<h2 className={styles.title}>New In Jackets</h2>
<p className={styles.description}>Discover timeless...</p>
```

**Expected:** Data-driven từ CMS hoặc config file

**4.4. Không có PropTypes/Interface cho Components**
```tsx
// ❌ SmallTreasures.tsx - Không có props interface
const SmallTreasures = () => { /* ... */ }
```

**4.5. Component quá lớn**
- `Hero.tsx`: 170 lines (quá nhiều logic animation)
- `CategoryBox.tsx`: 153 lines (nên tách thành sub-components)
- `OurPartners.tsx`: 187 lines (quá phức tạp)

---

#### 5. **Accessibility Issues** ⚠️ MEDIUM

**5.1. Missing Alt Text**
```tsx
// ❌ CategoryBox.tsx
<video className={styles.videoBackground} autoPlay loop muted playsInline>
  {/* Không có <track> cho captions */}
</video>
```

**5.2. Non-Semantic HTML**
```tsx
// ❌ SmallTreasures.tsx
<button className="button--surtur">
  {/* Button không có accessible label */}
</button>
```

**5.3. Links không rõ destination**
```tsx
// ❌ Multiple components
<a className={styles.link} href="#">Shop Now</a>
```

---

#### 6. **TypeScript Issues** ⚠️ MEDIUM

**6.1. Type Casting Unsafe**
```tsx
// ❌ Scarves.tsx
const getVariantsByCategoryWithChildren = productService.getVariantsByCategoryWithChildren as (
  categoryId: string,
  categories: CategoryData[]
) => Promise<unknown[]>;
```

**6.2. Inline Type Definitions**
```tsx
// ❌ Scarves.tsx - Type nên nằm trong types/index.ts
interface VariantItem {
  _id: string;
  productInfo?: { name: string };
  // ...
}
```

---

## Refactor Plan (Roadmap)

### Phase 1: Architecture Restructure (Day 1) 🏗️

**Goal:** Tuân thủ Feature-Based Architecture đúng chuẩn

#### Task 1.1: Tạo API Layer
- [ ] Tạo `home/api/homeService.ts`
  - Export `getLatestProducts()` (wrap `useLatestVariants`)
  - Export `getScarvesCollection()` (consolidate Scarves logic)
  - Export `getHomeCategories()` nếu cần filter riêng

#### Task 1.2: Tạo Custom Hooks
- [ ] `home/hooks/useHomeProducts.ts`
  - `useNewArrivals(limit: number)` - Wrap React Query cho NewArrivals
  - `useScarves()` - Consolidate toàn bộ logic từ Scarves.tsx
- [ ] `home/hooks/useHomeAnimations.ts`
  - `useHeroAnimation()` - Tách animation logic từ Hero
  - `useScrollAnimations()` - Shared scroll animations

#### Task 1.3: Refactor Components
**NewArrivals.tsx:**
```tsx
// BEFORE (❌ 150 lines)
const NewArrivals = () => {
  const { data: variantsData, isLoading } = useLatestVariants(4);
  const products = useMemo(() => { /* transform logic */ }, [variantsData]);
  // ... animation logic ...
}

// AFTER (✅ ~50 lines)
const NewArrivals = () => {
  const { products, isLoading, isError } = useNewArrivals(4);
  
  if (isLoading) return <Loading />;
  if (isError) return <ErrorState />;
  
  return <ProductList products={products} />;
}
```

**Scarves.tsx:**
```tsx
// BEFORE (❌ 122 lines với logic phức tạp)
const Scarves = () => {
  const { data: categoriesResponse } = useCategories();
  const { scarvesCategory, allCategoryIds } = useMemo(() => {
    // 40+ lines logic
  }, [categoriesResponse]);
  // ...
}

// AFTER (✅ ~30 lines)
const Scarves = () => {
  const { products, isLoading, error } = useScarves();
  
  return (
    <ProductCarousel
      title="Scarves Collection"
      products={products}
      isLoading={isLoading}
    />
  );
}
```

---

### Phase 2: Performance Optimization (Day 1-2) ⚡

#### Task 2.1: Implement Lazy Loading
**HomePage.tsx:**
```tsx
// ✅ Lazy load components below the fold
const Hero = lazy(() => import('./components/Hero/Hero'));
const Introduction = lazy(() => import('./components/Introduction/Introduction'));
const NewArrivals = lazy(() => import('./components/NewArrivals/NewArrivals'));
const SmallTreasures = lazy(() => import('./components/SmallTreasures/SmallTreasures'));
const CategoryBox = lazy(() => import('./components/CategoryBox/CategoryBox'));
const Scarves = lazy(() => import('./components/Scarves/Scarves'));
const OurPartners = lazy(() => import('./components/OurPartners/OurPartners'));

const HomePage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Hero /> {/* Above fold - no lazy */}
      <Introduction />
      <Suspense fallback={<SkeletonCard />}>
        <NewArrivals />
      </Suspense>
      <SmallTreasures />
      <CategoryBox />
      <Scarves />
      <OurPartners />
    </Suspense>
  );
};
```

#### Task 2.2: Optimize Images
- [ ] Add `loading="lazy"` cho tất cả images below fold
- [ ] Implement responsive images với `srcset` nếu cần
- [ ] CategoryBox: Convert background-image thành `<img>` với lazy loading

#### Task 2.3: Optimize Animations
**Hero.tsx:**
- [ ] Defer GSAP imports: `const gsap = lazy(() => import('gsap'))`
- [ ] Sử dụng `requestIdleCallback` cho non-critical animations
- [ ] Add `will-change` CSS hint cho animated elements

#### Task 2.4: Code Splitting
- [ ] Extract GSAP utilities thành separate chunk
- [ ] Bundle analyze để kiểm tra chunk sizes

---

### Phase 3: Code Quality Improvements (Day 2) 🧹

#### Task 3.1: Add Error Boundaries
```tsx
// ✅ home/components/ErrorBoundary/HomeErrorBoundary.tsx
export const HomeErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary fallback={<HomeErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
};
```

#### Task 3.2: Refactor Large Components
**CategoryBox.tsx → Split into:**
- `CategoryBox/CategoryBox.tsx` (container)
- `CategoryBox/CategoryItem.tsx` (reusable item)
- `CategoryBox/ProductSlider.tsx` (slider logic)

**OurPartners.tsx → Split into:**
- `OurPartners/OurPartners.tsx` (container)
- `OurPartners/PartnerLogo.tsx` (single logo)
- `OurPartners/PartnerTitle.tsx` (title with scramble effect)

#### Task 3.3: Add PropTypes/Interfaces
```tsx
// ✅ components/Hero/Hero.types.ts
export interface HeroProps {
  videoUrl?: string;
  title?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

// ✅ Hero.tsx
const Hero = memo<HeroProps>(({ videoUrl, title, ctaText }) => { /* ... */ });
```

#### Task 3.4: Error Handling
```tsx
// ✅ hooks/useNewArrivals.ts
export const useNewArrivals = (limit: number) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['home', 'new-arrivals', limit],
    queryFn: () => homeService.getLatestProducts(limit),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    onError: (err) => {
      console.error('[useNewArrivals] Error:', err);
      // Send to error tracking (Sentry)
    }
  });

  return { products: data || [], isLoading, isError, error };
};
```

---

### Phase 4: Configuration & Data Management (Day 2-3) 📝

#### Task 4.1: Extract Hardcoded Data
**CategoryBox.tsx:**
```tsx
// ✅ home/config/categoryBoxData.ts
export const categoryBoxItems = [
  {
    id: 1,
    type: 'video',
    src: '/videos/TheGiftGuide.webm',
    title: 'New In Jackets',
    description: 'Discover timeless craftsmanship...',
    ctaText: 'Shop Now',
    ctaLink: '/products?category=jackets'
  },
  // ...
];

// ✅ CategoryBox.tsx
import { categoryBoxItems } from '../../config/categoryBoxData';

const CategoryBox = () => {
  return (
    <>
      {categoryBoxItems.map(item => (
        <CategoryItem key={item.id} {...item} />
      ))}
    </>
  );
};
```

#### Task 4.2: Environment Configuration
```tsx
// ✅ home/config/homeConfig.ts
export const HOME_CONFIG = {
  newArrivals: {
    limit: 4,
    staleTime: 5 * 60 * 1000,
  },
  scarves: {
    maxDisplay: 12,
    carouselSpeed: 500,
  },
  animations: {
    enabled: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    heroDelay: 500,
  }
};
```

---

### Phase 5: Accessibility & SEO (Day 3) ♿

#### Task 5.1: Add ARIA Labels
```tsx
// ✅ SmallTreasures.tsx
<button 
  className="button--surtur"
  aria-label="Explore small treasures collection"
>
  {/* SVG content */}
</button>

// ✅ CategoryBox.tsx
<video 
  aria-label="Showcasing new jackets collection"
  className={styles.videoBackground}
  autoPlay loop muted playsInline
>
  <track kind="captions" src="/captions/gift-guide.vtt" srclang="en" />
</video>
```

#### Task 5.2: Semantic HTML
```tsx
// ✅ HomePage.tsx
<main>
  <Hero />
  <section aria-labelledby="introduction-heading">
    <Introduction />
  </section>
  <section aria-labelledby="new-arrivals-heading">
    <NewArrivals />
  </section>
  {/* ... */}
</main>
```

#### Task 5.3: SEO Metadata
```tsx
// ✅ pages/HomePage/HomePage.tsx
import { Helmet } from 'react-helmet-async';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Devenir - Premium Men's Fashion</title>
        <meta name="description" content="Discover timeless luxury fashion..." />
        <meta property="og:image" content="/images/og-home.jpg" />
      </Helmet>
      {/* ... */}
    </>
  );
};
```

---

### Phase 6: Testing & Validation (Day 3) 🧪

#### Task 6.1: Unit Tests
```tsx
// ✅ hooks/__tests__/useNewArrivals.test.ts
describe('useNewArrivals', () => {
  it('should fetch latest products', async () => {
    const { result } = renderHook(() => useNewArrivals(4));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.products).toHaveLength(4);
  });
});
```

#### Task 6.2: Integration Tests
```tsx
// ✅ pages/__tests__/HomePage.test.tsx
describe('HomePage', () => {
  it('should render all sections', () => {
    render(<HomePage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByLabelText(/new arrivals/i)).toBeInTheDocument();
  });
});
```

#### Task 6.3: Performance Benchmarks
- [ ] Lighthouse CI: Target Score 90+ (Performance, Accessibility, Best Practices)
- [ ] Bundle size: Target < 200KB (gzipped) cho home chunks
- [ ] First Contentful Paint: < 1.5s
- [ ] Time to Interactive: < 3.5s

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Breaking animations** do refactor GSAP logic | Medium | High | Incremental refactor + Visual regression tests |
| **Performance regression** từ lazy loading overhead | Low | Medium | Measure với Lighthouse trước/sau; adjust strategy |
| **React Query cache invalidation** issues | Medium | Medium | Test kỹ cache keys; document invalidation rules |
| **Cross-feature dependencies** break khi tách hooks | High | High | Wrap thay vì duplicate code; maintain backward compatibility |
| **Timeline delay** do scope creep | Medium | Low | Strict adherence to phases; defer nice-to-haves |

---

## Acceptance Criteria

### Functional Requirements
- [ ] Tất cả features hiện tại hoạt động đúng sau refactor (zero regression)
- [ ] Animations mượt mà, không bị jank (60fps)
- [ ] Loading states hiển thị đúng cho tất cả data fetching
- [ ] Error states xử lý gracefully với fallback UI

### Architectural Requirements
- [ ] Cấu trúc Feature-Based đầy đủ: `api/`, `hooks/`, `components/`, `pages/`, `types/`, `config/`
- [ ] Không có component nào > 100 lines (exclude animations config)
- [ ] Tất cả data fetching phải thông qua custom hooks trong `home/hooks/`
- [ ] Zero direct imports từ `features/products/*` trong components (chỉ qua hooks)

### Performance Requirements
- [ ] Lighthouse Performance Score ≥ 90
- [ ] First Contentful Paint ≤ 1.5s
- [ ] Total Blocking Time ≤ 200ms
- [ ] Bundle size (home chunks) ≤ 200KB gzipped
- [ ] Images below fold phải lazy load (kiểm tra Network tab)

### Code Quality Requirements
- [ ] TypeScript strict mode compliance (zero `any`)
- [ ] ESLint: Zero errors, < 5 warnings
- [ ] Test coverage ≥ 80% cho hooks và utilities
- [ ] All components có PropTypes/Interface documentation
- [ ] Code reviewed bởi ≥ 2 senior devs

### Accessibility Requirements
- [ ] Lighthouse Accessibility Score ≥ 95
- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels cho tất cả dynamic content
- [ ] `prefers-reduced-motion` support cho animations

### Security Requirements
- [ ] No hardcoded sensitive data (API keys, tokens)
- [ ] All external links có `rel="noopener noreferrer"`
- [ ] Sanitize dynamic content nếu có user input

---

## Implementation Checklist

### Pre-Refactor
- [ ] Backup current code (git branch `backup/home-before-refactor`)
- [ ] Document current behavior (screenshots, videos animations)
- [ ] Run Lighthouse audit baseline (save report)
- [ ] Freeze feature development trong home module

### Phase 1: Architecture (Day 1 Morning)
- [ ] Create `home/api/homeService.ts`
- [ ] Create `home/hooks/useNewArrivals.ts`
- [ ] Create `home/hooks/useScarves.ts`
- [ ] Refactor NewArrivals.tsx để dùng custom hook
- [ ] Refactor Scarves.tsx để dùng custom hook
- [ ] Test data fetching (manual QA)

### Phase 2: Performance (Day 1 Afternoon - Day 2 Morning)
- [ ] Implement lazy loading trong HomePage.tsx
- [ ] Add `loading="lazy"` cho images
- [ ] Extract GSAP logic vào hooks
- [ ] Add Suspense boundaries với Skeleton loaders
- [ ] Bundle analysis (webpack-bundle-analyzer)
- [ ] Lighthouse audit #2

### Phase 3: Code Quality (Day 2 Afternoon)
- [ ] Split CategoryBox thành sub-components
- [ ] Split OurPartners thành sub-components
- [ ] Add PropTypes cho tất cả components
- [ ] Implement ErrorBoundary
- [ ] Add error handling cho tất cả queries
- [ ] ESLint fix

### Phase 4: Configuration (Day 2 Evening)
- [ ] Extract categoryBoxData.ts
- [ ] Extract homeConfig.ts
- [ ] Remove hardcoded strings
- [ ] Environment variable check

### Phase 5: Accessibility (Day 3 Morning)
- [ ] Add ARIA labels
- [ ] Semantic HTML review
- [ ] Keyboard navigation test
- [ ] Screen reader test (NVDA/VoiceOver)
- [ ] Lighthouse audit #3

### Phase 6: Testing & Launch (Day 3 Afternoon)
- [ ] Write unit tests cho hooks
- [ ] Write integration tests cho HomePage
- [ ] Manual QA (all features)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (iOS Safari, Chrome Android)
- [ ] Performance validation (Lighthouse ≥ 90)
- [ ] Code review
- [ ] Merge to develop
- [ ] Deploy to staging
- [ ] Final QA on staging
- [ ] Production deployment

---

## Rollback Plan

Nếu refactor gây critical bugs:
1. **Immediate:** Revert to branch `backup/home-before-refactor`
2. **Short-term:** Deploy hotfix cho specific bug nếu identified
3. **Long-term:** Re-plan refactor theo incremental approach (feature by feature)

---

## Success Metrics (Post-Launch)

Measure sau 7 ngày production:
- **Performance:** Avg Lighthouse score ≥ 90
- **Errors:** Zero unhandled exceptions in Sentry
- **User Experience:** Bounce rate không tăng (so với pre-refactor)
- **Developer Experience:** Velocity tăng 20% cho home feature tasks

---

## Appendix: Code Examples

### A. Custom Hook Pattern

```tsx
// ✅ home/hooks/useNewArrivals.ts
import { useQuery } from '@tanstack/react-query';
import { homeService } from '../api/homeService';
import type { NewArrivalProduct } from '../types';

export const useNewArrivals = (limit: number = 4) => {
  const { data, isLoading, isError, error } = useQuery<NewArrivalProduct[]>({
    queryKey: ['home', 'new-arrivals', limit],
    queryFn: () => homeService.getLatestProducts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  return {
    products: data || [],
    isLoading,
    isError,
    error
  };
};
```

### B. API Service Pattern

```tsx
// ✅ home/api/homeService.ts
import { productService } from '@/features/products/api/productService';
import type { NewArrivalProduct } from '../types';

class HomeService {
  async getLatestProducts(limit: number): Promise<NewArrivalProduct[]> {
    const variants = await productService.getLatestVariants(limit);
    
    return variants.map(variant => ({
      id: variant._id,
      name: variant.productInfo?.name || 'Unknown Product',
      price: variant.price,
      image: variant.mainImage || '/images/placeholder.png',
      imageHover: variant.hoverImage || variant.mainImage,
      color: variant.color,
      size: variant.size,
      sku: variant.sku,
    }));
  }

  async getScarvesCollection() {
    // Consolidate logic từ Scarves.tsx
    const categories = await productService.getCategories();
    const scarvesCategory = categories.find(cat => 
      cat.name.toLowerCase() === 'scarves'
    );
    
    if (!scarvesCategory) return [];
    
    const variants = await productService.getVariantsByCategory(scarvesCategory._id);
    return variants.slice(0, 12);
  }
}

export const homeService = new HomeService();
```

### C. Component Refactor Example

```tsx
// ❌ BEFORE: NewArrivals.tsx (150 lines)
const NewArrivals = () => {
  const { data: variantsData, isLoading } = useLatestVariants(4);
  const products = useMemo(() => {
    // Transform logic...
  }, [variantsData]);
  
  useGSAP(() => {
    // 50+ lines animation logic
  });
  
  return (/* JSX */);
};

// ✅ AFTER: NewArrivals.tsx (~40 lines)
const NewArrivals = () => {
  const { products, isLoading, isError } = useNewArrivals(4);
  useScrollAnimation('.titleSection', { delay: 0.5 });
  
  if (isLoading) return <NewArrivalsSkeletonLoader />;
  if (isError) return <ErrorState message="Failed to load new arrivals" />;
  if (!products.length) return null;
  
  return (
    <section className={styles.newArrivals} aria-labelledby="new-arrivals-title">
      <TitleSection 
        title="New Arrivals, new journeys"
        viewAllLink="/products?filter=new"
      />
      <ProductGrid products={products} />
    </section>
  );
};
```

---

## Notes for Developers

1. **Incremental Migration:** Refactor một component một lần, test kỹ trước khi move sang component khác
2. **Animation Preservation:** Đảm bảo record videos của animations trước khi refactor để compare
3. **Cache Keys:** Document tất cả React Query cache keys trong `home/api/cacheKeys.ts`
4. **Communication:** Update team daily về progress và blockers

---

**Plan Approved By:** _[Pending Review]_  
**Implementation Start:** _[TBD]_  
**Target Completion:** _[TBD]_
