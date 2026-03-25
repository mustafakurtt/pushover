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
import { ConfigValidator } from '../validators/config.validator.ts'
import { MessageValidator } from '../validators/message.validator.ts'
import { RequestBuilder } from './request-builder.ts'

export class PushoverClient {
  private readonly requestBuilder: RequestBuilder
  private readonly fetchFn: FetchFunction

  constructor(config: PushoverConfig) {
    ConfigValidator.validate(config)

    this.fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis)
    this.requestBuilder = new RequestBuilder(config.token, config.user, {
      device: config.defaultDevice,
      sound: config.defaultSound,
      title: config.defaultTitle,
    })
  }

  async send(messageOrText: PushoverMessage | string): Promise<PushoverResponse> {
    const message = this.normalizeMessage(messageOrText)

    MessageValidator.validate(message)

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
