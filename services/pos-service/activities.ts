import { Context, log, sleep } from '@temporalio/activity'
import { idempotencyKey } from '../shared/idempotency'
import { updateOrderStatus } from '../shared/status-client'
import type { Order } from '../../src/types'

export async function submitOrderToPos(order: Order): Promise<void> {
  const { attempt } = Context.current().info
  const maxAttempts = Number(process.env.DEMO_MAX_ATTEMPTS ?? 3)
  const failuresBeforeSuccess = Number(
    process.env.DEMO_POS_FAILURES_BEFORE_SUCCESS ?? 1,
  )
  const key = idempotencyKey('submit-pos', order.orderId)

  await updateOrderStatus(
    order.orderId,
    'submitting_pos',
    `Submitting order to POS (attempt ${attempt} of ${maxAttempts})`,
    {
      paymentAuthorized: true,
      attempt,
      maxAttempts,
    },
  )

  log.info('submitting order to POS', {
    orderId: order.orderId,
    idempotencyKey: key,
  })

  Context.current().heartbeat({ attempt, stage: 'pos' })
  await sleep(700)

  if (attempt <= failuresBeforeSuccess) {
    throw new Error('Simulated temporary POS failure')
  }
}

export async function voidPosOrder({
  orderId,
}: {
  orderId: string
}): Promise<void> {
  const { attempt } = Context.current().info
  const maxAttempts = Number(process.env.DEMO_MAX_ATTEMPTS ?? 3)
  const key = idempotencyKey('void-pos', orderId)

  await updateOrderStatus(
    orderId,
    'voiding_pos',
    `Voiding POS ticket (attempt ${attempt} of ${maxAttempts})`,
    { paymentAuthorized: true, attempt, maxAttempts },
  )

  log.info('voiding POS ticket', {
    orderId,
    idempotencyKey: key,
  })

  Context.current().heartbeat({ attempt, stage: 'void-pos' })
  await sleep(500)
}
