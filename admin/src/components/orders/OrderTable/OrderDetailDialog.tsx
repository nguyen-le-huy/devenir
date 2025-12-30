/**
 * Order Detail Dialog Component
 * Modal showing full order details
 */
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, getStatusConfig, getPaymentMethodLabel } from './types'
import type { Order } from '@/hooks/useOrders'

interface OrderDetailDialogProps {
  orderId: string | null
  orderData?: Order
  isLoading: boolean
  onClose: () => void
}

export function OrderDetailDialog({
  orderId,
  orderData,
  isLoading,
  onClose,
}: OrderDetailDialogProps) {
  return (
    <Dialog open={!!orderId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn hàng #{orderId?.slice(-8).toUpperCase()}</DialogTitle>
          <DialogDescription>
            {orderData && `Tạo lúc ${formatDate(orderData.createdAt)}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          orderData && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="font-semibold mb-2">Thông tin khách hàng</h4>
                <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Tên:</span> {orderData.user?.firstName}{' '}
                    {orderData.user?.lastName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span> {orderData.user?.email}
                  </p>
                  <p>
                    <span className="text-muted-foreground">SĐT:</span>{' '}
                    {orderData.shippingAddress?.phone}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Địa chỉ:</span>{' '}
                    {orderData.shippingAddress?.street}, {orderData.shippingAddress?.city}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-2">Sản phẩm ({orderData.orderItems.length})</h4>
                <div className="space-y-2">
                  {orderData.orderItems.map((item, idx) => (
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
                  <span>{formatCurrency(orderData.totalPrice - orderData.shippingPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí vận chuyển:</span>
                  <span>{formatCurrency(orderData.shippingPrice)}</span>
                </div>
                {orderData.appliedGiftCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mã giảm giá:</span>
                    <span className="text-green-600">-{orderData.appliedGiftCode}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(orderData.totalPrice)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex gap-4 text-sm">
                <Badge variant="outline">{getPaymentMethodLabel(orderData.paymentMethod)}</Badge>
                <Badge variant={getStatusConfig(orderData.status).variant}>
                  {getStatusConfig(orderData.status).label}
                </Badge>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
