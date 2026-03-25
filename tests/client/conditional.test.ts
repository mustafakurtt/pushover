import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { createSpyFetch, VALID_CONFIG } from '../helpers/mock-fetch.ts'
import type { PushoverResponse } from '../../src/types/response.types.ts'

describe('Conditional Sending (.onlyBetween)', () => {
  it('should send when within time window', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const result = await client
      .message('Test')
      .onlyBetween('00:00', '23:59')
      .send()

    expect(calls).toHaveLength(1)
    expect((result as PushoverResponse).status).toBe(1)
  })

  it('should skip when outside time window', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const now = new Date()
    const pastHour = (now.getHours() + 22) % 24
    const start = `${String(pastHour).padStart(2, '0')}:00`
    const end = `${String(pastHour).padStart(2, '0')}:01`

    const result = await client
      .message('Test')
      .onlyBetween(start, end)
      .send()

    expect(calls).toHaveLength(0)
    expect((result as PushoverResponse).request).toBe('skipped:outside-time-window')
  })

  it('should handle overnight time window (e.g. 22:00-06:00)', async () => {
    const { fetchFn } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const result = await client
      .message('Test')
      .onlyBetween('00:00', '23:59')
      .send()

    expect((result as PushoverResponse).status).toBe(1)
  })

  it('should combine with other builder methods', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client
      .message('Server alert')
      .title('Alert')
      .onlyBetween('00:00', '23:59')
      .send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.title).toBe('Alert')
    expect(body.message).toBe('Server alert')
  })
})
