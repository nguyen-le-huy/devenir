/**
 * Variant Drawer Components
 * Re-export all variant drawer related components
 */

// Main component
export { default as VariantDrawer, default } from './VariantDrawer'

// Sub-components
export { VariantImageUpload } from './VariantImageUpload'
export { VariantFormFields } from './VariantFormFields'

// Hooks
export { useVariantData, useVariantForm } from './useVariantForm'

// Types
export type {
  VariantDrawerProps,
  Product,
  Color,
  VariantImage,
  VariantFormState,
  VariantFormData,
} from './types'

// Constants
export { SIZES, defaultFormState } from './types'
