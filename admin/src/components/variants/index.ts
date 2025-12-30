/**
 * Variant Components
 * Re-export all variant related components
 */

// Variant Table Components
export {
  VariantQuickStats,
  VariantFilters,
  VariantDataTable,
  useVariantCSV,
} from './VariantTable'
export type {
  Variant as TableVariant,
  VariantProductRef,
  QuickStats,
  VariantFiltersType,
  CSVImportRow,
} from './VariantTable'

// Variant Drawer Components
export { default as VariantDrawer } from './VariantDrawer'
export {
  VariantImageUpload,
  VariantFormFields,
  useVariantData,
  useVariantForm,
  SIZES,
  defaultFormState,
} from './VariantDrawer'
export type {
  VariantDrawerProps,
  Product,
  Color,
  VariantImage,
  VariantFormState,
  VariantFormData,
} from './VariantDrawer'

// Other Variant Components
export { VariantDetailModal } from './VariantDetailModal'
export type { Variant as VariantModalType } from './VariantDetailModal'

export { VariantEditDialog } from './VariantEditDialog'

export { VariantsMatrix } from './VariantsMatrix'
export type { Variant } from './VariantsMatrix'
