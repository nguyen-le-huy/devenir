/**
 * CategoryFormModal Component - Complete Version
 * 3 Tabs: Basic Info, Hierarchy & Relationships, SEO & Settings
 * Auto-generates slug, prevents circular references
 */

import { useState, useEffect } from 'react'
import type { Category, CategoryFormData } from '@/services/categoryService'
import { getDescendantIds, getCategoryPath, type CategoryTreeNode } from '@/utils/categoryHelpers'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/services/api'
import { IconUpload, IconTrash, IconAlertTriangle } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CategoryFormData) => Promise<void>
  initialData?: Partial<Category>
  allCategories: Category[]
  parentCategory?: Category | null
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  allCategories,
  parentCategory,
}: CategoryFormModalProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    thumbnailUrl: initialData?.thumbnailUrl || '',
    slug: initialData?.slug || '',
    parentCategory: parentCategory?._id || initialData?.parentCategory || null,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    sortOrder: initialData?.sortOrder || 0,
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(initialData?.thumbnailUrl || '')
  const [isSaving, setIsSaving] = useState(false)
  const [parentSearchTerm, setParentSearchTerm] = useState('')
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode: populate with existing data
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          thumbnailUrl: initialData.thumbnailUrl || '',
          slug: initialData.slug || '',
          parentCategory: initialData.parentCategory || null,
          isActive: initialData.isActive !== undefined ? initialData.isActive : true,
          sortOrder: initialData.sortOrder || 0,
        })
        setThumbnailPreview(initialData.thumbnailUrl || '')
      } else {
        // Create mode: reset to empty form
        setFormData({
          name: '',
          description: '',
          thumbnailUrl: '',
          slug: '',
          parentCategory: parentCategory?._id || null,
          isActive: true,
          sortOrder: 0,
        })
        setThumbnailPreview('')
        setActiveTab('basic')
      }
    }
  }, [isOpen, initialData, parentCategory])

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !initialData) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.name, initialData])

  // Image compression
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const LIMIT_10MB = 10 * 1024 * 1024
      if (file.size < LIMIT_10MB) {
        return resolve(file)
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

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

          let quality = 0.9

          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file)
                  return
                }

                if (blob.size < LIMIT_10MB || quality < 0.5) {
                  const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  })
                  resolve(newFile)
                } else {
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
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error uploading image'
      toast.error(errorMsg)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please provide category name')
      return
    }

    // Auto-generate slug if not provided (Vietnamese-friendly)
    const dataToSubmit = {
      ...formData,
      slug: formData.slug || formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }

    console.log('📤 Submitting category data:', dataToSubmit)

    try {
      setIsSaving(true)
      await onSave(dataToSubmit)
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Get available parent categories
  const availableParents = allCategories.filter((cat) => {
    if (!initialData?._id) return true
    const excludedIds = [initialData._id, ...getDescendantIds(initialData._id, allCategories)]
    return !excludedIds.includes(cat._id)
  })

  // Count excluded categories for circular reference warning
  const excludedCount = initialData?._id 
    ? 1 + getDescendantIds(initialData._id, allCategories).length 
    : 0

  // Build hierarchy tree
  const buildParentTree = (cats: Category[], parentId: string | null = null, level = 0): any[] => {
    return cats
      .filter((c) => c.parentCategory === parentId)
      .map((cat) => ({
        ...cat,
        level,
        children: buildParentTree(cats, cat._id, level + 1),
      }))
  }

  const parentTree = buildParentTree(availableParents)

  const flattenParentTree = (tree: any[]): any[] => {
    const flattened: any[] = []
    tree.forEach((node) => {
      flattened.push(node)
      if (node.children.length > 0) {
        flattened.push(...flattenParentTree(node.children))
      }
    })
    return flattened
  }

  const flatParents = flattenParentTree(parentTree)

  // Filter parents by search term
  const filteredParents = flatParents.filter((cat) =>
    cat.name.toLowerCase().includes(parentSearchTerm.toLowerCase())
  )

  // Get hierarchy path preview with correct format
  const getHierarchyPreview = () => {
    const categoryName = formData.name || 'New Category'
    
    if (!formData.parentCategory) {
      // Root category: 📍 [Category Name]
      return `📍 [${categoryName}]`
    }
    
    // Child category: 📍 Parent > [Child Name]
    const path = getCategoryPath(formData.parentCategory, allCategories || [])
    return `📍 ${path.join(' > ')} > [${categoryName}]`
  }

  const getDepth = () => {
    if (!formData.parentCategory) return 0
    // Get selected parent's level and add 1
    const parent = allCategories?.find(c => c._id === formData.parentCategory) as CategoryTreeNode | undefined
    return parent ? (parent.level ?? 0) + 1 : 0
  }

  const depth = getDepth()

  const headingTitle = initialData ? 'Edit Category' : 'Create Category'

  const formElement = (
    <form onSubmit={handleSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="hierarchy">Relationship</TabsTrigger>
          <TabsTrigger value="seo">SEO &amp; Setting</TabsTrigger>
        </TabsList>

        {/* TAB 1: BASIC INFORMATION */}
        <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Category Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder='E.g., "Formal Shirts"'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Shop premium formal shirts for business occasions..."
                  className="min-h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description?.length || 0}/500 characters
                </p>
              </div>

              <div className="space-y-3">
                <Label>Thumbnail Image</Label>

                {thumbnailPreview ? (
                  <div className="space-y-3">
                    <div className="relative group">
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg border"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('thumbnail-input')?.click()}
                      >
                        <IconUpload className="h-4 w-4 mr-2" />
                        Change Image
                      </Button>
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
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors',
                      uploadingImage && 'opacity-50 pointer-events-none'
                    )}
                    onClick={() => document.getElementById('thumbnail-input')?.click()}
                  >
                    <IconUpload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                      {uploadingImage ? 'Uploading...' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 400x400px • Max 2MB • JPG, PNG, WebP
                    </p>
                  </div>
                )}

                <input
                  id="thumbnail-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadThumbnail(file)
                  }}
                  disabled={uploadingImage}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (Auto-generated)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  URL: <span className="font-mono">/categories/{formData.slug || 'example-slug'}</span>
                </p>
              </div>
            </TabsContent>

        {/* TAB 2: HIERARCHY & RELATIONSHIPS */}
        <TabsContent value="hierarchy" className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label htmlFor="parentCategory">Parent Category</Label>
                
                {/* Search Input */}
                <Input
                  placeholder="🔍 Search parent category..."
                  value={parentSearchTerm}
                  onChange={(e) => setParentSearchTerm(e.target.value)}
                  className="mb-2"
                />
                
                <select
                  id="parentCategory"
                  className="w-full border rounded-md p-2 text-sm bg-background"
                  value={formData.parentCategory || 'none'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentCategory: e.target.value === 'none' ? null : e.target.value,
                    })
                  }
                >
                  <option value="none">📁 None (Create as Root)</option>
                  <option disabled>────────────────────</option>
                  {filteredParents.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {'  '.repeat(cat.level)}
                      {cat.level === 0 ? '📁' : cat.level === 1 ? '📂' : '📄'} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="text-sm font-semibold">Preview Path</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono">{getHierarchyPreview()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Level: {depth} {depth === 0 ? '(Root)' : ''}
                </p>
              </div>

              {initialData && excludedCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                  <IconAlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">
                      ⚠️ Circular Reference Prevention
                    </h4>
                    <p className="text-xs text-amber-700 mt-1">
                      {excludedCount} categor{excludedCount === 1 ? 'y' : 'ies'} excluded (this category and {excludedCount - 1} children)
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

        {/* TAB 3: SEO & SETTINGS */}
        <TabsContent value="seo" className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label>Status & Visibility</Label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={formData.isActive === true}
                      onChange={() => setFormData({ ...formData, isActive: true })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">● Active</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={formData.isActive === false}
                      onChange={() => setFormData({ ...formData, isActive: false })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">○ Inactive</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                  placeholder="10"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>
            </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between pt-6 border-t mt-6">
        <div className="flex gap-2">
          {activeTab !== 'basic' && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setActiveTab(
                  activeTab === 'seo' ? 'hierarchy' : activeTab === 'hierarchy' ? 'basic' : 'basic'
                )
              }
            >
              ❮ Previous
            </Button>
          )}
          {activeTab !== 'seo' && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setActiveTab(
                  activeTab === 'basic' ? 'hierarchy' : activeTab === 'hierarchy' ? 'seo' : 'seo'
                )
              }
            >
              Next ❯
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : initialData ? 'Update Category' : 'Publish'} ✓
          </Button>
        </div>
      </div>
    </form>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto px-4 w-full max-w-xl left-1/2 -translate-x-1/2 right-auto rounded-t-3xl"
        >
          <SheetHeader className="text-left">
            <SheetTitle>{headingTitle}</SheetTitle>
            <SheetDescription>
              {parentCategory ? `Parent: ${parentCategory.name}` : 'Configure category details'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-6 w-full max-w-lg mx-auto">{formElement}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-2xl">
            <span>{headingTitle}</span>
            {parentCategory && (
              <span className="text-sm font-normal text-muted-foreground">
                Parent: {parentCategory.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        {formElement}
      </DialogContent>
    </Dialog>
  )
}
