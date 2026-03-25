import { describe, expect, it } from 'bun:test'
import { PushoverClient } from '../../src/client/pushover-client.ts'
import { RequestBuilder } from '../../src/client/request-builder.ts'
import { VALID_CONFIG } from '../helpers/mock-fetch.ts'

function createAttachmentSpyFetch() {
  const calls: { url: string; options?: RequestInit }[] = []

  const fetchFn = ((url: string | URL | Request, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    calls.push({ url: urlStr, options })
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ status: 1, request: 'req-attachment' }),
    })
  }) as unknown as typeof globalThis.fetch

  return { fetchFn, calls }
}

describe('Attachment Support', () => {
  describe('RequestBuilder', () => {
    const builder = new RequestBuilder('token', 'user', {})

    it('hasAttachment should return false for normal message', () => {
      expect(builder.hasAttachment({ message: 'hello' })).toBe(false)
    })

    it('hasAttachment should return true when attachment is present', () => {
      const blob = new Blob(['test'], { type: 'image/png' })
      expect(builder.hasAttachment({ message: 'hello', attachment: blob })).toBe(true)
    })

    it('buildFormData should return FormData instance', () => {
      const blob = new Blob(['test'], { type: 'image/png' })
      const formData = builder.buildFormData({ message: 'hello', attachment: blob })
      expect(formData).toBeInstanceOf(FormData)
    })

    it('buildFormData should include text fields', () => {
      const blob = new Blob(['test'], { type: 'image/png' })
      const formData = builder.buildFormData({ message: 'hello', attachment: blob })
      expect(formData.get('message')).toBe('hello')
      expect(formData.get('token')).toBe('token')
      expect(formData.get('user')).toBe('user')
    })

    it('buildFormData should include attachment blob', () => {
      const blob = new Blob(['test'], { type: 'image/png' })
      const formData = builder.buildFormData({ message: 'hello', attachment: blob })
      const file = formData.get('attachment')
      expect(file).toBeTruthy()
    })

    it('buildFormData should use custom filename', () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' })
      const formData = builder.buildFormData({
        message: 'hello',
        attachment: blob,
        attachmentName: 'camera.jpg',
      })
      const file = formData.get('attachment') as File
      expect(file.name).toBe('camera.jpg')
    })

    it('buildFormData should handle Buffer/Uint8Array', () => {
      const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
      const formData = builder.buildFormData({ message: 'hello', attachment: buffer })
      expect(formData.get('attachment')).toBeTruthy()
    })
  })

  describe('PushoverClient with attachment', () => {
    it('should use FormData when attachment is present', async () => {
      const { fetchFn, calls } = createAttachmentSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      const blob = new Blob(['image-data'], { type: 'image/png' })
      await client.send({ message: 'Camera alert', attachment: blob })

      expect(calls[0]!.options!.body).toBeInstanceOf(FormData)
    })

    it('should NOT use FormData when no attachment', async () => {
      const { fetchFn, calls } = createAttachmentSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.send('Normal message')

      expect(typeof calls[0]!.options!.body).toBe('string')
    })

    it('should use JSON content-type for non-attachment', async () => {
      const { fetchFn, calls } = createAttachmentSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      await client.send('Normal message')

      const headers = calls[0]!.options!.headers as Record<string, string>
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should NOT set content-type for FormData (browser sets boundary)', async () => {
      const { fetchFn, calls } = createAttachmentSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      const blob = new Blob(['img'], { type: 'image/png' })
      await client.send({ message: 'With image', attachment: blob })

      expect(calls[0]!.options!.headers).toBeUndefined()
    })
  })

  describe('MessageBuilder .withAttachment()', () => {
    it('should attach via fluent builder', async () => {
      const { fetchFn, calls } = createAttachmentSpyFetch()
      const client = new PushoverClient({ ...VALID_CONFIG, fetchFn })

      const blob = new Blob(['camera'], { type: 'image/jpeg' })
      await client
        .message('Security alert')
        .withAttachment(blob, 'front-door.jpg')
        .send()

      expect(calls[0]!.options!.body).toBeInstanceOf(FormData)
    })
  })
})
