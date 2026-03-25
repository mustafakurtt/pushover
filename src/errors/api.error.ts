import { PushoverBaseError } from './base.error.ts'

export class PushoverApiError extends PushoverBaseError {
  public readonly code = 'PUSHOVER_API_ERROR' as const
  public readonly status: number
  public readonly requestId: string
  public readonly apiErrors: string[]

  constructor(message: string, status: number, requestId: string, apiErrors: string[] = []) {
    super(message)
    this.status = status
    this.requestId = requestId
    this.apiErrors = apiErrors
  }
}
