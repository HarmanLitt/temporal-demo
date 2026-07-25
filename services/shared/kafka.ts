import {
  Kafka,
  logLevel,
  Partitioners,
  type Producer,
} from 'kafkajs'

export const topics = {
  orderPlaced:
    process.env.KAFKA_ORDER_PLACED_TOPIC ?? 'quickbite.order.placed',
  orderStatus:
    process.env.KAFKA_ORDER_STATUS_TOPIC ?? 'quickbite.order.status',
  paymentAuthorized:
    process.env.KAFKA_PAYMENT_AUTHORIZED_TOPIC ??
    'quickbite.payment.authorized',
  posSubmitted:
    process.env.KAFKA_POS_SUBMITTED_TOPIC ?? 'quickbite.pos.submitted',
  orderCancellationRequested:
    process.env.KAFKA_ORDER_CANCELLATION_TOPIC ??
    'quickbite.order.cancellation-requested',
} as const

const topicPartitionCount = Number(process.env.KAFKA_TOPIC_PARTITIONS ?? 3)

export function createKafka(clientId: string): Kafka {
  const username = process.env.KAFKA_USERNAME
  const password = process.env.KAFKA_PASSWORD

  return new Kafka({
    clientId,
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((broker) => broker.trim()),
    ssl: process.env.KAFKA_SSL === 'true' || Boolean(username),
    sasl:
      username && password
        ? { mechanism: 'plain', username, password }
        : undefined,
    logLevel:
      process.env.KAFKA_LOG_LEVEL === 'debug' ? logLevel.DEBUG : logLevel.INFO,
    retry: {
      retries: Number(process.env.KAFKA_CONNECTION_RETRIES ?? 8),
      initialRetryTime: Number(
        process.env.KAFKA_RETRY_INITIAL_INTERVAL_MS ?? 300,
      ),
      maxRetryTime: Number(process.env.KAFKA_RETRY_MAX_INTERVAL_MS ?? 30_000),
      factor: Number(process.env.KAFKA_RETRY_RANDOMIZATION_FACTOR ?? 0.2),
      multiplier: Number(process.env.KAFKA_RETRY_MULTIPLIER ?? 2),
    },
  })
}

export async function ensureTopics(kafka: Kafka): Promise<void> {
  const admin = kafka.admin()
  await admin.connect()

  const topicNames = Object.values(topics)
  const existing = new Set(await admin.listTopics())
  const missing = topicNames.filter((topic) => !existing.has(topic))

  if (missing.length > 0) {
    await admin.createTopics({
      waitForLeaders: true,
      topics: missing.map((topic) => ({
        topic,
        numPartitions: topicPartitionCount,
        replicationFactor: 1,
      })),
    })
  }

  const metadata = await admin.fetchTopicMetadata({ topics: topicNames })
  const undersized = metadata.topics
    .filter((topic) => topic.partitions.length < topicPartitionCount)
    .map((topic) => ({ topic: topic.name, count: topicPartitionCount }))

  if (undersized.length > 0) {
    await admin.createPartitions({ topicPartitions: undersized })
  }

  await admin.disconnect()
}

export async function createProducer(kafka: Kafka): Promise<Producer> {

  const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
    idempotent: true,
    maxInFlightRequests: 1,
    allowAutoTopicCreation: false,
    retry: {
      retries: Number(process.env.KAFKA_PRODUCER_RETRIES ?? 8),
    },
  })
  await producer.connect()
  return producer
}

export function orderKey(orderId: string, restaurantId: string): string {

  return `${restaurantId}-${orderId}`
}
