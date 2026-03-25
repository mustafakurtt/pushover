import type { PushoverSoundValue, PushoverPriorityValue } from './common.types.ts'

export interface MessageTemplate {
  title?: string
  sound?: PushoverSoundValue
  priority?: PushoverPriorityValue
  device?: string
  url?: string
  urlTitle?: string
  html?: 0 | 1
  retry?: number
  expire?: number
}

export interface TemplateMap {
  [templateName: string]: MessageTemplate
}
