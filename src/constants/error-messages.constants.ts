import { MESSAGE_LIMITS } from './limits.constants.ts'

export const ERROR_MESSAGES = {
  TOKEN_REQUIRED: 'A valid Pushover API token is required.',
  USER_REQUIRED: 'A valid Pushover user key is required.',
  MESSAGE_REQUIRED: 'Message content is required and must be a string.',
  MESSAGE_TOO_LONG: `Message content must be ${MESSAGE_LIMITS.MESSAGE_MAX_LENGTH} characters or fewer.`,
  TITLE_TOO_LONG: `Title must be ${MESSAGE_LIMITS.TITLE_MAX_LENGTH} characters or fewer.`,
  URL_TOO_LONG: `URL must be ${MESSAGE_LIMITS.URL_MAX_LENGTH} characters or fewer.`,
  URL_TITLE_TOO_LONG: `URL title must be ${MESSAGE_LIMITS.URL_TITLE_MAX_LENGTH} characters or fewer.`,
  EMERGENCY_RETRY_EXPIRE_REQUIRED: 'Emergency priority requires both "retry" and "expire" parameters.',
  RETRY_TOO_SHORT: `Retry must be at least ${MESSAGE_LIMITS.RETRY_MIN_SECONDS} seconds.`,
  EXPIRE_TOO_LONG: `Expire must be ${MESSAGE_LIMITS.EXPIRE_MAX_SECONDS} seconds (3 hours) or fewer.`,
} as const
