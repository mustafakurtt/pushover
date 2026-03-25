import { describe, expect, it } from 'bun:test'
import { createPushover, notify } from '../../src/factory/index.ts'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { createMockFetch, MOCK_SUCCESS_RESPONSE, VALID_CONFIG } from '../helpers/mock-fetch.ts'

describe('createPushover()', () => {
  it('should return PushoverClient instance', () => {
    const fetchFn = createMockFetch(MOCK_SUCCESS_RESPONSE)
    const client = createPushover({ ...VALID_CONFIG, fetchFn })

    expect(client).toBeInstanceOf(PushoverClient)
  })

  it('should throw on invalid config', () => {
    const fetchFn = createMockFetch(MOCK_SUCCESS_RESPONSE)
    expect(() => createPushover({ token: '', user: '', fetchFn })).toThrow(PushoverValidationError)
  })
})

describe('notify()', () => {
  it('should send notification and return response', async () => {
    const fetchFn = createMockFetch(MOCK_SUCCESS_RESPONSE)
    const result = await notify({ ...VALID_CONFIG, fetchFn }, 'Hello')

    expect(result).toEqual(MOCK_SUCCESS_RESPONSE)
  })

  it('should accept string message', async () => {
    const fetchFn = createMockFetch(MOCK_SUCCESS_RESPONSE)
    const result = await notify({ ...VALID_CONFIG, fetchFn }, 'Quick message')

    expect(result.status).toBe(1)
  })

  it('should accept object message', async () => {
    const fetchFn = createMockFetch(MOCK_SUCCESS_RESPONSE)
    const result = await notify({ ...VALID_CONFIG, fetchFn }, { message: 'Detailed', title: 'Test' })

    expect(result.status).toBe(1)
  })

  it('should throw on invalid config', async () => {
    const fetchFn = createMockFetch(MOCK_SUCCESS_RESPONSE)
    expect(() => notify({ token: '', user: '', fetchFn }, 'Hello')).toThrow(PushoverValidationError)
  })
})
