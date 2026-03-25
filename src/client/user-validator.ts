import {
  PUSHOVER_API_BASE_URL,
  PUSHOVER_API_ENDPOINTS,
  HTTP_HEADERS,
  API_SUCCESS_STATUS,
} from '../constants/api.constants.ts'
import { PushoverApiError } from '../errors/api.error.ts'
import { PushoverValidationError } from '../errors/validation.error.ts'
import type { FetchFunction } from '../types/common.types.ts'
import type { UserValidationResponse } from '../types/user-validation.types.ts'

export class UserValidator {
  private readonly token: string
  private readonly fetchFn: FetchFunction

  constructor(token: string, fetchFn: FetchFunction) {
    this.token = token
    this.fetchFn = fetchFn
  }

  async validate(userKey: string, device?: string): Promise<UserValidationResponse> {
    if (!userKey || userKey.trim().length === 0) {
      throw new PushoverValidationError('User key is required for validation', 'user')
    }

    const url = `${PUSHOVER_API_BASE_URL}${PUSHOVER_API_ENDPOINTS.USER_VALIDATE}`

    const body: Record<string, string> = {
      token: this.token,
      user: userKey,
    }

    if (device !== undefined) {
      body.device = device
    }

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: HTTP_HEADERS.CONTENT_TYPE,
      body: JSON.stringify(body),
    })

    const data = (await response.json()) as UserValidationResponse

    if (data.status !== API_SUCCESS_STATUS) {
      throw new PushoverApiError(
        `User validation failed: ${data.errors?.join(', ') ?? 'Unknown error'}`,
        data.status,
        data.request,
        data.errors,
      )
    }

    return data
  }

  async isValid(userKey: string): Promise<boolean> {
    try {
      await this.validate(userKey)
      return true
    } catch {
      return false
    }
  }

  async getDevices(userKey: string): Promise<string[]> {
    const result = await this.validate(userKey)
    return result.devices
  }

  async isGroup(userKey: string): Promise<boolean> {
    const result = await this.validate(userKey)
    return result.group === 1
  }
}
