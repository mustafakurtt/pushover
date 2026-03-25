import {
  PUSHOVER_API_BASE_URL,
  PUSHOVER_API_ENDPOINTS,
  HTTP_HEADERS,
  API_SUCCESS_STATUS,
} from '../constants/api.constants.ts'
import { PushoverApiError } from '../errors/api.error.ts'
import { PushoverValidationError } from '../errors/validation.error.ts'
import type { FetchFunction } from '../types/common.types.ts'
import type { GroupInfo, GroupActionResponse, AddUserOptions } from '../types/group.types.ts'

export class GroupManager {
  private readonly token: string
  private readonly groupKey: string
  private readonly fetchFn: FetchFunction

  constructor(token: string, groupKey: string, fetchFn: FetchFunction) {
    if (!groupKey || groupKey.trim().length === 0) {
      throw new PushoverValidationError('Group key is required', 'groupKey')
    }

    this.token = token
    this.groupKey = groupKey
    this.fetchFn = fetchFn
  }

  async info(): Promise<GroupInfo> {
    const url = this.buildUrl(PUSHOVER_API_ENDPOINTS.GROUP_INFO) + `?token=${this.token}`

    const response = await this.fetchFn(url)
    const data = (await response.json()) as GroupInfo

    if (data.status !== API_SUCCESS_STATUS) {
      throw new PushoverApiError(
        'Failed to fetch group info',
        data.status,
        data.request,
      )
    }

    return data
  }

  async addUser(options: AddUserOptions): Promise<GroupActionResponse> {
    if (!options.user || options.user.trim().length === 0) {
      throw new PushoverValidationError('User key is required to add to group', 'user')
    }

    return this.postGroupAction(PUSHOVER_API_ENDPOINTS.GROUP_ADD_USER, {
      token: this.token,
      user: options.user,
      ...(options.device !== undefined && { device: options.device }),
      ...(options.memo !== undefined && { memo: options.memo }),
    })
  }

  async removeUser(userKey: string): Promise<GroupActionResponse> {
    if (!userKey || userKey.trim().length === 0) {
      throw new PushoverValidationError('User key is required to remove from group', 'user')
    }

    return this.postGroupAction(PUSHOVER_API_ENDPOINTS.GROUP_DELETE_USER, {
      token: this.token,
      user: userKey,
    })
  }

  async disableUser(userKey: string): Promise<GroupActionResponse> {
    if (!userKey || userKey.trim().length === 0) {
      throw new PushoverValidationError('User key is required to disable', 'user')
    }

    return this.postGroupAction(PUSHOVER_API_ENDPOINTS.GROUP_DISABLE_USER, {
      token: this.token,
      user: userKey,
    })
  }

  async enableUser(userKey: string): Promise<GroupActionResponse> {
    if (!userKey || userKey.trim().length === 0) {
      throw new PushoverValidationError('User key is required to enable', 'user')
    }

    return this.postGroupAction(PUSHOVER_API_ENDPOINTS.GROUP_ENABLE_USER, {
      token: this.token,
      user: userKey,
    })
  }

  async rename(name: string): Promise<GroupActionResponse> {
    if (!name || name.trim().length === 0) {
      throw new PushoverValidationError('Group name is required', 'name')
    }

    return this.postGroupAction(PUSHOVER_API_ENDPOINTS.GROUP_RENAME, {
      token: this.token,
      name,
    })
  }

  async listUsers(): Promise<GroupInfo['users']> {
    const groupInfo = await this.info()
    return groupInfo.users
  }

  async hasUser(userKey: string): Promise<boolean> {
    const users = await this.listUsers()
    return users.some(u => u.user === userKey)
  }

  private buildUrl(endpointTemplate: string): string {
    const path = endpointTemplate.replace('{group_key}', this.groupKey)
    return `${PUSHOVER_API_BASE_URL}${path}`
  }

  private async postGroupAction(
    endpoint: string,
    body: Record<string, string>,
  ): Promise<GroupActionResponse> {
    const url = this.buildUrl(endpoint)

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: HTTP_HEADERS.CONTENT_TYPE,
      body: JSON.stringify(body),
    })

    const data = (await response.json()) as GroupActionResponse

    if (data.status !== API_SUCCESS_STATUS) {
      throw new PushoverApiError(
        `Group action failed: ${data.errors?.join(', ') ?? 'Unknown error'}`,
        data.status,
        data.request,
        data.errors,
      )
    }

    return data
  }
}
