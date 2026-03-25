import { describe, expect, it } from 'bun:test'
import { RetryHandler } from '../../src/client/retry-handler.ts'

describe('RetryHandler', () => {
  it('should return result on first success', async () => {
    const handler = new RetryHandler({ maxAttempts: 3 })
    const result = await handler.execute(() => Promise.resolve('ok'))
    expect(result).toBe('ok')
  })

  it('should retry on failure and succeed', async () => {
    const handler = new RetryHandler({ maxAttempts: 3, baseDelayMs: 10 })
    let attempt = 0

    const result = await handler.execute(() => {
      attempt++
      if (attempt < 3) throw new Error('fail')
      return Promise.resolve('recovered')
    })

    expect(result).toBe('recovered')
    expect(attempt).toBe(3)
  })

  it('should throw after max attempts exhausted', async () => {
    const handler = new RetryHandler({ maxAttempts: 2, baseDelayMs: 10 })

    try {
      await handler.execute(() => Promise.reject(new Error('always fails')))
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('always fails')
    }
  })

  it('should use default config when none provided', async () => {
    const handler = new RetryHandler()
    const result = await handler.execute(() => Promise.resolve(42))
    expect(result).toBe(42)
  })

  it('should respect maxAttempts = 1 (no retry)', async () => {
    const handler = new RetryHandler({ maxAttempts: 1 })
    let attempt = 0

    try {
      await handler.execute(() => {
        attempt++
        throw new Error('fail')
      })
    } catch {
      expect(attempt).toBe(1)
    }
  })
})
