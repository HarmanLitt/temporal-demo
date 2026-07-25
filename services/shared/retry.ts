import { setTimeout as delay } from 'node:timers/promises'

export { delay }

export type RetryPolicy = {
  maximumAttempts: number
  startToCloseTimeoutMs: number
  initialIntervalMs: number
  backoffCoefficient: number
  maximumIntervalMs: number
}

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        )
      }),
    ])
  } finally {

    if (timeout) clearTimeout(timeout)
  }
}

export async function retry({
  label,
  policy,
  operation,
  onAttempt,
  onRetry,
}: {
  label: string
  policy: RetryPolicy
  operation: (attempt: number) => Promise<void>
  onAttempt: (attempt: number) => Promise<void>
  onRetry: (attempt: number, error: unknown) => Promise<void>
}): Promise<void> {
  let lastError: unknown

  for (let attempt = 1; attempt <= policy.maximumAttempts; attempt += 1) {

    await onAttempt(attempt)
    try {
      await withTimeout(
        () => operation(attempt),
        policy.startToCloseTimeoutMs,
        label,
      )
      return
    } catch (error) {
      lastError = error
      if (attempt < policy.maximumAttempts) {
        await onRetry(attempt, error)
        const retryDelayMs = Math.min(
          policy.initialIntervalMs *
            policy.backoffCoefficient ** (attempt - 1),
          policy.maximumIntervalMs,
        )
        await delay(retryDelayMs)
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} failed after ${policy.maximumAttempts} attempts`)
}
