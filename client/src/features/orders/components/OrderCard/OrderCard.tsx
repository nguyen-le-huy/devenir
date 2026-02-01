import { format } from 'date-fns';
import { IOrder } from '@/features/orders/types';
import OrderTimeline from '../OrderTimeline/OrderTimeline';
import styles from './OrderCard.module.css';

interface OrderCardProps {
    order: IOrder;
}

const formatDate = (value: string | undefined) =>
    value ? format(new Date(value), 'MMM d, yyyy') : '—';

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const OrderCard = ({ order }: OrderCardProps) => {
    const primaryItem = order.orderItems?.[0];
    const totalItems = order.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const eta = order.estimatedDelivery || order.shippedAt;

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div>
                    <div className={styles.orderCode}>#{order._id.slice(-8).toUpperCase()}</div>
                    <div className={styles.subtle}>Placed on {formatDate(order.createdAt)}</div>
                </div>
                <div className={`${styles.badge} ${styles[`status_${order.status}`] || ''}`}>
                    {statusLabels[order.status] || order.status}
                </div>
            </div>

            <div className={styles.orderInfo}>
                <div>
                    <div className={styles.itemName}>{primaryItem?.name || 'Order'}</div>
                    <div className={styles.subtle}>
                        {primaryItem?.variantName ? `${primaryItem.variantName} • ` : ''}
                        {totalItems} item{totalItems !== 1 ? 's' : ''}
                    </div>
                </div>
                <div className={styles.amount}>USD {order.totalPrice.toFixed(2)}</div>
            </div>

            <div className={styles.metaRow}>
                <div>
                    <div className={styles.metaLabel}>Payment</div>
                    <div className={styles.metaValue}>{order.paymentMethod || '—'}</div>
                </div>
                <div>
                    <div className={styles.metaLabel}>Tracking #</div>
                    <div className={styles.metaValue}>{order.trackingNumber || 'Processing...'}</div>
                </div>
                <div>
                    <div className={styles.metaLabel}>Est. Delivery</div>
                    <div className={styles.metaValue}>{formatDate(eta)}</div>
                </div>
            </div>

            <OrderTimeline order={order} />
        </div>
    );
};

export default OrderCard;
