import {
  createKafka,
  createProducer,
  ensureTopics,
  topics,
} from '../shared/kafka'
import { idempotencyKey } from '../shared/idempotency'
import { delay, retry } from '../shared/retry'
import { posRetryPolicy } from '../shared/retry-policies'
import { publishStatus } from '../shared/status'
import type { Order, OrderCancellationRequested } from '../../src/types'

const failuresBeforeSuccess = Number(
  process.env.DEMO_POS_FAILURES_BEFORE_SUCCESS ?? 1,
)

const kafka = createKafka('quickbite-pos-service')
await ensureTopics(kafka)
const producer = await createProducer(kafka)

const paymentConsumer = kafka.consumer({ groupId: 'quickbite-pos-service' })

const cancellationConsumer = kafka.consumer({
  groupId: 'quickbite-pos-cancellations',
})

const cancelledOrders = new Set<string>()

await paymentConsumer.connect()
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
  },
})

await paymentConsumer.subscribe({
  topic: topics.paymentAuthorized,
  fromBeginning: false,
})
await paymentConsumer.run({
  eachMessage: async ({ message }) => {
    const order = JSON.parse(message.value?.toString('utf8') ?? '{}') as Order

    if (cancelledOrders.has(order.orderId)) return

    try {
      const posIdempotencyKey = idempotencyKey('submit-pos', order.orderId)

      await retry({
        label: 'Submitting order to POS',
        policy: posRetryPolicy,
        onAttempt: (attempt) =>
          publishStatus(
            producer,
            message.key,
            order.orderId,
            'submitting_pos',
            `Submitting order to POS (attempt ${attempt} of ${posRetryPolicy.maximumAttempts})`,
            {
              paymentAuthorized: true,
              attempt,
              maxAttempts: posRetryPolicy.maximumAttempts,
            },
          ),
        onRetry: (attempt) =>
          publishStatus(
            producer,
            message.key,
            order.orderId,
            'submitting_pos',
            'POS submission failed; retrying automatically',
            {
              paymentAuthorized: true,
              attempt,
              maxAttempts: posRetryPolicy.maximumAttempts,
            },
          ),
        operation: async (attempt) => {
          console.info('[pos-service] submitting order', {
            orderId: order.orderId,
            attempt,
            idempotencyKey: posIdempotencyKey,
          })
          await delay(700)
          if (attempt <= failuresBeforeSuccess) {
            throw new Error('Simulated temporary POS failure')
          }
        },
      })

      if (cancelledOrders.has(order.orderId)) return

      await producer.send({
        topic: topics.posSubmitted,

        messages: [
          {
            key: message.key,
            value: JSON.stringify(order),
            headers: {
              'idempotency-key': posIdempotencyKey,
            },
          },
        ],
      })
    } catch (error) {
      await publishStatus(
        producer,
        message.key,
        order.orderId,
        'failed',
        error instanceof Error ? error.message : 'POS submission failed',
        { paymentAuthorized: true },
      )
    }
  },
})

console.info('[pos-service] consuming payment events')

async function shutdown(): Promise<void> {

  await Promise.all([
    paymentConsumer.disconnect(),
    cancellationConsumer.disconnect(),
    producer.disconnect(),
  ])
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown().finally(() => process.exit(0))
  })
}
