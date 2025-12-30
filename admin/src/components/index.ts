/**
 * Admin Components Index
 * Centralized re-exports for all admin components
 * 
 * Note: Individual modules should be imported directly to avoid
 * naming conflicts (e.g., import { ProductForm } from '@/components/products')
 */

// =============================================================
// COMMON REUSABLE COMPONENTS (Safe to re-export - no conflicts)
// =============================================================
export * from './common'

// =============================================================
// FEATURE MODULES (Import directly from subfolders to avoid conflicts)
// =============================================================
// Products: import from '@/components/products'
// Variants: import from '@/components/variants'
// Orders: import from '@/components/orders'
// Customers: import from '@/components/customers'
// Categories: import from '@/components/categories'

// =============================================================
// LAYOUT COMPONENTS
// =============================================================
export * from './layout'

// =============================================================
// AUTH COMPONENTS
// =============================================================
export * from './auth'
