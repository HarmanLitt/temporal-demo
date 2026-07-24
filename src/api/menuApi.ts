import { requestMenu } from '../kafka/mockKafka'
import type { MenuItem } from '../types'

export async function fetchMenu(): Promise<MenuItem[]> {
  return requestMenu()
}
