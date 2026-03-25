import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { PushoverApiError } from '../../src/errors/api.error.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { PushoverPriority } from '../../src/constants/priorities.constants.ts'
import { SEMANTIC_METHOD_CONFIG } from '../../src/constants/semantic-defaults.constants.ts'
import {
  createMockFetch,
  createSpyFetch,
  MOCK_SUCCESS_RESPONSE,
  MOCK_ERROR_RESPONSE,
  VALID_CONFIG,
} from '../helpers/mock-fetch.ts'

function createClient(fetchFn = createMockFetch(MOCK_SUCCESS_RESPONSE)) {
  return new PushoverClient({ ...VALID_CONFIG, fetchFn })
}

describe('PushoverClient', () => {
  describe('constructor', () => {
    it('should create client with valid config', () => {
      const client = createClient()
      expect(client).toBeInstanceOf(PushoverClient)
    })

    it('should throw on empty token', () => {
      expect(
        () => new PushoverClient({ token: '', user: 'valid', fetchFn: createMockFetch(MOCK_SUCCESS_RESPONSE) }),
      ).toThrow(PushoverValidationError)
    })

    it('should throw on empty user', () => {
      expect(
        () => new PushoverClient({ token: 'valid', user: '', fetchFn: createMockFetch(MOCK_SUCCESS_RESPONSE) }),
      ).toThrow(PushoverValidationError)
    })
  })

  describe('send()', () => {
    it('should send string message', async () => {
      const client = createClient()
      const result = await client.send('Hello')

      expect(result).toEqual(MOCK_SUCCESS_RESPONSE)
    })

    it('should send object message', async () => {
      const client = createClient()
      const result = await client.send({ message: 'Hello', title: 'Test' })

      expect(result).toEqual(MOCK_SUCCESS_RESPONSE)
    })

    it('should throw PushoverApiError on API failure', async () => {
      const client = createClient(createMockFetch(MOCK_ERROR_RESPONSE))

      try {
        await client.send('Hello')
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverApiError)
        const apiError = error as PushoverApiError
        expect(apiError.status).toBe(0)
        expect(apiError.requestId).toBe('test-request-id-456')
        expect(apiError.apiErrors).toEqual(['application token is invalid'])
      }
    })

    it('should throw PushoverValidationError on empty message', async () => {
      const client = createClient()
      expect(client.send('')).rejects.toThrow(PushoverValidationError)
    })

    it('should send correct request body', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.send({ message: 'Test body', title: 'Title' })

      expect(calls).toHaveLength(1)
      const sentBody = JSON.parse(calls[0]!.options!.body as string)
      expect(sentBody.token).toBe(VALID_CONFIG.token)
      expect(sentBody.user).toBe(VALID_CONFIG.user)
      expect(sentBody.message).toBe('Test body')
      expect(sentBody.title).toBe('Title')
    })

    it('should send to correct API endpoint', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.send('Test')

      expect(calls[0]!.url).toBe('https://api.pushover.net/1/messages.json')
    })

    it('should use POST method with JSON content type', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.send('Test')

      expect(calls[0]!.options!.method).toBe('POST')
      expect(calls[0]!.options!.headers).toEqual({ 'Content-Type': 'application/json' })
    })
  })

  describe('semantic methods', () => {
    const semanticMethods = ['info', 'success', 'warning', 'error', 'emergency'] as const

    for (const method of semanticMethods) {
      it(`${method}() should send with correct config`, async () => {
        const { fetchFn, calls } = createSpyFetch()
        const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })
        const config = SEMANTIC_METHOD_CONFIG[method]

        await client[method]('Test message')

        const sentBody = JSON.parse(calls[0]!.options!.body as string)
        expect(sentBody.message).toBe('Test message')
        expect(sentBody.title).toBe(config.title)
        expect(sentBody.priority).toBe(config.priority)
        expect(sentBody.sound).toBe(config.sound)
      })
    }

    it('emergency() should include retry and expire defaults', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.emergency('Critical!')

      const sentBody = JSON.parse(calls[0]!.options!.body as string)
      expect(sentBody.priority).toBe(PushoverPriority.EMERGENCY)
      expect(sentBody.retry).toBeDefined()
      expect(sentBody.expire).toBeDefined()
    })

    it('semantic methods should allow title override', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.error('Server down', { message: 'Server down', title: 'Custom Title' })

      const sentBody = JSON.parse(calls[0]!.options!.body as string)
      expect(sentBody.title).toBe('Custom Title')
    })

    it('emergency() should allow retry/expire override', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.emergency('Alert', { message: 'Alert', retry: 120, expire: 7200 })

      const sentBody = JSON.parse(calls[0]!.options!.body as string)
      expect(sentBody.retry).toBe(120)
      expect(sentBody.expire).toBe(7200)
    })
  })

  describe('default config', () => {
    it('should apply defaultTitle', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn, defaultTitle: 'My App' })

      await client.send('Hello')

      const sentBody = JSON.parse(calls[0]!.options!.body as string)
      expect(sentBody.title).toBe('My App')
    })

    it('should apply defaultSound', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn, defaultSound: 'cosmic' })

      await client.send('Hello')

      const sentBody = JSON.parse(calls[0]!.options!.body as string)
      expect(sentBody.sound).toBe('cosmic')
    })

    it('should apply defaultDevice', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn, defaultDevice: 'iphone' })

      await client.send('Hello')

      const sentBody = JSON.parse(calls[0]!.options!.body as string)
      expect(sentBody.device).toBe('iphone')
    })
  })
})
