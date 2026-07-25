export type IdempotentOperation =
  | 'place-order'
  | 'cancel-order'
  | 'authorize-payment'
  | 'refund-payment'
  | 'submit-pos'
  | 'accept-restaurant'

export function idempotencyKey(
  operation: IdempotentOperation,
  orderId: string,
): string {
  return `${operation}:${orderId}`
}
