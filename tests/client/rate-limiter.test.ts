import { describe, expect, it } from 'bun:test'
import { RateLimiter } from '../../src/client/rate-limiter.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'

describe('RateLimiter', () => {
  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter({ maxPerInterval: 5, intervalMs: 1000 })

    await limiter.acquire()
    await limiter.acquire()
    await limiter.acquire()

    expect(limiter.remaining).toBe(2)
  })

  it('should throw when limit exceeded', async () => {
    const limiter = new RateLimiter({ maxPerInterval: 2, intervalMs: 60_000 })

    await limiter.acquire()
    await limiter.acquire()

    expect(() => limiter.acquire()).toThrow(PushoverValidationError)
  })

  it('should report remaining correctly', async () => {
    const limiter = new RateLimiter({ maxPerInterval: 3, intervalMs: 1000 })

    expect(limiter.remaining).toBe(3)
    await limiter.acquire()
    expect(limiter.remaining).toBe(2)
    await limiter.acquire()
    expect(limiter.remaining).toBe(1)
  })

  it('should reset state', async () => {
    const limiter = new RateLimiter({ maxPerInterval: 2, intervalMs: 60_000 })

    await limiter.acquire()
    await limiter.acquire()
    expect(limiter.remaining).toBe(0)

    limiter.reset()
    expect(limiter.remaining).toBe(2)
  })

  it('should throw error with rateLimit field', async () => {
    const limiter = new RateLimiter({ maxPerInterval: 1, intervalMs: 60_000 })
    await limiter.acquire()

    try {
      await limiter.acquire()
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(PushoverValidationError)
      expect((error as PushoverValidationError).field).toBe('rateLimit')
    }
  })
})
