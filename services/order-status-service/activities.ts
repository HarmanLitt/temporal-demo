import { seedOrderStatus, updateOrderStatus } from '../shared/status-client'
import type { Order, OrderStage } from '../../src/types'

export async function seedStatus(order: Order): Promise<void> {
  await seedOrderStatus(order)
}

export async function publishOrderStatus(input: {
  orderId: string
  status: OrderStage
  message: string
  paymentAuthorized?: boolean
  refunded?: boolean
  posVoided?: boolean
  attempt?: number
  maxAttempts?: number
}): Promise<void> {
  const { orderId, status, message, ...changes } = input
  await updateOrderStatus(orderId, status, message, changes)
}
