import assert from 'node:assert/strict'
import test from 'node:test'
import {
  selectScenarioPrimaryBatteryRecommendation,
  selectLargerBatteryAlternative,
  selectStandardBatteryRecommendation,
  shouldOfferLargerBatteryAlternative,
} from './batteryRecommendation.js'

const candidates = [
  { product_id: 'small', battery_kWh: 10.6, roi_pct: 21.8, balanced_fit: true },
  { product_id: 'standard', battery_kWh: 15.9, roi_pct: 24.08, balanced_fit: false },
  { product_id: 'large', battery_kWh: 21.2, roi_pct: 26.23, balanced_fit: false },
  { product_id: 'largest', battery_kWh: 26.5, roi_pct: 27.93, balanced_fit: false },
]

test('default selects the highest-ROI standard size, not a larger size', () => {
  assert.equal(selectStandardBatteryRecommendation(candidates)?.product_id, 'standard')
})

test('standard balanced fit is the fallback when standard sizes have no positive ROI', () => {
  const noPositiveRoi = candidates.map((item) => ({ ...item, roi_pct: -1 }))
  assert.equal(selectStandardBatteryRecommendation(noPositiveRoi)?.product_id, 'small')
})

test('a financially recommended larger size can become primary when the scenario warrants it', () => {
  const ranked = candidates.map((item) => ({
    ...item,
    recommended: item.product_id === 'large',
    incremental_roi_pct: item.product_id === 'large' ? 8.5 : 0,
  }))

  assert.equal(
    selectScenarioPrimaryBatteryRecommendation(ranked, true)?.product_id,
    'large',
  )
  assert.equal(
    selectScenarioPrimaryBatteryRecommendation(ranked, false)?.product_id,
    'standard',
  )
})

test('larger primary recommendation requires positive overall and incremental ROI', () => {
  const base = candidates.map((item) => ({
    ...item,
    recommended: item.product_id === 'large',
    incremental_roi_pct: item.product_id === 'large' ? 8.5 : 0,
  }))
  const unprofitableLarger = base.map((item) => (
    item.product_id === 'large' ? { ...item, roi_pct: 0 } : item
  ))
  const unrankedLarger = base.map((item) => (
    item.product_id === 'large' ? { ...item, recommended: false } : item
  ))

  assert.equal(selectScenarioPrimaryBatteryRecommendation(unprofitableLarger, true)?.product_id, 'standard')
  assert.equal(selectScenarioPrimaryBatteryRecommendation(unrankedLarger, true)?.product_id, 'standard')
})

test('a selected-phase candidate set without larger models cannot promote or offer one', () => {
  const selectedPhaseCandidates = candidates.filter((item) => item.battery_kWh <= 15.9)
  const primary = selectScenarioPrimaryBatteryRecommendation(selectedPhaseCandidates, true)

  assert.ok(primary)
  assert.ok(primary.battery_kWh <= 15.9)
  assert.equal(selectLargerBatteryAlternative(selectedPhaseCandidates, primary, true), null)
})

test('larger alternative is hidden unless the energy scenario warrants it', () => {
  const primary = selectStandardBatteryRecommendation(candidates)
  assert.equal(selectLargerBatteryAlternative(candidates, primary, false), null)
  assert.equal(
    selectLargerBatteryAlternative(candidates, primary, true)?.product_id,
    'largest',
  )
})

test('larger alternatives are triggered by high annual totals or planned additions', () => {
  const baseline = {
    projectedConsumptionKwh: 5000,
    projectedSolarKwh: 5500,
    plannedSolar: false,
    plannedHeatPump: false,
    plannedEv: false,
  }
  assert.equal(shouldOfferLargerBatteryAlternative(baseline), false)
  assert.equal(shouldOfferLargerBatteryAlternative({
    ...baseline,
    projectedConsumptionKwh: 6000,
  }), true)
  assert.equal(shouldOfferLargerBatteryAlternative({
    ...baseline,
    projectedSolarKwh: 6000,
  }), true)
  assert.equal(shouldOfferLargerBatteryAlternative({
    ...baseline,
    plannedSolar: true,
  }), true)
  assert.equal(shouldOfferLargerBatteryAlternative({
    ...baseline,
    plannedHeatPump: true,
  }), true)
  assert.equal(shouldOfferLargerBatteryAlternative({
    ...baseline,
    plannedEv: true,
  }), true)
})