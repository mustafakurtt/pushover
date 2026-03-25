import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { VALID_CONFIG } from '../helpers/mock-fetch.ts'

function createFetchWithHeaders(limitHeaders: Record<string, string>) {
  const fetchFn = (() =>
    Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers(limitHeaders),
      json: () => Promise.resolve({ status: 1, request: 'req-limits' }),
    })
  ) as unknown as typeof globalThis.fetch

  return fetchFn
}

describe('Response Header Limits', () => {
  it('should parse limits from response headers', async () => {
    const fetchFn = createFetchWithHeaders({
      'X-Limit-App-Limit': '10000',
      'X-Limit-App-Remaining': '9500',
      'X-Limit-App-Reset': '1700000000',
    })
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const response = await client.send('test')

    expect(response.limits).toBeDefined()
    expect(response.limits!.limit).toBe(10000)
    expect(response.limits!.remaining).toBe(9500)
    expect(response.limits!.reset).toBe(1700000000)
  })

  it('should not set limits when headers are missing', async () => {
    const fetchFn = createFetchWithHeaders({})
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const response = await client.send('test')

    expect(response.limits).toBeUndefined()
  })

  it('should not set limits when only partial headers exist', async () => {
    const fetchFn = createFetchWithHeaders({
      'X-Limit-App-Limit': '10000',
    })
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const response = await client.send('test')

    expect(response.limits).toBeUndefined()
  })
})
