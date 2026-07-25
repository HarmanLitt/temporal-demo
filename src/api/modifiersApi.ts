import type { Modifier } from '../types'
import { requestJson } from './http'

export async function fetchModifiers(menuItemId: string): Promise<Modifier[]> {
  return requestJson<Modifier[]>(
    `/api/modifiers/${encodeURIComponent(menuItemId)}`,
  )
}
