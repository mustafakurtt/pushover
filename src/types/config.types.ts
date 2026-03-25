import type { FetchFunction, PushoverSoundValue } from './common.types.ts'

export interface PushoverConfig {
  token: string
  user: string
  defaultDevice?: string
  defaultSound?: PushoverSoundValue
  defaultTitle?: string
  fetchFn?: FetchFunction
}

export interface PushoverDefaults {
  device?: string
  sound?: string
  title?: string
}
