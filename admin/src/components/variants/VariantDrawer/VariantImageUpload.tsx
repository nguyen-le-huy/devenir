/**
 * Variant Image Upload Section
 * Handles multiple image upload and main/hover selection
 */
import React, { useRef } from 'react'
import { IconTrash, IconUpload } from '@tabler/icons-react'
import { Label } from '@/components/ui/label'
import { uploadImage } from '@/services/uploadService'
import { toast } from 'sonner'
import type { VariantImage } from './types'

interface VariantImageUploadProps {
  isEdit: boolean
  variantImages: VariantImage[]
  selectedMainImage: string
  selectedHoverImage: string
  onImagesChange: (images: VariantImage[]) => void
  onMainImageChange: (url: string) => void
  onHoverImageChange: (url: string) => void
}

export function VariantImageUpload({
  isEdit,
  variantImages,
  selectedMainImage,
  selectedHoverImage,
  onImagesChange,
  onMainImageChange,
  onHoverImageChange,
}: VariantImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = React.useState(false)

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
        .map((res, idx) => ({
          url: res.data.url,
          id: `img-${Date.now()}-${idx}`,
        }))

      if (uploadedUrls.length > 0) {
        onImagesChange([...variantImages, ...uploadedUrls])
      } else {
        toast.error('Upload failed')
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err?.message || 'Upload error')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (imageId: string) => {
    const imageToRemove = variantImages.find((img) => img.id === imageId)
    if (!imageToRemove) return

    const newImages = variantImages.filter((img) => img.id !== imageId)
    onImagesChange(newImages)

    if (imageToRemove.url === selectedMainImage) {
      onMainImageChange('')
    }
    if (imageToRemove.url === selectedHoverImage) {
      onHoverImageChange('')
    }
  }

  // Don't show if edit mode and no images
  if (isEdit && variantImages.length === 0 && !selectedMainImage && !selectedHoverImage) {
    return null
  }

  return (
    <div className="space-y-3 border-b pb-4">
      <Label className="font-medium">Images</Label>

      {/* Upload Area */}
      <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
        <IconUpload className="w-5 h-5 text-gray-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {uploadingImage ? 'Uploading...' : 'Click to upload images'}
          </p>
          <p className="text-xs text-gray-500">or drag and drop</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleMultipleImageUpload}
          disabled={uploadingImage}
        />
      </label>

      {/* Uploaded Images Grid */}
      {variantImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Images ({variantImages.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {variantImages.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt="Variant"
                  className="w-full aspect-square object-cover rounded border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconTrash className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Image Selection */}
      {variantImages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Main Image *</Label>
          <div className="grid grid-cols-3 gap-2">
            {variantImages.map((img) => (
              <div
                key={`main-${img.id}`}
                onClick={() => onMainImageChange(img.url)}
                className={`cursor-pointer relative rounded-lg overflow-hidden border-2 transition-all ${
                  selectedMainImage === img.url ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <img src={img.url} alt="Main" className="w-full aspect-square object-cover" />
                {selectedMainImage === img.url && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hover Image Selection */}
      {variantImages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Hover Image *</Label>
          <div className="grid grid-cols-3 gap-2">
            {variantImages.map((img) => (
              <div
                key={`hover-${img.id}`}
                onClick={() => onHoverImageChange(img.url)}
                className={`cursor-pointer relative rounded-lg overflow-hidden border-2 transition-all ${
                  selectedHoverImage === img.url ? 'border-green-500' : 'border-gray-200'
                }`}
              >
                <img src={img.url} alt="Hover" className="w-full aspect-square object-cover" />
                {selectedHoverImage === img.url && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
