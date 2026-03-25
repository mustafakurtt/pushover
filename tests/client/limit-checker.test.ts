import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { PushoverApiError } from '../../src/errors/api.error.ts'
import { VALID_CONFIG } from '../helpers/mock-fetch.ts'
import type { PushoverLimitsResponse } from '../../src/types/limits.types.ts'

function createLimitsFetch(response: PushoverLimitsResponse) {
  let callCount = 0
  const fetchFn = ((url: string | URL | Request) => {
    callCount++
    const urlStr = typeof url === 'string' ? url : url.toString()

    if (urlStr.includes('limits.json')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(response),
      })
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 1, request: 'req-123' }),
    })
  }) as unknown as typeof globalThis.fetch

  return { fetchFn, getCallCount: () => callCount }
}

describe('LimitChecker (via client.limits())', () => {
  it('should return limits data', async () => {
    const mockLimits: PushoverLimitsResponse = {
      status: 1,
      request: 'req-limits',
      limit: 10000,
      remaining: 9500,
      reset: 1700000000,
    }
    const { fetchFn } = createLimitsFetch(mockLimits)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const result = await client.limits()

    expect(result.limit).toBe(10000)
    expect(result.remaining).toBe(9500)
    expect(result.reset).toBe(1700000000)
  })

  it('should throw PushoverApiError on failure', async () => {
    const mockError: PushoverLimitsResponse = {
      status: 0,
      request: 'req-fail',
      limit: 0,
      remaining: 0,
      reset: 0,
    }
    const { fetchFn } = createLimitsFetch(mockError)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    try {
      await client.limits()
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(PushoverApiError)
    }
  })

  it('should call correct API endpoint', async () => {
    const urls: string[] = []
    const fetchFn = ((url: string | URL | Request) => {
      urls.push(typeof url === 'string' ? url : url.toString())
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          status: 1, request: 'req', limit: 10000, remaining: 9000, reset: 0,
        }),
      })
    }) as unknown as typeof globalThis.fetch

    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })
    await client.limits()

    expect(urls[0]).toContain('/apps/limits.json')
    expect(urls[0]).toContain(`token=${VALID_CONFIG.token}`)
  })
})
