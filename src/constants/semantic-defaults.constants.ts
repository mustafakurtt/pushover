import { PushoverPriority } from './priorities.constants.ts'
import { PushoverSound } from './sounds.constants.ts'
import { EMERGENCY_DEFAULTS } from './limits.constants.ts'

import type { SemanticLevel, SemanticMethodConfig } from '../types/semantic.types.ts'

export const SEMANTIC_METHOD_CONFIG: Record<SemanticLevel, SemanticMethodConfig> = {
  info: {
    title: 'Info',
    priority: PushoverPriority.LOW,
    sound: PushoverSound.PUSHOVER,
  },
  success: {
    title: 'Success',
    priority: PushoverPriority.NORMAL,
    sound: PushoverSound.MAGIC,
  },
  warning: {
    title: 'Warning',
    priority: PushoverPriority.HIGH,
    sound: PushoverSound.FALLING,
  },
  error: {
    title: 'Error',
    priority: PushoverPriority.HIGH,
    sound: PushoverSound.SIREN,
  },
  emergency: {
    title: 'EMERGENCY',
    priority: PushoverPriority.EMERGENCY,
    sound: PushoverSound.PERSISTENT,
    retry: EMERGENCY_DEFAULTS.RETRY_SECONDS,
    expire: EMERGENCY_DEFAULTS.EXPIRE_SECONDS,
  },
} as const
