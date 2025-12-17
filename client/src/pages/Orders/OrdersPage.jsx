import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useMyOrders } from '../../hooks/useOrders'
import styles from './OrdersPage.module.css'

const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const statusText = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
}

const flow = ['pending', 'paid', 'shipped', 'delivered']

const formatDate = (value) => (value ? format(new Date(value), 'dd/MM HH:mm', { locale: vi }) : '—')

const OrderTimeline = ({ order }) => {
  const currentIndex = flow.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  const steps = [
    { key: 'pending', label: 'Đặt hàng', at: order.createdAt },
    { key: 'paid', label: 'Thanh toán', at: order.paidAt },
    { key: 'shipped', label: 'Đang giao', at: order.shippedAt || order.estimatedDelivery },
    { key: 'delivered', label: 'Đã giao', at: order.deliveredAt },
  ]

  return (
    <div className={styles.timeline}>
      {steps.map((step, idx) => {
        const isActive = isCancelled ? false : currentIndex >= idx && flow.includes(step.key)
        return (
          <div key={step.key} className={styles.timelineStep}>
            <div className={`${styles.dot} ${isActive ? styles.dotActive : ''}`} />
            <div className={styles.timelineLabel}>{step.label}</div>
            <div className={styles.timelineTime}>{formatDate(step.at)}</div>
            {idx < steps.length - 1 && <div className={`${styles.line} ${isActive ? styles.lineActive : ''}`} />}
          </div>
        )
      })}
      {isCancelled && <div className={styles.cancelNote}>Đơn đã hủy</div>}
    </div>
  )
}

const OrderCard = ({ order }) => {
  const primaryItem = order.orderItems?.[0]
  const totalItems = order.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
  const eta = order.estimatedDelivery || order.shippedAt

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.orderCode}>#{order._id.slice(-8).toUpperCase()}</div>
          <div className={styles.subtle}>Đặt lúc {formatDate(order.createdAt)}</div>
        </div>
        <div className={`${styles.badge} ${styles[`status_${order.status}`] || ''}`}>
          {statusText[order.status] || order.status}
        </div>
      </div>

      <div className={styles.orderInfo}>
        <div>
          <div className={styles.itemName}>{primaryItem?.name || 'Đơn hàng'}</div>
          <div className={styles.subtle}>
            {primaryItem?.variantName ? `${primaryItem.variantName} • ` : ''}
            {totalItems} sản phẩm
          </div>
        </div>
        <div className={styles.amount}>{formatter.format(order.totalPrice || 0)}</div>
      </div>

      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>Thanh toán</div>
          <div className={styles.metaValue}>{order.paymentMethod || '—'}</div>
        </div>
        <div>
          <div className={styles.metaLabel}>Mã vận đơn</div>
          <div className={styles.metaValue}>{order.trackingNumber || 'Đang tạo'}</div>
        </div>
        <div>
          <div className={styles.metaLabel}>Dự kiến giao</div>
          <div className={styles.metaValue}>{formatDate(eta)}</div>
        </div>
      </div>

      <OrderTimeline order={order} />
    </div>
  )
}

export default function OrdersPage() {
  const { data, isLoading, error } = useMyOrders()
  const orders = data?.data || []

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Theo dõi đơn hàng</p>
          <h1 className={styles.title}>Trạng thái vận chuyển</h1>
          <p className={styles.subtitle}>Cập nhật realtime dự kiến giao và trạng thái giao hàng.</p>
        </div>
      </div>

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className={styles.skeleton} />
          ))}
        </div>
      )}

      {error && <div className={styles.error}>Không tải được đơn hàng. Vui lòng thử lại.</div>}

      {!isLoading && !orders.length && !error && (
        <div className={styles.empty}>
          <h3>Chưa có đơn hàng</h3>
          <p>Bạn sẽ thấy đơn hàng ở đây sau khi thanh toán thành công.</p>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className={styles.grid}>
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
