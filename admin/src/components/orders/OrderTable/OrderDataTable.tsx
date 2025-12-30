/**
 * Order Data Table Component
 * Table displaying order list with actions
 */
import {
  IconEye,
  IconCheck,
  IconTruck,
  IconPackage,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, getStatusConfig, getPaymentMethodLabel } from './types'
import type { Order, OrderStatus } from '@/hooks/useOrders'

interface Pagination {
  page: number
  pages: number
  total: number
  limit: number
}

interface OrderDataTableProps {
  orders: Order[]
  isLoading: boolean
  pagination?: Pagination
  onViewOrder: (order: Order) => void
  onStatusUpdate: (id: string, status: OrderStatus) => void
  onCancelOrder: (id: string) => void
  onPageChange: (page: number) => void
}

export function OrderDataTable({
  orders,
  isLoading,
  pagination,
  onViewOrder,
  onStatusUpdate,
  onCancelOrder,
  onPageChange,
}: OrderDataTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Không tìm thấy đơn hàng nào
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status)
              return (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-sm">
                    {order._id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {order.user?.firstName || order.user?.username || 'N/A'}{' '}
                        {order.user?.lastName || ''}
                      </div>
                      <div className="text-sm text-muted-foreground">{order.user?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {order.orderItems[0]?.image && (
                        <img
                          src={order.orderItems[0].image}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-sm line-clamp-1">
                          {order.orderItems[0]?.name}
                        </div>
                        {order.orderItems.length > 1 && (
                          <div className="text-xs text-muted-foreground">
                            +{order.orderItems.length - 1} sản phẩm khác
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant} className="gap-1">
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewOrder(order)}>
                          <IconEye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Cập nhật trạng thái</DropdownMenuLabel>
                        {order.status === 'pending' && (
                          <DropdownMenuItem onClick={() => onStatusUpdate(order._id, 'paid')}>
                            <IconCheck className="mr-2 h-4 w-4" />
                            Đánh dấu đã thanh toán
                          </DropdownMenuItem>
                        )}
                        {order.status === 'paid' && (
                          <DropdownMenuItem onClick={() => onStatusUpdate(order._id, 'shipped')}>
                            <IconTruck className="mr-2 h-4 w-4" />
                            Đánh dấu đang giao
                          </DropdownMenuItem>
                        )}
                        {order.status === 'shipped' && (
                          <DropdownMenuItem onClick={() => onStatusUpdate(order._id, 'delivered')}>
                            <IconPackage className="mr-2 h-4 w-4" />
                            Đánh dấu hoàn thành
                          </DropdownMenuItem>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onCancelOrder(order._id)}
                            >
                              <IconX className="mr-2 h-4 w-4" />
                              Hủy đơn hàng
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Hiển thị {orders.length} / {pagination.total} đơn hàng
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Trang {pagination.page} / {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
