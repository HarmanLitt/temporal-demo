import { Context, log, sleep } from '@temporalio/activity'
import { idempotencyKey } from '../shared/idempotency'
import { updateOrderStatus } from '../shared/status-client'
import type { Order } from '../../src/types'

export async function waitForRestaurantAcceptance(order: Order): Promise<void> {
  const { attempt } = Context.current().info
  const maxAttempts = Number(process.env.DEMO_MAX_ATTEMPTS ?? 3)
  const acceptanceDelayMs = Number(
    process.env.DEMO_RESTAURANT_ACCEPTANCE_DELAY_MS ?? 3_000,
  )
  const acceptanceTimeoutMs = Number(
    process.env.DEMO_RESTAURANT_ACCEPTANCE_TIMEOUT_MS ?? 8_000,
  )
  const key = idempotencyKey('accept-restaurant', order.orderId)

  log.info('requesting restaurant acceptance', {
    orderId: order.orderId,
    idempotencyKey: key,
  })

  await updateOrderStatus(
    order.orderId,
    'waiting_restaurant',
    `Waiting for restaurant acceptance (attempt ${attempt} of ${maxAttempts})`,
    { paymentAuthorized: true, attempt, maxAttempts },
  )

  const startedAt = Date.now()
  while (Date.now() - startedAt < acceptanceDelayMs) {
    // what is the purpose of throttling the heartbeats? Is it just keeping the load lower?
    Context.current().heartbeat({
      elapsedMs: Date.now() - startedAt,
      stage: 'restaurant',
    })
    if (Date.now() - startedAt >= acceptanceTimeoutMs) {
      throw new Error('Restaurant acceptance timed out')
    }
    await sleep(200)
  }
}
