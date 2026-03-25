import { PushoverClient } from '../client/pushover-client.ts'
import type { PushoverConfig } from '../types/config.types.ts'
import type { PushoverMessage } from '../types/message.types.ts'
import type { PushoverResponse } from '../types/response.types.ts'

export function createPushover(config: PushoverConfig): PushoverClient {
  return new PushoverClient(config)
}

export async function notify(
  config: PushoverConfig,
  messageOrText: PushoverMessage | string,
): Promise<PushoverResponse> {
  const client = new PushoverClient(config)
  return client.send(messageOrText)
}
