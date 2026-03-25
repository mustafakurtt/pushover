import { describe, expect, it } from 'bun:test'
import { MessageValidator } from '../../src/validators/message.validator.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { MESSAGE_LIMITS } from '../../src/constants/limits.constants.ts'
import { PushoverPriority } from '../../src/constants/priorities.constants.ts'

describe('MessageValidator', () => {
  describe('message field', () => {
    it('should pass with valid message', () => {
      expect(() => MessageValidator.validate({ message: 'Hello' })).not.toThrow()
    })

    it('should throw when message is empty', () => {
      expect(() => MessageValidator.validate({ message: '' })).toThrow(PushoverValidationError)
    })

    it('should throw when message exceeds max length', () => {
      const longMessage = 'a'.repeat(MESSAGE_LIMITS.MESSAGE_MAX_LENGTH + 1)
      expect(() => MessageValidator.validate({ message: longMessage })).toThrow(PushoverValidationError)
    })

    it('should pass at exact max length', () => {
      const exactMessage = 'a'.repeat(MESSAGE_LIMITS.MESSAGE_MAX_LENGTH)
      expect(() => MessageValidator.validate({ message: exactMessage })).not.toThrow()
    })
  })

  describe('title field', () => {
    it('should pass without title', () => {
      expect(() => MessageValidator.validate({ message: 'Hello' })).not.toThrow()
    })

    it('should pass with valid title', () => {
      expect(() => MessageValidator.validate({ message: 'Hello', title: 'Test' })).not.toThrow()
    })

    it('should throw when title exceeds max length', () => {
      const longTitle = 'a'.repeat(MESSAGE_LIMITS.TITLE_MAX_LENGTH + 1)
      expect(() => MessageValidator.validate({ message: 'Hello', title: longTitle })).toThrow(PushoverValidationError)
    })
  })

  describe('url field', () => {
    it('should pass with valid url', () => {
      expect(() =>
        MessageValidator.validate({ message: 'Hello', url: 'https://example.com' }),
      ).not.toThrow()
    })

    it('should throw when url exceeds max length', () => {
      const longUrl = 'https://' + 'a'.repeat(MESSAGE_LIMITS.URL_MAX_LENGTH)
      expect(() => MessageValidator.validate({ message: 'Hello', url: longUrl })).toThrow(PushoverValidationError)
    })
  })

  describe('urlTitle field', () => {
    it('should pass with valid urlTitle', () => {
      expect(() =>
        MessageValidator.validate({ message: 'Hello', urlTitle: 'Click here' }),
      ).not.toThrow()
    })

    it('should throw when urlTitle exceeds max length', () => {
      const longUrlTitle = 'a'.repeat(MESSAGE_LIMITS.URL_TITLE_MAX_LENGTH + 1)
      expect(() =>
        MessageValidator.validate({ message: 'Hello', urlTitle: longUrlTitle }),
      ).toThrow(PushoverValidationError)
    })
  })

  describe('emergency priority', () => {
    it('should pass with valid emergency params', () => {
      expect(() =>
        MessageValidator.validate({
          message: 'Alert',
          priority: PushoverPriority.EMERGENCY,
          retry: 30,
          expire: 3600,
        }),
      ).not.toThrow()
    })

    it('should throw when emergency has no retry', () => {
      expect(() =>
        MessageValidator.validate({
          message: 'Alert',
          priority: PushoverPriority.EMERGENCY,
          expire: 3600,
        }),
      ).toThrow(PushoverValidationError)
    })

    it('should throw when emergency has no expire', () => {
      expect(() =>
        MessageValidator.validate({
          message: 'Alert',
          priority: PushoverPriority.EMERGENCY,
          retry: 60,
        }),
      ).toThrow(PushoverValidationError)
    })

    it('should throw when retry is less than minimum', () => {
      expect(() =>
        MessageValidator.validate({
          message: 'Alert',
          priority: PushoverPriority.EMERGENCY,
          retry: 10,
          expire: 3600,
        }),
      ).toThrow(PushoverValidationError)
    })

    it('should throw when expire exceeds maximum', () => {
      expect(() =>
        MessageValidator.validate({
          message: 'Alert',
          priority: PushoverPriority.EMERGENCY,
          retry: 60,
          expire: MESSAGE_LIMITS.EXPIRE_MAX_SECONDS + 1,
        }),
      ).toThrow(PushoverValidationError)
    })

    it('should not validate emergency params for non-emergency priority', () => {
      expect(() =>
        MessageValidator.validate({
          message: 'Normal',
          priority: PushoverPriority.HIGH,
        }),
      ).not.toThrow()
    })
  })
})
