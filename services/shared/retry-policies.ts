import type { RetryPolicy } from './retry'

const defaultMaximumAttempts = Number(process.env.DEMO_MAX_ATTEMPTS ?? 3)
const defaultTimeoutMs = Number(
  process.env.DEMO_ACTIVITY_TIMEOUT_MS ?? 2_000,
)

export const paymentRetryPolicy: RetryPolicy = {
  maximumAttempts: Number(
    process.env.DEMO_PAYMENT_MAX_ATTEMPTS ?? defaultMaximumAttempts,
  ),
  startToCloseTimeoutMs: Number(
    process.env.DEMO_PAYMENT_TIMEOUT_MS ?? defaultTimeoutMs,
  ),
  initialIntervalMs: Number(
    process.env.DEMO_PAYMENT_RETRY_INITIAL_INTERVAL_MS ?? 500,
  ),
  backoffCoefficient: Number(
    process.env.DEMO_PAYMENT_RETRY_BACKOFF_COEFFICIENT ?? 2,
  ),
  maximumIntervalMs: Number(
    process.env.DEMO_PAYMENT_RETRY_MAX_INTERVAL_MS ?? 4_000,
  ),
}

export const posRetryPolicy: RetryPolicy = {
  maximumAttempts: Number(
    process.env.DEMO_POS_MAX_ATTEMPTS ?? defaultMaximumAttempts,
  ),
  startToCloseTimeoutMs: Number(
    process.env.DEMO_POS_TIMEOUT_MS ?? defaultTimeoutMs,
  ),
  initialIntervalMs: Number(
    process.env.DEMO_POS_RETRY_INITIAL_INTERVAL_MS ?? 500,
  ),
  backoffCoefficient: Number(
    process.env.DEMO_POS_RETRY_BACKOFF_COEFFICIENT ?? 2,
  ),
  maximumIntervalMs: Number(
    process.env.DEMO_POS_RETRY_MAX_INTERVAL_MS ?? 4_000,
  ),
}
