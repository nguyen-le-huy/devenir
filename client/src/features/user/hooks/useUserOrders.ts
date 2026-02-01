/**
 * User Orders Hook
 * React Query + Socket.IO integration for realtime order updates
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { queryKeys } from '@/core/lib/queryClient';
import { getSocket } from '@/core/lib/socket';
// Note: Importing from orders feature - consider if this violates feature isolation
// If orders API is stable, this is acceptable. Otherwise, duplicate the interface.
import { useMyOrders } from '@/features/orders/hooks/useOrders';

/**
 * Socket event payload for order status updates
 */
interface OrderUpdatePayload {
  orderId: string;
  status?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
}

/**
 * User orders hook with realtime socket updates
 * 
 * Features:
 * - Fetches user's orders via React Query
 * - Subscribes to Socket.IO for realtime status updates
 * - Auto-invalidates queries on order updates
 * - Handles socket disconnections gracefully
 * 
 * @example
 * const { data: orders, isLoading } = useUserOrders();
 */
export const useUserOrders = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Fetch orders via React Query (delegated to orders feature)
  const ordersQuery = useMyOrders();

  // Socket.IO realtime updates
  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    const socket = getSocket(token);
    if (!socket) {
      console.warn('Socket not available for order updates');
      return undefined;
    }

    /**
     * Handle order status update event
     */
    const handleOrderUpdate = (payload: OrderUpdatePayload) => {
      console.log('Order update received:', payload);

      // Update orders list in cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.orders.all },
        (existing: any) => {
          if (!existing?.data) return existing;

          const nextData = existing.data.map((order: any) =>
            order._id === payload.orderId
              ? { ...order, ...payload }
              : order
          );

          return { ...existing, data: nextData };
        }
      );

      // Invalidate specific order detail
      if (payload.orderId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.detail(payload.orderId),
        });
      }

      // Invalidate orders list for fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.all,
      });
    };

    // Subscribe to socket event
    socket.on('order:status-updated', handleOrderUpdate);

    // Cleanup on unmount
    return () => {
      socket.off('order:status-updated', handleOrderUpdate);
    };
  }, [isAuthenticated, token, queryClient]);

  return ordersQuery;
};
