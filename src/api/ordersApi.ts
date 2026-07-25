import type {
  Order,
  OrderAccepted,
  OrderStatus,
  OrderStatusUpdate,
} from '../types'
import { requestJson } from './http'

export async function submitOrder(order: Order): Promise<OrderAccepted> {
  return requestJson<OrderAccepted>('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(order),
  })
}

export async function fetchOrderStatus(orderId: string): Promise<OrderStatus> {
  return requestJson<OrderStatus>(
    `/api/order-status/${encodeURIComponent(orderId)}`,
  )
}

export async function cancelOrder(
  orderId: string,
  restaurantId: string,
): Promise<OrderStatusUpdate> {
  return requestJson<OrderStatusUpdate>(
    `/api/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ restaurantId }),
    },
  )
}
