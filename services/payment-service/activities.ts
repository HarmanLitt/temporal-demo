import { Context, log, sleep } from '@temporalio/activity'
import { idempotencyKey } from '../shared/idempotency'
import { updateOrderStatus } from '../shared/status-client'

export type AuthorizePaymentInput = {
  orderId: string
  amount: number
}

export type PaymentAuthorization = {
  authorizationId: string
  idempotencyKey: string
  authorizedAt: string
}

export type RefundPaymentInput = {
  orderId: string
  authorizationId: string
}

export type PaymentRefund = {
  refundId: string
  idempotencyKey: string
  refundedAt: string
}

const failuresBeforeSuccess = Number(
  process.env.DEMO_PAYMENT_FAILURES_BEFORE_SUCCESS ?? 0,
)

export async function authorizePayment({
  orderId,
  amount,
}: AuthorizePaymentInput): Promise<PaymentAuthorization> {
  const { attempt } = Context.current().info
  const maxAttempts = Number(process.env.DEMO_MAX_ATTEMPTS ?? 3)
  const key = idempotencyKey('authorize-payment', orderId)

  await updateOrderStatus(
    orderId,
    'authorizing_payment',
    `Authorizing payment (attempt ${attempt} of ${maxAttempts})`,
    { attempt, maxAttempts },
  )

  log.info('authorizing payment', {
    orderId,
    amount,
    idempotencyKey: key,
  })

  Context.current().heartbeat({ attempt, stage: 'authorize' })
  await sleep(700)

  if (attempt <= failuresBeforeSuccess) {
    throw new Error('Simulated temporary payment failure')
  }

  return {
    authorizationId: `authorization:${orderId}`,
    idempotencyKey: key,
    authorizedAt: new Date().toISOString(),
  }
}

export async function refundPayment({
  orderId,
  authorizationId,
}: RefundPaymentInput): Promise<PaymentRefund> {
  const key = idempotencyKey('refund-payment', orderId)

  await updateOrderStatus(
    orderId,
    'refunding',
    'Refunding authorized payment',
    { paymentAuthorized: true },
  )

  log.info('refunding payment', {
    orderId,
    authorizationId,
    idempotencyKey: key,
  })

  Context.current().heartbeat({ stage: 'refund' })
  await sleep(600)

  return {
    refundId: `refund:${authorizationId}`,
    idempotencyKey: key,
    refundedAt: new Date().toISOString(),
  }
}
