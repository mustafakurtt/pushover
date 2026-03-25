import type { PushoverPriority as PriorityConstants, PushoverSound as SoundConstants } from '../constants/index.ts'

export type PushoverSoundValue = (typeof SoundConstants)[keyof typeof SoundConstants]
export type PushoverPriorityValue = (typeof PriorityConstants)[keyof typeof PriorityConstants]

export type FetchFunction = typeof globalThis.fetch
