import { describe, expect, it } from 'bun:test'
import { PushoverApiError } from '../../src/errors/api.error.ts'
import { PushoverBaseError } from '../../src/errors/base.error.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'

describe('PushoverValidationError', () => {
  it('should extend PushoverBaseError', () => {
    const error = new PushoverValidationError('test')
    expect(error).toBeInstanceOf(PushoverBaseError)
    expect(error).toBeInstanceOf(Error)
  })

  it('should set correct name', () => {
    const error = new PushoverValidationError('test')
    expect(error.name).toBe('PushoverValidationError')
  })

  it('should set code to PUSHOVER_VALIDATION_ERROR', () => {
    const error = new PushoverValidationError('test')
    expect(error.code).toBe('PUSHOVER_VALIDATION_ERROR')
  })

  it('should store message', () => {
    const error = new PushoverValidationError('Invalid token')
    expect(error.message).toBe('Invalid token')
  })

  it('should store field when provided', () => {
    const error = new PushoverValidationError('Too long', 'message')
    expect(error.field).toBe('message')
  })

  it('should have undefined field when not provided', () => {
    const error = new PushoverValidationError('test')
    expect(error.field).toBeUndefined()
  })
})

describe('PushoverApiError', () => {
  it('should extend PushoverBaseError', () => {
    const error = new PushoverApiError('test', 0, 'req-123')
    expect(error).toBeInstanceOf(PushoverBaseError)
    expect(error).toBeInstanceOf(Error)
  })

  it('should set correct name', () => {
    const error = new PushoverApiError('test', 0, 'req-123')
    expect(error.name).toBe('PushoverApiError')
  })

  it('should set code to PUSHOVER_API_ERROR', () => {
    const error = new PushoverApiError('test', 0, 'req-123')
    expect(error.code).toBe('PUSHOVER_API_ERROR')
  })

  it('should store all properties', () => {
    const errors = ['invalid token', 'user not found']
    const error = new PushoverApiError('API failed', 0, 'req-456', errors)

    expect(error.message).toBe('API failed')
    expect(error.status).toBe(0)
    expect(error.requestId).toBe('req-456')
    expect(error.apiErrors).toEqual(errors)
  })

  it('should default apiErrors to empty array', () => {
    const error = new PushoverApiError('test', 0, 'req-123')
    expect(error.apiErrors).toEqual([])
  })
})
