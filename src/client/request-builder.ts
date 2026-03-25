import type { PushoverDefaults } from '../types/config.types.ts'
import type { PushoverMessage } from '../types/message.types.ts'

export class RequestBuilder {
  private readonly token: string
  private readonly user: string
  private readonly defaults: PushoverDefaults

  constructor(token: string, user: string, defaults: PushoverDefaults) {
    this.token = token
    this.user = user
    this.defaults = defaults
  }

  build(message: PushoverMessage): Record<string, unknown> {
    const body: Record<string, unknown> = {
      token: this.token,
      user: this.user,
      message: message.message,
    }

    body.title = message.title ?? this.defaults.title
    body.sound = message.sound ?? this.defaults.sound
    body.device = message.device ?? this.defaults.device

    if (message.url !== undefined) body.url = message.url
    if (message.urlTitle !== undefined) body.url_title = message.urlTitle
    if (message.priority !== undefined) body.priority = message.priority
    if (message.html !== undefined) body.html = message.html
    if (message.timestamp !== undefined) body.timestamp = message.timestamp
    if (message.retry !== undefined) body.retry = message.retry
    if (message.expire !== undefined) body.expire = message.expire

    return this.removeUndefined(body)
  }

  buildFormData(message: PushoverMessage): FormData {
    const fields = this.build(message)
    const formData = new FormData()

    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, String(value))
    }

    if (message.attachment) {
      const blob = message.attachment instanceof Blob
        ? message.attachment
        : new Blob([message.attachment], { type: 'image/png' })
      formData.append('attachment', blob, message.attachmentName ?? 'image.png')
    }

    return formData
  }

  hasAttachment(message: PushoverMessage): boolean {
    return message.attachment !== undefined
  }

  private removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined))
  }
}
