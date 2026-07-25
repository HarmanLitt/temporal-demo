import { setTimeout as delay } from 'node:timers/promises'

export { delay }

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
  maxAttempts,
  timeoutMs,
  operation,
  onAttempt,
  onRetry,
}: {
  label: string
  maxAttempts: number
  timeoutMs: number
  operation: (attempt: number) => Promise<void>
  onAttempt: (attempt: number) => Promise<void>
  onRetry: (attempt: number, error: unknown) => Promise<void>
}): Promise<void> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await onAttempt(attempt)
    try {
      await withTimeout(() => operation(attempt), timeoutMs, label)
      return
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await onRetry(attempt, error)
        await delay(500 * attempt)
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} failed after ${maxAttempts} attempts`)
}
