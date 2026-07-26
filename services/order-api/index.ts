import express, { type NextFunction, type Request, type Response } from 'express'
import type { Server } from 'node:http'
import { Connection, Client } from '@temporalio/client'
import { initialOrderStatus } from '../shared/status'
import { updateOrderStatus } from '../shared/status-client'
import {
  orderTaskQueue,
  temporalAddress,
  temporalNamespace,
} from '../shared/temporal'
import { menuItems } from '../../src/mock/menuData'
import { modifiersByMenuItemId } from '../../src/mock/modifierData'
import type { Order, OrderStatusUpdate } from '../../src/types'

const port = Number(process.env.ORDER_API_PORT ?? 3001)

const connection = await Connection.connect({ address: temporalAddress })
const temporal = new Client({
  connection,
  namespace: temporalNamespace,
})

const app = express()
let server: Server | undefined

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

  await temporal.workflow.start('orderFulfillmentWorkflow', {
    taskQueue: orderTaskQueue,
    workflowId: order.orderId,
    args: [order],
  })

  response.status(202).json(initialOrderStatus(order))
})

app.post('/api/orders/:orderId/cancel', async (request, response) => {
  const restaurantId = String(request.body?.restaurantId ?? '')
  if (!restaurantId) {
    response.status(400).json({ error: 'restaurantId is required' })
    return
  }

  const orderId = request.params.orderId

  await updateOrderStatus(
    orderId,
    'cancellation_requested',
    'Cancellation requested',
  )

  const handle = temporal.workflow.getHandle(orderId)
  await handle.cancel()

  const update: OrderStatusUpdate = {
    orderId,
    status: 'cancellation_requested',
    message: 'Cancellation requested',
    updatedAt: new Date().toISOString(),
  }
  response.status(202).json(update)
})

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
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
  await connection.close()
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown().finally(() => process.exit(0))
  })
}
