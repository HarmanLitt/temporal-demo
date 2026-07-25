import express, { type NextFunction, type Request, type Response } from 'express'
import type { Server } from 'node:http'
import {
  createKafka,
  createProducer,
  ensureTopics,
  orderKey,
  topics,
} from '../shared/kafka'
import { initialOrderStatus, publishStatus } from '../shared/status'
import { menuItems } from '../../src/mock/menuData'
import { modifiersByMenuItemId } from '../../src/mock/modifierData'
import type {
  Order,
  OrderCancellationRequested,
  OrderStatusUpdate,
} from '../../src/types'

const port = Number(process.env.ORDER_API_PORT ?? 3001)

const app = express()
const kafka = createKafka('quickbite-order-api')
const producer = await createProducer(kafka)
let server: Server | undefined

await ensureTopics(kafka)

app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ service: 'order-api', status: 'ok' })
})

app.get('/api/menu', (_request, response) => {
  response.json(menuItems)
})

app.get('/api/modifiers/:menuItemId', (request, response) => {
  response.json(modifiersByMenuItemId[request.params.menuItemId] ?? [])
})

app.post('/api/orders', async (request, response) => {
  const order = request.body as Order

  const key = orderKey(order.orderId, order.restaurantId)

  await producer.send({
    topic: topics.orderPlaced,
    messages: [{ key, value: JSON.stringify(order) }],
  })

  response.status(202).json(initialOrderStatus(order))
})

app.post('/api/orders/:orderId/cancel', async (request, response) => {
  const restaurantId = String(request.body?.restaurantId ?? '')
  if (!restaurantId) {
    response.status(400).json({ error: 'restaurantId is required' })
    return
  }

  const cancellation: OrderCancellationRequested = {
    orderId: request.params.orderId,
    restaurantId,
    requestedAt: new Date().toISOString(),
  }
  const key = orderKey(cancellation.orderId, cancellation.restaurantId)

  await producer.send({
    topic: topics.orderCancellationRequested,
    messages: [{ key, value: JSON.stringify(cancellation) }],
  })

  await publishStatus(
    producer,
    key,
    cancellation.orderId,
    'cancellation_requested',
    'Cancellation requested',
  )

  const update: OrderStatusUpdate = {
    orderId: cancellation.orderId,
    status: 'cancellation_requested',
    message: 'Cancellation requested',
    updatedAt: new Date().toISOString(),
  }
  response.status(202).json(update)
})

app.use(
  (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    console.error('[order-api]', error)
    response.status(502).json({
      error: error instanceof Error ? error.message : 'Order API failed',
    })
  },
)

server = app.listen(port, () => {
  console.info(`[order-api] listening on http://localhost:${port}`)
})

async function shutdown(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()))
    })
  }
  await producer.disconnect()
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown().finally(() => process.exit(0))
  })
}
