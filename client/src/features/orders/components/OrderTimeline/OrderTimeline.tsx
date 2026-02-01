import { format } from 'date-fns';
import { IOrder, OrderStatus } from '@/features/orders/types';
import styles from './OrderTimeline.module.css';

interface OrderTimelineProps {
    order: IOrder;
}

const flow = [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

const formatDate = (value: string | undefined) =>
    value ? format(new Date(value), 'MMM d, h:mm a') : '—';

const OrderTimeline = ({ order }: OrderTimelineProps) => {
    const currentIndex = flow.indexOf(order.status);
    const isCancelled = order.status === OrderStatus.CANCELLED;

    const steps = [
        { key: OrderStatus.PENDING, label: 'Placed', at: order.createdAt },
        { key: OrderStatus.PAID, label: 'Paid', at: order.paidAt },
        { key: OrderStatus.SHIPPED, label: 'Shipped', at: order.shippedAt || order.estimatedDelivery },
        { key: OrderStatus.DELIVERED, label: 'Delivered', at: order.deliveredAt },
    ];

    return (
        <div className={styles.timeline}>
            {steps.map((step, idx) => {
                const isActive = isCancelled ? false : currentIndex >= idx && flow.includes(step.key);
                return (
                    <div key={step.key} className={styles.timelineStep}>
                        <div className={`${styles.dot} ${isActive ? styles.dotActive : ''}`} />
                        <div className={styles.timelineLabel}>{step.label}</div>
                        <div className={styles.timelineTime}>{formatDate(step.at)}</div>
                        {idx < steps.length - 1 && (
                            <div className={`${styles.line} ${isActive ? styles.lineActive : ''}`} />
                        )}
                    </div>
                );
            })}
            {isCancelled && <div className={styles.cancelNote}>Order Cancelled</div>}
        </div>
    );
};

export default OrderTimeline;
