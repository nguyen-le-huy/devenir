import { useMyOrders } from '@/features/orders/hooks/useOrders';
import OrderCard from '@/features/orders/components/OrderCard/OrderCard';
import { IOrder } from '@/features/orders/types';
import styles from './OrdersPage.module.css';

export default function OrdersPage() {
    const { data, isLoading, error } = useMyOrders();
    // useQuery return type has data property which contains our response structure { data: IOrder[], ... }
    // But check useOrders implementation: it returns data as { data: IOrder[], ... } 
    // so accessing data?.data gets the array.
    const orders = data?.data || [];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Track Orders</p>
                    <h1 className={styles.title}>Shipping Status</h1>
                    <p className={styles.subtitle}>Real-time updates on your delivery status.</p>
                </div>
            </div>

            {isLoading && (
                <div className={styles.grid}>
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className={styles.skeleton} />
                    ))}
                </div>
            )}

            {error && <div className={styles.error}>Failed to load orders. Please try again.</div>}

            {!isLoading && !orders.length && !error && (
                <div className={styles.empty}>
                    <h3>No orders yet</h3>
                    <p>You will see your orders here after a successful checkout.</p>
                </div>
            )}

            {!isLoading && orders.length > 0 && (
                <div className={styles.grid}>
                    {orders.map((order: IOrder) => (
                        <OrderCard key={order._id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
