import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  IconSearch,
  IconRefresh,
  IconEye,
  IconCheck,
  IconTruck,
  IconPackage,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconDownload,
} from '@tabler/icons-react'

import { AdminLayout } from '@/layouts/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

import { useOrderList, useOrderDetail, useOrderMutations, type Order, type OrderListFilters, type OrderStatus } from '@/hooks/useOrders'
import { useDebounce } from '@/hooks/useDebounce'
import OrderExportDialog from '@/components/orders/OrderExportDialog'

// ============ Helpers ============

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi })
}

const getStatusConfig = (status: OrderStatus) => {
  const configs: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    pending: { label: 'Chờ xử lý', variant: 'outline', icon: <IconLoader2 className="h-3 w-3" /> },
    paid: { label: 'Đã thanh toán', variant: 'default', icon: <IconCheck className="h-3 w-3" /> },
    shipped: { label: 'Đang giao', variant: 'secondary', icon: <IconTruck className="h-3 w-3" /> },
    delivered: { label: 'Hoàn thành', variant: 'default', icon: <IconPackage className="h-3 w-3" /> },
    cancelled: { label: 'Đã hủy', variant: 'destructive', icon: <IconX className="h-3 w-3" /> },
  }
  return configs[status] || configs.pending
}

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    Bank: 'Chuyển khoản',
    Crypto: 'Crypto',
    COD: 'COD',
  }
  return labels[method] || method
}

// ============ Default Filters ============

const defaultFilters: OrderListFilters = {
  page: 1,
  limit: 20,
  status: 'all',
  sort: 'newest',
}

// ============ Component ============

export default function OrdersPage() {
  // State
  const [filters, setFilters] = useState<OrderListFilters>(defaultFilters)
  const [searchInput, setSearchInput] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [statusToUpdate, setStatusToUpdate] = useState<{ id: string; status: OrderStatus } | null>(null)
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Debounce search
  const debouncedSearch = useDebounce(searchInput, 500)

  // Memoized filters with debounced search
  const queryFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch || undefined,
  }), [filters, debouncedSearch])

  // Queries
  const { data: orderData, isLoading, refetch, isFetching } = useOrderList(queryFilters)
  const { data: orderDetail, isLoading: isLoadingDetail } = useOrderDetail(selectedOrderId || undefined)
  const { updateStatus, deleteOrder } = useOrderMutations()

  // Handlers
  const handleFiltersChange = (updates: Partial<OrderListFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...updates,
      page: updates.page ?? 1, // Reset to page 1 when filters change
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleStatusUpdate = async () => {
    if (!statusToUpdate) return

    try {
      await updateStatus.mutateAsync(statusToUpdate)
      toast.success(`Đã cập nhật trạng thái thành "${getStatusConfig(statusToUpdate.status).label}"`)
      setStatusToUpdate(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  const handleCancelOrder = async () => {
    if (!orderToCancel) return

    try {
      await deleteOrder.mutateAsync(orderToCancel)
      toast.success('Đã hủy đơn hàng')
      setOrderToCancel(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể hủy đơn hàng')
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrderId(order._id)
  }

  // Data
  const orders = orderData?.data || []
  const pagination = orderData?.pagination
  const stats = orderData?.stats

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn hàng</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <IconDownload className="mr-2 h-4 w-4" />
              Xuất File
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <IconRefresh className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filters.status === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleFiltersChange({ status: 'all' })}
          >
            Tất cả ({stats?.total || 0})
          </Badge>
          <Badge
            variant={filters.status === 'pending' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleFiltersChange({ status: 'pending' })}
          >
            Chờ xử lý ({stats?.pending || 0})
          </Badge>
          <Badge
            variant={filters.status === 'paid' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => handleFiltersChange({ status: 'paid' })}
          >
            Đã thanh toán ({stats?.paid || 0})
          </Badge>
          <Badge
            variant={filters.status === 'shipped' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => handleFiltersChange({ status: 'shipped' })}
          >
            Đang giao ({stats?.shipped || 0})
          </Badge>
          <Badge
            variant={filters.status === 'delivered' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => handleFiltersChange({ status: 'delivered' })}
          >
            Hoàn thành ({stats?.delivered || 0})
          </Badge>
          <Badge
            variant={filters.status === 'cancelled' ? 'default' : 'destructive'}
            className="cursor-pointer"
            onClick={() => handleFiltersChange({ status: 'cancelled' })}
          >
            Đã hủy ({stats?.cancelled || 0})
          </Badge>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã đơn, email, tên khách hàng..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.sort}
                onValueChange={(value) => handleFiltersChange({ sort: value as OrderListFilters['sort'] })}
              >
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

            {/* Table */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Không tìm thấy đơn hàng nào
              </div>
            ) : (
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
                                {order.user?.firstName || order.user?.username || 'N/A'} {order.user?.lastName || ''}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {order.user?.email}
                              </div>
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
                          <TableCell className="font-medium">
                            {formatCurrency(order.totalPrice)}
                          </TableCell>
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
                                <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                  <IconEye className="mr-2 h-4 w-4" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Cập nhật trạng thái</DropdownMenuLabel>
                                {order.status === 'pending' && (
                                  <DropdownMenuItem
                                    onClick={() => setStatusToUpdate({ id: order._id, status: 'paid' })}
                                  >
                                    <IconCheck className="mr-2 h-4 w-4" />
                                    Đánh dấu đã thanh toán
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'paid' && (
                                  <DropdownMenuItem
                                    onClick={() => setStatusToUpdate({ id: order._id, status: 'shipped' })}
                                  >
                                    <IconTruck className="mr-2 h-4 w-4" />
                                    Đánh dấu đang giao
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'shipped' && (
                                  <DropdownMenuItem
                                    onClick={() => setStatusToUpdate({ id: order._id, status: 'delivered' })}
                                  >
                                    <IconPackage className="mr-2 h-4 w-4" />
                                    Đánh dấu hoàn thành
                                  </DropdownMenuItem>
                                )}
                                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => setOrderToCancel(order._id)}
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
            )}

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
                    onClick={() => handlePageChange(pagination.page - 1)}
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
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chi tiết đơn hàng #{selectedOrderId?.slice(-8).toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              {orderDetail?.data && `Tạo lúc ${formatDate(orderDetail.data.createdAt)}`}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : orderDetail?.data && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="font-semibold mb-2">Thông tin khách hàng</h4>
                <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Tên:</span> {orderDetail.data.user?.firstName} {orderDetail.data.user?.lastName}</p>
                  <p><span className="text-muted-foreground">Email:</span> {orderDetail.data.user?.email}</p>
                  <p><span className="text-muted-foreground">SĐT:</span> {orderDetail.data.shippingAddress?.phone}</p>
                  <p><span className="text-muted-foreground">Địa chỉ:</span> {orderDetail.data.shippingAddress?.street}, {orderDetail.data.shippingAddress?.city}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-2">Sản phẩm ({orderDetail.data.orderItems.length})</h4>
                <div className="space-y-2">
                  {orderDetail.data.orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-muted rounded-lg p-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.color} / {item.size} • SKU: {item.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.price)}</p>
                        <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính:</span>
                  <span>{formatCurrency(orderDetail.data.totalPrice - orderDetail.data.shippingPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí vận chuyển:</span>
                  <span>{formatCurrency(orderDetail.data.shippingPrice)}</span>
                </div>
                {orderDetail.data.appliedGiftCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mã giảm giá:</span>
                    <span className="text-green-600">-{orderDetail.data.appliedGiftCode}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(orderDetail.data.totalPrice)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex gap-4 text-sm">
                <Badge variant="outline">
                  {getPaymentMethodLabel(orderDetail.data.paymentMethod)}
                </Badge>
                <Badge variant={getStatusConfig(orderDetail.data.status).variant}>
                  {getStatusConfig(orderDetail.data.status).label}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Status Update Dialog */}
      <AlertDialog open={!!statusToUpdate} onOpenChange={() => setStatusToUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận cập nhật trạng thái</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "{statusToUpdate && getStatusConfig(statusToUpdate.status).label}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Cancel Order Dialog */}
      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.
              Tồn kho sẽ được hoàn lại cho các sản phẩm trong đơn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={deleteOrder.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrder.isPending ? 'Đang xử lý...' : 'Hủy đơn hàng'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <OrderExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
    </AdminLayout>
  )
}
