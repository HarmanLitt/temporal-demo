import type { MenuItem } from '../types'
import { requestJson } from './http'

export async function fetchMenu(): Promise<MenuItem[]> {
  return requestJson<MenuItem[]>('/api/menu')
}
