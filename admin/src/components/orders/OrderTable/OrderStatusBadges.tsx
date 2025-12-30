/**
 * Order Status Badges Component
 * Clickable badges to filter orders by status
 */
import { Badge } from '@/components/ui/badge'
import type { OrderListFilters } from '@/hooks/useOrders'

interface OrderStats {
  total?: number
  pending?: number
  paid?: number
  shipped?: number
  delivered?: number
  cancelled?: number
}

interface OrderStatusBadgesProps {
  currentStatus: OrderListFilters['status']
  stats?: OrderStats
  onStatusChange: (status: OrderListFilters['status']) => void
}

export function OrderStatusBadges({ currentStatus, stats, onStatusChange }: OrderStatusBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={currentStatus === 'all' ? 'default' : 'outline'}
        className="cursor-pointer"
        onClick={() => onStatusChange('all')}
      >
        Tất cả ({stats?.total || 0})
      </Badge>
      <Badge
        variant={currentStatus === 'pending' ? 'default' : 'outline'}
        className="cursor-pointer"
        onClick={() => onStatusChange('pending')}
      >
        Chờ xử lý ({stats?.pending || 0})
      </Badge>
      <Badge
        variant={currentStatus === 'paid' ? 'default' : 'secondary'}
        className="cursor-pointer"
        onClick={() => onStatusChange('paid')}
      >
        Đã thanh toán ({stats?.paid || 0})
      </Badge>
      <Badge
        variant={currentStatus === 'shipped' ? 'default' : 'secondary'}
        className="cursor-pointer"
        onClick={() => onStatusChange('shipped')}
      >
        Đang giao ({stats?.shipped || 0})
      </Badge>
      <Badge
        variant={currentStatus === 'delivered' ? 'default' : 'secondary'}
        className="cursor-pointer"
        onClick={() => onStatusChange('delivered')}
      >
        Hoàn thành ({stats?.delivered || 0})
      </Badge>
      <Badge
        variant={currentStatus === 'cancelled' ? 'default' : 'destructive'}
        className="cursor-pointer"
        onClick={() => onStatusChange('cancelled')}
      >
        Đã hủy ({stats?.cancelled || 0})
      </Badge>
    </div>
  )
}
