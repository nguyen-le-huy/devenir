/**
 * ProductForm
 * Main orchestrator component for product form
 * Manages all tabs: Basic Info, Variants, Inventory, SEO
 */

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProductForm } from "./useProductForm"
import { ProductBasicInfoTab } from "./ProductBasicInfoTab"
import { ProductVariantsTab } from "./ProductVariantsTab"
import { ProductInventoryTab } from "./ProductInventoryTab"
import { ProductSEOTab } from "./ProductSEOTab"
import type { ProductFormProps } from "./types"

export function ProductForm({ onSave, onDraft, initialData }: ProductFormProps) {
  const {
    formData,
    categories,
    colors,
    loadingColors,
    brandsLoading,
    postToFacebook,
    setPostToFacebook,
    categorySearch,
    setCategorySearch,
    brandSearch,
    setBrandSearch,
    colorSearchTerm,
    setColorSearchTerm,
    filteredCategories,
    filteredBrands,
    filteredColorOptions,
    availableBrands,
    selectedBrandDetails,
    updateFormField,
    updateVariants,
  } = useProductForm(initialData)

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{formData.name || "New Product"}</h1>
          <p className="text-muted-foreground">Manage product information and variants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onDraft?.(formData)}>
            Save as Draft
          </Button>
          <Button onClick={() => onSave?.({ ...formData, postToFacebook })}>
            Publish Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <ProductBasicInfoTab
            formData={formData}
            categories={categories}
            filteredCategories={filteredCategories}
            categorySearch={categorySearch}
            setCategorySearch={setCategorySearch}
            availableBrands={availableBrands}
            filteredBrands={filteredBrands}
            brandSearch={brandSearch}
            setBrandSearch={setBrandSearch}
            brandsLoading={brandsLoading}
            selectedBrandDetails={selectedBrandDetails}
            postToFacebook={postToFacebook}
            setPostToFacebook={setPostToFacebook}
            onUpdateField={updateFormField}
          />
        </TabsContent>

        {/* Tab 2: Variants */}
        <TabsContent value="variants" className="space-y-6">
          <ProductVariantsTab
            formData={formData}
            colors={colors}
            filteredColorOptions={filteredColorOptions}
            colorSearchTerm={colorSearchTerm}
            setColorSearchTerm={setColorSearchTerm}
            loadingColors={loadingColors}
            onUpdateVariants={updateVariants}
          />
        </TabsContent>

        {/* Tab 3: Inventory Summary */}
        <TabsContent value="inventory" className="space-y-6">
          <ProductInventoryTab formData={formData} colors={colors} />
        </TabsContent>

        {/* Tab 4: SEO */}
        <TabsContent value="seo" className="space-y-6">
          <ProductSEOTab formData={formData} onUpdateField={updateFormField} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProductForm
