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
  items: CartLine[]
  total: number
  restaurant: "McDonald's"
}

export type OrderConfirmation = {
  orderId: string
  status: 'confirmed'
  total: number
  restaurant: "McDonald's"
  itemCount: number
}
