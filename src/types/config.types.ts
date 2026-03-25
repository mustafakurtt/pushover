import type { FetchFunction, PushoverSoundValue } from './common.types.ts'
import type { RateLimitConfig } from './rate-limit.types.ts'
import type { RetryConfig } from './retry.types.ts'
import type { QueueConfig } from './queue.types.ts'

export interface PushoverConfig {
  token: string
  user: string
  defaultDevice?: string
  defaultSound?: PushoverSoundValue
  defaultTitle?: string
  fetchFn?: FetchFunction
  retry?: RetryConfig
  rateLimit?: RateLimitConfig
  queue?: QueueConfig
}

export interface PushoverDefaults {
  device?: string
  sound?: string
  title?: string
}
