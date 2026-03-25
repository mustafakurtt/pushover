export interface RateLimitConfig {
  maxPerInterval?: number
  intervalMs?: number
}

export interface RateLimitState {
  timestamps: number[]
  remaining: number
}
