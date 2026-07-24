import { menuItems } from '../mock/menuData'
import { modifiersByMenuItemId } from '../mock/modifierData'
import type { MenuItem, Modifier, Order, OrderConfirmation } from '../types'

const DELAY_MS = 400

function delay(ms = DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock Kafka helpers.
 * Each function pretends to publish a request event and wait for a response event.
 */
export async function requestMenu(): Promise<MenuItem[]> {
  console.info('[kafka] produce: menu.request')
  await delay()
  console.info('[kafka] consume: menu.response', { count: menuItems.length })
  return menuItems
}

export async function requestModifiers(menuItemId: string): Promise<Modifier[]> {
  console.info('[kafka] produce: modifiers.request', { menuItemId })
  await delay()
  const modifiers = modifiersByMenuItemId[menuItemId] ?? []
  console.info('[kafka] consume: modifiers.response', {
    menuItemId,
    count: modifiers.length,
  })
  return modifiers
}

export async function placeOrder(order: Order): Promise<OrderConfirmation> {
  console.info('[kafka] produce: order.place', {
    restaurant: order.restaurant,
    itemCount: order.items.length,
    total: order.total,
  })
  await delay(600)
  const confirmation: OrderConfirmation = {
    orderId: `QB-${Date.now().toString().slice(-8)}`,
    status: 'confirmed',
    total: order.total,
    restaurant: order.restaurant,
    itemCount: order.items.reduce((sum, line) => sum + line.quantity, 0),
  }
  console.info('[kafka] consume: order.confirmed', confirmation)
  return confirmation
}
