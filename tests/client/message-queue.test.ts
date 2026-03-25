import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { createMockFetch, createSpyFetch, MOCK_SUCCESS_RESPONSE, MOCK_ERROR_RESPONSE, VALID_CONFIG } from '../helpers/mock-fetch.ts'

describe('MessageQueue', () => {
  it('should queue messages with queue()', () => {
    const { fetchFn } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    client.queue('Message 1').queue('Message 2').queue('Message 3')

    expect(client.queueSize).toBe(3)
  })

  it('should flush all queued messages', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    client.queue('Message 1').queue('Message 2')
    const result = await client.flush()

    expect(calls).toHaveLength(2)
    expect(result.succeeded).toHaveLength(2)
    expect(result.failed).toHaveLength(0)
    expect(client.queueSize).toBe(0)
  })

  it('should accept object messages in queue', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    client.queue({ message: 'Detailed', title: 'Test' })
    const result = await client.flush()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.title).toBe('Test')
    expect(result.succeeded).toHaveLength(1)
  })

  it('should report failed messages separately', async () => {
    const fetchFn = createMockFetch(MOCK_ERROR_RESPONSE)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    client.queue('Will fail')
    const result = await client.flush()

    expect(result.succeeded).toHaveLength(0)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0]!.message.message).toBe('Will fail')
    expect(result.failed[0]!.error).toBeInstanceOf(Error)
  })

  it('should respect maxSize', () => {
    const { fetchFn } = createSpyFetch()
    const client = new PushoverClient({
      ...VALID_CONFIG,
      fetchFn,
      queue: { maxSize: 2 },
    })

    client.queue('One').queue('Two')

    expect(() => client.queue('Three')).toThrow(PushoverValidationError)
  })

  it('should return empty result when flushing empty queue', async () => {
    const { fetchFn } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const result = await client.flush()

    expect(result.succeeded).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
  })
})
