import { PushoverBaseError } from './base.error.ts'

export class PushoverValidationError extends PushoverBaseError {
  public readonly code = 'PUSHOVER_VALIDATION_ERROR' as const
  public readonly field?: string

  constructor(message: string, field?: string) {
    super(message)
    this.field = field
  }
}
