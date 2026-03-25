import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { PushoverSound } from '../../src/constants/sounds.constants.ts'
import { PushoverPriority } from '../../src/constants/priorities.constants.ts'
import { createSpyFetch, VALID_CONFIG } from '../helpers/mock-fetch.ts'

describe('MessageBuilder (fluent chaining)', () => {
  it('should send basic message', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client.message('Hello').send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.message).toBe('Hello')
  })

  it('should chain title', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client.message('Hello').title('My Title').send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.title).toBe('My Title')
  })

  it('should chain device with to()', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client.message('Hello').to('iphone').send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.device).toBe('iphone')
  })

  it('should chain sound', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client.message('Hello').withSound(PushoverSound.SIREN).send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.sound).toBe('siren')
  })

  it('should chain priority', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client.message('Alert').withPriority(PushoverPriority.HIGH).send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.priority).toBe(1)
  })

  it('should chain url with title', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client.message('Check').withUrl('https://example.com', 'Click').send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.url).toBe('https://example.com')
    expect(body.url_title).toBe('Click')
  })

  it('should chain multiple options', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client
      .message('Server down!')
      .title('Alert')
      .to('iphone')
      .withSound(PushoverSound.SIREN)
      .withPriority(PushoverPriority.HIGH)
      .send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.message).toBe('Server down!')
    expect(body.title).toBe('Alert')
    expect(body.device).toBe('iphone')
    expect(body.sound).toBe('siren')
    expect(body.priority).toBe(1)
  })

  it('should chain html and timestamp', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client.message('<b>Bold</b>').html().timestamp(1234567890).send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.html).toBe(1)
    expect(body.timestamp).toBe(1234567890)
  })

  it('should chain retry and expire', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    await client
      .message('Emergency')
      .withPriority(PushoverPriority.EMERGENCY)
      .retry(60)
      .expire(3600)
      .send()

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.priority).toBe(2)
    expect(body.retry).toBe(60)
    expect(body.expire).toBe(3600)
  })
})
