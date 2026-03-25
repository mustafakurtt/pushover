import {
  PUSHOVER_API_BASE_URL,
  PUSHOVER_API_ENDPOINTS,
  API_SUCCESS_STATUS,
} from '../constants/api.constants.ts'
import { PushoverApiError } from '../errors/api.error.ts'
import type { FetchFunction } from '../types/common.types.ts'
import type { PushoverLimitsResponse } from '../types/limits.types.ts'

export class LimitChecker {
  private readonly token: string
  private readonly fetchFn: FetchFunction

  constructor(token: string, fetchFn: FetchFunction) {
    this.token = token
    this.fetchFn = fetchFn
  }

  async check(): Promise<PushoverLimitsResponse> {
    const url = `${PUSHOVER_API_BASE_URL}${PUSHOVER_API_ENDPOINTS.LIMITS}?token=${this.token}`

    const response = await this.fetchFn(url)
    const data = (await response.json()) as PushoverLimitsResponse

    if (data.status !== API_SUCCESS_STATUS) {
      throw new PushoverApiError(
        'Failed to fetch application limits',
        data.status,
        data.request,
      )
    }

    return data
  }
}
