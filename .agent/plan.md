## Feature Plan: All Categories Page Optimization

### Requirement Summary
- **Visual Excellence:** The "All Categories" page serves as a high-level visual navigation menu. It must be polished and glitch-free.
- **Current Issues:**
    - Manual `useQuery` usage instead of standardized hooks.
    - Missing `useImagePreloader`, causing potential image pop-ins.
    - Type safety issues (`any`).
- **Goal:** Refactor to use clean architecture and implement visual-first loading.

### Architecture Design

#### 1. Data Fetching
- **Current:** Manual `useQuery` + `getMainCategories`.
- **Target:** Use standard `useMainCategories` hook from `features/products/hooks/useCategories.ts`.

#### 2. Visual-First Loading
- **Strategy:** Block the main loader until ALL category background images are preloaded. Since there are usually few main categories (4-8), preloading all of them is acceptable and provides a premium "instant" feel.

### Implementation Steps (for Dev)

1.  **Refactor Data Access**:
    - Replace manual query with `useMainCategories()`.
    - Properly type the data with `ICategory`.

2.  **Implement Preloader**:
    - Import `useImagePreloader`.
    - Extract `thumbnailUrl` from all categories.
    - Pass to preloader.
    - Update `PageWrapper.isLoading` to wait for both `!isLoading` AND `areImagesLoaded`.

3.  **UI Cleanup**:
    - Ensure gradient fallback is clean.
    - Verify `Header`/`Footer` usage (Standardize if needed, though likely fine as page-level).

### Test Strategy (for QA)
- **Visual:**
    - Load page -> Expect Full Screen Loader -> Content appears instantly with images fully visible.
    - No "pop-in" of background images.
- **Functional:**
    - Click any category -> Navigates to correct `/products?category=ID`.

### Acceptance Criteria
- [x] Code uses `useMainCategories` hook.
- [x] No `any` types for category data.
- [x] Images are preloaded before content display.
