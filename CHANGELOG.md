# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
- 67 unit tests (bun:test) — errors, validators, request-builder, client, factory
- MIT license
