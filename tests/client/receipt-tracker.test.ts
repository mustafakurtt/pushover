import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { ReceiptTracker } from '../../src/client/receipt-tracker.ts'
import { PushoverApiError } from '../../src/errors/api.error.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { VALID_CONFIG } from '../helpers/mock-fetch.ts'
import type { ReceiptStatus } from '../../src/types/receipt.types.ts'

const MOCK_RECEIPT_STATUS_PENDING: ReceiptStatus = {
  status: 1,
  request: 'req-receipt',
  acknowledged: 0,
  acknowledged_at: 0,
  acknowledged_by: '',
  acknowledged_by_device: '',
  last_delivered_at: 1700000000,
  expired: 0,
  expires_at: 1700003600,
  called_back: 0,
  called_back_at: 0,
}

const MOCK_RECEIPT_STATUS_ACKNOWLEDGED: ReceiptStatus = {
  ...MOCK_RECEIPT_STATUS_PENDING,
  acknowledged: 1,
  acknowledged_at: 1700000100,
  acknowledged_by: 'user-key-1',
  acknowledged_by_device: 'iphone',
}

const MOCK_RECEIPT_STATUS_EXPIRED: ReceiptStatus = {
  ...MOCK_RECEIPT_STATUS_PENDING,
  expired: 1,
}

function createReceiptFetch(responseProvider: (url: string) => unknown) {
  const calls: { url: string; options?: RequestInit }[] = []

  const fetchFn = ((url: string | URL | Request, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    calls.push({ url: urlStr, options })
    const response = responseProvider(urlStr)
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
    })
  }) as unknown as typeof globalThis.fetch

  return { fetchFn, calls }
}

describe('ReceiptTracker', () => {
  describe('constructor', () => {
    it('should throw on empty receipt', () => {
      const fetchFn = (() => {}) as unknown as typeof globalThis.fetch
      expect(() => new ReceiptTracker('token', '', fetchFn)).toThrow(PushoverValidationError)
    })

    it('should throw on whitespace-only receipt', () => {
      const fetchFn = (() => {}) as unknown as typeof globalThis.fetch
      expect(() => new ReceiptTracker('token', '   ', fetchFn)).toThrow(PushoverValidationError)
    })

    it('should create with valid params', () => {
      const fetchFn = (() => {}) as unknown as typeof globalThis.fetch
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)
      expect(tracker).toBeInstanceOf(ReceiptTracker)
    })
  })

  describe('status()', () => {
    it('should return receipt status', async () => {
      const { fetchFn } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_PENDING)
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      const status = await tracker.status()

      expect(status.acknowledged).toBe(0)
      expect(status.expired).toBe(0)
      expect(status.last_delivered_at).toBe(1700000000)
    })

    it('should call correct endpoint with token', async () => {
      const { fetchFn, calls } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_PENDING)
      const tracker = new ReceiptTracker('my-token', 'rcpt-abc', fetchFn)

      await tracker.status()

      expect(calls[0]!.url).toContain('/receipts/rcpt-abc.json')
      expect(calls[0]!.url).toContain('token=my-token')
    })

    it('should throw PushoverApiError on failure', async () => {
      const { fetchFn } = createReceiptFetch(() => ({ status: 0, request: 'fail' }))
      const tracker = new ReceiptTracker('token', 'rcpt-bad', fetchFn)

      try {
        await tracker.status()
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverApiError)
      }
    })
  })

  describe('cancel()', () => {
    it('should cancel emergency notification', async () => {
      const { fetchFn, calls } = createReceiptFetch(() => ({ status: 1, request: 'req-cancel' }))
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      const result = await tracker.cancel()

      expect(result.status).toBe(1)
      expect(calls[0]!.url).toContain('/receipts/rcpt-123/cancel.json')
      expect(calls[0]!.options!.method).toBe('POST')
      const body = JSON.parse(calls[0]!.options!.body as string)
      expect(body.token).toBe('token')
    })

    it('should throw on API error', async () => {
      const { fetchFn } = createReceiptFetch(() => ({
        status: 0,
        request: 'fail',
        errors: ['receipt not found'],
      }))
      const tracker = new ReceiptTracker('token', 'rcpt-bad', fetchFn)

      try {
        await tracker.cancel()
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverApiError)
        expect((error as Error).message).toContain('receipt not found')
      }
    })
  })

  describe('isAcknowledged', () => {
    it('should return true when acknowledged', async () => {
      const { fetchFn } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_ACKNOWLEDGED)
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      expect(await tracker.isAcknowledged).toBe(true)
    })

    it('should return false when not acknowledged', async () => {
      const { fetchFn } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_PENDING)
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      expect(await tracker.isAcknowledged).toBe(false)
    })
  })

  describe('isExpired', () => {
    it('should return true when expired', async () => {
      const { fetchFn } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_EXPIRED)
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      expect(await tracker.isExpired).toBe(true)
    })

    it('should return false when not expired', async () => {
      const { fetchFn } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_PENDING)
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      expect(await tracker.isExpired).toBe(false)
    })
  })

  describe('waitForAcknowledgement()', () => {
    it('should return immediately when already acknowledged', async () => {
      const { fetchFn } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_ACKNOWLEDGED)
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      const status = await tracker.waitForAcknowledgement({ intervalMs: 10, timeoutMs: 100 })

      expect(status.acknowledged).toBe(1)
      expect(status.acknowledged_by).toBe('user-key-1')
    })

    it('should throw when receipt expires', async () => {
      const { fetchFn } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_EXPIRED)
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      try {
        await tracker.waitForAcknowledgement({ intervalMs: 10, timeoutMs: 100 })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverApiError)
        expect((error as Error).message).toContain('expired')
      }
    })

    it('should throw on timeout', async () => {
      const { fetchFn } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_PENDING)
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      try {
        await tracker.waitForAcknowledgement({ intervalMs: 10, timeoutMs: 30 })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(PushoverValidationError)
        expect((error as PushoverValidationError).field).toBe('timeout')
      }
    })

    it('should poll until acknowledged', async () => {
      let callCount = 0
      const { fetchFn } = createReceiptFetch(() => {
        callCount++
        if (callCount >= 3) return MOCK_RECEIPT_STATUS_ACKNOWLEDGED
        return MOCK_RECEIPT_STATUS_PENDING
      })
      const tracker = new ReceiptTracker('token', 'rcpt-123', fetchFn)

      const status = await tracker.waitForAcknowledgement({ intervalMs: 10, timeoutMs: 5000 })

      expect(status.acknowledged).toBe(1)
      expect(callCount).toBeGreaterThanOrEqual(3)
    })
  })
})

describe('PushoverClient.receipt() integration', () => {
  it('should return ReceiptTracker instance', () => {
    const fetchFn = (() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ status: 1, request: 'r' }) })
    ) as unknown as typeof globalThis.fetch
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    const tracker = client.receipt('rcpt-abc')
    expect(tracker).toBeInstanceOf(ReceiptTracker)
  })

  it('should pass token and fetchFn from client', async () => {
    const { fetchFn, calls } = createReceiptFetch(() => MOCK_RECEIPT_STATUS_PENDING)
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client.receipt('rcpt-test').status()

    expect(calls[0]!.url).toContain('/receipts/rcpt-test.json')
    expect(calls[0]!.url).toContain(`token=${VALID_CONFIG.token}`)
  })
})
