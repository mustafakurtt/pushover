import { describe, expect, it } from 'bun:test'
import { RequestBuilder } from '../../src/client/request-builder.ts'

const TOKEN = 'test-token'
const USER = 'test-user'

describe('RequestBuilder', () => {
  it('should build basic request body', () => {
    const builder = new RequestBuilder(TOKEN, USER, {})
    const body = builder.build({ message: 'Hello' })

    expect(body).toEqual({
      token: TOKEN,
      user: USER,
      message: 'Hello',
    })
  })

  it('should include message fields when provided', () => {
    const builder = new RequestBuilder(TOKEN, USER, {})
    const body = builder.build({
      message: 'Hello',
      title: 'Test',
      url: 'https://example.com',
      urlTitle: 'Click',
      priority: 1,
      sound: 'siren',
      device: 'iphone',
      html: 1,
      timestamp: 1234567890,
    })

    expect(body.title).toBe('Test')
    expect(body.url).toBe('https://example.com')
    expect(body.url_title).toBe('Click')
    expect(body.priority).toBe(1)
    expect(body.sound).toBe('siren')
    expect(body.device).toBe('iphone')
    expect(body.html).toBe(1)
    expect(body.timestamp).toBe(1234567890)
  })

  it('should apply defaults when message fields are not provided', () => {
    const builder = new RequestBuilder(TOKEN, USER, {
      title: 'Default Title',
      sound: 'cosmic',
      device: 'my-phone',
    })
    const body = builder.build({ message: 'Hello' })

    expect(body.title).toBe('Default Title')
    expect(body.sound).toBe('cosmic')
    expect(body.device).toBe('my-phone')
  })

  it('should override defaults with message fields', () => {
    const builder = new RequestBuilder(TOKEN, USER, {
      title: 'Default Title',
      sound: 'cosmic',
    })
    const body = builder.build({
      message: 'Hello',
      title: 'Override Title',
      sound: 'siren',
    })

    expect(body.title).toBe('Override Title')
    expect(body.sound).toBe('siren')
  })

  it('should not include undefined values', () => {
    const builder = new RequestBuilder(TOKEN, USER, {})
    const body = builder.build({ message: 'Hello' })

    expect(Object.keys(body)).toEqual(['token', 'user', 'message'])
    expect(body).not.toHaveProperty('title')
    expect(body).not.toHaveProperty('sound')
    expect(body).not.toHaveProperty('device')
  })

  it('should map urlTitle to url_title (snake_case API format)', () => {
    const builder = new RequestBuilder(TOKEN, USER, {})
    const body = builder.build({ message: 'Hello', urlTitle: 'Click here' })

    expect(body.url_title).toBe('Click here')
    expect(body).not.toHaveProperty('urlTitle')
  })

  it('should include retry and expire for emergency', () => {
    const builder = new RequestBuilder(TOKEN, USER, {})
    const body = builder.build({
      message: 'Emergency',
      priority: 2,
      retry: 60,
      expire: 3600,
    })

    expect(body.retry).toBe(60)
    expect(body.expire).toBe(3600)
  })
})
