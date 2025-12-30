/**
 * Re-export from refactored variants-page folder
 * This file is kept for backward compatibility
 */
export { default } from './variants-page'
// Types are re-exported explicitly to avoid ESLint warning
export type {
  Variant,
  Product,
  Color,
  QuickStats,
  VariantFilters,
} from './variants-page'
