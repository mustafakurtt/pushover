import { QUEUE_DEFAULTS } from '../constants/queue.constants.ts'
import { PushoverValidationError } from '../errors/validation.error.ts'
import type { PushoverMessage } from '../types/message.types.ts'
import type { PushoverResponse } from '../types/response.types.ts'
import type { QueueConfig, QueueResult, QueueFailedItem } from '../types/queue.types.ts'

type SendFunction = (message: PushoverMessage) => Promise<PushoverResponse>

export class MessageQueue {
  private readonly sendFn: SendFunction
  private readonly maxSize: number
  private readonly autoFlushSize: number
  private readonly autoFlushIntervalMs: number
  private readonly items: PushoverMessage[] = []
  private autoFlushTimer: ReturnType<typeof setInterval> | null = null

  constructor(sendFn: SendFunction, config?: QueueConfig) {
    this.sendFn = sendFn
    this.maxSize = config?.maxSize ?? QUEUE_DEFAULTS.MAX_SIZE
    this.autoFlushSize = config?.autoFlushSize ?? QUEUE_DEFAULTS.AUTO_FLUSH_SIZE
    this.autoFlushIntervalMs = config?.autoFlushIntervalMs ?? QUEUE_DEFAULTS.AUTO_FLUSH_INTERVAL_MS
  }

  add(messageOrText: PushoverMessage | string): this {
    if (this.items.length >= this.maxSize) {
      throw new PushoverValidationError(
        `Queue is full. Max size: ${this.maxSize}`,
        'queue',
      )
    }

    const message = typeof messageOrText === 'string'
      ? { message: messageOrText }
      : messageOrText

    this.items.push(message)
    return this
  }

  get size(): number {
    return this.items.length
  }

  get isEmpty(): boolean {
    return this.items.length === 0
  }

  clear(): void {
    this.items.length = 0
  }

  async flush(): Promise<QueueResult> {
    const batch = this.items.splice(0, this.items.length)

    const succeeded: PushoverResponse[] = []
    const failed: QueueFailedItem[] = []

    for (const message of batch) {
      try {
        const response = await this.sendFn(message)
        succeeded.push(response)
      } catch (error) {
        failed.push({
          message,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }

    return { succeeded, failed }
  }

  startAutoFlush(): void {
    if (this.autoFlushTimer) return

    this.autoFlushTimer = setInterval(async () => {
      if (this.items.length >= this.autoFlushSize) {
        await this.flush()
      }
    }, this.autoFlushIntervalMs)
  }

  stopAutoFlush(): void {
    if (this.autoFlushTimer) {
      clearInterval(this.autoFlushTimer)
      this.autoFlushTimer = null
    }
  }
}
