import assert from 'node:assert/strict'
import test from 'node:test'
import { getBatteryTenYearNet } from './batteryProjection.js'

test('uses the backend ten-year total without applying a second haircut', () => {
  assert.deepEqual(getBatteryTenYearNet({
    total_annual_low: 1000,
    total_annual_high: 1200,
    ten_year_net_low_eur: 5000,
    ten_year_net_high_eur: 7000,
  }, 5000), {
    low: 5000,
    high: 7000,
  })
})

test('older results fall back to ten annual savings minus the investment', () => {
  assert.deepEqual(getBatteryTenYearNet({
    total_annual_low: 1000,
    total_annual_high: 1200,
  }, 5000), {
    low: 5000,
    high: 7000,
  })
})

test('missing values do not turn into a fabricated zero-valued projection', () => {
  assert.equal(getBatteryTenYearNet({ total_annual_low: null }, 5000), null)
})
