## Feature Plan: Home Feature Refactor & Optimization

### Requirement Summary
- **Current Status**: The `home` feature has a cluttered directory structure (all components in `pages`), strict type violations (`any`, `@ts-ignore`), and massive inline logic (GSAP helpers).
- **Goal**: Refactor the Home feature to meet Enterprise Standards, ensuring clean architecture, type safety, and better code organization.
- **Success Metrics**: 
    - No `any` types or `@ts-ignore` in the feature.
    - Components moved to `features/home/components`.
    - `horizontalLoop` extracted to `shared/utils`.
    - No logic regressions in animations.

### Architecture Design
- **Directory Restructuring**:
    - `client/src/features/home/pages/HomePage/*` -> `client/src/features/home/components/*` (Keep only `HomePage.tsx` in `pages/HomePage`).
- **Shared Utils**:
    - Extract `horizontalLoop` from `Introduction.tsx` to `client/src/shared/utils/gsapHelpers.ts`.
- **Types**:
    - Create `client/src/features/home/types/index.ts` or leverage existing types to stricter interfaces.

### Implementation Steps (for Dev)
1. **Refactor Directory**: 
    - Create `client/src/features/home/components/Hero`, `Introduction`, etc.
    - Move files and update imports in `HomePage.tsx`.
2. **Extract Logic**:
    - Move `horizontalLoop` to `client/src/shared/utils/gsapHelpers.ts`.
    - Move big inline SVGs to separate components (e.g., `HeroLogo.tsx`).
3. **Fix Types**:
    - Remove `@ts-ignore` in `NewArrivals.tsx`.
    - Define interfaces for `variantsData` and `product` mapping.
    - Replace `any` in `Hero.tsx` and `Introduction.tsx` with proper GSAP types or `HTMLElement`.
4. **Cleanup**:
    - Verify all imports are correct using aliases `@/...`.

### Test Strategy (for QA)
- **Unit**: Verify `HomePage` renders all sections without error.
- **Integration**: checks that `NewArrivals` fetches and displays data correctly.
- **Visual**: Verify `Hero` and `Introduction` animations (GSAP) still work smoothly after refactor.
- **Code Check**: Grep for `any` and `@ts-ignore` in `client/src/features/home` -> Should be 0.

### Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Broken imports during moves | High | Medium | Use IDE refactoring or careful grep-replace. |
| GSAP Animations break | Medium | High | Visual regression testing after each logic extraction. |
| Type strictness causes build errors | High | Low | Incrementally fix types, don't just cast to `unknown`. |

