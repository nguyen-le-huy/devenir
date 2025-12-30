/**
 * ProductVariantsTab
 * Tab 2: Variant management (upload, form, list)
 */

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { uploadImage } from "@/services/uploadService"
import type { ProductFormData, VariantData, VariantImage } from "./types"
import type { Color } from "@/services/colorService"
import { defaultVariant } from "./types"
import { generateSKU, getUniqueSizes, getUniqueColors, filterVariants } from "./utils"
import { VariantImageUpload } from "./VariantImageUpload"
import { VariantFormSection } from "./VariantFormSection"
import { VariantListFilters } from "./VariantListFilters"
import { VariantListTable } from "./VariantListTable"
import { VariantDetailModal } from "./VariantDetailModal"

interface ProductVariantsTabProps {
  formData: ProductFormData
  colors: Color[]
  filteredColorOptions: Color[]
  colorSearchTerm: string
  setColorSearchTerm: (value: string) => void
  loadingColors: boolean
  onUpdateVariants: (variants: VariantData[]) => void
}

export function ProductVariantsTab({
  formData,
  colors,
  filteredColorOptions,
  colorSearchTerm,
  setColorSearchTerm,
  loadingColors,
  onUpdateVariants,
}: ProductVariantsTabProps) {
  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false)
  const [variantImages, setVariantImages] = useState<VariantImage[]>([])
  const [selectedMainImage, setSelectedMainImage] = useState("")
  const [selectedHoverImage, setSelectedHoverImage] = useState("")

  // Variant form states
  const [newVariant, setNewVariant] = useState<VariantData>({ ...defaultVariant })
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)

  // Variant list states
  const [filterSize, setFilterSize] = useState("all")
  const [filterColor, setFilterColor] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set())
  const [viewDetailIndex, setViewDetailIndex] = useState<number | null>(null)
  const [variantPage, setVariantPage] = useState(1)
  const variantItemsPerPage = 10

  // Computed values
  const variantSizes = getUniqueSizes(formData.variants)
  const variantColors = getUniqueColors(formData.variants)
  const filteredVariants = filterVariants(formData.variants, {
    size: filterSize,
    color: filterColor,
    search: searchTerm,
  })

  const filteredIndices = formData.variants
    .map((_, idx) => idx)
    .filter((idx) => {
      const v = formData.variants[idx]
      return filteredVariants.some(fv => fv.sku === v.sku)
    })

  // Handle image upload
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      const fileArray = Array.from(files)
      const uploadPromises = fileArray.map((file) => uploadImage(file))
      const responses = await Promise.all(uploadPromises)
      const uploadedUrls = responses
        .filter((res) => res.success && res.data?.url)
        .map((res) => ({
          url: res.data.url,
          id: res.data.id,
        }))

      if (uploadedUrls.length > 0) {
        setVariantImages((prev) => [...prev, ...uploadedUrls])
      } else {
        toast.error("Upload failed")
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err?.message || "Upload error")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setVariantImages((prev) => prev.filter((_, i) => i !== index))
    if (variantImages[index].url === selectedMainImage) setSelectedMainImage("")
    if (variantImages[index].url === selectedHoverImage) setSelectedHoverImage("")
  }

  // Handle add/update variant
  const handleAddOrUpdateVariant = () => {
    if (!newVariant.color || selectedSizes.length === 0 || !newVariant.price || newVariant.quantity === undefined) {
      toast.error("Please fill all required fields (Color, Size(s), Price, Quantity)")
      return
    }

    if (!selectedMainImage || !selectedHoverImage) {
      toast.error("Please select both main and hover images")
      return
    }

    if (editingVariantIndex !== null) {
      // Edit mode
      const originalVariant = formData.variants[editingVariantIndex]
      const originalSize = originalVariant.size
      const originalColor = originalVariant.color

      if (selectedSizes.length === 1 && selectedSizes[0] === originalSize) {
        const updatedVariant = {
          ...newVariant,
          sku: generateSKU(formData.name, newVariant.color, newVariant.size),
          mainImage: selectedMainImage,
          hoverImage: selectedHoverImage,
          images: variantImages.map((img) => img.url),
          colorId: newVariant.colorId,
        }

        const updatedVariants = [...formData.variants]
        updatedVariants[editingVariantIndex] = updatedVariant

        // Auto-sync same-color variants
        if (newVariant.color === originalColor) {
          const sameColorIndices = formData.variants
            .map((v, idx) => ({ variant: v, idx }))
            .filter(({ variant, idx }) => variant.color === originalColor && idx !== editingVariantIndex)
            .map(({ idx }) => idx)

          if (sameColorIndices.length > 0) {
            sameColorIndices.forEach((idx) => {
              const variant = updatedVariants[idx]
              updatedVariants[idx] = {
                ...variant,
                price: newVariant.price,
                mainImage: selectedMainImage,
                hoverImage: selectedHoverImage,
                images: variantImages.map((img) => img.url),
              }
            })
            onUpdateVariants(updatedVariants)
            setEditingVariantIndex(null)
            toast.success(`Variant updated! ${sameColorIndices.length} same-color variant(s) synced.`)
            resetForm()
            return
          }
        }

        onUpdateVariants(updatedVariants)
        setEditingVariantIndex(null)
        toast.success("Variant updated successfully")
      } else {
        // Added new sizes
        const newSizesToAdd = selectedSizes.filter((size) => size !== originalSize)

        if (newSizesToAdd.length > 0) {
          const updatedOriginalVariant = {
            ...newVariant,
            sku: generateSKU(formData.name, newVariant.color, originalSize),
            size: originalSize,
            mainImage: selectedMainImage,
            hoverImage: selectedHoverImage,
            images: variantImages.map((img) => img.url),
            colorId: newVariant.colorId,
          }

          const newVariants = newSizesToAdd.map((size) => ({
            sku: generateSKU(formData.name, newVariant.color, size),
            color: newVariant.color,
            colorId: newVariant.colorId,
            size: size,
            price: newVariant.price,
            quantity: newVariant.quantity,
            mainImage: selectedMainImage,
            hoverImage: selectedHoverImage,
            images: variantImages.map((img) => img.url),
          }))

          const updatedVariants = [...formData.variants]
          updatedVariants[editingVariantIndex] = updatedOriginalVariant

          onUpdateVariants([...updatedVariants, ...newVariants])
          setEditingVariantIndex(null)
          toast.success(`Variant updated! Created ${newVariants.length} additional variant(s)`)
        }
      }
    } else {
      // Add mode
      const newVariants = selectedSizes.map((size) => ({
        sku: generateSKU(formData.name, newVariant.color, size),
        color: newVariant.color,
        colorId: newVariant.colorId,
        size: size,
        price: newVariant.price,
        quantity: newVariant.quantity,
        mainImage: selectedMainImage,
        hoverImage: selectedHoverImage,
        images: variantImages.map((img) => img.url),
      }))

      onUpdateVariants([...formData.variants, ...newVariants])
      toast.success(`Created ${newVariants.length} variant(s) for color "${newVariant.color}"`)
    }

    resetForm()
  }

  const resetForm = () => {
    setNewVariant({ ...defaultVariant })
    setSelectedSizes([])
    setVariantImages([])
    setSelectedMainImage("")
    setSelectedHoverImage("")
  }

  const handleEditVariant = (index: number) => {
    const variant = formData.variants[index]
    setNewVariant(variant)
    setSelectedSizes([variant.size])
    if (variant.images && variant.images.length > 0) {
      setVariantImages(variant.images.map((url, idx) => ({ url, id: `${index}-${idx}` })))
    }
    setSelectedMainImage(variant.mainImage || "")
    setSelectedHoverImage(variant.hoverImage || "")
    setEditingVariantIndex(index)
  }

  const handleDeleteVariant = (index: number) => {
    onUpdateVariants(formData.variants.filter((_, i) => i !== index))
  }

  const handleDeleteSelected = () => {
    if (confirm(`Delete ${selectedVariants.size} selected variant(s)?`)) {
      const indicesToDelete = Array.from(selectedVariants).sort((a, b) => b - a)
      const updatedVariants = [...formData.variants]
      indicesToDelete.forEach((idx) => {
        updatedVariants.splice(idx, 1)
      })
      onUpdateVariants(updatedVariants)
      setSelectedVariants(new Set())
      toast.success(`Deleted ${selectedVariants.size} variant(s)`)
    }
  }

  const toggleVariantSelection = (idx: number) => {
    const newSelected = new Set(selectedVariants)
    if (newSelected.has(idx)) {
      newSelected.delete(idx)
    } else {
      newSelected.add(idx)
    }
    setSelectedVariants(newSelected)
  }

  const toggleAllVariants = () => {
    if (selectedVariants.size === filteredIndices.length) {
      setSelectedVariants(new Set())
    } else {
      setSelectedVariants(new Set(filteredIndices))
    }
  }

  const handleCancelEdit = () => {
    setEditingVariantIndex(null)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* Upload Images Section */}
      <VariantImageUpload
        images={variantImages}
        selectedMainImage={selectedMainImage}
        selectedHoverImage={selectedHoverImage}
        uploadingImage={uploadingImage}
        onUpload={handleMultipleImageUpload}
        onRemove={handleRemoveImage}
      />

      {/* Variant Form */}
      <Card>
        <CardHeader>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>
            Each variant is a unique combination of color and size with its own price and quantity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <VariantFormSection
            newVariant={newVariant}
            setNewVariant={setNewVariant}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
            colors={colors}
            filteredColorOptions={filteredColorOptions}
            colorSearchTerm={colorSearchTerm}
            setColorSearchTerm={setColorSearchTerm}
            loadingColors={loadingColors}
            variantImages={variantImages}
            selectedMainImage={selectedMainImage}
            setSelectedMainImage={setSelectedMainImage}
            selectedHoverImage={selectedHoverImage}
            setSelectedHoverImage={setSelectedHoverImage}
            editingVariantIndex={editingVariantIndex}
            onAddOrUpdate={handleAddOrUpdateVariant}
            onCancel={handleCancelEdit}
          />

          {/* Variants List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Variants List ({formData.variants.length})</h3>
            </div>

            {formData.variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No variants added yet</p>
            ) : (
              <>
                <VariantListFilters
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterSize={filterSize}
                  setFilterSize={setFilterSize}
                  filterColor={filterColor}
                  setFilterColor={setFilterColor}
                  variantSizes={variantSizes}
                  variantColors={variantColors}
                  colors={colors}
                  filteredCount={filteredVariants.length}
                  totalCount={formData.variants.length}
                  selectedCount={selectedVariants.size}
                  onDeleteSelected={handleDeleteSelected}
                />

                <VariantListTable
                  variants={formData.variants}
                  filteredVariants={filteredVariants}
                  colors={colors}
                  selectedVariants={selectedVariants}
                  variantPage={variantPage}
                  variantItemsPerPage={variantItemsPerPage}
                  onToggleSelect={toggleVariantSelection}
                  onToggleSelectAll={toggleAllVariants}
                  onView={setViewDetailIndex}
                  onEdit={handleEditVariant}
                  onDelete={handleDeleteVariant}
                  onPageChange={setVariantPage}
                />

                {/* Selection Info */}
                {selectedVariants.size > 0 && (
                  <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                    {selectedVariants.size} variant(s) selected
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVariants(new Set())}
                      className="ml-2 h-7"
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Variant Details Modal */}
      {viewDetailIndex !== null && formData.variants[viewDetailIndex] && (
        <VariantDetailModal
          variant={formData.variants[viewDetailIndex]}
          productName={formData.name}
          colors={colors}
          onClose={() => setViewDetailIndex(null)}
          onEdit={() => {
            handleEditVariant(viewDetailIndex)
            setViewDetailIndex(null)
          }}
          onDelete={() => {
            handleDeleteVariant(viewDetailIndex)
            setViewDetailIndex(null)
            toast.success("Variant deleted")
          }}
        />
      )}
    </div>
  )
}

export default ProductVariantsTab
