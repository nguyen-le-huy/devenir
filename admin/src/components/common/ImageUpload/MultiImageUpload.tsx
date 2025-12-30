/**
 * Multi Image Upload Component
 * Reusable multiple image upload with preview grid
 */
import React, { useRef, useState } from 'react'
import { IconUpload, IconTrash } from '@tabler/icons-react'
import { Label } from '@/components/ui/label'
import { uploadImage as uploadImageService } from '@/services/uploadService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface UploadedImage {
  url: string
  id: string
}

interface MultiImageUploadProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  label?: string
  maxImages?: number
  className?: string
}

export function MultiImageUpload({
  images,
  onChange,
  label,
  maxImages = 10,
  className,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const fileArray = Array.from(files).slice(0, maxImages - images.length)
      const uploadPromises = fileArray.map((file) => uploadImageService(file))

      const responses = await Promise.all(uploadPromises)
      const uploadedImages = responses
        .filter((res) => res.success && res.data?.url)
        .map((res, idx) => ({
          url: res.data.url,
          id: `img-${Date.now()}-${idx}`,
        }))

      if (uploadedImages.length > 0) {
        onChange([...images, ...uploadedImages])
        toast.success(`${uploadedImages.length} image(s) uploaded`)
      } else {
        toast.error('Upload failed')
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err?.message || 'Upload error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = (imageId: string) => {
    onChange(images.filter((img) => img.id !== imageId))
  }

  return (
    <div className={cn('space-y-3', className)}>
      {label && <Label className="font-medium">{label}</Label>}

      {/* Upload Area */}
      {images.length < maxImages && (
        <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
          <IconUpload className="w-6 h-6 text-gray-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {uploading ? 'Uploading...' : 'Click to upload images'}
            </p>
            <p className="text-xs text-gray-500">
              {images.length}/{maxImages} images
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square">
              <img
                src={img.url}
                alt="Uploaded"
                className="w-full h-full object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IconTrash className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
