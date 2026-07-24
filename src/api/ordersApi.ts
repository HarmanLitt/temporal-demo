import { placeOrder } from '../kafka/mockKafka'
import type { Order, OrderConfirmation } from '../types'

export async function submitOrder(order: Order): Promise<OrderConfirmation> {
  return placeOrder(order)
}
