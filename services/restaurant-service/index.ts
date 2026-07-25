import {
  createKafka,
  createProducer,
  ensureTopics,
  topics,
} from '../shared/kafka'
import { delay } from '../shared/retry'
import { publishStatus } from '../shared/status'
import type { Order, OrderCancellationRequested } from '../../src/types'

const acceptanceDelayMs = Number(
  process.env.DEMO_RESTAURANT_ACCEPTANCE_DELAY_MS ?? 3_000,
)
const acceptanceTimeoutMs = Number(
  process.env.DEMO_RESTAURANT_ACCEPTANCE_TIMEOUT_MS ?? 8_000,
)

const kafka = createKafka('quickbite-restaurant-service')
await ensureTopics(kafka)
const producer = await createProducer(kafka)

const posConsumer = kafka.consumer({ groupId: 'quickbite-restaurant-service' })

const cancellationConsumer = kafka.consumer({
  groupId: 'quickbite-restaurant-cancellations',
})

const cancelledOrders = new Set<string>()

await posConsumer.connect()
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

await posConsumer.subscribe({
  topic: topics.posSubmitted,
  fromBeginning: false,
})
await posConsumer.run({
  eachMessage: async ({ message }) => {
    const order = JSON.parse(message.value?.toString('utf8') ?? '{}') as Order
    if (cancelledOrders.has(order.orderId)) return

    await publishStatus(
      producer,
      message.key,
      order.orderId,
      'waiting_restaurant',
      'Waiting for restaurant acceptance',
      { paymentAuthorized: true },
    )

    const startedAt = Date.now()
    while (Date.now() - startedAt < acceptanceDelayMs) {
      if (cancelledOrders.has(order.orderId)) return
      if (Date.now() - startedAt >= acceptanceTimeoutMs) {
        await publishStatus(
          producer,
          message.key,
          order.orderId,
          'failed',
          'Restaurant acceptance timed out',
          { paymentAuthorized: true },
        )
        return
      }
      await delay(200)
    }

    if (cancelledOrders.has(order.orderId)) return

    await publishStatus(
      producer,
      message.key,
      order.orderId,
      'confirmed',
      'Restaurant accepted the order',
      { paymentAuthorized: true },
    )
  },
})

console.info('[restaurant-service] consuming POS events')

async function shutdown(): Promise<void> {
  await Promise.all([
    posConsumer.disconnect(),
    cancellationConsumer.disconnect(),
    producer.disconnect(),
  ])
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown().finally(() => process.exit(0))
  })
}
