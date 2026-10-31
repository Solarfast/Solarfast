import assert from 'node:assert/strict'
import test from 'node:test'
import {
  estimateAircoAnnualElectricity,
  calculateAircoCapacity,
  getSmallestSingleSplitOptions,
  getSuitableMultiSplitPackages,
} from './aircoSizing.js'

const room = (areaM2, insulationLevel = 'average') => ({ areaM2: String(areaM2), insulationLevel })

test('single room uses its own area and insulation level for a cooling estimate', () => {
  const result = calculateAircoCapacity({ rooms: [room(25)], goal: 'cooling' })
  assert.equal(result.status, 'ready')
  assert.equal(result.systemType, 'single-split')
  assert.equal(result.rooms[0].estimatedCapacityKw, 2.5)
  assert.equal(result.rooms[0].recommendedCapacityKw, 2.5)
  assert.equal(result.totalAreaM2, 25)
  assert.equal(result.hasUnknownInsulation, false)
  assert.deepEqual(getSmallestSingleSplitOptions(2.5).map((model) => model.capacityKw), [2.5, 2.7, 2.7])
})

test('insulation grade changes the rough room cooling load', () => {
  const good = calculateAircoCapacity({ rooms: [room(25, 'good')], goal: 'cooling' })
  const poor = calculateAircoCapacity({ rooms: [room(25, 'poor')], goal: 'cooling' })
  const average30 = calculateAircoCapacity({ rooms: [room(30, 'average')], goal: 'cooling' })
  const poor35 = calculateAircoCapacity({ rooms: [room(35, 'poor')], goal: 'cooling' })
  const good40 = calculateAircoCapacity({ rooms: [room(40, 'good')], goal: 'cooling' })
  assert.equal(good.rooms[0].estimatedCapacityKw, 2)
  assert.equal(poor.rooms[0].estimatedCapacityKw, 3.25)
  assert.equal(poor.rooms[0].recommendedCapacityKw, 3.5)
  assert.equal(average30.rooms[0].estimatedCapacityKw, 3)
  assert.equal(poor35.rooms[0].estimatedCapacityKw, 4.55)
  assert.equal(good40.rooms[0].estimatedCapacityKw, 3.2)
})

test('unknown insulation uses the average guideline but cannot produce a definitive recommendation', () => {
  const unknown = calculateAircoCapacity({ rooms: [room(25, 'unknown')], goal: 'cooling-heating' })
  const average = calculateAircoCapacity({ rooms: [room(25, 'average')], goal: 'cooling' })
  assert.equal(unknown.status, 'ready')
  assert.equal(unknown.rooms[0].wattsPerM2, 100)
  assert.equal(unknown.hasUnknownInsulation, true)
  assert.equal(average.rooms[0].wattsPerM2, 100)
  assert.equal(Object.hasOwn(unknown, 'estimatedAnnualHeatingElectricityKwh'), false)
  assert.equal(Object.hasOwn(unknown, 'estimatedAnnualCoolingElectricityKwh'), false)
})

test('annual electricity estimate uses visible average SEER/SCOP and insulation assumptions', () => {
  const estimate = estimateAircoAnnualElectricity([room(25, 'average')], 'cooling-heating')
  assert.equal(estimate.seer, 6.5)
  assert.equal(estimate.scop, 4)
  assert.equal(estimate.coolingThermalKwh, 500)
  assert.equal(estimate.coolingEquivalentFullLoadHoursPerYear, 200)
  assert.equal(estimate.coolingElectricityKwh, 500 / 6.5)
  assert.equal(estimate.heatingThermalKwh, 1250)
  assert.equal(estimate.heatingElectricityKwh, 312.5)
})

test('annual electricity estimate only shows heating when heating is selected', () => {
  const estimate = estimateAircoAnnualElectricity([room(25, 'unknown')], 'cooling')
  assert.equal(estimate.heatingElectricityKwh, null)
  assert.equal(estimate.coolingElectricityKwh, 500 / 6.5)
})

test('two rooms select multi-split packages by indoor and outdoor capacity', () => {
  const result = calculateAircoCapacity({
    rooms: [room(25), room(25)],
    goal: 'cooling-heating',
  })
  assert.equal(result.status, 'ready')
  assert.equal(result.systemType, 'multi-split')
  const packages = getSuitableMultiSplitPackages(result.rooms)
  assert.ok(packages.length > 0)
  assert.ok(packages.every((pack) => pack.indoorCapacitiesKw.length === 2))
  assert.ok(packages.some((pack) => pack.brand === 'Haier' && pack.outdoorCapacityKw === 5))
})

test('multi-split candidates do not reject an inventory set solely by summing indoor ratings', () => {
  const result = calculateAircoCapacity({ rooms: [room(25), room(50)], goal: 'cooling' })
  const packages = getSuitableMultiSplitPackages(result.rooms)
  const listedLgSet = packages.find((pack) =>
    pack.brand === 'LG' &&
    pack.indoorCapacitiesKw.includes(2.5) &&
    pack.indoorCapacitiesKw.includes(5) &&
    pack.outdoorCapacityKw === 7,
  )
  assert.ok(listedLgSet)
  assert.equal(listedLgSet.indoorCapacitiesKw.reduce((sum, kw) => sum + kw, 0), 7.5)
  assert.ok(listedLgSet.outdoorCapacityKw < 7.5)
})

test('three and four rooms only recommend packages with the matching indoor-unit count', () => {
  for (const count of [3, 4]) {
    const result = calculateAircoCapacity({
      rooms: Array.from({ length: count }, () => room(15, 'good')),
      goal: 'cooling',
    })
    assert.equal(result.status, 'ready')
    assert.ok(getSuitableMultiSplitPackages(result.rooms).every((pack) => pack.indoorCapacitiesKw.length === count))
  }
})

test('invalid or missing room inputs and goal are rejected', () => {
  const missing = calculateAircoCapacity({ rooms: [{ areaM2: '', insulationLevel: '' }], goal: '' })
  assert.equal(missing.status, 'incomplete')
  assert.equal(missing.errors.room1Area, 'required')
  assert.equal(missing.errors.room1Insulation, 'required')
  assert.equal(missing.errors.goal, 'required')

  const invalid = calculateAircoCapacity({ rooms: [room('1001')], goal: 'cooling' })
  assert.equal(invalid.status, 'incomplete')
  assert.equal(invalid.errors.room1Area, 'out-of-range')
})

test('comma decimals are accepted, while a load above the sizing guide is not guessed', () => {
  const decimal = calculateAircoCapacity({ rooms: [{ areaM2: '25,5', insulationLevel: 'average' }], goal: 'cooling' })
  assert.equal(decimal.status, 'ready')
  assert.equal(decimal.rooms[0].estimatedCapacityKw, 2.55)
  assert.equal(decimal.rooms[0].recommendedCapacityKw, 3.5)

  const oversized = calculateAircoCapacity({ rooms: [room(100, 'poor')], goal: 'cooling' })
  assert.equal(oversized.status, 'incomplete')
  assert.equal(oversized.errors.room1Area, 'requires-professional-sizing')
})
