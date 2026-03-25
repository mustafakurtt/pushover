import type { PushoverResponse } from '../../src/types/response.types.ts'

export function createMockFetch(response: PushoverResponse, status = 200): typeof globalThis.fetch {
  return (() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
    })) as unknown as typeof globalThis.fetch
}

export const MOCK_SUCCESS_RESPONSE: PushoverResponse = {
  status: 1,
  request: 'test-request-id-123',
}

export const MOCK_ERROR_RESPONSE: PushoverResponse = {
  status: 0,
  request: 'test-request-id-456',
  errors: ['application token is invalid'],
}

export const VALID_CONFIG = {
  token: 'test-token-abc123',
  user: 'test-user-xyz789',
} as const

export function createSpyFetch(response: PushoverResponse = MOCK_SUCCESS_RESPONSE) {
  const calls: { url: string | URL | Request; options?: RequestInit }[] = []

  const fetchFn = ((url: string | URL | Request, options?: RequestInit) => {
    calls.push({ url, options })
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
    })
  }) as unknown as typeof globalThis.fetch

  return { fetchFn, calls }
}
