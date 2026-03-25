import { ERROR_MESSAGES } from '../constants/error-messages.constants.ts'
import { PushoverValidationError } from '../errors/validation.error.ts'
import type { PushoverConfig } from '../types/config.types.ts'

export class ConfigValidator {
  static validate(config: PushoverConfig): void {
    if (!config.token || typeof config.token !== 'string') {
      throw new PushoverValidationError(ERROR_MESSAGES.TOKEN_REQUIRED, 'token')
    }

    if (!config.user || typeof config.user !== 'string') {
      throw new PushoverValidationError(ERROR_MESSAGES.USER_REQUIRED, 'user')
    }
  }
}
