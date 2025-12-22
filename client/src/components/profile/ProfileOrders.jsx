import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useMyOrders } from '../../hooks/useOrders'
import { useAuthStore } from '../../stores/useAuthStore'
import { queryKeys } from '../../lib/queryClient'
import { getSocket } from '../../lib/socket'
import styles from './ProfileOrders.module.css'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const statusText = {
  all: 'All',
  pending: 'Pending',
  paid: 'Processing',
  shipped: 'Shipping',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
const flow = ['pending', 'paid', 'shipped', 'delivered']
const formatDate = (v) => (v ? format(new Date(v), 'MM/dd HH:mm', { locale: enUS }) : '—')

function Timeline({ order }) {
  const currentIndex = flow.indexOf(order.status)
  const steps = [
    { key: 'pending', label: 'Ordered', at: order.createdAt },
    { key: 'paid', label: 'Paid', at: order.paidAt },
    { key: 'shipped', label: 'Shipping', at: order.shippedAt || order.estimatedDelivery },
    { key: 'delivered', label: 'Delivered', at: order.deliveredAt },
  ]

  return (
    <div className={styles.timeline}>
      {steps.map((step, idx) => {
        const active = currentIndex >= idx && order.status !== 'cancelled'
        return (
          <div key={step.key} className={styles.step}>
            <div className={`${styles.dot} ${active ? styles.dotActive : ''}`} />
            <div className={styles.stepLabel}>{step.label}</div>
            <div className={styles.stepTime}>{formatDate(step.at)}</div>
            {idx < steps.length - 1 && <div className={`${styles.line} ${active ? styles.lineActive : ''}`} />}
          </div>
        )
      })}
    </div>
  )
}

function DetailPanel({ order, showTimeline = false }) {
  if (!order) {
    return (
      <div className={styles.detailPlaceholder}>
        <div className={styles.placeholderTitle}>Select an order to view details</div>
        <p className={styles.subtle}>Details and status will be shown here.</p>
      </div>
    )
  }

  const totalItems = order.orderItems?.reduce((s, i) => s + (i.quantity || 0), 0) || 0

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
          <div className={styles.amount}>{currency.format(order.totalPrice || 0)}</div>
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
        {order.orderItems?.map((item, idx) => (
          <div key={idx} className={styles.itemRow}>
            <div>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.subtle}>{item.color} / {item.size} • x{item.quantity}</div>
            </div>
            <div className={styles.amount}>{currency.format(item.price)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ShipStatusStrip({ order }) {
  if (!order) return null
  return (
    <div className={styles.shipStrip}>
      <div className={styles.stripHeader}>
        <div>
          <div className={styles.code}>#{order._id.slice(-8).toUpperCase()}</div>
          <div className={styles.subtle}>Ordered at {formatDate(order.createdAt)}</div>
        </div>
        <div className={styles.stripMeta}>
          <span>Tracking: {order.trackingNumber || 'Processing'}</span>
          <span>Items: {order.orderItems?.reduce((s, i) => s + (i.quantity || 0), 0) || 0}</span>
        </div>
      </div>
      <Timeline order={order} />
    </div>
  )
}

export default function ProfileOrders() {
  const queryClient = useQueryClient()
  // Atomic selectors
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { data, isLoading, error } = useMyOrders()
  const orders = data?.data || []
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortMode, setSortMode] = useState('newest')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = useMemo(() => {
    let list = [...orders]
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter)
    if (dateFilter) {
      const target = new Date(dateFilter)
      list = list.filter((o) => {
        const d = new Date(o.createdAt)
        return d.toDateString() === target.toDateString()
      })
    }
    list.sort((a, b) => (sortMode === 'newest' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt)))
    return list
  }, [orders, statusFilter, sortMode, dateFilter])

  const selectedOrder = filtered.find((o) => o._id === selectedId) || filtered[0]

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined

    const socket = getSocket(token)
    if (!socket) return undefined

    const handleOrderUpdate = (payload) => {
      queryClient.setQueriesData({ queryKey: queryKeys.orders.all }, (existing) => {
        if (!existing?.data) return existing
        const nextData = existing.data.map((order) =>
          order._id === payload.orderId ? { ...order, ...payload } : order
        )
        return { ...existing, data: nextData }
      })

      if (payload?.orderId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(payload.orderId) })
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    }

    socket.on('order:status-updated', handleOrderUpdate)

    return () => {
      socket.off('order:status-updated', handleOrderUpdate)
    }
  }, [isAuthenticated, token, queryClient])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Your Orders</h2>
          <p className={styles.note}>Page auto-refreshes for active shipments.</p>
        </div>
      </div>

      {error && <div className={styles.error}>Failed to load orders. Please try again.</div>}

      <div className={styles.heroAreaDesktop}>
        <ShipStatusStrip order={selectedOrder} />
      </div>

      <div className={styles.heroAreaMobile}>
        <DetailPanel order={selectedOrder} showTimeline />
      </div>

      {isLoading && (
        <div className={styles.skeletonRow}>
          <div className={styles.skeletonBox} />
          <div className={styles.skeletonBox} />
        </div>
      )}

      {!isLoading && !orders.length && !error && (
        <div className={styles.empty}>
          <div>No orders found.</div>
          <div className={styles.subtle}>Your order history will appear here.</div>
        </div>
      )}

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
                    <tr key={order._id} onClick={() => setSelectedId(order._id)} className={selectedOrder?._id === order._id ? styles.rowActive : ''}>
                      <td>#{order._id.slice(-8).toUpperCase()}</td>
                      <td className={styles.cellMain}>
                        <div className={styles.itemName}>{order.orderItems?.[0]?.name || 'Order'}</div>
                        <div className={styles.subtle}>{order.orderItems?.length || 0} items</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[`status_${order.status}`] || ''}`}>
                          {statusText[order.status] || order.status}
                        </span>
                      </td>
                      <td className={styles.amount}>{currency.format(order.totalPrice || 0)}</td>
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
  )
}
