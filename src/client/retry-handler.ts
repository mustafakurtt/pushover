import { RETRY_DEFAULTS } from '../constants/retry.constants.ts'
import type { RetryConfig } from '../types/retry.types.ts'

export class RetryHandler {
  private readonly maxAttempts: number
  private readonly baseDelayMs: number
  private readonly maxDelayMs: number
  private readonly backoffMultiplier: number

  constructor(config?: RetryConfig) {
    this.maxAttempts = config?.maxAttempts ?? RETRY_DEFAULTS.MAX_ATTEMPTS
    this.baseDelayMs = config?.baseDelayMs ?? RETRY_DEFAULTS.BASE_DELAY_MS
    this.maxDelayMs = config?.maxDelayMs ?? RETRY_DEFAULTS.MAX_DELAY_MS
    this.backoffMultiplier = config?.backoffMultiplier ?? RETRY_DEFAULTS.BACKOFF_MULTIPLIER
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === this.maxAttempts) break

        const delay = this.calculateDelay(attempt)
        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  private calculateDelay(attempt: number): number {
    const delay = this.baseDelayMs * Math.pow(this.backoffMultiplier, attempt - 1)
    const jitter = delay * 0.1 * Math.random()
    return Math.min(delay + jitter, this.maxDelayMs)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
