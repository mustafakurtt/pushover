import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { UserValidator } from '../../src/client/user-validator.ts'
import { PushoverApiError } from '../../src/errors/api.error.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { VALID_CONFIG } from '../helpers/mock-fetch.ts'
import type { UserValidationResponse } from '../../src/types/user-validation.types.ts'

const MOCK_VALID_USER: UserValidationResponse = {
  status: 1,
  request: 'req-validate',
  group: 0,
  devices: ['iphone', 'pixel'],
  licenses: ['ios', 'android'],
}

const MOCK_VALID_GROUP: UserValidationResponse = {
  ...MOCK_VALID_USER,
  group: 1,
  devices: [],
}

const MOCK_INVALID_USER: UserValidationResponse = {
  status: 0,
  request: 'req-invalid',
  group: 0,
  devices: [],
  licenses: [],
  errors: ['user key is not valid for any active user'],
}

function createValidationFetch(responseProvider: (url: string) => unknown) {
  const calls: { url: string; options?: RequestInit }[] = []

  const fetchFn = ((url: string | URL | Request, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    calls.push({ url: urlStr, options })
    const response = responseProvider(urlStr)
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
    })
  }) as unknown as typeof globalThis.fetch

  return { fetchFn, calls }
}

describe('UserValidator', () => {
  describe('validate()', () => {
    it('should validate a user key', async () => {
      const { fetchFn } = createValidationFetch(() => MOCK_VALID_USER)
      const validator = new UserValidator('token', fetchFn)

      const result = await validator.validate('user-key-123')

      expect(result.status).toBe(1)
      expect(result.devices).toEqual(['iphone', 'pixel'])
      expect(result.group).toBe(0)
    })

    it('should call correct endpoint', async () => {
      const { fetchFn, calls } = createValidationFetch(() => MOCK_VALID_USER)
      const validator = new UserValidator('my-token', fetchFn)

      await validator.validate('user-key-123')

      expect(calls[0]!.url).toContain('/users/validate.json')
      expect(calls[0]!.options!.method).toBe('POST')
      const body = JSON.parse(calls[0]!.options!.body as string)
      expect(body.token).toBe('my-token')
      expect(body.user).toBe('user-key-123')
    })

    it('should include device when provided', async () => {
      const { fetchFn, calls } = createValidationFetch(() => MOCK_VALID_USER)
      const validator = new UserValidator('token', fetchFn)

      await validator.validate('user-key', 'iphone')

      const body = JSON.parse(calls[0]!.options!.body as string)
      expect(body.device).toBe('iphone')
    })

    it('should throw on empty user key', async () => {
      const { fetchFn } = createValidationFetch(() => MOCK_VALID_USER)
      const validator = new UserValidator('token', fetchFn)

      try {
        await validator.validate('')
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverValidationError)
        expect((error as PushoverValidationError).field).toBe('user')
      }
    })

    it('should throw PushoverApiError for invalid user', async () => {
      const { fetchFn } = createValidationFetch(() => MOCK_INVALID_USER)
      const validator = new UserValidator('token', fetchFn)

      try {
        await validator.validate('invalid-key')
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverApiError)
        expect((error as Error).message).toContain('not valid')
      }
    })
  })

  describe('isValid()', () => {
    it('should return true for valid user', async () => {
      const { fetchFn } = createValidationFetch(() => MOCK_VALID_USER)
      const validator = new UserValidator('token', fetchFn)

      expect(await validator.isValid('user-key')).toBe(true)
    })

    it('should return false for invalid user', async () => {
      const { fetchFn } = createValidationFetch(() => MOCK_INVALID_USER)
      const validator = new UserValidator('token', fetchFn)

      expect(await validator.isValid('bad-key')).toBe(false)
    })
  })

  describe('getDevices()', () => {
    it('should return device list', async () => {
      const { fetchFn } = createValidationFetch(() => MOCK_VALID_USER)
      const validator = new UserValidator('token', fetchFn)

      const devices = await validator.getDevices('user-key')

      expect(devices).toEqual(['iphone', 'pixel'])
    })
  })

  describe('isGroup()', () => {
    it('should return false for user key', async () => {
      const { fetchFn } = createValidationFetch(() => MOCK_VALID_USER)
      const validator = new UserValidator('token', fetchFn)

      expect(await validator.isGroup('user-key')).toBe(false)
    })

    it('should return true for group key', async () => {
      const { fetchFn } = createValidationFetch(() => MOCK_VALID_GROUP)
      const validator = new UserValidator('token', fetchFn)

      expect(await validator.isGroup('group-key')).toBe(true)
    })
  })
})

describe('PushoverClient user validation integration', () => {
  it('validateUser() should return validation response', async () => {
    const { fetchFn } = createValidationFetch(() => MOCK_VALID_USER)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const result = await client.validateUser('user-key')

    expect(result.status).toBe(1)
    expect(result.devices).toEqual(['iphone', 'pixel'])
  })

  it('isValidUser() should return true for valid user', async () => {
    const { fetchFn } = createValidationFetch(() => MOCK_VALID_USER)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    expect(await client.isValidUser('user-key')).toBe(true)
  })

  it('isValidUser() should return false for invalid user', async () => {
    const { fetchFn } = createValidationFetch(() => MOCK_INVALID_USER)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    expect(await client.isValidUser('bad-key')).toBe(false)
  })

  it('getUserDevices() should return device list', async () => {
    const { fetchFn } = createValidationFetch(() => MOCK_VALID_USER)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const devices = await client.getUserDevices('user-key')
    expect(devices).toEqual(['iphone', 'pixel'])
  })

  it('validateUser() should pass device parameter', async () => {
    const { fetchFn, calls } = createValidationFetch(() => MOCK_VALID_USER)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client.validateUser('user-key', 'iphone')

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.device).toBe('iphone')
  })
})
