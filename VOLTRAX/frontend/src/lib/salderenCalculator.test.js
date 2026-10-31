import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateSalderingImpact } from './salderenCalculator.js'

const standardInput = {
  annualConsumptionKwh: 3000,
  annualProductionKwh: 4400,
  annualExportKwh: 3400,
  purchasePriceEurPerKwh: 0.25,
  feedInCompensationEurPerKwh: 0.07,
  annualFeedInCostsEur: 0,
}

test('calculates the stated 2027 saldering example', () => {
  const result = calculateSalderingImpact(standardInput)
  assert.equal(result.gridImportKwh, 2000)
  assert.equal(result.salderedKwh, 2000)
  assert.ok(Math.abs(result.costsWithSalderingEur + 98) < 1e-10)
  assert.ok(Math.abs(result.costsWithoutSalderingEur - 262) < 1e-10)
  assert.equal(result.extraPerYearEur, 360)
  assert.equal(result.extraPerMonthEur, 30)
  assert.ok(Math.abs(result.extraPerDayEur - 360 / 365) < 1e-12)
})

test('zero export means no difference between the two scenarios', () => {
  const result = calculateSalderingImpact({
    ...standardInput,
    annualProductionKwh: 1000,
    annualExportKwh: 0,
  })
  assert.equal(result.gridImportKwh, 2000)
  assert.equal(result.salderedKwh, 0)
  assert.equal(result.extraPerYearEur, 0)
})

test('zero grid import means there is nothing to salder', () => {
  const result = calculateSalderingImpact({
    ...standardInput,
    annualConsumptionKwh: 1000,
    annualProductionKwh: 1500,
    annualExportKwh: 500,
  })
  assert.equal(result.gridImportKwh, 0)
  assert.equal(result.salderedKwh, 0)
  assert.equal(result.extraPerYearEur, 0)
})

test('keeps entered annual feed-in costs in both scenarios', () => {
  const result = calculateSalderingImpact({ ...standardInput, annualFeedInCostsEur: 125 })
  assert.ok(Math.abs(result.costsWithoutSalderingEur - result.costsWithSalderingEur - 360) < 1e-10)
  assert.ok(Math.abs(result.costsWithSalderingEur - 27) < 1e-10)
  assert.ok(Math.abs(result.costsWithoutSalderingEur - 387) < 1e-10)
})

test('rejects export above production and implied solar use above household use', () => {
  assert.throws(
    () => calculateSalderingImpact({ ...standardInput, annualExportKwh: 4500 }),
    /export-cannot-exceed-production/,
  )
  assert.throws(
    () => calculateSalderingImpact({
      ...standardInput,
      annualConsumptionKwh: 500,
      annualExportKwh: 1000,
    }),
    /solar-self-use-cannot-exceed-consumption/,
  )
})
