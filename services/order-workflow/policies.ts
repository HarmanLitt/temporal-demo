export const paymentActivityOptions = {
  startToCloseTimeout: '2 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '500 milliseconds',
    backoffCoefficient: 2,
    maximumInterval: '4 seconds',
  },
} as const

export const posActivityOptions = {
  startToCloseTimeout: '2 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '500 milliseconds',
    backoffCoefficient: 2,
    maximumInterval: '4 seconds',
  },
} as const

export const statusActivityOptions = {
  startToCloseTimeout: '5 seconds',
  retry: {
    maximumAttempts: 5,
    initialInterval: '200 milliseconds',
    backoffCoefficient: 2,
    maximumInterval: '2 seconds',
  },
} as const

export const restaurantActivityOptions = {
  startToCloseTimeout: '15 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumInterval: '8 seconds',
  },
} as const

export const restaurantAcceptanceDelayMs = 3_000
export const restaurantAcceptanceTimeoutMs = 8_000
