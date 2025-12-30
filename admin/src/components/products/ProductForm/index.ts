/**
 * Product Form Components
 * Re-export all product form related components
 */

// Main component
export { ProductForm, default } from './ProductForm'

// Tab components
export { ProductBasicInfoTab } from './ProductBasicInfoTab'
export { ProductVariantsTab } from './ProductVariantsTab'
export { ProductInventoryTab } from './ProductInventoryTab'
export { ProductSEOTab } from './ProductSEOTab'

// Variant sub-components
export { VariantImageUpload } from './VariantImageUpload'
export { VariantFormSection } from './VariantFormSection'
export { VariantListFilters } from './VariantListFilters'
export { VariantListTable } from './VariantListTable'
export { VariantDetailModal } from './VariantDetailModal'

// Hooks
export { useProductForm } from './useProductForm'

// Types
export type {
  ProductFormData,
  ProductFormProps,
  VariantData,
  VariantImage,
  PopulatedReference,
  SizeType,
} from './types'

// Constants & Utils
export { SIZES, defaultFormData, defaultVariant } from './types'
export * from './utils'
