import type { PushoverPriorityValue, PushoverSoundValue } from './common.types.ts'

export type SemanticLevel = 'info' | 'success' | 'warning' | 'error' | 'emergency'

export interface SemanticMethodConfig {
  title: string
  priority: PushoverPriorityValue
  sound: PushoverSoundValue
  retry?: number
  expire?: number
}
