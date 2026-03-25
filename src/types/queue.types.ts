import type { PushoverMessage } from './message.types.ts'
import type { PushoverResponse } from './response.types.ts'

export interface QueueConfig {
  maxSize?: number
  autoFlushSize?: number
  autoFlushIntervalMs?: number
}

export interface QueueResult {
  succeeded: PushoverResponse[]
  failed: QueueFailedItem[]
}

export interface QueueFailedItem {
  message: PushoverMessage
  error: Error
}
