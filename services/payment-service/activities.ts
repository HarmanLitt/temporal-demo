import { Context, sleep } from '@temporalio/activity'

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

  const idempotencyKey = `authorize:${orderId}`

  console.info('[payment-activity] authorizing payment', {
    orderId,
    amount,
    attempt,
    idempotencyKey,
  })

  await sleep(700)

  if (attempt <= failuresBeforeSuccess) {
    throw new Error('Simulated temporary payment failure')
  }

  return {
    authorizationId: `authorization:${orderId}`,
    idempotencyKey,
    authorizedAt: new Date().toISOString(),
  }
}

export async function refundPayment({
  orderId,
  authorizationId,
}: RefundPaymentInput): Promise<PaymentRefund> {

  const idempotencyKey = `refund:${orderId}`

  console.info('[payment-activity] refunding payment', {
    orderId,
    authorizationId,
    idempotencyKey,
  })

  await sleep(600)

  return {
    refundId: `refund:${authorizationId}`,
    idempotencyKey,
    refundedAt: new Date().toISOString(),
  }
}
