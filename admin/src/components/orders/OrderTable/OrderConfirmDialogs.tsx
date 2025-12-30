/**
 * Order Confirmation Dialogs Component
 * Alert dialogs for status update and cancel confirmation
 */
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
import { getStatusConfig } from './types'
import type { OrderStatus } from '@/hooks/useOrders'

interface StatusUpdateDialogProps {
  statusToUpdate: { id: string; status: OrderStatus } | null
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function StatusUpdateDialog({
  statusToUpdate,
  isPending,
  onConfirm,
  onCancel,
}: StatusUpdateDialogProps) {
  return (
    <AlertDialog open={!!statusToUpdate} onOpenChange={() => onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận cập nhật trạng thái</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "
            {statusToUpdate && getStatusConfig(statusToUpdate.status).label}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Đang xử lý...' : 'Xác nhận'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface CancelOrderDialogProps {
  orderToCancel: string | null
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function CancelOrderDialog({
  orderToCancel,
  isPending,
  onConfirm,
  onCancel,
}: CancelOrderDialogProps) {
  return (
    <AlertDialog open={!!orderToCancel} onOpenChange={() => onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn hủy đơn hàng này? Thao tác này không thể hoàn tác. Tồn kho sẽ được hoàn
            lại cho các sản phẩm trong đơn.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Không</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Đang xử lý...' : 'Hủy đơn hàng'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
