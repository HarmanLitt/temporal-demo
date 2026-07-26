import {
  CancellationScope,
  isCancellation,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow'
import type * as activities from './activities'
import {
  paymentActivityOptions,
  posActivityOptions,
  restaurantActivityOptions,
  statusActivityOptions,
} from './policies'
import { cancelOrderSignal } from './signals'
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
  let cancelled = false
  let authorization:
    | Awaited<ReturnType<typeof payment.authorizePayment>>
    | undefined
  let posSubmitted = false
  let activeScope: CancellationScope | undefined

  setHandler(cancelOrderSignal, () => {
    cancelled = true
    activeScope?.cancel()
  })

  await status.seedStatus(order)

  try {
    activeScope = new CancellationScope()
    await activeScope.run(async () => {
      if (cancelled) {
        throw new Error('ORDER_CANCELLED')
      }

      authorization = await payment.authorizePayment({
        orderId: order.orderId,
        amount: order.total,
      })

      if (cancelled) {
        throw new Error('ORDER_CANCELLED')
      }

      await status.publishOrderStatus({
        orderId: order.orderId,
        status: 'payment_authorized',
        message: 'Payment authorized',
        paymentAuthorized: true,
      })

      await pos.submitOrderToPos(order)
      posSubmitted = true

      if (cancelled) {
        throw new Error('ORDER_CANCELLED')
      }

      await restaurant.waitForRestaurantAcceptance(order)

      if (cancelled) {
        throw new Error('ORDER_CANCELLED')
      }

      await status.publishOrderStatus({
        orderId: order.orderId,
        status: 'confirmed',
        message: 'Restaurant accepted the order',
        paymentAuthorized: true,
      })
    })
  } catch (error) {
    await compensate(order.orderId, posSubmitted, authorization)

    if (cancelled || isCancellation(error) || isOrderCancelled(error)) {
      await status.publishOrderStatus({
        orderId: order.orderId,
        status: 'cancelled',
        message: describeCancellation(posSubmitted, Boolean(authorization)),
        paymentAuthorized: Boolean(authorization),
        refunded: Boolean(authorization),
        posVoided: posSubmitted,
      })
      return
    }

    await status.publishOrderStatus({
      orderId: order.orderId,
      status: 'failed',
      message:
        error instanceof Error ? error.message : 'Order fulfillment failed',
      paymentAuthorized: Boolean(authorization),
      refunded: Boolean(authorization),
      posVoided: posSubmitted,
    })
  }
}

async function compensate(
  orderId: string,
  posSubmitted: boolean,
  authorization:
    | Awaited<ReturnType<typeof payment.authorizePayment>>
    | undefined,
): Promise<void> {
  if (posSubmitted) {
    await pos.voidPosOrder({ orderId })
  }

  if (authorization) {
    await payment.refundPayment({
      orderId,
      authorizationId: authorization.authorizationId,
    })
  }
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

function isOrderCancelled(error: unknown): boolean {
  return error instanceof Error && error.message === 'ORDER_CANCELLED'
}
