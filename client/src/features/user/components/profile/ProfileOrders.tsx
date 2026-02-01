import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useUserOrders } from '@/features/user/hooks';
import { formatCurrency } from '@/features/user/utils';
import styles from './ProfileOrders.module.css';

/**
 * Order type (should be moved to features/orders/types in future)
 */
interface OrderItem {
    name: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
}

interface Order {
    _id: string;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    totalPrice: number;
    paymentMethod?: string;
    trackingNumber?: string;
    orderItems: OrderItem[];
    createdAt: string;
    paidAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    estimatedDelivery?: string;
}

const statusText: Record<string, string> = {
    all: 'All',
    pending: 'Pending',
    paid: 'Processing',
    shipped: 'Shipping',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const flow = ['pending', 'paid', 'shipped', 'delivered'];

const formatDate = (v: string | undefined): string => 
    v ? format(new Date(v), 'MM/dd HH:mm', { locale: enUS }) : '—';

/**
 * Timeline Component
 * Displays order progress timeline
 */
function Timeline({ order }: { order: Order }) {
    const currentIndex = flow.indexOf(order.status);
    const steps = [
        { key: 'pending', label: 'Ordered', at: order.createdAt },
        { key: 'paid', label: 'Paid', at: order.paidAt },
        { key: 'shipped', label: 'Shipping', at: order.shippedAt || order.estimatedDelivery },
        { key: 'delivered', label: 'Delivered', at: order.deliveredAt },
    ];

    return (
        <div className={styles.timeline}>
            {steps.map((step, idx) => {
                const active = currentIndex >= idx && order.status !== 'cancelled';
                return (
                    <div key={step.key} className={styles.step}>
                        <div className={`${styles.dot} ${active ? styles.dotActive : ''}`} />
                        <div className={styles.stepLabel}>{step.label}</div>
                        <div className={styles.stepTime}>{formatDate(step.at)}</div>
                        {idx < steps.length - 1 && (
                            <div className={`${styles.line} ${active ? styles.lineActive : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Detail Panel Component
 * Displays order details and timeline
 */
function DetailPanel({ order, showTimeline = false }: { order: Order | null; showTimeline?: boolean }) {
    if (!order) {
        return (
            <div className={styles.detailPlaceholder}>
                <div className={styles.placeholderTitle}>Select an order to view details</div>
                <p className={styles.subtle}>Details and status will be shown here.</p>
            </div>
        );
    }

    const totalItems = order.orderItems?.reduce((sum: number, item: OrderItem) => 
        sum + (item.quantity || 0), 0) || 0;

    return (
        <div className={styles.detailCard}>
            <div className={styles.detailHeader}>
                <div>
                    <div className={styles.code}>#{order._id.slice(-8).toUpperCase()}</div>
                    <div className={styles.subtle}>Ordered at {formatDate(order.createdAt)}</div>
                </div>
            </div>

            <div className={styles.detailMeta}>
                <div>
                    <div className={styles.metaLabel}>Total</div>
                    <div className={styles.amount}>{formatCurrency(order.totalPrice || 0)}</div>
                </div>
                <div>
                    <div className={styles.metaLabel}>Payment</div>
                    <div className={styles.metaValue}>{order.paymentMethod || '—'}</div>
                </div>
                <div>
                    <div className={styles.metaLabel}>Tracking</div>
                    <div className={styles.metaValue}>{order.trackingNumber || 'Processing'}</div>
                </div>
                <div>
                    <div className={styles.metaLabel}>Items</div>
                    <div className={styles.metaValue}>{totalItems} items</div>
                </div>
            </div>

            {showTimeline && <Timeline order={order} />}

            <div className={styles.itemsList}>
                {order.orderItems?.map((item: OrderItem, idx: number) => (
                    <div key={idx} className={styles.itemRow}>
                        <div>
                            <div className={styles.itemName}>{item.name}</div>
                            <div className={styles.subtle}>
                                {item.color} / {item.size} • x{item.quantity}
                            </div>
                        </div>
                        <div className={styles.amount}>{formatCurrency(item.price)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Ship Status Strip Component
 * Compact order status for mobile/desktop hero area
 */
function ShipStatusStrip({ order }: { order: Order | null }) {
    if (!order) return null;
    
    const totalItems = order.orderItems?.reduce((sum: number, item: OrderItem) => 
        sum + (item.quantity || 0), 0) || 0;
    
    return (
        <div className={styles.shipStrip}>
            <div className={styles.stripHeader}>
                <div>
                    <div className={styles.code}>#{order._id.slice(-8).toUpperCase()}</div>
                    <div className={styles.subtle}>Ordered at {formatDate(order.createdAt)}</div>
                </div>
                <div className={styles.stripMeta}>
                    <span>Tracking: {order.trackingNumber || 'Processing'}</span>
                    <span>Items: {totalItems}</span>
                </div>
            </div>
            <Timeline order={order} />
        </div>
    );
}

/**
 * Profile Orders Component
 * Displays user's order history with realtime socket updates
 * 
 * Features:
 * - Realtime order status updates via Socket.IO
 * - Filtering by status and date
 * - Sorting (newest/oldest)
 * - Mobile/Desktop responsive views
 * - Loading skeleton for better UX
 */
export default function ProfileOrders() {
    // Use the new hook that combines React Query + Socket.IO
    const { data, isLoading, error } = useUserOrders();

    // Handle both response structures: { data: [...] } or direct array
    const orders: Order[] = Array.isArray(data) ? data : (data?.data || []);
    
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortMode, setSortMode] = useState('newest');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Memoized filtered and sorted orders
    const filtered = useMemo(() => {
        let list: Order[] = [...orders];
        
        // Filter by status
        if (statusFilter !== 'all') {
            list = list.filter((order) => order.status === statusFilter);
        }
        
        // Filter by date
        if (dateFilter) {
            const target = new Date(dateFilter);
            list = list.filter((order) => {
                const orderDate = new Date(order.createdAt);
                return orderDate.toDateString() === target.toDateString();
            });
        }
        
        // Sort
        list.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortMode === 'newest' ? dateB - dateA : dateA - dateB;
        });
        
        return list;
    }, [orders, statusFilter, sortMode, dateFilter]);

    const selectedOrder = filtered.find((order) => order._id === selectedId) || filtered[0] || null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Your Orders</h2>
                    <p className={styles.note}>Page auto-refreshes for active shipments.</p>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className={styles.error}>
                    Failed to load orders. Please try again.
                </div>
            )}

            {/* Hero Areas */}
            <div className={styles.heroAreaDesktop}>
                <ShipStatusStrip order={selectedOrder} />
            </div>

            <div className={styles.heroAreaMobile}>
                <DetailPanel order={selectedOrder} showTimeline />
            </div>

            {/* Loading Skeleton */}
            {/* Empty State */}
            {/* Empty State */}
            {!isLoading && !orders.length && !error && (
                <div className={styles.empty}>
                    <div>No orders found.</div>
                    <div className={styles.subtle}>Your order history will appear here.</div>
                </div>
            )}

            {/* Orders Table and Detail */}
            {!isLoading && orders.length > 0 && (
                <div className={styles.layoutSplit}>
                    <div className={styles.tableCard}>
                        <div className={styles.tableToolbar}>
                            <div className={styles.tabs}>
                                {['all', 'paid', 'shipped', 'delivered'].map((key) => (
                                    <button
                                        key={key}
                                        className={`${styles.tab} ${statusFilter === key ? styles.tabActive : ''}`}
                                        onClick={() => setStatusFilter(key)}
                                    >
                                        {statusText[key]}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.filters}>
                                <label className={styles.filterControl}>
                                    <span>Sort by</span>
                                    <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                                        <option value="newest">Newest</option>
                                        <option value="oldest">Oldest</option>
                                    </select>
                                </label>
                                <label className={styles.filterControl}>
                                    <span>Date</span>
                                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                                </label>
                            </div>
                        </div>

                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Product</th>
                                        <th>Status</th>
                                        <th>Total</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((order) => (
                                        <tr
                                            key={order._id}
                                            onClick={() => setSelectedId(order._id)}
                                            className={selectedOrder?._id === order._id ? styles.rowActive : ''}
                                        >
                                            <td>#{order._id.slice(-8).toUpperCase()}</td>
                                            <td className={styles.cellMain}>
                                                <div className={styles.itemName}>
                                                    {order.orderItems?.[0]?.name || 'Order'}
                                                </div>
                                                <div className={styles.subtle}>
                                                    {order.orderItems?.length || 0} items
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${styles[`status_${order.status}`] || ''}`}>
                                                    {statusText[order.status] || order.status}
                                                </span>
                                            </td>
                                            <td className={styles.amount}>
                                                {formatCurrency(order.totalPrice || 0)}
                                            </td>
                                            <td>{formatDate(order.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={styles.detailSide}>
                        <DetailPanel order={selectedOrder} />
                    </div>
                </div>
            )}
        </div>
    );
}
