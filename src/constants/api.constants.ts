export const PUSHOVER_API_BASE_URL = 'https://api.pushover.net/1' as const

export const PUSHOVER_API_ENDPOINTS = {
  MESSAGES: '/messages.json',
  LIMITS: '/apps/limits.json',
} as const

export const HTTP_HEADERS = {
  CONTENT_TYPE: { 'Content-Type': 'application/json' },
} as const

export const API_SUCCESS_STATUS = 1 as const
