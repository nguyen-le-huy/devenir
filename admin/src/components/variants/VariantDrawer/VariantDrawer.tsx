/**
 * Variant Drawer Component
 * Slide-out drawer for adding/editing variants
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

import { VariantImageUpload } from './VariantImageUpload'
import { VariantFormFields } from './VariantFormFields'
import { useVariantData, useVariantForm } from './useVariantForm'
import type { VariantDrawerProps } from './types'

export default function VariantDrawer({
  isOpen,
  variantId,
  variantData,
  isEdit = false,
  onClose,
  onSuccess,
}: VariantDrawerProps) {
  // Data fetching
  const { products, colors, fetchProducts, fetchColors } = useVariantData()

  // Form state
  const {
    formData,
    setFormData,
    variantImages,
    setVariantImages,
    selectedMainImage,
    setSelectedMainImage,
    selectedHoverImage,
    setSelectedHoverImage,
    loading,
    resetForm,
    loadVariantData,
    fetchVariant,
    handleSubmit,
  } = useVariantForm(isEdit, variantId, variantData)

  // Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [colorSearchTerm, setColorSearchTerm] = useState('')

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchColors()
      document.documentElement.style.overflow = 'hidden'

      if (isEdit && variantData) {
        // Use pre-loaded variant data (FAST!)
        loadVariantData(variantData)
      } else if (isEdit && variantId) {
        // Fallback: fetch if data not provided
        fetchVariant()
      } else {
        resetForm()
      }
    } else {
      document.documentElement.style.overflow = 'unset'
    }

    return () => {
      document.documentElement.style.overflow = 'unset'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, variantId, variantData, isEdit])

  // Handle form submit
  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await handleSubmit()
    if (success) {
      resetForm()
      setSearchTerm('')
      setColorSearchTerm('')
      onSuccess()
      onClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-96 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between shrink-0 z-10">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit Variant' : 'Add Variant'}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form
          onSubmit={onFormSubmit}
          className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5"
        >
          {/* Image Upload Section */}
          <VariantImageUpload
            isEdit={isEdit}
            variantImages={variantImages}
            selectedMainImage={selectedMainImage}
            selectedHoverImage={selectedHoverImage}
            onImagesChange={setVariantImages}
            onMainImageChange={setSelectedMainImage}
            onHoverImageChange={setSelectedHoverImage}
          />

          {/* Form Fields */}
          <VariantFormFields
            isEdit={isEdit}
            formData={formData}
            products={products}
            colors={colors}
            searchTerm={searchTerm}
            colorSearchTerm={colorSearchTerm}
            onFormDataChange={setFormData}
            onSearchTermChange={setSearchTerm}
            onColorSearchTermChange={setColorSearchTerm}
          />
        </form>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t p-4 space-y-2 shrink-0">
          <Button type="submit" onClick={onFormSubmit} className="w-full text-sm" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Variant' : 'Create Variant'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full text-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </>,
    document.body
  )
}
