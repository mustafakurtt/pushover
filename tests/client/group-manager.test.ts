import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { GroupManager } from '../../src/client/group-manager.ts'
import { PushoverApiError } from '../../src/errors/api.error.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { VALID_CONFIG } from '../helpers/mock-fetch.ts'
import type { GroupInfo } from '../../src/types/group.types.ts'
import type { GroupActionResponse } from '../../src/types/group.types.ts'

const MOCK_GROUP_INFO: GroupInfo = {
  status: 1,
  request: 'req-group-info',
  name: 'Project Team',
  users: [
    { user: 'user-key-1', device: 'iphone', memo: 'Mustafa', status: 1, disabled: false },
    { user: 'user-key-2', device: 'pixel', memo: 'Ali', status: 1, disabled: false },
    { user: 'user-key-3', memo: 'Ayşe', status: 1, disabled: true },
  ],
}

const MOCK_GROUP_ACTION_SUCCESS: GroupActionResponse = {
  status: 1,
  request: 'req-action',
}

const MOCK_GROUP_ACTION_ERROR: GroupActionResponse = {
  status: 0,
  request: 'req-action-fail',
  errors: ['user is already a member of this group'],
}

function createGroupFetch(getResponse: (url: string, method?: string) => unknown) {
  const calls: { url: string; options?: RequestInit }[] = []

  const fetchFn = ((url: string | URL | Request, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    calls.push({ url: urlStr, options })
    const response = getResponse(urlStr, options?.method)
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
    })
  }) as unknown as typeof globalThis.fetch

  return { fetchFn, calls }
}

describe('GroupManager', () => {
  describe('constructor', () => {
    it('should throw on empty group key', () => {
      const fetchFn = (() => {}) as unknown as typeof globalThis.fetch
      expect(() => new GroupManager('token', '', fetchFn)).toThrow(PushoverValidationError)
    })

    it('should throw on whitespace-only group key', () => {
      const fetchFn = (() => {}) as unknown as typeof globalThis.fetch
      expect(() => new GroupManager('token', '  ', fetchFn)).toThrow(PushoverValidationError)
    })

    it('should create with valid params', () => {
      const fetchFn = (() => {}) as unknown as typeof globalThis.fetch
      const manager = new GroupManager('token', 'group-key', fetchFn)
      expect(manager).toBeInstanceOf(GroupManager)
    })
  })

  describe('info()', () => {
    it('should return group info with users', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_INFO)
      const manager = new GroupManager('token', 'grp-key-123', fetchFn)

      const info = await manager.info()

      expect(info.name).toBe('Project Team')
      expect(info.users).toHaveLength(3)
      expect(info.users[0]!.user).toBe('user-key-1')
      expect(info.users[0]!.memo).toBe('Mustafa')
    })

    it('should call correct endpoint with token', async () => {
      const { fetchFn, calls } = createGroupFetch(() => MOCK_GROUP_INFO)
      const manager = new GroupManager('my-token', 'grp-key-123', fetchFn)

      await manager.info()

      expect(calls[0]!.url).toContain('/groups/grp-key-123.json')
      expect(calls[0]!.url).toContain('token=my-token')
    })

    it('should throw PushoverApiError on failure', async () => {
      const { fetchFn } = createGroupFetch(() => ({ status: 0, request: 'fail' }))
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      try {
        await manager.info()
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverApiError)
      }
    })
  })

  describe('addUser()', () => {
    it('should add user to group', async () => {
      const { fetchFn, calls } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      const result = await manager.addUser({ user: 'new-user-key' })

      expect(result.status).toBe(1)
      expect(calls[0]!.url).toContain('/groups/grp-key/add_user.json')
      const body = JSON.parse(calls[0]!.options!.body as string)
      expect(body.user).toBe('new-user-key')
      expect(body.token).toBe('token')
    })

    it('should include optional device and memo', async () => {
      const { fetchFn, calls } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      await manager.addUser({
        user: 'new-user',
        device: 'iphone',
        memo: 'My friend Ali',
      })

      const body = JSON.parse(calls[0]!.options!.body as string)
      expect(body.device).toBe('iphone')
      expect(body.memo).toBe('My friend Ali')
    })

    it('should throw on empty user key', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      try {
        await manager.addUser({ user: '' })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverValidationError)
        expect((error as PushoverValidationError).field).toBe('user')
      }
    })

    it('should throw PushoverApiError when API fails', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_ACTION_ERROR)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      try {
        await manager.addUser({ user: 'duplicate-user' })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverApiError)
        expect((error as Error).message).toContain('already a member')
      }
    })
  })

  describe('removeUser()', () => {
    it('should remove user from group', async () => {
      const { fetchFn, calls } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      const result = await manager.removeUser('user-key-1')

      expect(result.status).toBe(1)
      expect(calls[0]!.url).toContain('/groups/grp-key/delete_user.json')
      const body = JSON.parse(calls[0]!.options!.body as string)
      expect(body.user).toBe('user-key-1')
    })

    it('should throw on empty user key', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      expect(() => manager.removeUser('')).toThrow(PushoverValidationError)
    })
  })

  describe('disableUser()', () => {
    it('should disable user in group', async () => {
      const { fetchFn, calls } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      const result = await manager.disableUser('user-key-2')

      expect(result.status).toBe(1)
      expect(calls[0]!.url).toContain('/groups/grp-key/disable_user.json')
    })

    it('should throw on empty user key', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      expect(() => manager.disableUser('')).toThrow(PushoverValidationError)
    })
  })

  describe('enableUser()', () => {
    it('should enable user in group', async () => {
      const { fetchFn, calls } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      const result = await manager.enableUser('user-key-3')

      expect(result.status).toBe(1)
      expect(calls[0]!.url).toContain('/groups/grp-key/enable_user.json')
    })

    it('should throw on empty user key', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      expect(() => manager.enableUser('')).toThrow(PushoverValidationError)
    })
  })

  describe('rename()', () => {
    it('should rename group', async () => {
      const { fetchFn, calls } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      const result = await manager.rename('New Team Name')

      expect(result.status).toBe(1)
      expect(calls[0]!.url).toContain('/groups/grp-key/rename.json')
      const body = JSON.parse(calls[0]!.options!.body as string)
      expect(body.name).toBe('New Team Name')
    })

    it('should throw on empty name', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      expect(() => manager.rename('')).toThrow(PushoverValidationError)
    })
  })

  describe('listUsers()', () => {
    it('should return array of users', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_INFO)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      const users = await manager.listUsers()

      expect(users).toHaveLength(3)
      expect(users[0]!.memo).toBe('Mustafa')
      expect(users[1]!.memo).toBe('Ali')
      expect(users[2]!.disabled).toBe(true)
    })
  })

  describe('hasUser()', () => {
    it('should return true for existing user', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_INFO)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      const exists = await manager.hasUser('user-key-1')
      expect(exists).toBe(true)
    })

    it('should return false for non-existing user', async () => {
      const { fetchFn } = createGroupFetch(() => MOCK_GROUP_INFO)
      const manager = new GroupManager('token', 'grp-key', fetchFn)

      const exists = await manager.hasUser('nonexistent-key')
      expect(exists).toBe(false)
    })
  })
})

describe('PushoverClient.group() integration', () => {
  it('should return a GroupManager instance', () => {
    const fetchFn = (() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 1, request: 'req' }),
      })
    ) as unknown as typeof globalThis.fetch

    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })
    const manager = client.group('grp-key-123')

    expect(manager).toBeInstanceOf(GroupManager)
  })

  it('should pass token and fetchFn from client', async () => {
    const urls: string[] = []
    const fetchFn = ((url: string | URL | Request) => {
      urls.push(typeof url === 'string' ? url : url.toString())
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          status: 1,
          request: 'req',
          name: 'Team',
          users: [],
        }),
      })
    }) as unknown as typeof globalThis.fetch

    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })
    await client.group('my-group-key').info()

    expect(urls[0]).toContain('/groups/my-group-key.json')
    expect(urls[0]).toContain(`token=${VALID_CONFIG.token}`)
  })

  it('should allow chaining group operations', async () => {
    const { fetchFn, calls } = createGroupFetch(() => MOCK_GROUP_ACTION_SUCCESS)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })
    const group = client.group('team-key')

    await group.addUser({ user: 'friend-key', memo: 'My friend' })
    await group.rename('Dev Team')

    expect(calls).toHaveLength(2)
    expect(calls[0]!.url).toContain('add_user.json')
    expect(calls[1]!.url).toContain('rename.json')
  })
})
