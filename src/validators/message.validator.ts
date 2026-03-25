import { ERROR_MESSAGES } from '../constants/error-messages.constants.ts'
import { MESSAGE_LIMITS } from '../constants/limits.constants.ts'
import { PushoverPriority } from '../constants/priorities.constants.ts'
import { PushoverValidationError } from '../errors/validation.error.ts'
import type { PushoverMessage } from '../types/message.types.ts'

export class MessageValidator {
  static validate(message: PushoverMessage): void {
    MessageValidator.validateMessage(message.message)
    MessageValidator.validateTitle(message.title)
    MessageValidator.validateUrl(message.url)
    MessageValidator.validateUrlTitle(message.urlTitle)
    MessageValidator.validateEmergency(message)
  }

  private static validateMessage(message: string | undefined): void {
    if (!message || typeof message !== 'string') {
      throw new PushoverValidationError(ERROR_MESSAGES.MESSAGE_REQUIRED, 'message')
    }

    if (message.length > MESSAGE_LIMITS.MESSAGE_MAX_LENGTH) {
      throw new PushoverValidationError(ERROR_MESSAGES.MESSAGE_TOO_LONG, 'message')
    }
  }

  private static validateTitle(title: string | undefined): void {
    if (title && title.length > MESSAGE_LIMITS.TITLE_MAX_LENGTH) {
      throw new PushoverValidationError(ERROR_MESSAGES.TITLE_TOO_LONG, 'title')
    }
  }

  private static validateUrl(url: string | undefined): void {
    if (url && url.length > MESSAGE_LIMITS.URL_MAX_LENGTH) {
      throw new PushoverValidationError(ERROR_MESSAGES.URL_TOO_LONG, 'url')
    }
  }

  private static validateUrlTitle(urlTitle: string | undefined): void {
    if (urlTitle && urlTitle.length > MESSAGE_LIMITS.URL_TITLE_MAX_LENGTH) {
      throw new PushoverValidationError(ERROR_MESSAGES.URL_TITLE_TOO_LONG, 'urlTitle')
    }
  }

  private static validateEmergency(message: PushoverMessage): void {
    if (message.priority !== PushoverPriority.EMERGENCY) return

    if (!message.retry || !message.expire) {
      throw new PushoverValidationError(ERROR_MESSAGES.EMERGENCY_RETRY_EXPIRE_REQUIRED, 'priority')
    }

    if (message.retry < MESSAGE_LIMITS.RETRY_MIN_SECONDS) {
      throw new PushoverValidationError(ERROR_MESSAGES.RETRY_TOO_SHORT, 'retry')
    }

    if (message.expire > MESSAGE_LIMITS.EXPIRE_MAX_SECONDS) {
      throw new PushoverValidationError(ERROR_MESSAGES.EXPIRE_TOO_LONG, 'expire')
    }
  }
}
