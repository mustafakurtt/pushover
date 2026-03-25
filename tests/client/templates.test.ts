import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { PushoverValidationError } from '../../src/errors/validation.error.ts'
import { PushoverPriority } from '../../src/constants/priorities.constants.ts'
import { PushoverSound } from '../../src/constants/sounds.constants.ts'
import { createSpyFetch, VALID_CONFIG } from '../helpers/mock-fetch.ts'

describe('Template Messages', () => {
  it('should send with template config', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({
      ...VALID_CONFIG,
      fetchFn,
      templates: {
        deploy: { title: 'Deploy', sound: PushoverSound.MAGIC, priority: PushoverPriority.NORMAL },
      },
    })

    await client.template('deploy', 'v2.1.0 deployed to production')

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.message).toBe('v2.1.0 deployed to production')
    expect(body.title).toBe('Deploy')
    expect(body.sound).toBe('magic')
    expect(body.priority).toBe(0)
  })

  it('should send with alert template', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({
      ...VALID_CONFIG,
      fetchFn,
      templates: {
        alert: { title: 'ALERT', sound: PushoverSound.SIREN, priority: PushoverPriority.HIGH },
      },
    })

    await client.template('alert', 'CPU %99')

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.title).toBe('ALERT')
    expect(body.sound).toBe('siren')
    expect(body.priority).toBe(1)
  })

  it('should throw on unknown template', async () => {
    const { fetchFn } = createSpyFetch()
    const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

    try {
      await client.template('nonexistent', 'Test')
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(PushoverValidationError)
      expect((error as PushoverValidationError).field).toBe('template')
    }
  })

  it('should list available templates in error', async () => {
    const { fetchFn } = createSpyFetch()
    const client = new PushoverClient({
      ...VALID_CONFIG,
      fetchFn,
      templates: { deploy: { title: 'Deploy' }, alert: { title: 'Alert' } },
    })

    try {
      await client.template('unknown', 'Test')
    } catch (error) {
      expect((error as Error).message).toContain('deploy')
      expect((error as Error).message).toContain('alert')
    }
  })

  it('should support template with device and url', async () => {
    const { fetchFn, calls } = createSpyFetch()
    const client = new PushoverClient({
      ...VALID_CONFIG,
      fetchFn,
      templates: {
        monitoring: {
          title: 'Monitor',
          device: 'server-phone',
          url: 'https://grafana.example.com',
          urlTitle: 'Open Grafana',
        },
      },
    })

    await client.template('monitoring', 'Latency spike detected')

    const body = JSON.parse(calls[0]!.options!.body as string)
    expect(body.device).toBe('server-phone')
    expect(body.url).toBe('https://grafana.example.com')
    expect(body.url_title).toBe('Open Grafana')
  })
})
