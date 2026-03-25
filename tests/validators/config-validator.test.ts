import { describe, expect, it } from 'bun:test'
import { ConfigValidator } from '../../src/validators/config.validator.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { ERROR_MESSAGES } from '../../src/constants/error-messages.constants.ts'

describe('ConfigValidator', () => {
  it('should pass with valid config', () => {
    expect(() =>
      ConfigValidator.validate({ token: 'valid-token', user: 'valid-user' }),
    ).not.toThrow()
  })

  it('should throw when token is empty', () => {
    expect(() =>
      ConfigValidator.validate({ token: '', user: 'valid-user' }),
    ).toThrow(new PushoverValidationError(ERROR_MESSAGES.TOKEN_REQUIRED, 'token'))
  })

  it('should throw when user is empty', () => {
    expect(() =>
      ConfigValidator.validate({ token: 'valid-token', user: '' }),
    ).toThrow(new PushoverValidationError(ERROR_MESSAGES.USER_REQUIRED, 'user'))
  })

  it('should throw with correct field for token', () => {
    try {
      ConfigValidator.validate({ token: '', user: 'valid-user' })
    } catch (error) {
      expect(error).toBeInstanceOf(PushoverValidationError)
      expect((error as PushoverValidationError).field).toBe('token')
    }
  })

  it('should throw with correct field for user', () => {
    try {
      ConfigValidator.validate({ token: 'valid-token', user: '' })
    } catch (error) {
      expect(error).toBeInstanceOf(PushoverValidationError)
      expect((error as PushoverValidationError).field).toBe('user')
    }
  })
})
