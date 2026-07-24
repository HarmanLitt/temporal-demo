import { requestModifiers } from '../kafka/mockKafka'
import type { Modifier } from '../types'

export async function fetchModifiers(menuItemId: string): Promise<Modifier[]> {
  return requestModifiers(menuItemId)
}
