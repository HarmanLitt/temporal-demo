export type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  category: string
}

export type Modifier = {
  id: string
  name: string
  price: number
  type: 'single' | 'multi'
  group: string
}

export type CartLine = {
  id: string
  menuItem: MenuItem
  modifiers: Modifier[]
  quantity: number
}

export type Order = {
  orderId: string
  restaurantId: string
  items: CartLine[]
  total: number
  restaurant: "McDonald's"
}

export type OrderStage =
  | 'pending'
  | 'authorizing_payment'
  | 'payment_authorized'
  | 'submitting_pos'
  | 'waiting_restaurant'
  | 'cancellation_requested'
  | 'voiding_pos'
  | 'refunding'
  | 'confirmed'
  | 'cancelled'
  | 'failed'

export type OrderStatus = {
  orderId: string
  restaurantId: string
  status: OrderStage
  message: string
  updatedAt: string
  total: number
  restaurant: "McDonald's"
  itemCount: number
  paymentAuthorized: boolean
  refunded: boolean
  posVoided?: boolean
  attempt?: number
  maxAttempts?: number
}

export type OrderStatusUpdate = Pick<
  OrderStatus,
  'orderId' | 'status' | 'message' | 'updatedAt'
> &
  Partial<
    Pick<
      OrderStatus,
      | 'total'
      | 'restaurantId'
      | 'restaurant'
      | 'itemCount'
      | 'paymentAuthorized'
      | 'refunded'
      | 'posVoided'
      | 'attempt'
      | 'maxAttempts'
    >
  >

export type OrderAccepted = OrderStatus & {
  status: 'pending'
}

export type OrderConfirmation = OrderStatus & {
  status: 'confirmed'
}

export type OrderCancellationRequested = {
  orderId: string
  restaurantId: string
  requestedAt: string
}
