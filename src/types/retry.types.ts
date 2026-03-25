export interface RetryConfig {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

export interface RetryState {
  attempt: number
  lastError?: Error
}
