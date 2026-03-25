import { RATE_LIMIT_DEFAULTS } from '../constants/rate-limit.constants.ts'
import { PushoverValidationError } from '../errors/validation.error.ts'
import type { RateLimitConfig } from '../types/rate-limit.types.ts'

export class RateLimiter {
  private readonly maxPerInterval: number
  private readonly intervalMs: number
  private readonly timestamps: number[] = []

  constructor(config?: RateLimitConfig) {
    this.maxPerInterval = config?.maxPerInterval ?? RATE_LIMIT_DEFAULTS.MAX_PER_INTERVAL
    this.intervalMs = config?.intervalMs ?? RATE_LIMIT_DEFAULTS.INTERVAL_MS
  }

  async acquire(): Promise<void> {
    this.pruneExpired()

    if (this.timestamps.length >= this.maxPerInterval) {
      const oldestTimestamp = this.timestamps[0]!
      const waitMs = oldestTimestamp + this.intervalMs - Date.now()

      if (waitMs > 0) {
        throw new PushoverValidationError(
          `Rate limit exceeded. Max ${this.maxPerInterval} requests per ${this.intervalMs}ms. Retry after ${Math.ceil(waitMs / 1000)}s.`,
          'rateLimit',
        )
      }
    }

    this.timestamps.push(Date.now())
  }

  get remaining(): number {
    this.pruneExpired()
    return Math.max(0, this.maxPerInterval - this.timestamps.length)
  }

  reset(): void {
    this.timestamps.length = 0
  }

  private pruneExpired(): void {
    const cutoff = Date.now() - this.intervalMs
    while (this.timestamps.length > 0 && this.timestamps[0]! < cutoff) {
      this.timestamps.shift()
    }
  }
}
