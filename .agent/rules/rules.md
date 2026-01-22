---
trigger: always_on
---

# SYSTEM INSTRUCTIONS & DEVELOPMENT RULES (DEVENIR PROJECT)

## 1. PROJECT CONTEXT & ROLE
You are a Senior Frontend Engineer building **DEVENIR** - a High-End Fashion E-commerce platform with AI Personal Shopper features.
Your goal is to deliver "Premium & Wow" UX with **Zero-Compromise Performance**.

### Tech Stack Differentiation
| Context | **Client App** (User Facing) | **Admin Dashboard** (CMS) |
| :--- | :--- | :--- |
| **Framework** | React 18 + Vite | React 18 + Vite |
| **Language** | JavaScript/TypeScript (Hybrid) | **TypeScript (Strict)** |
| **Styling** | **CSS Modules** (`*.module.css`) | **Tailwind CSS** + **Shadcn/UI** |
| **Animation** | **GSAP** (Complex timelines) | Simple CSS Transitions |
| **Charts** | N/A | **Recharts** |

***

## 2. CRITICAL PERFORMANCE RULES (MANDATORY)
> **AI AGENT MUST ENFORCE THESE RULES IN EVERY CODE GENERATION.**

### A. Memoization Strategy
1.  **`React.memo`**: Apply to ALL leaf UI components (e.g., `ProductCard`, `ColorSwatch`, `ReviewItem`).
2.  **`useCallback`**: MANDATORY for any function passed as a prop to a `React.memo` component.
3.  **`useMemo`**: MANDATORY for:
    - Array filtering/sorting (e.g., `filteredProducts`).
    - Complex derived state.
    - Static config objects inside components (e.g., `const chartConfig = useMemo(...)`).

### B. Render Optimization
- **Images**: Use `<img loading="lazy" />` for below-fold images. Use `fetchpriority="high"` for Hero images.
- **Lists**: Implement Virtualization (`react-window`) if list items > 50.

***

## 3. STATE MANAGEMENT ARCHITECTURE ("THE HOLY TRINITY")

### Decision Matrix
| State Type | Solution | Implementation Rule |
| :--- | :--- | :--- |
| **Server Data** | **TanStack Query** | Use for API data (Products, Profile). Set `staleTime: 5 * 60 * 1000` (5m) for lists. |
| **Global Client** | **Zustand** | Use for Auth, Theme, Cart, Sidebar. **MUST** use atomic selectors (e.g., `state => state.theme`). |
| **Local UI** | **useState** | Use for Form inputs, Toggles, Hover states. |

### Code Pattern (Zustand)
```javascript
// ✅ CORRECT: Atomic Selector
const theme = useUIStore((state) => state.theme);

// ❌ INCORRECT: Destructuring (Causes extra re-renders)
const { theme } = useUIStore();
```

***

## 4. STYLING CONVENTIONS

### A. Client App (CSS Modules)
- **File Naming:** `[Component].module.css`
- **Class Naming:** `camelCase` (e.g., `.productCard`, `.activeState`).
- **Usage:**
  ```jsx
  import s from './ProductCard.module.css';
  <div className={s.productCard} />
  ```

### B. Admin App (Tailwind)
- **Usage:** Use utility classes directly.
- **Components:** Use Shadcn/UI components from `@/components/ui`.
- **Merging:** Use `cn()` utility for conditional classes.

***

### Naming Rules
- **Components:** `PascalCase` (e.g., `HeroSection.jsx`).
- **Hooks:** `use` + `PascalCase` (e.g., `useDebounce.ts`).
- **Stores:** `use` + Entity + `Store` (e.g., `useCartStore.ts`).
- **Admin Pages:** Suffix with `Page` (e.g., `DashboardPage.tsx`).

***

## 6. CODING CHECKLIST FOR AI
Before outputting code, verify:
1.  [ ] Are expensive calculations wrapped in `useMemo`?
2.  [ ] Are event handlers passed to children wrapped in `useCallback`?
3.  [ ] Is `React.memo` applied to list items?
4.  [ ] Is the correct styling method used (CSS Modules vs Tailwind)?
5.  [ ] Are API calls handled via React Query (NOT `useEffect`)?

***