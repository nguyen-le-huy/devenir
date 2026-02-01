# Server Refactor Plan - Architecture & Business Logic Separation

## 1. Goal
Decouple Business Logic from Controllers. Implement **Service Layer Pattern** across the backend to improve maintainability, testability, and scalability.

## 2. Current State Analysis
- **Controllers** (`server/controllers/*`) currently contain:
  - Request parsing & validation.
  - Database queries & mutations (Direct Mongoose calls).
  - Business logic (e.g., complex variant syncing in Products, token generation in Auth).
  - Side effects (Email sending, Realtime events, Ingestion triggers).
  - Response formatting.

## 3. Architecture Guidelines (Reference: `architecture.md`, `senior-dev.md`)
- **Controllers**:
  - **Responsibilities**: 
    - Receive HTTP Request (req).
    - Basic Input Validation (Schema validation via Zod/Joi or manual check).
    - Call **Service** methods.
    - specialized Error Handling (map Service errors to HTTP status codes).
    - Send HTTP Response (res).
  - **Anti-patterns**: Direct DB access, complex logic loops.

- **Services**:
  - **Responsibilities**:
    - Contain ALL Business Rules.
    - Interact with **Repositories/Models** (Mongoose Models).
    - Return value-objects or DTOs (Data Transfer Objects), NOT HTTP Responses.
    - Throw descriptive Errors (e.g., `AppError` or similar) on failure.
    - Handle external integrations (Email, Payment, Search Engine triggers).

## 4. Refactoring Plan

### Phase 1: Authentication Module (`AuthController.js`) -> `AuthService.js`
- **Create**: `server/services/auth.service.js`
- **Move Logic**:
  - `generateToken` & `generateRandomUsername` helper functions.
  - `register`: DB creation, Hash crypto generation, Email trigger.
  - `login`: User lookup, Password match, Lock check logic.
  - `googleLogin`: OAuth verification, User create/update logic.
  - `forgotPassword` / `resetPassword`: Token hashing, finding user, updating password.
  - `verifyEmail` / `addPhone`: Token verification, User update.
  - `updateProfile` / `changePassword`: User update logic.

### Phase 2: Product Module (`ProductController.js`) -> `ProductService.js`
- **Create**: `server/services/product.service.js`
- **Move Logic**:
  - `getAllProducts`: Filter construction request handling, Pagination calculation.
  - `createProduct`:
    - Logic for checking existing entities.
    - Transactional logic for creating Product + Variants.
    - Side effects triggers: `emitRealtimeEvent`, `triggerProductIngestion`, `invalidateBrandCache`.
  - `updateProduct` & `updateVariant`:
    - Complex "Sync Color Group" logic.
    - Variant comparison and update logic.
    - Cache invalidation and Re-ingestion triggers.

### Phase 3: Order Module (Future)
- `OrderController` is also likely heavy, will need `OrderService`.

## 5. Implementation Steps

### Step 1: Create Base Service Structure
- Define a standard for Service return values or Error handling.
- Example: 
  ```javascript
  // Service
  async function login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('USER_NOT_FOUND');
    // ... logic
    return { user, token };
  }
  
  // Controller
  const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json({ success: true, ...result });
  });
  ```

### Step 2: Extract Auth Logic
- Refactor `AuthController` completely.

### Step 3: Extract Product Logic
- Refactor `ProductController` completely.

### Step 4: Verification
- Ensure all tests pass (if any).
- Verify API endpoints manually via Postman or Client App.
