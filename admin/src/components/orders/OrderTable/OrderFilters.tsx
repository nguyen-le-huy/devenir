/**
 * Order Filters Component
 * Search and sort controls for orders table
 */
import { IconSearch } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OrderListFilters } from '@/hooks/useOrders'

interface OrderFiltersProps {
  searchValue: string
  sortValue: OrderListFilters['sort']
  onSearchChange: (value: string) => void
  onSortChange: (value: OrderListFilters['sort']) => void
}

export function OrderFilters({
  searchValue,
  sortValue,
  onSearchChange,
  onSortChange,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo mã đơn, email, tên khách hàng..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={sortValue} onValueChange={(value) => onSortChange(value as OrderListFilters['sort'])}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sắp xếp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Mới nhất</SelectItem>
          <SelectItem value="oldest">Cũ nhất</SelectItem>
          <SelectItem value="total-high">Giá trị cao</SelectItem>
          <SelectItem value="total-low">Giá trị thấp</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
