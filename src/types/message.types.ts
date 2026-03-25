import type { PushoverPriorityValue, PushoverSoundValue } from './common.types.ts'

export interface PushoverMessage {
  message: string
  title?: string
  url?: string
  urlTitle?: string
  priority?: PushoverPriorityValue
  sound?: PushoverSoundValue
  device?: string
  html?: 0 | 1
  timestamp?: number
  retry?: number
  expire?: number
}

export interface PushoverShortMessage {
  message: string
  title?: string
  url?: string
  urlTitle?: string
  device?: string
}

export interface PushoverEmergencyMessage extends PushoverShortMessage {
  retry?: number
  expire?: number
}
