import type { PushoverMessage } from '../types/message.types.ts'
import type { PushoverResponse } from '../types/response.types.ts'
import type { PushoverSoundValue, PushoverPriorityValue } from '../types/common.types.ts'
import type { MultiDeviceResult } from '../types/device-group.types.ts'
import type { TimeWindow } from '../types/conditional.types.ts'

type SendFunction = (message: PushoverMessage) => Promise<PushoverResponse>
type DeviceGroupResolver = (groupName: string) => string[]

export class MessageBuilder {
  private readonly sendFn: SendFunction
  private readonly deviceGroupResolver: DeviceGroupResolver | null
  private readonly message: PushoverMessage
  private devices: string[] = []
  private timeWindow: TimeWindow | null = null

  constructor(sendFn: SendFunction, text: string, deviceGroupResolver?: DeviceGroupResolver) {
    this.sendFn = sendFn
    this.deviceGroupResolver = deviceGroupResolver ?? null
    this.message = { message: text }
  }

  title(title: string): this {
    this.message.title = title
    return this
  }

  to(...devices: string[]): this {
    this.devices = devices
    return this
  }

  toGroup(groupName: string): this {
    if (!this.deviceGroupResolver) {
      throw new Error('No device groups configured. Pass deviceGroups in config.')
    }
    this.devices = this.deviceGroupResolver(groupName)
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

  onlyBetween(start: string, end: string): this {
    this.timeWindow = { start, end }
    return this
  }

  async send(): Promise<PushoverResponse | MultiDeviceResult[]> {
    if (this.timeWindow && !this.isWithinTimeWindow(this.timeWindow)) {
      return { status: 1, request: 'skipped:outside-time-window' } as PushoverResponse
    }

    if (this.devices.length > 1) {
      return this.sendToMultipleDevices()
    }

    if (this.devices.length === 1) {
      this.message.device = this.devices[0]
    }

    return this.sendFn(this.message)
  }

  private async sendToMultipleDevices(): Promise<MultiDeviceResult[]> {
    const results: MultiDeviceResult[] = []

    for (const device of this.devices) {
      try {
        const response = await this.sendFn({ ...this.message, device })
        results.push({ device, success: true, response })
      } catch (error) {
        results.push({
          device,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }

    return results
  }

  private isWithinTimeWindow(window: TimeWindow): boolean {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [startH, startM] = window.start.split(':').map(Number) as [number, number]
    const [endH, endM] = window.end.split(':').map(Number) as [number, number]
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    }

    return currentMinutes >= startMinutes || currentMinutes <= endMinutes
  }
}
