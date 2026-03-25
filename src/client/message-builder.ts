import type { PushoverMessage } from '../types/message.types.ts'
import type { PushoverResponse } from '../types/response.types.ts'
import type { PushoverSoundValue, PushoverPriorityValue } from '../types/common.types.ts'

type SendFunction = (message: PushoverMessage) => Promise<PushoverResponse>

export class MessageBuilder {
  private readonly sendFn: SendFunction
  private readonly message: PushoverMessage

  constructor(sendFn: SendFunction, text: string) {
    this.sendFn = sendFn
    this.message = { message: text }
  }

  title(title: string): this {
    this.message.title = title
    return this
  }

  to(device: string): this {
    this.message.device = device
    return this
  }

  withSound(sound: PushoverSoundValue): this {
    this.message.sound = sound
    return this
  }

  withPriority(priority: PushoverPriorityValue): this {
    this.message.priority = priority
    return this
  }

  withUrl(url: string, urlTitle?: string): this {
    this.message.url = url
    if (urlTitle !== undefined) this.message.urlTitle = urlTitle
    return this
  }

  html(enabled = true): this {
    this.message.html = enabled ? 1 : 0
    return this
  }

  timestamp(ts: number): this {
    this.message.timestamp = ts
    return this
  }

  retry(seconds: number): this {
    this.message.retry = seconds
    return this
  }

  expire(seconds: number): this {
    this.message.expire = seconds
    return this
  }

  async send(): Promise<PushoverResponse> {
    return this.sendFn(this.message)
  }
}
