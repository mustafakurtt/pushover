# @mustafakurtt/pushover

Modern, TypeScript-first [Pushover](https://pushover.net/) API client. Zero dependencies. Works with **Bun** & **Node.js**.

## Why This Package?

Other Pushover packages are just thin wrappers — you still write the same boilerplate every time. This one is different:

- **Semantic methods** — `.success()`, `.error()`, `.warning()`, `.info()`, `.emergency()` with smart defaults
- **Fluent builder** — `pushover.message('text').to('iphone').withSound('siren').send()`
- **Message queue** — batch multiple notifications and flush at once
- **Rate limiting** — built-in sliding window protection
- **Auto-retry** — exponential backoff on failures
- **Limit checker** — check your remaining monthly quota via API
- **Multi-device** — `.to('iphone', 'pixel')` or `.sendToDevices()` — one call, multiple devices
- **Device groups** — define named groups, send with `.toGroup('mobile')`
- **Templates** — reusable message presets: `.template('deploy', 'v2.0 shipped!')`
- **Conditional sending** — `.onlyBetween('09:00', '18:00')` — time-based filtering
- **Delivery groups** — full group management API: add/remove/enable/disable users, rename, list
- **Receipt tracking** — track emergency notifications: acknowledged? expired? cancel & poll
- **User validation** — verify user keys, list devices, detect groups
- **String shorthand** — `pushover.send('Deploy done!')` — no object needed
- **One-liner `notify()`** — fire-and-forget without creating a client instance
- **Factory function** — `createPushover()` — no `new` keyword
- **Default config** — set `defaultSound`, `defaultDevice`, `defaultTitle` once
- **Full TypeScript** — strict types, autocomplete everything
- **Zero dependencies** — native `fetch`, no bloat

```typescript
// Other packages
const push = new Pushover({ user: '...', token: '...' })
push.send({ message: 'done', title: 'Deploy', sound: 'magic', priority: 0 }, callback)

// This package
const pushover = createPushover({ token: '...', user: '...' })
await pushover.success('Deploy done!')

// Or with fluent builder
await pushover
  .message('Server down!')
  .to('iphone')
  .withSound('siren')
  .withPriority(1)
  .send()
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

### Fluent Builder (Method Chaining)

Build notifications step-by-step with full IDE autocomplete:

```typescript
await pushover
  .message('CPU usage above 95%')
  .title('Server Alert')
  .to('iphone')
  .withSound('siren')
  .withPriority(1)
  .withUrl('https://monitor.example.com', 'View Dashboard')
  .send()

// Emergency with retry
await pushover
  .message('All replicas are down!')
  .withPriority(2)
  .retry(60)
  .expire(3600)
  .send()

// HTML content
await pushover
  .message('<b>Bold</b> and <i>italic</i>')
  .html()
  .send()
```

### Message Queue (Batch Sending)

Queue multiple messages and send them all at once:

```typescript
pushover
  .queue('Backup started')
  .queue('Database optimized')
  .queue({ message: 'Backup completed', title: 'Backup' })

console.log(pushover.queueSize) // 3

const result = await pushover.flush()
console.log(result.succeeded.length) // 3
console.log(result.failed.length)    // 0
```

### Rate Limiting

Protect against accidentally exceeding API limits:

```typescript
const pushover = createPushover({
  token: 'YOUR_APP_TOKEN',
  user: 'YOUR_USER_KEY',
  rateLimit: {
    maxPerInterval: 10,   // max 10 messages
    intervalMs: 60_000,   // per minute
  },
})

// 11th message within a minute throws PushoverValidationError
```

### Auto-Retry with Exponential Backoff

Automatically retry failed requests:

```typescript
const pushover = createPushover({
  token: 'YOUR_APP_TOKEN',
  user: 'YOUR_USER_KEY',
  retry: {
    maxAttempts: 3,        // try up to 3 times
    baseDelayMs: 1000,     // 1s → 2s → 4s (exponential)
    maxDelayMs: 30_000,    // cap at 30s
  },
})

// If API is temporarily down, it will retry automatically
await pushover.send('This will retry on failure')
```

### Check Monthly Limits

Check your app's remaining monthly message quota:

```typescript
const limits = await pushover.limits()

console.log(limits.limit)     // 10000 (monthly limit)
console.log(limits.remaining) // 9500  (remaining this month)
console.log(limits.reset)     // Unix timestamp when limit resets
```

### Multi-Device Targeting

Send to multiple devices in one call:

```typescript
// Via method
const results = await pushover.sendToDevices('Alert!', ['iphone', 'pixel', 'desktop'])

results.forEach(r => {
  console.log(`${r.device}: ${r.success ? 'sent' : r.error?.message}`)
})

// Via fluent builder
await pushover.message('Server down!').to('iphone', 'pixel').send()
```

### Device Groups

Define named device groups in config:

```typescript
const pushover = createPushover({
  token: 'YOUR_APP_TOKEN',
  user: 'YOUR_USER_KEY',
  deviceGroups: {
    mobile: ['iphone', 'pixel'],
    all: ['iphone', 'pixel', 'desktop'],
  },
})

// Send to a group
await pushover.sendToGroup('Alert!', 'mobile')

// Or via builder
await pushover.message('Alert!').toGroup('all').send()
```

### Template Messages

Define reusable message presets:

```typescript
const pushover = createPushover({
  token: 'YOUR_APP_TOKEN',
  user: 'YOUR_USER_KEY',
  templates: {
    deploy: { title: 'Deploy', sound: 'magic', priority: 0 },
    alert: { title: 'ALERT', sound: 'siren', priority: 1 },
    monitoring: { title: 'Monitor', url: 'https://grafana.example.com', urlTitle: 'Open Grafana' },
  },
})

await pushover.template('deploy', 'v2.1.0 deployed to production')
await pushover.template('alert', 'CPU at 99%')
```

### Conditional Sending (Time-Based)

Send notifications only during specific hours:

```typescript
// Only send during business hours
await pushover
  .message('Report generated')
  .onlyBetween('09:00', '18:00')
  .send()

// Overnight window also works (e.g. night shift)
await pushover
  .message('Batch job complete')
  .onlyBetween('22:00', '06:00')
  .send()
```

### Delivery Groups (Multi-User)

Manage Pushover Delivery Groups via API — add/remove friends, enable/disable users, rename groups:

```typescript
const pushover = createPushover({
  token: 'YOUR_APP_TOKEN',
  user: 'YOUR_USER_KEY',
})

const team = pushover.group('DELIVERY_GROUP_KEY')

// Get group info & members
const info = await team.info()
console.log(info.name)   // "Project Team"
console.log(info.users)  // [{ user: '...', memo: 'Mustafa', ... }, ...]

// Add a friend to the group
await team.addUser({
  user: 'FRIEND_USER_KEY',
  memo: 'Ali',
  device: 'iphone',       // optional: target specific device
})

// Remove, disable, enable users
await team.removeUser('FRIEND_USER_KEY')
await team.disableUser('FRIEND_USER_KEY')
await team.enableUser('FRIEND_USER_KEY')

// Rename the group
await team.rename('Dev Team')

// Helper methods
const users = await team.listUsers()
const exists = await team.hasUser('FRIEND_USER_KEY')
```

> **Tip:** To send notifications to the entire group, use the group key as the `user` parameter in your config. Pushover delivers to all group members automatically.

### Receipt Tracking (Emergency)

Track and manage emergency (priority=2) notifications:

```typescript
// Send emergency → returns receipt
const response = await pushover.emergency('All servers down!', {
  retry: 30,
  expire: 3600,
})

// Track the receipt
const tracker = pushover.receipt(response.receipt!)

// Check status
const status = await tracker.status()
console.log(status.acknowledged)      // 0 or 1
console.log(status.acknowledged_by)   // user key who acknowledged
console.log(status.expired)           // 0 or 1

// Convenience getters
if (await tracker.isAcknowledged) console.log('Someone acknowledged!')
if (await tracker.isExpired) console.log('Nobody responded...')

// Cancel the emergency repeat
await tracker.cancel()

// Or poll until someone acknowledges (with timeout)
const ack = await tracker.waitForAcknowledgement({
  intervalMs: 5000,   // check every 5s (default)
  timeoutMs: 300000,  // give up after 5min (default)
})
console.log(`Acknowledged by ${ack.acknowledged_by} on ${ack.acknowledged_by_device}`)
```

### User Validation

Verify user/group keys and discover devices before sending:

```typescript
// Full validation
const result = await pushover.validateUser('USER_KEY')
console.log(result.devices)   // ['iphone', 'pixel']
console.log(result.group)     // 0 (user) or 1 (group)
console.log(result.licenses)  // ['ios', 'android']

// Validate specific device
await pushover.validateUser('USER_KEY', 'iphone')

// Simple checks
const valid = await pushover.isValidUser('USER_KEY')       // true/false
const devices = await pushover.getUserDevices('USER_KEY')   // string[]
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
import { PushoverApiError, PushoverValidationError } from '@mustafakurtt/pushover'

try {
  await pushover.send('Hello!')
} catch (err) {
  if (err instanceof PushoverValidationError) {
    console.error('Validation:', err.message, err.field)
  } else if (err instanceof PushoverApiError) {
    console.error('API:', err.apiErrors, err.code)
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
| `fetchFn` | `FetchFunction` | No | Custom fetch for testing (DI) |
| `retry` | `RetryConfig` | No | Auto-retry configuration |
| `rateLimit` | `RateLimitConfig` | No | Rate limiting configuration |
| `queue` | `QueueConfig` | No | Message queue configuration |
| `deviceGroups` | `DeviceGroupMap` | No | Named device groups |
| `templates` | `TemplateMap` | No | Reusable message presets |

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

### `message(text)` → `MessageBuilder`

Fluent builder methods: `.title()`, `.to(...devices)`, `.toGroup(name)`, `.withSound()`, `.withPriority()`, `.withUrl()`, `.html()`, `.timestamp()`, `.retry()`, `.expire()`, `.onlyBetween(start, end)`, `.send()`

### `template(name, text)`

Send using a predefined template. Templates are defined in config.

### `sendToDevices(message, devices)`

Send to multiple devices. Returns `MultiDeviceResult[]` with per-device success/failure.

### `sendToGroup(message, groupName)`

Send to a named device group. Groups are defined in config.

### `queue(message)` / `flush()`

Queue messages and send them in batch. Returns `QueueResult` with `succeeded` and `failed` arrays.

### `limits()`

Returns `PushoverLimitsResponse` with `limit`, `remaining`, and `reset` fields.

### `group(groupKey)` → `GroupManager`

Full Delivery Group management:

| Method | Description |
|--------|-------------|
| `.info()` | Get group name and member list |
| `.addUser({ user, device?, memo? })` | Add a user to the group |
| `.removeUser(userKey)` | Remove a user from the group |
| `.disableUser(userKey)` | Temporarily disable a user |
| `.enableUser(userKey)` | Re-enable a disabled user |
| `.rename(name)` | Rename the delivery group |
| `.listUsers()` | Shorthand for `info().users` |
| `.hasUser(userKey)` | Check if a user is in the group |

### `receipt(receiptId)` → `ReceiptTracker`

Track emergency notifications:

| Method | Description |
|--------|-------------|
| `.status()` | Get full receipt status (acknowledged, expired, etc.) |
| `.cancel()` | Cancel the emergency notification repeat |
| `.isAcknowledged` | `Promise<boolean>` — was it acknowledged? |
| `.isExpired` | `Promise<boolean>` — did it expire? |
| `.waitForAcknowledgement(options?)` | Poll until acknowledged, expired, or timeout |

### `validateUser(userKey, device?)`

Validate a user/group key. Returns `UserValidationResponse` with `devices`, `group`, `licenses`.

### `isValidUser(userKey)` → `Promise<boolean>`

Quick check if a user key is valid.

### `getUserDevices(userKey)` → `Promise<string[]>`

Get all registered devices for a user.

### `notify(config, message)`

Standalone function — creates a client and sends in one call.

## Requirements

- **Node.js** >= 18.0.0 (native `fetch`)
- **Bun** >= 1.0.0

## License

[MIT](./LICENSE) - Mustafa Kurt
