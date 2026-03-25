import {
  API_SUCCESS_STATUS,
  HTTP_HEADERS,
  PUSHOVER_API_BASE_URL,
  PUSHOVER_API_ENDPOINTS,
  SEMANTIC_METHOD_CONFIG,
} from '../constants/index.ts'
import { PushoverApiError } from '../errors/api.error.ts'
import type { PushoverConfig } from '../types/config.types.ts'
import type { PushoverEmergencyMessage, PushoverMessage, PushoverShortMessage } from '../types/message.types.ts'
import type { PushoverResponse } from '../types/response.types.ts'
import type { FetchFunction } from '../types/common.types.ts'
import type { SemanticLevel } from '../types/semantic.types.ts'
import type { PushoverLimitsResponse } from '../types/limits.types.ts'
import type { QueueResult } from '../types/queue.types.ts'
import { ConfigValidator } from '../validators/config.validator.ts'
import { MessageValidator } from '../validators/message.validator.ts'
import { RequestBuilder } from './request-builder.ts'
import { RetryHandler } from './retry-handler.ts'
import { RateLimiter } from './rate-limiter.ts'
import { MessageBuilder } from './message-builder.ts'
import { MessageQueue } from './message-queue.ts'
import { LimitChecker } from './limit-checker.ts'

export class PushoverClient {
  private readonly requestBuilder: RequestBuilder
  private readonly fetchFn: FetchFunction
  private readonly retryHandler: RetryHandler | null
  private readonly rateLimiter: RateLimiter | null
  private readonly limitChecker: LimitChecker
  private readonly messageQueue: MessageQueue

  constructor(config: PushoverConfig) {
    ConfigValidator.validate(config)

    this.fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis)
    this.requestBuilder = new RequestBuilder(config.token, config.user, {
      device: config.defaultDevice,
      sound: config.defaultSound,
      title: config.defaultTitle,
    })

    this.retryHandler = config.retry ? new RetryHandler(config.retry) : null
    this.rateLimiter = config.rateLimit ? new RateLimiter(config.rateLimit) : null
    this.limitChecker = new LimitChecker(config.token, this.fetchFn)
    this.messageQueue = new MessageQueue(
      (msg: PushoverMessage) => this.executeSend(msg),
      config.queue,
    )
  }

  async send(messageOrText: PushoverMessage | string): Promise<PushoverResponse> {
    const message = this.normalizeMessage(messageOrText)
    MessageValidator.validate(message)

    if (this.rateLimiter) {
      await this.rateLimiter.acquire()
    }

    if (this.retryHandler) {
      return this.retryHandler.execute(() => this.executeSend(message))
    }

    return this.executeSend(message)
  }

  message(text: string): MessageBuilder {
    return new MessageBuilder(
      (msg: PushoverMessage) => this.send(msg),
      text,
    )
  }

  queue(messageOrText: PushoverMessage | string): this {
    this.messageQueue.add(messageOrText)
    return this
  }

  async flush(): Promise<QueueResult> {
    return this.messageQueue.flush()
  }

  get queueSize(): number {
    return this.messageQueue.size
  }

  async limits(): Promise<PushoverLimitsResponse> {
    return this.limitChecker.check()
  }

  async info(text: string, options?: PushoverShortMessage): Promise<PushoverResponse> {
    return this.sendSemantic('info', text, options)
  }

  async success(text: string, options?: PushoverShortMessage): Promise<PushoverResponse> {
    return this.sendSemantic('success', text, options)
  }

  async warning(text: string, options?: PushoverShortMessage): Promise<PushoverResponse> {
    return this.sendSemantic('warning', text, options)
  }

  async error(text: string, options?: PushoverShortMessage): Promise<PushoverResponse> {
    return this.sendSemantic('error', text, options)
  }

  async emergency(text: string, options?: PushoverEmergencyMessage): Promise<PushoverResponse> {
    return this.sendSemantic('emergency', text, options)
  }

  private async executeSend(message: PushoverMessage): Promise<PushoverResponse> {
    const body = this.requestBuilder.build(message)
    const url = `${PUSHOVER_API_BASE_URL}${PUSHOVER_API_ENDPOINTS.MESSAGES}`

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: HTTP_HEADERS.CONTENT_TYPE,
      body: JSON.stringify(body),
    })

    const data = (await response.json()) as PushoverResponse

    if (data.status !== API_SUCCESS_STATUS) {
      throw new PushoverApiError(
        `Pushover API error: ${data.errors?.join(', ') ?? 'Unknown error'}`,
        data.status,
        data.request,
        data.errors,
      )
    }

    return data
  }

  private sendSemantic(
    level: SemanticLevel,
    text: string,
    options?: PushoverShortMessage | PushoverEmergencyMessage,
  ): Promise<PushoverResponse> {
    const config = SEMANTIC_METHOD_CONFIG[level]

    return this.send({
      ...options,
      message: options?.message ?? text,
      title: options?.title ?? config.title,
      priority: config.priority,
      sound: config.sound,
      ...(config.retry !== undefined && { retry: (options as PushoverEmergencyMessage)?.retry ?? config.retry }),
      ...(config.expire !== undefined && { expire: (options as PushoverEmergencyMessage)?.expire ?? config.expire }),
    })
  }

  private normalizeMessage(messageOrText: PushoverMessage | string): PushoverMessage {
    return typeof messageOrText === 'string' ? { message: messageOrText } : messageOrText
  }
}
