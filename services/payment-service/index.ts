import {
  createKafka,
  createProducer,
  ensureTopics,
  topics,
} from '../shared/kafka'
import { delay, retry } from '../shared/retry'
import { publishStatus } from '../shared/status'
import type { Order, OrderCancellationRequested } from '../../src/types'

const maxAttempts = Number(process.env.DEMO_MAX_ATTEMPTS ?? 3)
const timeoutMs = Number(process.env.DEMO_ACTIVITY_TIMEOUT_MS ?? 2_000)
const failuresBeforeSuccess = Number(
  process.env.DEMO_PAYMENT_FAILURES_BEFORE_SUCCESS ?? 0,
)

const kafka = createKafka('quickbite-payment-service')
await ensureTopics(kafka)

const producer = await createProducer(kafka)

const orderConsumer = kafka.consumer({ groupId: 'quickbite-payment-service' })

const cancellationConsumer = kafka.consumer({
  groupId: 'quickbite-payment-cancellations',
})

const authorizedOrders = new Set<string>()
const cancelledOrders = new Set<string>()

await orderConsumer.connect()
await cancellationConsumer.connect()

await cancellationConsumer.subscribe({
  topic: topics.orderCancellationRequested,
  fromBeginning: false,
})
await cancellationConsumer.run({
  eachMessage: async ({ message }) => {
    const cancellation = JSON.parse(
      message.value?.toString('utf8') ?? '{}',
    ) as OrderCancellationRequested
    cancelledOrders.add(cancellation.orderId)
    console.log('[payment-service] cancellation received', cancellation)
    if (authorizedOrders.has(cancellation.orderId)) {
      console.log('[payment-service] refunding payment', cancellation.orderId)
      await publishStatus(
        producer,
        message.key,
        cancellation.orderId,
        'refunding',
        'Refunding authorized payment',
        { paymentAuthorized: true },
      )
      await delay(600)
      await publishStatus(
        producer,
        message.key,
        cancellation.orderId,
        'cancelled',
        'Order cancelled and payment refunded',
        { paymentAuthorized: true, refunded: true },
      )
      authorizedOrders.delete(cancellation.orderId)
    }
  },
})

await orderConsumer.subscribe({
  topic: topics.orderPlaced,
  fromBeginning: false,
})
await orderConsumer.run({
  eachMessage: async ({ message }) => {
    const order = JSON.parse(message.value?.toString('utf8') ?? '{}') as Order

    if (cancelledOrders.has(order.orderId)) {
      await publishStatus(
        producer,
        message.key,
        order.orderId,
        'cancelled',
        'Order cancelled before payment authorization',
      )
      return
    }

    try {
      await retry({
        label: 'Authorizing payment',
        maxAttempts,
        timeoutMs,
        onAttempt: (attempt) =>
          publishStatus(
            producer,
            message.key,
            order.orderId,
            'authorizing_payment',
            `Authorizing payment (attempt ${attempt} of ${maxAttempts})`,
            { attempt, maxAttempts },
          ),
        onRetry: (attempt) =>
          publishStatus(
            producer,
            message.key,
            order.orderId,
            'authorizing_payment',
            'Payment authorization failed; retrying automatically',
            { attempt, maxAttempts },
          ),
        operation: async (attempt) => {
          await delay(700)
          if (attempt <= failuresBeforeSuccess) {
            throw new Error('Simulated temporary payment failure')
          }
        },
      })

      if (cancelledOrders.has(order.orderId)) {
        await publishStatus(
          producer,
          message.key,
          order.orderId,
          'refunding',
          'Refunding payment after cancellation',
          { paymentAuthorized: true },
        )
        await delay(600)
        await publishStatus(
          producer,
          message.key,
          order.orderId,
          'cancelled',
          'Order cancelled and payment refunded',
          { paymentAuthorized: true, refunded: true },
        )
        return
      }

      authorizedOrders.add(order.orderId)
      await publishStatus(
        producer,
        message.key,
        order.orderId,
        'payment_authorized',
        'Payment authorized',
        { paymentAuthorized: true },
      )

      await producer.send({
        topic: topics.paymentAuthorized,
        messages: [{ key: message.key, value: JSON.stringify(order) }],
      })
    } catch (error) {
      await publishStatus(
        producer,
        message.key,
        order.orderId,
        'failed',
        error instanceof Error ? error.message : 'Payment authorization failed',
      )
    }
  },
})

console.info('[payment-service] consuming order events')

async function shutdown(): Promise<void> {
  await Promise.all([
    orderConsumer.disconnect(),
    cancellationConsumer.disconnect(),
    producer.disconnect(),
  ])
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown().finally(() => process.exit(0))
  })
}
