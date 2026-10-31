import test from 'node:test'
import assert from 'node:assert/strict'
import { trackEvent } from './analytics.js'

test('analytics safely does nothing when the provider is unavailable', () => {
  const previousWindow = globalThis.window
  try {
    delete globalThis.window
    assert.doesNotThrow(() => trackEvent('calculator_completed'))
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test('analytics forwards only the event name and explicitly supplied properties', () => {
  const previousWindow = globalThis.window
  const calls = []
  try {
    globalThis.window = { umami: { track: (...args) => calls.push(args) } }
    trackEvent('calculator_completed', { source: 'test' })
    assert.deepEqual(calls, [['calculator_completed', { source: 'test' }]])
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test('analytics provider errors never interrupt a customer flow', () => {
  const previousWindow = globalThis.window
  try {
    globalThis.window = {
      umami: {
        track() {
          throw new Error('provider unavailable')
        },
      },
    }
    assert.doesNotThrow(() => trackEvent('calculator_started'))
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
