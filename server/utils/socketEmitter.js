import logger from '../config/logger.js'

export const emitOrderUpdate = (io, order) => {
  if (!io || !order || !order.user) return

  try {
    const userId = order.user._id ? order.user._id.toString() : order.user.toString()

    const payload = {
      orderId: order._id?.toString(),
      status: order.status,
      trackingNumber: order.trackingNumber,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      estimatedDelivery: order.estimatedDelivery,
      updatedAt: order.updatedAt,
      createdAt: order.createdAt,
    }

    io.to(`user:${userId}`).emit('order:status-updated', payload)
  } catch (error) {
    logger.error('emitOrderUpdate failed', {
      orderId: order?._id,
      error: error.message,
    })
  }
}
