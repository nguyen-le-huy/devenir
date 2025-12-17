import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  IconRefresh,
  IconTruckDelivery,
  IconPackage,
  IconClock,
  IconCheck,
  IconX,
  IconChevronRight,
} from '@tabler/icons-react'

import { AdminLayout } from '@/layouts/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useShipmentList, useShipmentMutations, type ShipmentStatus } from '@/hooks/useShipments'
import { useOrderDetail } from '@/hooks/useOrders'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—')
const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)

export default function ShipmentsPage() {
  const [status, setStatus] = useState<ShipmentStatus>('shipped')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const filters = useMemo(() => ({ status }), [status])
  const { data, isLoading, isFetching, refetch } = useShipmentList(filters)
  const { markDelivered, cancelShipment } = useShipmentMutations()
  const { data: orderDetail, isLoading: isLoadingDetail } = useOrderDetail(selectedOrderId || undefined)

  const shipments = data?.data || []

  const handleDeliver = async (id: string) => {
    try {
      await markDelivered.mutateAsync(id)
      toast.success('Đã xác nhận giao thành công')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật giao hàng')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelShipment.mutateAsync(id)
      toast.success('Đã hủy vận chuyển và hoàn kho')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể hủy vận chuyển')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vận chuyển</h1>
            <p className="text-muted-foreground">Theo dõi đơn đang giao và xác nhận giao hàng.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <IconRefresh className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Danh sách vận chuyển</CardTitle>
              <p className="text-sm text-muted-foreground">Bao gồm các đơn đang giao và đã giao.</p>
            </div>
            <div className="flex gap-2">
              <Select value={status} onValueChange={(value) => setStatus(value as ShipmentStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipped">Đang giao</SelectItem>
                  <SelectItem value="delivered">Đã giao</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 w-full" />
                ))}
              </div>
            ) : shipments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Không có đơn vận chuyển nào.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Giao dự kiến</TableHead>
                      <TableHead>Đã giao</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => {
                      const isDelivered = shipment.status === 'delivered'
                      return (
                        <TableRow key={shipment._id}>
                          <TableCell className="font-mono text-xs">{shipment._id.slice(-8).toUpperCase()}</TableCell>
                          <TableCell>
                            <div className="font-medium">{shipment.user?.firstName || shipment.user?.username || 'Khách'}</div>
                            <div className="text-xs text-muted-foreground">{shipment.user?.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="line-clamp-1 text-sm font-medium">{shipment.orderItems?.[0]?.name || 'Sản phẩm'}</div>
                            {shipment.orderItems.length > 1 && (
                              <div className="text-xs text-muted-foreground">+{shipment.orderItems.length - 1} sản phẩm khác</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isDelivered ? 'secondary' : 'default'} className="gap-1">
                              {isDelivered ? <IconCheck className="h-4 w-4" /> : <IconTruckDelivery className="h-4 w-4" />}
                              {isDelivered ? 'Đã giao' : 'Đang giao'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(shipment.estimatedDelivery)}</TableCell>
                          <TableCell className="text-sm">{formatDate(shipment.deliveredAt)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            {!isDelivered ? (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => handleDeliver(shipment._id)} disabled={markDelivered.isPending}>
                                  <IconPackage className="mr-1 h-4 w-4" />
                                  Đã giao
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleCancel(shipment._id)} disabled={cancelShipment.isPending}>
                                  <IconX className="mr-1 h-4 w-4" />
                                  Hủy
                                </Button>
                              </>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <IconClock className="h-4 w-4" />
                                {shipment.trackingNumber || 'Đã hoàn tất'}
                              </Badge>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setSelectedOrderId(shipment._id)}>
                              Chi tiết
                              <IconChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng #{selectedOrderId?.slice(-8).toUpperCase()}</DialogTitle>
            <DialogDescription>
              {orderDetail?.data && `Tạo lúc ${formatDate(orderDetail.data.createdAt)}`}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : orderDetail?.data ? (
            <div className="space-y-6">
              <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{orderDetail.data.user?.firstName || 'Khách'} {orderDetail.data.user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{orderDetail.data.user?.email}</p>
                  <p className="text-sm">{orderDetail.data.shippingAddress?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{orderDetail.data.shippingAddress?.street}</p>
                  <p className="text-sm text-muted-foreground">{orderDetail.data.shippingAddress?.city}</p>
                  <p className="text-sm text-muted-foreground">Mã vận đơn: {orderDetail.data.trackingNumber || 'Đang tạo'}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Sản phẩm ({orderDetail.data.orderItems.length})</h4>
                <div className="space-y-2">
                  {orderDetail.data.orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border p-3">
                      <img src={item.image} alt={item.name} className="h-14 w-14 rounded object-cover" />
                      <div className="flex-1">
                        <p className="font-medium leading-tight">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.color} / {item.size} • SKU {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.price)}</p>
                        <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatCurrency(orderDetail.data.totalPrice - orderDetail.data.shippingPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span>{formatCurrency(orderDetail.data.shippingPrice)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(orderDetail.data.totalPrice)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
