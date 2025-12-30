import { useEffect, useState } from 'react'
import { IconPlus, IconTrash, IconX } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import type { CustomerDetailResponse, CustomerFormPayload, CustomerListItem } from '@/services/customerService'

type CustomerFormInitial = CustomerListItem | CustomerDetailResponse['data']

interface CustomerFormDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  initialData?: CustomerFormInitial
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CustomerFormPayload) => Promise<void> | void
  onDelete?: () => void
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  loyaltyTier: string
  status: string
  preferredChannel: string
  marketingOptIn: boolean
  tags: string[]
  notes: string
  password: string
}

const defaultState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  loyaltyTier: 'bronze',
  status: 'prospect',
  preferredChannel: 'email',
  marketingOptIn: true,
  tags: [],
  notes: '',
  password: '',
}

export function CustomerFormDrawer({ open, mode, initialData, loading, onOpenChange, onSubmit, onDelete }: CustomerFormDrawerProps) {
  const [formState, setFormState] = useState<FormState>(defaultState)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormState({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        loyaltyTier: initialData.customerProfile?.loyaltyTier || 'bronze',
        status: initialData.customerProfile?.status || 'prospect',
        preferredChannel: initialData.customerProfile?.preferredChannel || 'email',
        marketingOptIn: initialData.customerProfile?.marketingOptIn ?? true,
        tags: (initialData as any).tags || initialData.customerProfile?.tags || [],
        notes: initialData.customerProfile?.notes || '',
        password: '',
      })
    } else if (!open) {
      setFormState(defaultState)
    }
  }, [initialData, mode, open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.email.trim() && mode === 'create') return

    const payload: CustomerFormPayload = {
      email: formState.email || undefined,
      firstName: formState.firstName || undefined,
      lastName: formState.lastName || undefined,
      phone: formState.phone || undefined,
      password: formState.password || undefined,
      customerProfile: {
        loyaltyTier: formState.loyaltyTier as any,
        status: formState.status as any,
        preferredChannel: formState.preferredChannel as any,
        marketingOptIn: formState.marketingOptIn,
        tags: formState.tags,
        notes: formState.notes,
      },
    }

    await onSubmit(payload)
    if (mode === 'create') {
      setFormState(defaultState)
      setTagInput('')
    }
  }

  const addTag = () => {
    const value = tagInput.trim().toLowerCase()
    if (!value) return
    if (formState.tags.includes(value)) {
      setTagInput('')
      return
    }
    setFormState(prev => ({ ...prev, tags: [...prev.tags, value] }))
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setFormState(prev => ({ ...prev, tags: prev.tags.filter(item => item !== tag) }))
  }

  const displayName = initialData && (initialData.firstName || initialData.lastName)
    ? `${initialData.firstName || ''} ${initialData.lastName || ''}`.trim()
    : initialData?.username || initialData?.email || 'Khách hàng'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full space-y-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{mode === 'create' ? 'Thêm khách hàng mới' : 'Chỉnh sửa khách hàng'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          {mode === 'edit' && initialData && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
              <div>
                <p className="text-sm text-muted-foreground">Khách hàng hiện tại</p>
                <p className="text-xl font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">{initialData.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="capitalize">{initialData.customerSegment ?? 'regular'}</Badge>
                <Badge variant="outline" className="capitalize">{initialData.loyaltyTier ?? 'bronze'}</Badge>
                {onDelete && (
                  <Button type="button" variant="ghost" size="sm" className="ml-auto text-destructive" onClick={onDelete}>
                    <IconTrash className="mr-1 h-4 w-4" /> Lưu trữ
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">Tên</Label>
              <Input id="firstName" value={formState.firstName} onChange={(e) => setFormState(prev => ({ ...prev, firstName: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="lastName">Họ</Label>
              <Input id="lastName" value={formState.lastName} onChange={(e) => setFormState(prev => ({ ...prev, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required={mode === 'create'} value={formState.email} onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" value={formState.phone} onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
          </div>
          {mode === 'create' && (
            <div>
              <Label htmlFor="password">Mật khẩu tạm</Label>
              <Input id="password" type="password" placeholder="Tự động nếu bỏ trống" value={formState.password} onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))} />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Cấp độ</Label>
              <Select value={formState.loyaltyTier} onValueChange={(value) => setFormState(prev => ({ ...prev, loyaltyTier: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={formState.status} onValueChange={(value) => setFormState(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kênh ưa thích</Label>
              <Select value={formState.preferredChannel} onValueChange={(value) => setFormState(prev => ({ ...prev, preferredChannel: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="messaging">Messaging</SelectItem>
                  <SelectItem value="in-person">In-person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Nhận thông tin Marketing</p>
              <p className="text-xs text-muted-foreground">Cho phép gửi email/SMS chăm sóc</p>
            </div>
            <Switch checked={formState.marketingOptIn} onCheckedChange={(checked) => setFormState(prev => ({ ...prev, marketingOptIn: checked }))} />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập tag và nhấn Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addTag}>
                <IconPlus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formState.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="capitalize">
                  {tag}
                  <Button type="button" variant="ghost" size="icon" className="ml-1 h-4 w-4" onClick={() => removeTag(tag)}>
                    <IconX className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea id="notes" value={formState.notes} onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))} placeholder="Thông tin đặc biệt, nhu cầu styling..." />
          </div>

          <Separator />

          <SheetFooter className="flex flex-col gap-2 px-0 pt-0 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {mode === 'create' ? 'Tạo khách hàng' : 'Lưu thay đổi'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
