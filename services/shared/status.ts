import type { Producer } from 'kafkajs'
import { topics } from './kafka'
import type {
  Order,
  OrderAccepted,
  OrderStage,
  OrderStatusUpdate,
} from '../../src/types'

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

export async function publishStatus(
  producer: Producer,
  messageKey: Buffer | string | null,
  orderId: string,
  status: OrderStage,
  message: string,
  changes: Omit<
    OrderStatusUpdate,
    'orderId' | 'status' | 'message' | 'updatedAt'
  > = {},
): Promise<void> {
  const update: OrderStatusUpdate = {
    orderId,
    status,
    message,
    updatedAt: new Date().toISOString(),
    ...changes,
  }

  await producer.send({
    topic: topics.orderStatus,

    messages: [{ key: messageKey, value: JSON.stringify(update) }],
  })
}
