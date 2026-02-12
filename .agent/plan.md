
## Feature Plan: RAG Service Enterprise Standardization

### Requirement Summary
- **Objective:** Refactor and optimize `server/services/rag` to meet Enterprise Architecture standards.
- **Scope:** Cleanup redundant files, consolidate data sources, and standardize utilities.
- **Key Issues Identified:**
    1.  **Data Duplication:** Hardcoded policies/sizes in services (`policy-faq`, `size-advisor`) duplicate `data/knowledge-base.json`.
    2.  **Utils Fragmentation:** RAG has its own `logger.js`, which should be centralized.
    3.  **Type Definitions:** TypeScript file (`types/index.ts`) in JS project needs clarification.

### Architecture Design

#### 1. Single Source of Truth (Data)
- **Strategy:** All static knowledge (Policies, Size Charts, Store Info) must be loaded from `data/knowledge-base.json`.
- **Changes:**
    - `policy-faq.service.js`: Remove hardcoded objects. Import JSON.
    - `size-advisor.service.js`: Remove hardcoded size charts. Import JSON.
    - `constants.js`: Sync `SIZE_CHARTS` with JSON or deprecate in favor of JSON.

#### 2. Centralized Logging
- **Strategy:** Move `rag/utils/logger.js` to `server/utils/logger.js` to serve as the global application logger (Winston).
- **Migration:**
    - Move file to `server/utils/`.
    - Create `rag/utils/logger.js` as a proxy (re-export) to prevent breaking existing imports in the short term.

#### 3. Type Safety
- **Strategy:** Clarify `types/index.ts` usage.
- **Action:** Rename `types/index.ts` to `types/rag-types.d.ts` (if used for JSDoc) or keep as reference documentation.

### Implementation Steps

1.  **Refactor `policy-faq.service.js`**:
    - Import `knowledge-base.json`.
    - Replace `PAYMENT_INFO`, `SHIPPING_INFO`, `RETURN_POLICY`, `STORE_LOCATION` with JSON data.

2.  **Refactor `size-advisor.service.js`**:
    - Import `knowledge-base.json`.
    - Update `getSizeGuide` to return data from `knowledge-base.sizeGuide`.

3.  **Logger Migration (Optional/Next Phase)**:
    - *Plan Only*: Move `logger.js` to `server/utils`.

4.  **Verification**:
    - Verify `constants.js` alignment.

### Test Strategy
- **Functional Testing**:
    - Query: "Chính sách đổi trả thế nào?" -> Verify accurate response from JSON.
    - Query: "Size guide cho áo thun" -> Verify size chart from JSON.
- **Regression Testing**: Ensure `npm test:rag` passes.

### Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Broken Imports** | Low | High | Use Search & Replace carefully; keep proxy files if needed. |
| **Data Mismatch** | Medium | Medium | Verify JSON structure matches Service expectations exactly. |

### Acceptance Criteria
- [ ] `policy-faq.service.js` has NO hardcoded text.
- [ ] `size-advisor.service.js` has NO hardcoded size charts.
- [ ] `knowledge-base.json` is the sole source of static knowledge.