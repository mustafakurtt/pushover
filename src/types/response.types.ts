export interface PushoverResponse {
  status: number
  request: string
  errors?: string[]
  receipt?: string
  limits?: {
    limit: number
    remaining: number
    reset: number
  }
}
