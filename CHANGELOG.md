# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] — 2026-03-25

### Added
- **Fluent Builder** — `pushover.message('text').to('iphone').withSound('siren').send()` with full method chaining
- **Message Queue** — `pushover.queue('msg1').queue('msg2')` then `await pushover.flush()` for batch sending
- **Rate Limiter** — built-in sliding window rate limiting via `rateLimit` config option
- **Auto-Retry** — exponential backoff with jitter via `retry` config option (`RetryHandler`)
- **Limit Checker** — `await pushover.limits()` to check remaining monthly API quota
- `MessageBuilder`, `MessageQueue`, `RetryHandler`, `RateLimiter`, `LimitChecker` classes
- `RetryConfig`, `RateLimitConfig`, `QueueConfig`, `QueueResult`, `PushoverLimitsResponse` types
- `RETRY_DEFAULTS`, `RATE_LIMIT_DEFAULTS`, `QUEUE_DEFAULTS` constants
- 95 unit tests (up from 67) — all new features fully tested

## [0.1.0] — 2026-03-25

### Added
- `PushoverClient` class with `send()` method for sending notifications
- Semantic shorthand methods: `info()`, `success()`, `warning()`, `error()`, `emergency()` with smart defaults
- `createPushover()` factory function — no `new` keyword needed
- `notify()` one-liner — send notifications without creating a client instance
- String shorthand support — `pushover.send('text')` without wrapping in an object
- Default config support — `defaultSound`, `defaultDevice`, `defaultTitle`
- `fetchFn` dependency injection for testable HTTP layer
- Error hierarchy: `PushoverBaseError` (abstract) → `PushoverApiError`, `PushoverValidationError`
- `PushoverSound` and `PushoverPriority` constant objects with full type inference
- `MESSAGE_LIMITS`, `EMERGENCY_DEFAULTS`, `ERROR_MESSAGES` constants — zero magic strings/numbers
- `SEMANTIC_METHOD_CONFIG` data-driven map — extensible via Open/Closed principle
- `MessageValidator`, `ConfigValidator` as separate classes — Single Responsibility
- `RequestBuilder` class — isolated HTTP body construction
- Full TypeScript type definitions (strict mode, 5 separate type files)
- ESM + CJS + DTS build output (tsup, tree-shakeable)
- MIT license
