import {
  PUSHOVER_API_BASE_URL,
  PUSHOVER_API_ENDPOINTS,
  API_SUCCESS_STATUS,
} from '../constants/api.constants.ts'
import { PushoverApiError } from '../errors/api.error.ts'
import { PushoverValidationError } from '../errors/validation.error.ts'
import type { FetchFunction } from '../types/common.types.ts'
import type { ReceiptStatus, ReceiptCancelResponse, ReceiptPollOptions } from '../types/receipt.types.ts'

const POLL_DEFAULTS = {
  INTERVAL_MS: 5_000,
  TIMEOUT_MS: 300_000,
} as const

export class ReceiptTracker {
  private readonly token: string
  private readonly receipt: string
  private readonly fetchFn: FetchFunction

  constructor(token: string, receipt: string, fetchFn: FetchFunction) {
    if (!receipt || receipt.trim().length === 0) {
      throw new PushoverValidationError('Receipt is required', 'receipt')
    }

    this.token = token
    this.receipt = receipt
    this.fetchFn = fetchFn
  }

  async status(): Promise<ReceiptStatus> {
    const url = this.buildUrl(PUSHOVER_API_ENDPOINTS.RECEIPT_STATUS) + `?token=${this.token}`

    const response = await this.fetchFn(url)
    const data = (await response.json()) as ReceiptStatus

    if (data.status !== API_SUCCESS_STATUS) {
      throw new PushoverApiError(
        'Failed to fetch receipt status',
        data.status,
        data.request,
      )
    }

    return data
  }

  async cancel(): Promise<ReceiptCancelResponse> {
    const url = this.buildUrl(PUSHOVER_API_ENDPOINTS.RECEIPT_CANCEL)

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.token }),
    })

    const data = (await response.json()) as ReceiptCancelResponse

    if (data.status !== API_SUCCESS_STATUS) {
      throw new PushoverApiError(
        `Failed to cancel receipt: ${data.errors?.join(', ') ?? 'Unknown error'}`,
        data.status,
        data.request,
        data.errors,
      )
    }

    return data
  }

  get isAcknowledged(): Promise<boolean> {
    return this.status().then(s => s.acknowledged === 1)
  }

  get isExpired(): Promise<boolean> {
    return this.status().then(s => s.expired === 1)
  }

  async waitForAcknowledgement(options?: ReceiptPollOptions): Promise<ReceiptStatus> {
    const intervalMs = options?.intervalMs ?? POLL_DEFAULTS.INTERVAL_MS
    const timeoutMs = options?.timeoutMs ?? POLL_DEFAULTS.TIMEOUT_MS
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const receiptStatus = await this.status()

      if (receiptStatus.acknowledged === 1) {
        return receiptStatus
      }

      if (receiptStatus.expired === 1) {
        throw new PushoverApiError(
          'Emergency notification expired without acknowledgement',
          receiptStatus.status,
          receiptStatus.request,
        )
      }

      await this.sleep(intervalMs)
    }

    throw new PushoverValidationError(
      `Acknowledgement timeout after ${timeoutMs}ms`,
      'timeout',
    )
  }

  private buildUrl(endpointTemplate: string): string {
    const path = endpointTemplate.replace('{receipt}', this.receipt)
    return `${PUSHOVER_API_BASE_URL}${path}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
