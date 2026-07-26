import {
  ApplicationFailure,
  CancellationScope,
  isCancellation,
  proxyActivities,
} from '@temporalio/workflow'
import type * as activities from './activities'
import {
  paymentActivityOptions,
  posActivityOptions,
  restaurantActivityOptions,
  statusActivityOptions,
} from './policies'
import type { Order } from '../../src/types'

const status = proxyActivities<
  Pick<typeof activities, 'seedStatus' | 'publishOrderStatus'>
>(statusActivityOptions)

const payment = proxyActivities<
  Pick<typeof activities, 'authorizePayment' | 'refundPayment'>
>({
  ...paymentActivityOptions,
  heartbeatTimeout: '2 seconds',
})

const pos = proxyActivities<
  Pick<typeof activities, 'submitOrderToPos' | 'voidPosOrder'>
>({
  ...posActivityOptions,
  heartbeatTimeout: '2 seconds',
})

const restaurant = proxyActivities<
  Pick<typeof activities, 'waitForRestaurantAcceptance'>
>({
  ...restaurantActivityOptions,
  heartbeatTimeout: '2 seconds',
})

export async function orderFulfillmentWorkflow(order: Order): Promise<void> {
  let authorization:
    | Awaited<ReturnType<typeof payment.authorizePayment>>
    | undefined
  let posSubmitted = false

  try {
    await status.seedStatus(order)

    authorization = await payment.authorizePayment({
      orderId: order.orderId,
      amount: order.total,
    })

    await status.publishOrderStatus({
      orderId: order.orderId,
      status: 'payment_authorized',
      message: 'Payment authorized',
      paymentAuthorized: true,
    })

    await pos.submitOrderToPos(order)
    posSubmitted = true

    await restaurant.waitForRestaurantAcceptance(order)

    await status.publishOrderStatus({
      orderId: order.orderId,
      status: 'confirmed',
      message: 'Restaurant accepted the order',
      paymentAuthorized: true,
    })
  } catch (error) {
    const compensation = await CancellationScope.nonCancellable(async () => {
      const result = await compensate(order.orderId, posSubmitted, authorization)

      if (result.errors.length > 0) {
        await status.publishOrderStatus({
          orderId: order.orderId,
          status: 'failed',
          message: describeCompensationFailure(result, posSubmitted, authorization),
          paymentAuthorized: Boolean(authorization),
          refunded: result.refunded,
          posVoided: result.posVoided,
        })
        return result
      }

      if (isCancellation(error)) {
        await status.publishOrderStatus({
          orderId: order.orderId,
          status: 'cancelled',
          message: describeCancellation(result.posVoided, result.refunded),
          paymentAuthorized: Boolean(authorization),
          refunded: result.refunded,
          posVoided: result.posVoided,
        })
        return result
      }

      await status.publishOrderStatus({
        orderId: order.orderId,
        status: 'failed',
        message:
          error instanceof Error ? error.message : 'Order fulfillment failed',
        paymentAuthorized: Boolean(authorization),
        refunded: result.refunded,
        posVoided: result.posVoided,
      })
      return result
    })

    if (compensation.errors.length > 0) {
      throw ApplicationFailure.create({
        type: 'CompensationFailed',
        nonRetryable: true,
        message: describeCompensationFailure(
          compensation,
          posSubmitted,
          authorization,
        ),
        details: [
          {
            orderId: order.orderId,
            posVoided: compensation.posVoided,
            refunded: compensation.refunded,
            errors: compensation.errors.map(errorMessage),
          },
        ],
      })
    }

    if (isCancellation(error)) {
      throw error
    }
  }
}

type CompensationResult = {
  posVoided: boolean
  refunded: boolean
  errors: unknown[]
}

async function compensate(
  orderId: string,
  posSubmitted: boolean,
  authorization:
    | Awaited<ReturnType<typeof payment.authorizePayment>>
    | undefined,
): Promise<CompensationResult> {
  const result: CompensationResult = {
    posVoided: false,
    refunded: false,
    errors: [],
  }

  if (posSubmitted) {
    try {
      await pos.voidPosOrder({ orderId })
      result.posVoided = true
    } catch (error) {
      result.errors.push(error)
    }
  }

  if (authorization) {
    try {
      await payment.refundPayment({
        orderId,
        authorizationId: authorization.authorizationId,
      })
      result.refunded = true
    } catch (error) {
      result.errors.push(error)
    }
  }

  return result
}

function describeCompensationFailure(
  result: CompensationResult,
  posSubmitted: boolean,
  authorization: unknown,
): string {
  const pending: string[] = []
  if (posSubmitted && !result.posVoided) {
    pending.push('POS ticket void')
  }
  if (authorization && !result.refunded) {
    pending.push('payment refund')
  }
  return `Compensation incomplete (${pending.join(' and ')} failed) — manual intervention required: ${result.errors
    .map(errorMessage)
    .join('; ')}`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function describeCancellation(
  posVoided: boolean,
  refunded: boolean,
): string {
  if (posVoided) {
    return 'Order cancelled — POS ticket voided and payment refunded'
  }
  if (refunded) {
    return 'Order cancelled and payment refunded'
  }
  return 'Order cancelled before payment authorization'
}
