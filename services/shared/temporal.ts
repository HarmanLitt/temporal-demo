export const temporalAddress =
  process.env.TEMPORAL_ADDRESS ?? 'localhost:7233'

export const temporalNamespace =
  process.env.TEMPORAL_NAMESPACE ?? 'default'

export const orderTaskQueue =
  process.env.TEMPORAL_ORDER_TASK_QUEUE ?? 'quickbite-orders'

export const orderStatusBaseUrl =
  process.env.ORDER_STATUS_BASE_URL ?? 'http://localhost:3002'
