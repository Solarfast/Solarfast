import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CALCULATION_RESULTS_VERSION,
  restoreBatteryOnlyInvestment,
  shouldRefreshSavedBatteryResult,
} from './calculationVersion.js'

test('refreshes a saved battery result when its calculation version is missing', () => {
  assert.equal(
    shouldRefreshSavedBatteryResult(
      { smart_annual_low: 700 },
      { battery_kWh: 10.6 },
      null,
    ),
    true,
  )
})

test('does not refresh a result already calculated with the current model', () => {
  assert.equal(
    shouldRefreshSavedBatteryResult(
      { smart_annual_low: 544 },
      { battery_kWh: 10.6 },
      CALCULATION_RESULTS_VERSION,
    ),
    false,
  )
})

test('does not send heat-pump-only results through the battery API', () => {
  assert.equal(
    shouldRefreshSavedBatteryResult(
      { kind: 'heat-pump' },
      { mode: 'heat-pump', battery_kWh: 0 },
      null,
    ),
    false,
  )
})

test('restores the battery quote before recalculating older add-on results', () => {
  const input = { battery_kWh: 15.9, battery_price: 8950, jaarverbruik: 7000 }
  const restored = restoreBatteryOnlyInvestment(input, { baseBatteryInvestment: 7450 })

  assert.deepEqual(restored, { ...input, battery_price: 7450 })
  assert.equal(input.battery_price, 8950)
})

test('keeps the saved price when no separate battery quote exists', () => {
  const input = { battery_kWh: 10.6, battery_price: 5000 }
  assert.equal(restoreBatteryOnlyInvestment(input, { plannedAirco: { selected: true } }), input)
})