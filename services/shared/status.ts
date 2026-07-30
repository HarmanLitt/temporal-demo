import type { Order, OrderAccepted, OrderStage, OrderStatusUpdate } from '../../src/types'

export function initialOrderStatus(order: Order): OrderAccepted {
  return {
    orderId: order.orderId,
    restaurantId: order.restaurantId,
    status: 'pending',
    message: 'Order accepted for processing',
    updatedAt: new Date().toISOString(),
    total: order.total,
    restaurant: order.restaurant,
    itemCount: order.items.reduce((sum, line) => sum + line.quantity, 0),
    paymentAuthorized: false,
    refunded: false,
  }
}
// This is for building the status update object. Omit 'orderId' | 'status' | 'message' | 'updatedAt' because 
// they are already included.
export function buildStatusUpdate(
  orderId: string,
  status: OrderStage,
  message: string,
  changes: Omit<
    OrderStatusUpdate,
    'orderId' | 'status' | 'message' | 'updatedAt'
  > = {},
): OrderStatusUpdate {
  return {
    orderId,
    status,
    message,
    updatedAt: new Date().toISOString(),
    ...changes,
  }
}
