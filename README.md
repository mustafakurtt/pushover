# @mustafakurtt/pushover

Modern, TypeScript-first [Pushover](https://pushover.net/) API client. Zero dependencies. Works with **Bun** & **Node.js**.

## Why This Package?

Other Pushover packages are just thin wrappers — you still write the same boilerplate every time. This one is different:

- **Semantic methods** — `.success()`, `.error()`, `.warning()`, `.info()`, `.emergency()` with smart defaults
- **String shorthand** — `pushover.send('Deploy done!')` — no object needed for simple messages
- **One-liner `notify()`** — fire-and-forget without creating a client instance
- **Factory function** — `createPushover()` — no `new` keyword
- **Default config** — set `defaultSound`, `defaultDevice`, `defaultTitle` once, forget forever
- **Full TypeScript** — strict types, autocomplete everything
- **Zero dependencies** — native `fetch`, no bloat

```typescript
// Other packages
const push = new Pushover({ user: '...', token: '...' })
push.send({ message: 'done', title: 'Deploy', sound: 'magic', priority: 0 }, callback)

// This package
const pushover = createPushover({ token: '...', user: '...' })
await pushover.success('Deploy done!')
```

## Installation

```bash
# bun
bun add @mustafakurtt/pushover

# npm
npm install @mustafakurtt/pushover

# pnpm
pnpm add @mustafakurtt/pushover
```

## Quick Start

```typescript
import { createPushover } from '@mustafakurtt/pushover'

const pushover = createPushover({
  token: 'YOUR_APP_TOKEN',
  user: 'YOUR_USER_KEY',
})

// Simple string
await pushover.send('Hello from Pushover!')

// Semantic methods — priority, sound, title are auto-set
await pushover.success('Deployment completed')
await pushover.error('Payment service is down')
await pushover.warning('Disk usage at 85%')
await pushover.info('New user registered')
await pushover.emergency('Database unreachable!')
```

## Usage

### One-Liner (No Client Needed)

```typescript
import { notify } from '@mustafakurtt/pushover'

await notify(
  { token: 'YOUR_APP_TOKEN', user: 'YOUR_USER_KEY' },
  'Server restarted successfully',
)
```

### Default Config

```typescript
const pushover = createPushover({
  token: 'YOUR_APP_TOKEN',
  user: 'YOUR_USER_KEY',
  defaultSound: 'cosmic',
  defaultDevice: 'my-iphone',
  defaultTitle: 'My App',
})

// Every notification will use these defaults unless overridden
await pushover.send('Uses default sound, device, and title')
```

### Full Control

```typescript
import { PushoverClient, PushoverSound, PushoverPriority } from '@mustafakurtt/pushover'

const pushover = new PushoverClient({
  token: 'YOUR_APP_TOKEN',
  user: 'YOUR_USER_KEY',
})

await pushover.send({
  message: 'Server CPU usage above 90%',
  title: 'Server Alert',
  priority: PushoverPriority.HIGH,
  sound: PushoverSound.SIREN,
  url: 'https://monitor.example.com',
  urlTitle: 'View Dashboard',
})
```

### Semantic Methods with Options

```typescript
await pushover.error('Payment failed for order #1234', {
  title: 'Payment Error',
  url: 'https://admin.example.com/orders/1234',
  urlTitle: 'View Order',
})

await pushover.emergency('All replicas are down!', {
  retry: 30,
  expire: 7200,
})
```

### Error Handling

```typescript
import { PushoverError, PushoverValidationError } from '@mustafakurtt/pushover'

try {
  await pushover.send('Hello!')
} catch (err) {
  if (err instanceof PushoverValidationError) {
    console.error('Validation:', err.message)
  } else if (err instanceof PushoverError) {
    console.error('API:', err.errors)
  }
}
```

## Semantic Methods

| Method | Priority | Sound | Default Title |
|--------|----------|-------|---------------|
| `info(text)` | Low (-1) | pushover | Info |
| `success(text)` | Normal (0) | magic | Success |
| `warning(text)` | High (1) | falling | Warning |
| `error(text)` | High (1) | siren | Error |
| `emergency(text)` | Emergency (2) | persistent | EMERGENCY |

All semantic methods accept an optional second argument to override any field.

## API Reference

### `createPushover(config)` / `new PushoverClient(config)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | `string` | Yes | Application API token |
| `user` | `string` | Yes | User/group key |
| `defaultDevice` | `string` | No | Default target device |
| `defaultSound` | `PushoverSound` | No | Default notification sound |
| `defaultTitle` | `string` | No | Default notification title |

### `send(message)`

Accepts a `string` or a `PushoverMessage` object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | `string` | Yes | Notification body (max 1024 chars) |
| `title` | `string` | No | Notification title (max 250 chars) |
| `url` | `string` | No | Supplementary URL (max 512 chars) |
| `urlTitle` | `string` | No | URL title (max 100 chars) |
| `priority` | `number` | No | -2 to 2 (use `PushoverPriority`) |
| `sound` | `string` | No | Notification sound (use `PushoverSound`) |
| `device` | `string` | No | Target device name |
| `html` | `0 \| 1` | No | Enable HTML formatting |
| `timestamp` | `number` | No | Unix timestamp |
| `retry` | `number` | No | Emergency retry interval (sec, min 30) |
| `expire` | `number` | No | Emergency expiry (sec, max 10800) |

### `notify(config, message)`

Standalone function — creates a client and sends in one call.

## Requirements

- **Node.js** >= 18.0.0 (native `fetch`)
- **Bun** >= 1.0.0

## License

[MIT](./LICENSE) - Mustafa Kurt
