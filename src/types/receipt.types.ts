export interface ReceiptStatus {
  status: number
  request: string
  acknowledged: 0 | 1
  acknowledged_at: number
  acknowledged_by: string
  acknowledged_by_device: string
  last_delivered_at: number
  expired: 0 | 1
  expires_at: number
  called_back: 0 | 1
  called_back_at: number
}

export interface ReceiptCancelResponse {
  status: number
  request: string
  errors?: string[]
}

export interface ReceiptPollOptions {
  intervalMs?: number
  timeoutMs?: number
}
