import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { createSpyFetch, createMockFetch, MOCK_ERROR_RESPONSE, VALID_CONFIG } from '../helpers/mock-fetch.ts'

describe('Multi-Device Targeting', () => {
  describe('sendToDevices()', () => {
    it('should send to multiple devices', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      const results = await client.sendToDevices('Alert!', ['iphone', 'pixel', 'desktop'])

      expect(results).toHaveLength(3)
      expect(results[0]!.device).toBe('iphone')
      expect(results[0]!.success).toBe(true)
      expect(results[1]!.device).toBe('pixel')
      expect(results[2]!.device).toBe('desktop')
      expect(calls).toHaveLength(3)
    })

    it('should include correct device in each request body', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.sendToDevices('Test', ['iphone', 'pixel'])

      const body1 = JSON.parse(calls[0]!.options!.body as string)
      const body2 = JSON.parse(calls[1]!.options!.body as string)
      expect(body1.device).toBe('iphone')
      expect(body2.device).toBe('pixel')
    })

    it('should report failures per device', async () => {
      const fetchFn = createMockFetch(MOCK_ERROR_RESPONSE)
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      const results = await client.sendToDevices('Fail', ['iphone', 'pixel'])

      expect(results).toHaveLength(2)
      expect(results[0]!.success).toBe(false)
      expect(results[0]!.error).toBeInstanceOf(Error)
      expect(results[1]!.success).toBe(false)
    })

    it('should accept object message', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.sendToDevices({ message: 'Alert', title: 'Server' }, ['iphone'])

      const body = JSON.parse(calls[0]!.options!.body as string)
      expect(body.title).toBe('Server')
      expect(body.device).toBe('iphone')
    })
  })

  describe('builder .to() with multiple devices', () => {
    it('should send to multiple devices via builder', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      const results = await client.message('Alert!').to('iphone', 'pixel').send()

      expect(Array.isArray(results)).toBe(true)
      expect((results as any[]).length).toBe(2)
      expect(calls).toHaveLength(2)
    })

    it('should send to single device via builder', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      const result = await client.message('Alert!').to('iphone').send()

      expect(Array.isArray(result)).toBe(false)
      const body = JSON.parse(calls[0]!.options!.body as string)
      expect(body.device).toBe('iphone')
    })
  })
})
