export const PUSHOVER_API_BASE_URL = 'https://api.pushover.net/1' as const

export const PUSHOVER_API_ENDPOINTS = {
  MESSAGES: '/messages.json',
  LIMITS: '/apps/limits.json',
  GROUP_INFO: '/groups/{group_key}.json',
  GROUP_ADD_USER: '/groups/{group_key}/add_user.json',
  GROUP_DELETE_USER: '/groups/{group_key}/delete_user.json',
  GROUP_DISABLE_USER: '/groups/{group_key}/disable_user.json',
  GROUP_ENABLE_USER: '/groups/{group_key}/enable_user.json',
  GROUP_RENAME: '/groups/{group_key}/rename.json',
} as const

export const HTTP_HEADERS = {
  CONTENT_TYPE: { 'Content-Type': 'application/json' },
} as const

export const API_SUCCESS_STATUS = 1 as const
