import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getAnnualFeedInCosts,
  getFeedInCostDetails,
  getRemainingAnnualFeedInCost,
} from './feedInCosts.js'

test('annualizes per-kWh feed-in costs using current annual exports', () => {
  assert.equal(
    getAnnualFeedInCosts({ terugleverkosten_value: 0.08, terugleverkosten_unit: 'kWh' }, 2500, 0),
    200,
  )
})

test('shows annual feed-in costs without multiplying by exports', () => {
  assert.equal(
    getAnnualFeedInCosts({ terugleverkosten_value: 320, terugleverkosten_unit: 'jaar' }, 2500, 0),
    320,
  )
})

test('uses the API value for old saved inputs without a fee field', () => {
  assert.equal(getAnnualFeedInCosts({}, 2500, 125), 125)
})

test('an explicitly entered zero overrides a nonzero scenario fallback', () => {
  assert.equal(
    getAnnualFeedInCosts({ terugleverkosten_value: 0, terugleverkosten_unit: 'jaar' }, 2500, 125),
    0,
  )
})

test('keeps a per-kWh rate visible even when annual exports are zero', () => {
  assert.deepEqual(
    getFeedInCostDetails({ terugleverkosten_value: 0.08, terugleverkosten_unit: 'kWh' }, 0, 0),
    { enteredValue: 0.08, unit: 'kWh', annualCost: 0 },
  )
})

test('uses the modeled after-battery cost rather than a guessed percentage', () => {
  assert.equal(
    getRemainingAnnualFeedInCost(
      { terugleverkosten_value: 0.12, terugleverkosten_unit: 'kWh' },
      { terugleverkosten_na: 164.84 },
      240,
    ),
    164.84,
  )
})

test('fallback scales per-kWh fees by actual exports and keeps annual fees fixed', () => {
  assert.equal(
    getRemainingAnnualFeedInCost(
      { terugleverkosten_value: 0.12, terugleverkosten_unit: 'kWh' },
      { export_kwh_with: 850 },
      240,
    ),
    102,
  )
  assert.equal(
    getRemainingAnnualFeedInCost(
      { terugleverkosten_value: 240, terugleverkosten_unit: 'jaar' },
      {},
      240,
    ),
    240,
  )
})
