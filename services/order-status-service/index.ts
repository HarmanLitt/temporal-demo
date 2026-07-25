import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import express from 'express'
import { createKafka, ensureTopics, topics } from '../shared/kafka'
import { initialOrderStatus } from '../shared/status'
import type { Order, OrderStatus, OrderStatusUpdate } from '../../src/types'

const port = Number(process.env.ORDER_STATUS_PORT ?? 3002)
const databasePath =
  process.env.ORDER_STATUS_DB_PATH ?? 'data/order-status.db'

mkdirSync(dirname(databasePath), { recursive: true })
const database = new DatabaseSync(databasePath)

database.exec(`
  CREATE TABLE IF NOT EXISTS order_statuses (
    order_id TEXT PRIMARY KEY,
    status_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

const selectStatus = database.prepare(
  'SELECT status_json FROM order_statuses WHERE order_id = ?',
)
const upsertStatus = database.prepare(`
  INSERT INTO order_statuses (order_id, status_json, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(order_id) DO UPDATE SET
    status_json = excluded.status_json,
    updated_at = excluded.updated_at
`)

function readStatus(orderId: string): OrderStatus | undefined {
  const row = selectStatus.get(orderId) as
    | { status_json: string }
    | undefined
  return row ? (JSON.parse(row.status_json) as OrderStatus) : undefined
}

function writeStatus(status: OrderStatus): void {
  upsertStatus.run(
    status.orderId,
    JSON.stringify(status),
    status.updatedAt,
  )
}

function applyUpdate(update: OrderStatusUpdate): void {
  const current = readStatus(update.orderId)

  if (!current) return

  const terminal = ['confirmed', 'cancelled', 'failed'].includes(current.status)
  if (terminal) return

  const cancelling = current.status === 'cancellation_requested'
  const allowedDuringCancellation = ['refunding', 'cancelled', 'failed'].includes(
    update.status,
  )
  if (cancelling && !allowedDuringCancellation) return

  const next = { ...current, ...update }

  if (!['authorizing_payment', 'submitting_pos', 'refunding'].includes(next.status)) {
    delete next.attempt
    delete next.maxAttempts
  }
  writeStatus(next)
}

const kafka = createKafka('quickbite-order-status-service')
await ensureTopics(kafka)

const consumer = kafka.consumer({ groupId: 'quickbite-order-status-service' })
await consumer.connect()
await consumer.subscribe({
  topics: [topics.orderPlaced, topics.orderStatus],
  fromBeginning: false,
})
await consumer.run({
  eachMessage: async ({ topic, message }) => {
    if (topic === topics.orderPlaced) {
      const order = JSON.parse(message.value?.toString('utf8') ?? '{}') as Order

      writeStatus(initialOrderStatus(order))
      return
    }

    const update = JSON.parse(
      message.value?.toString('utf8') ?? '{}',
    ) as OrderStatusUpdate
    applyUpdate(update)
  },
})

const app = express()
app.get('/api/health', (_request, response) => {
  response.json({ service: 'order-status-service', status: 'ok' })
})
app.get('/api/order-status/:orderId', (request, response) => {
  const status = readStatus(request.params.orderId)
  if (!status) {
    response.status(404).json({ error: 'Order not found' })
    return
  }
  response.json(status)
})

const server = app.listen(port, () => {
  console.info(`[order-status-service] listening on http://localhost:${port}`)
})

async function shutdown(): Promise<void> {

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await consumer.disconnect()
  database.close()
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown().finally(() => process.exit(0))
  })
}
