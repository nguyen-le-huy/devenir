/**
 * Image Upload Component
 * Reusable image upload with preview
 */
import React, { useRef, useState } from 'react'
import { IconUpload, IconTrash } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { uploadImage as uploadImageService } from '@/services/uploadService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'auto'
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label,
  className,
  aspectRatio = 'square',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const response = await uploadImageService(file)
      if (response.success && response.data?.url) {
        onChange(response.data.url)
        toast.success('Image uploaded successfully')
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

  const handleRemove = () => {
    onChange('')
    onRemove?.()
  }

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label className="font-medium">{label}</Label>}

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className={cn('w-full rounded-lg border object-cover', aspectClasses[aspectRatio])}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <IconUpload className="h-4 w-4 mr-1" />
              Change
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleRemove}>
              <IconTrash className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
          <IconUpload className="w-8 h-8 text-gray-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {uploading ? 'Uploading...' : 'Click to upload'}
            </p>
            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
          </div>
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
    </div>
  )
}
