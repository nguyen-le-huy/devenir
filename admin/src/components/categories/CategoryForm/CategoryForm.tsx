import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { IconUpload, IconTrash } from '@tabler/icons-react'
import { api } from '@/services/api'
import type { Category, CategoryFormData } from '@/services/categoryService'
import { toast } from 'sonner'

interface CategoryFormProps {
    initialData?: Partial<Category>
    categories?: Category[]
    onSave: (data: CategoryFormData) => void
    onCancel?: () => void
}

export function CategoryForm({ initialData, categories = [], onSave, onCancel }: CategoryFormProps) {
    const [formData, setFormData] = useState<CategoryFormData>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        thumbnailUrl: initialData?.thumbnailUrl || '',
        parentCategory: initialData?.parentCategory || null,
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    })
    const [uploadingImage, setUploadingImage] = useState(false)
    const [thumbnailPreview, setThumbnailPreview] = useState<string>(initialData?.thumbnailUrl || '')

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                thumbnailUrl: initialData.thumbnailUrl || '',
                parentCategory: initialData.parentCategory || null,
                isActive: initialData.isActive !== undefined ? initialData.isActive : true,
            })
            setThumbnailPreview(initialData.thumbnailUrl || '')
        }
    }, [initialData])

    // Helper to compress image
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            // Only compress if file is larger than 10MB (Cloudinary limit)
            const LIMIT_10MB = 10 * 1024 * 1024
            if (file.size < LIMIT_10MB) {
                return resolve(file)
            }

            console.log(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Compressing to under 10MB...`)

            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    let width = img.width
                    let height = img.height

                    // Initial resize if huge dimensions (e.g. > 4000px) to help reduce size
                    const MAX_DIMENSION = 4000
                    if (width > height && width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width
                        width = MAX_DIMENSION
                    } else if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height
                        height = MAX_DIMENSION
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    // Try compressing with decreasing quality until < 10MB
                    let quality = 0.9

                    const tryCompress = () => {
                        canvas.toBlob(
                            (blob) => {
                                if (!blob) {
                                    resolve(file) // Fallback
                                    return
                                }

                                if (blob.size < LIMIT_10MB || quality < 0.5) {
                                    // Success or gave up (quality too low)
                                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                                        type: 'image/jpeg',
                                        lastModified: Date.now(),
                                    })
                                    console.log(`Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(newFile.size / 1024 / 1024).toFixed(2)}MB (Quality: ${quality})`)
                                    resolve(newFile)
                                } else {
                                    // Still too big, reduce quality and try again
                                    quality -= 0.1
                                    tryCompress()
                                }
                            },
                            'image/jpeg',
                            quality
                        )
                    }

                    tryCompress()
                }
                img.onerror = (err) => reject(err)
            }
            reader.onerror = (err) => reject(err)
        })
    }

    const uploadThumbnail = async (file: File) => {
        try {
            setUploadingImage(true)

            // Compress image if needed
            const processedFile = await compressImage(file)

            const formDataUpload = new FormData()
            formDataUpload.append('image', processedFile)

            const response = await api.post('/upload/image', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            if (response.data.success) {
                const imageUrl = response.data.data.url
                setFormData({ ...formData, thumbnailUrl: imageUrl })
                setThumbnailPreview(imageUrl)
            } else {
                toast.error(response.data.message || 'Upload failed')
            }
        } catch (error: unknown) {
            console.error('Upload error:', error)
            const err = error as { response?: { data?: { message?: string } }; message?: string }
            const errorMsg = err?.response?.data?.message || err?.message || 'Error uploading image'
            toast.error(errorMsg)
        } finally {
            setUploadingImage(false)
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Please provide category name')
            return
        }

        onSave(formData)
    }

    // Filter out current category from parent options (prevent self-parent)
    const availableParentCategories = categories.filter(
        (cat) => cat._id !== initialData?._id
    )

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{initialData ? 'Edit Category' : 'Create Category'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Name */}
                    <div>
                        <Label htmlFor="name">Category Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Áo, Quần, Phụ kiện"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe this category..."
                            className="min-h-24"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Thumbnail Upload */}
                    <div>
                        <Label className="mb-3 block">Thumbnail Image</Label>

                        {thumbnailPreview ? (
                            <div className="space-y-3">
                                <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                                    <img
                                        src={thumbnailPreview}
                                        alt="Category thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFormData({ ...formData, thumbnailUrl: '' })
                                        setThumbnailPreview('')
                                    }}
                                >
                                    <IconTrash className="h-4 w-4 mr-2" />
                                    Remove Image
                                </Button>
                            </div>
                        ) : (
                            <label className="w-48 h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:bg-muted/50 transition cursor-pointer">
                                <div className="flex flex-col items-center gap-2">
                                    {uploadingImage ? (
                                        <>
                                            <div className="animate-spin">⏳</div>
                                            <span className="text-xs">Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <IconUpload className="h-6 w-6" />
                                            <span className="text-sm">Upload Thumbnail</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingImage}
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            uploadThumbnail(e.target.files[0])
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    {/* Parent Category */}
                    <div>
                        <Label htmlFor="parentCategory">Parent Category</Label>
                        <Select
                            value={formData.parentCategory || 'none'}
                            onValueChange={(value) =>
                                setFormData({ ...formData, parentCategory: value === 'none' ? null : value })
                            }
                        >
                            <SelectTrigger id="parentCategory">
                                <SelectValue placeholder="None (Top-level category)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (Top-level category)</SelectItem>
                                {availableParentCategories.map((category) => (
                                    <SelectItem key={category._id} value={category._id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Leave as "None" for top-level categories
                        </p>
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, isActive: checked as boolean })
                            }
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">
                            Active (Display on website)
                        </Label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                            {initialData ? 'Update Category' : 'Create Category'}
                        </Button>
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
