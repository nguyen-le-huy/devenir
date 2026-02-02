import { useMemo, useState } from 'react';
import { useUserOrders } from '@/features/user/hooks';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import { IOrder, IOrderItem } from '@/features/orders/types';
import FormButton from '@/shared/components/form/FormButton';
import styles from './ProfileOrders.module.css';

/**
 * Status mapping
 */
const statusText: Record<string, string> = {
    all: 'All',
    pending: 'Pending',
    paid: 'Processing',
    shipped: 'Shipping',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const flow = ['pending', 'paid', 'shipped', 'delivered'];

/**
 * Timeline Component
 */
function Timeline({ order }: { order: IOrder }) {
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
                        <div className={styles.stepTime}>{formatDate(step.at, 'MM/dd HH:mm')}</div>
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
 */
function DetailPanel({ order, showTimeline = false }: { order: IOrder | null; showTimeline?: boolean }) {
    if (!order) {
        return (
            <div className={styles.detailPlaceholder}>
                <div className={styles.placeholderTitle}>Select an order to view details</div>
                <p className={styles.subtle}>Details and status will be shown here.</p>
            </div>
        );
    }

    const totalItems = order.orderItems?.reduce((sum: number, item: IOrderItem) =>
        sum + (item.quantity || 0), 0) || 0;

    return (
        <div className={styles.detailCard}>
            <div className={styles.detailHeader}>
                <div>
                    <div className={styles.code}>#{order._id.slice(-8).toUpperCase()}</div>
                    <div className={styles.subtle}>Ordered at {formatDate(order.createdAt, 'MMM d, h:mm a')}</div>
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
                {order.orderItems?.map((item: IOrderItem, idx: number) => (
                    <div key={idx} className={styles.itemRow}>
                        <div>
                            <div className={styles.itemName}>{item.name}</div>
                            <div className={styles.subtle}>
                                {item.variantName ? `${item.variantName} • ` : ''} x{item.quantity}
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
 */
function ShipStatusStrip({ order }: { order: IOrder | null }) {
    if (!order) return null;

    const totalItems = order.orderItems?.reduce((sum: number, item: IOrderItem) =>
        sum + (item.quantity || 0), 0) || 0;

    return (
        <div className={styles.shipStrip}>
            <div className={styles.stripHeader}>
                <div>
                    <div className={styles.code}>#{order._id.slice(-8).toUpperCase()}</div>
                    <div className={styles.subtle}>Ordered at {formatDate(order.createdAt, 'MMM d, h:mm a')}</div>
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
 */
export default function ProfileOrders() {
    const [page, setPage] = useState(1);
    const limit = 5;

    // Note: To implement true server-side pagination here, we'd need to update 
    // useUserOrders to accept pagination params. For now, we'll implement 
    // client-side pagination on the filtered results as a quick win,
    // or update the hook if possible. 
    // Given the previous refactor of OrdersPage used useMyOrders (NOT useUserOrders),
    // and useUserOrders delegates to useMyOrders, we should pass params.
    // However, useUserOrders currently doesn't accept args.
    // Let's rely on client-side pagination for this specific dashboard component 
    // unless we refactor useUserOrders too.

    const { data: rawData, isLoading, error } = useUserOrders();

    // Handle both response structures safely
    const allOrders = useMemo(() => {
        if (!rawData) return [];
        if (Array.isArray(rawData)) return rawData as IOrder[];
        return (rawData as any)?.data || [];
    }, [rawData]);

    const [statusFilter, setStatusFilter] = useState('all');
    const [sortMode, setSortMode] = useState('newest');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Filter & Sort Logic
    const filteredOrders = useMemo(() => {
        let list = [...allOrders];

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
    }, [allOrders, statusFilter, sortMode, dateFilter]);

    // Client-side Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / limit);
    const paginatedOrders = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredOrders.slice(start, start + limit);
    }, [filteredOrders, page, limit]);

    // Reset page when filters change
    useMemo(() => {
        setPage(1);
    }, [statusFilter, dateFilter]);

    const selectedOrder = paginatedOrders.find((order) => order._id === selectedId) || paginatedOrders[0] || null;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Your Orders</h2>
                    <p className={styles.note}>Page auto-refreshes for active shipments.</p>
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    Failed to load orders. Please try again.
                </div>
            )}

            {/* Hero Areas - Only show if we have data */}
            {!isLoading && paginatedOrders.length > 0 && (
                <>
                    <div className={styles.heroAreaDesktop}>
                        <ShipStatusStrip order={selectedOrder} />
                    </div>
                    <div className={styles.heroAreaMobile}>
                        <DetailPanel order={selectedOrder} showTimeline />
                    </div>
                </>
            )}

            {!isLoading && !allOrders.length && !error && (
                <div className={styles.empty}>
                    <div>No orders found.</div>
                    <div className={styles.subtle}>Your order history will appear here.</div>
                </div>
            )}

            {!isLoading && allOrders.length > 0 && (
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
                                    {paginatedOrders.map((order) => (
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
                                            <td>{formatDate(order.createdAt, 'MMM d')}</td>
                                        </tr>
                                    ))}
                                    {paginatedOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className={styles.empty}>
                                                No orders match your filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <FormButton
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => handlePageChange(page - 1)}
                                >
                                    Previous
                                </FormButton>
                                <span className={styles.pageInfo}>
                                    Page {page} of {totalPages}
                                </span>
                                <FormButton
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => handlePageChange(page + 1)}
                                >
                                    Next
                                </FormButton>
                            </div>
                        )}

                    </div>

                    <div className={styles.detailSide}>
                        <DetailPanel order={selectedOrder} />
                    </div>
                </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
                <div className={styles.skeletonContainer}>
                    <div className={styles.skeletonRow} />
                    <div className={styles.skeletonRow} />
                    <div className={styles.skeletonRow} />
                </div>
            )}
        </div>
    );
}
