import { orderStatusBaseUrl } from './temporal'
import type { Order, OrderStatusUpdate } from '../../src/types'
import { buildStatusUpdate } from './status'
import type { OrderStage } from '../../src/types'

async function requestJson(
  path: string,
  init: RequestInit,
): Promise<void> {
  const response = await fetch(`${orderStatusBaseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Status service ${path} failed (${response.status}): ${body}`,
    )
  }
}

export async function seedOrderStatus(order: Order): Promise<void> {
  await requestJson('/internal/order-status', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStage,
  message: string,
  changes: Omit<
    OrderStatusUpdate,
    'orderId' | 'status' | 'message' | 'updatedAt'
  > = {},
): Promise<void> {
  const update = buildStatusUpdate(orderId, status, message, changes)
  await requestJson(`/internal/order-status/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  })
}
