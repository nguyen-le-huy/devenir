import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { IconUpload, IconTrash } from '@tabler/icons-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import type { Brand, BrandFormData } from '@/services/brandService'
import { api } from '@/services/api'

interface BrandFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: BrandFormData) => Promise<void>
  initialData?: Brand | null
}

const emptyForm: BrandFormData = {
  name: '',
  description: '',
  tagline: '',
  originCountry: '',
  foundedYear: undefined,
  website: '',
  logoUrl: '',
  isActive: true,
}

export function BrandFormModal({ open, onClose, onSubmit, initialData }: BrandFormModalProps) {
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState<BrandFormData>(emptyForm)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description || '',
          tagline: initialData.tagline || '',
          originCountry: initialData.originCountry || '',
          foundedYear: initialData.foundedYear,
          website: initialData.website || '',
          logoUrl: initialData.logoUrl || '',
          isActive: initialData.isActive,
        })
      } else {
        setFormData(emptyForm)
      }
    }
  }, [open, initialData])

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingLogo(true)
      const payload = new FormData()
      payload.append('image', file)
      const response = await api.post('/upload/image', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = response.data?.data?.url
      if (url) {
        setFormData((prev) => ({ ...prev, logoUrl: url }))
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to upload logo'
      toast.error(message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Brand name is required')
      return
    }

    const payload: BrandFormData = {
      ...formData,
      name: formData.name.trim(),
      foundedYear: formData.foundedYear ? Number(formData.foundedYear) : undefined,
      website: formData.website?.trim() || undefined,
      originCountry: formData.originCountry?.trim() || undefined,
      tagline: formData.tagline?.trim() || undefined,
      description: formData.description?.trim() || undefined,
    }

    await onSubmit(payload)
  }

  const Body = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="brand-name">Brand Name *</Label>
        <Input
          id="brand-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Maison Devenir"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={formData.tagline}
          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
          placeholder="Effortless tailoring for modern men"
          maxLength={120}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="originCountry">Origin Country</Label>
          <Input
            id="originCountry"
            value={formData.originCountry}
            onChange={(e) => setFormData({ ...formData, originCountry: e.target.value })}
            placeholder="France"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="foundedYear">Founded Year</Label>
          <Input
            id="foundedYear"
            type="number"
            min={1850}
            max={new Date().getFullYear() + 1}
            value={formData.foundedYear ?? ''}
            onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="2012"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://devenir.shop"
          value={formData.website || ''}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Short overview of this brand, collection pillars, craftsmanship story..."
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Max 500 characters</p>
      </div>

      <div className="space-y-3">
        <Label>Brand Logo</Label>
        {formData.logoUrl ? (
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <img src={formData.logoUrl} alt={formData.name} className="h-14 w-14 rounded-md object-cover border" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="text-sm text-muted-foreground wrap-break-words">{formData.logoUrl}</div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById('brand-logo-input')?.click()}>
                  <IconUpload className="mr-2 h-4 w-4" />
                  Replace
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setFormData({ ...formData, logoUrl: '' })}>
                  <IconTrash className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <label
            htmlFor="brand-logo-input"
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <IconUpload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{uploadingLogo ? 'Uploading logo...' : 'Upload brand logo'}</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG up to 5MB</p>
            </div>
          </label>
        )}
        <input
          id="brand-logo-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              handleFileUpload(file)
            }
          }}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Active status</p>
          <p className="text-sm text-muted-foreground">Toggle to hide the brand from storefront</p>
        </div>
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
          {initialData ? 'Update Brand' : 'Create Brand'}
        </Button>
      </div>
    </form>
  )

  if (!open) {
    return null
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(value) => { if (!value) onClose() }}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto px-4">
          <SheetHeader className="text-left">
            <SheetTitle>{initialData ? 'Edit Brand' : 'Create Brand'}</SheetTitle>
            <SheetDescription>Maintain consistent branding information across storefront touchpoints.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-8">{Body}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Brand' : 'Create Brand'}</DialogTitle>
          <DialogDescription>Upload brand assets, positioning, and operating details.</DialogDescription>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  )
}
