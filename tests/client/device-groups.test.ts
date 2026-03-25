import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { createSpyFetch, VALID_CONFIG } from '../helpers/mock-fetch.ts'

describe('Device Groups', () => {
  describe('sendToGroup()', () => {
    it('should send to all devices in a group', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({
        ...VALID_CONFIG,
        fetchFn,
        deviceGroups: { mobile: ['iphone', 'pixel'] },
      })

      const results = await client.sendToGroup('Alert!', 'mobile')

      expect(results).toHaveLength(2)
      expect(results[0]!.device).toBe('iphone')
      expect(results[1]!.device).toBe('pixel')
      expect(calls).toHaveLength(2)
    })

    it('should throw on unknown group', async () => {
      const { fetchFn } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      try {
        await client.sendToGroup('Alert!', 'nonexistent')
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverValidationError)
        expect((error as PushoverValidationError).field).toBe('deviceGroup')
      }
    })
  })

  describe('builder .toGroup()', () => {
    it('should send to group via builder', async () => {
      const { fetchFn, calls } = createSpyFetch()
      const client = new PushoverClient({
        ...VALID_CONFIG,
        fetchFn,
        deviceGroups: { all: ['iphone', 'pixel', 'desktop'] },
      })

      const results = await client.message('Alert!').toGroup('all').send()

      expect(Array.isArray(results)).toBe(true)
      expect((results as any[]).length).toBe(3)
      expect(calls).toHaveLength(3)
    })

    it('should throw when no deviceGroups configured', () => {
      const { fetchFn } = createSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      expect(() => client.message('Alert!').toGroup('mobile')).toThrow()
    })

    it('should throw on unknown group via builder', () => {
      const { fetchFn } = createSpyFetch()
      const client = new PushoverClient({
        ...VALID_CONFIG,
        fetchFn,
        deviceGroups: { mobile: ['iphone'] },
      })

      expect(() => client.message('Alert!').toGroup('nonexistent')).toThrow(PushoverValidationError)
    })
  })
})
