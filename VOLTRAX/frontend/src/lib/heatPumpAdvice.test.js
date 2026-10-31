import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getHeatPumpAdvice,
  getInsulationLevel,
  INSULATION_PARTS,
  HEATED_AREA_RANGES,
  ANNUAL_GAS_RANGES,
  getRangeById,
  getRangeForValue,
  getRangeMidpoint,
  effectiveHeatElectricityPrice,
  getCombinationContractDefaults,
} from './heatPumpAdvice.js'
import { DEFAULT_HEAT_ASSUMPTIONS, calculateHeatPumpROI, normalizeHeatPumpROIResult } from './heatPumpROI.js'
import { HEAT_PUMP_PRODUCTS, findHeatPump } from './heatPumpProducts.js'

const home = {
  heat_home_type: 'terraced',
  heat_build_period: '2005-2020',
  heat_area_m2: '120',
  heat_gas_usage: '1200',
  heat_insulation: 'good',
  heat_emitters: 'floor',
}

test('default hybrid scenario models 80% total gas reduction and uses the stated electricity price', () => {
  assert.equal(DEFAULT_HEAT_ASSUMPTIONS.electricPricePerKwh, 0.26)
  const model = findHeatPump('vaillant-pro-5-hybrid')
  const result = calculateHeatPumpROI({
    model,
    annualHeatDemandKwh: 1000 * 0.8 * 9.77 * 0.9,
    gasPricePerM3: 1.55,
    electricPricePerKwh: 0.26,
    totalGasUseM3: 1000,
    investmentEur: model.finalPriceEur,
    flowTemperature: 55,
  })
  assert.equal(result.annualGasAvoidedM3, 800)
  assert.equal(result.annualGasRemainingM3, 200)
})

test('advises an existing all-electric model for a well insulated low-temperature home', () => {
  const advice = getHeatPumpAdvice(home)
  assert.equal(advice.recommendedConfig, 'all-electric')
  assert.equal(advice.suggestedModel?.config, 'all-electric')
  assert.equal(advice.flowTemperature, 35)
  assert.equal(advice.estimatedSpaceGasM3, 960)
  const roi = calculateHeatPumpROI({
    model: advice.suggestedModel,
    annualHeatDemandKwh: advice.annualHeatDemandKwh,
    gasPricePerM3: 1.35,
    electricPricePerKwh: 0.27,
    boilerEfficiencyPct: 90,
    gasEnergyKwhPerM3: 9.77,
    flowTemperature: advice.flowTemperature,
    investmentEur: 12000,
  })
  assert.equal(roi.annualGasAvoidedM3, 960)
  assert.ok(roi.electricityPerGasM3 > 1.7 && roi.electricityPerGasM3 < 2)
})

test('radiators and poor insulation favor hybrid and higher flow temperature', () => {
  const advice = getHeatPumpAdvice({
    ...home, heat_home_type: 'detached', heat_build_period: 'pre-1975',
    heat_insulation: 'poor', heat_emitters: 'radiators',
  })
  assert.equal(advice.recommendedConfig, 'hybrid')
  assert.equal(advice.flowTemperature, 55)
  assert.ok(advice.requiredKw > 10)
  assert.equal(advice.sizingNeedsReview, true)
})

test('insulation checklist maps to existing sizing bands without changing gas-based heat demand', () => {
  const cases = [
    [[], 'poor'],
    [['roof'], 'poor'],
    [['roof', 'walls'], 'average'],
    [['roof', 'walls', 'floor'], 'average'],
    [INSULATION_PARTS, 'good'],
  ]

  const advice = cases.map(([parts, expectedLevel]) => {
    const result = getHeatPumpAdvice({ ...home, heat_insulation_parts: parts })
    assert.equal(result.insulationLevel, expectedLevel)
    return result
  })

  assert.deepEqual(new Set(advice.map((item) => item.annualHeatDemandKwh)), new Set([1200 * 0.8 * 9.77 * 0.9]))
  assert.equal(advice[0].recommendedConfig, 'hybrid')
  assert.equal(advice.at(-1).recommendedConfig, 'all-electric')
  assert.ok(advice[0].requiredKw > advice.at(-1).requiredKw)
})

test('legacy insulation levels remain supported and unknown checklist entries do not inflate the level', () => {
  assert.equal(getInsulationLevel(null, 'average'), 'average')
  assert.equal(getInsulationLevel(['roof', 'roof', 'unknown'], 'good'), 'poor')
  assert.equal(getInsulationLevel(['roof', 'walls', 'unknown']), 'average')
})

test('dropdown range selections resolve to transparent rounded midpoints', () => {
  const areaRange = getRangeById('100-124', HEATED_AREA_RANGES)
  const gasRange = getRangeById('1000-1249', ANNUAL_GAS_RANGES)
  assert.equal(getRangeMidpoint(areaRange), 112)
  assert.equal(getRangeMidpoint(gasRange), 1125)
  assert.equal(getRangeForValue('120', HEATED_AREA_RANGES)?.id, '100-124')
  assert.equal(getRangeForValue('1200', ANNUAL_GAS_RANGES)?.id, '1000-1249')
  assert.equal(getRangeById('outside', HEATED_AREA_RANGES), null)
})

test('typed annual gas use is used exactly in the preliminary comparison', () => {
  const enteredGas = 1234.5
  const advice = getHeatPumpAdvice({ ...home, heat_gas_usage: String(enteredGas) })
  assert.equal(advice.estimatedSpaceGasM3, enteredGas * 0.8)
  assert.equal(advice.annualHeatDemandKwh, enteredGas * 0.8 * 9.77 * 0.9)
})

test('energy label and yes/no insulation answers refine the preliminary sizing band', () => {
  const highEfficiencyHome = {
    ...home,
    heat_energy_label: 'A',
    heat_insulation_roof: 'yes',
    heat_insulation_walls: 'yes',
    heat_insulation_floor: 'yes',
    heat_insulation_glazing: 'yes',
  }
  const lowEfficiencyHome = {
    ...home,
    heat_energy_label: 'G',
    heat_insulation_roof: 'no',
    heat_insulation_walls: 'no',
    heat_insulation_floor: 'no',
    heat_insulation_glazing: 'no',
  }
  const efficientAdvice = getHeatPumpAdvice(highEfficiencyHome)
  const inefficientAdvice = getHeatPumpAdvice(lowEfficiencyHome)

  assert.equal(efficientAdvice.energyLabel, 'A')
  assert.equal(efficientAdvice.insulationLevel, 'good')
  assert.equal(efficientAdvice.recommendedConfig, 'all-electric')
  assert.deepEqual(efficientAdvice.insulationParts, INSULATION_PARTS)
  assert.equal(inefficientAdvice.energyLabel, 'G')
  assert.equal(inefficientAdvice.insulationLevel, 'poor')
  assert.equal(inefficientAdvice.recommendedConfig, 'hybrid')
  assert.deepEqual(inefficientAdvice.insulationParts, [])
  assert.ok(inefficientAdvice.requiredKw > efficientAdvice.requiredKw)
})

test('air-conditioning is captured without treating it as a water-based low-temperature emitter', () => {
  const advice = getHeatPumpAdvice({
    ...home,
    heat_energy_label: 'A',
    heat_insulation_roof: 'yes',
    heat_insulation_walls: 'yes',
    heat_insulation_floor: 'yes',
    heat_insulation_glazing: 'yes',
    heat_emitters: 'air-conditioning',
  })
  assert.equal(advice.recommendedConfig, 'hybrid')
  assert.equal(advice.flowTemperature, 55)
  assert.equal(advice.heatingMethodNeedsReview, true)
})

test('incomplete or implausible inputs cannot generate advice', () => {
  assert.equal(getHeatPumpAdvice({ ...home, heat_gas_usage: '' }), null)
  assert.equal(getHeatPumpAdvice({ ...home, heat_area_m2: '0' }), null)
})

test('dynamic market value is not represented as an arbitrary heat-pump tariff discount', () => {
  assert.equal(effectiveHeatElectricityPrice('0,30', { isCombination: true, isDynamic: true }), 0.3)
  assert.equal(effectiveHeatElectricityPrice('0,30', { isCombination: true, isDynamic: false }), 0.3)
  assert.equal(effectiveHeatElectricityPrice('0,30', { isCombination: false, isDynamic: true }), 0.3)
})

test('combined mode defaults to dynamic, while preserving an explicit tariff choice', () => {
  assert.deepEqual(getCombinationContractDefaults(''), {
    heatContractType: 'dynamic',
    dynamicContract: true,
  })
  assert.deepEqual(getCombinationContractDefaults('fixed'), {
    heatContractType: 'fixed',
    dynamicContract: false,
  })
  assert.deepEqual(getCombinationContractDefaults('variable'), {
    heatContractType: 'variable',
    dynamicContract: false,
  })
})

test('all-electric includes hot water but retains standing charges until removal is confirmed', () => {
  const advice = getHeatPumpAdvice(home)
  const roi = calculateHeatPumpROI({
    model: advice.suggestedModel,
    annualHeatDemandKwh: advice.annualHeatDemandKwh,
    totalGasUseM3: 1200,
    gasStandingCostEur: 425,
    gasConnectionRemoved: false,
    gasPricePerM3: 1.35,
    electricPricePerKwh: 0.27,
    flowTemperature: advice.flowTemperature,
    investmentEur: advice.suggestedModel.finalPriceEur,
  })
  assert.equal(roi.annualGasAvoidedM3, 1200)
  assert.equal(roi.annualGasRemainingM3, 0)
  assert.equal(roi.gasStandingSavingsEur, 0)
  assert.equal(roi.gasConnectionRemoved, false)
  assert.ok(roi.annualHotWaterElectricityKwh > 0)
  assert.equal(
    roi.annualHeatPumpElectricityKwh,
    roi.coveredHeatKwh / roi.scopUsed + roi.annualHotWaterElectricityKwh,
  )
  assert.ok(roi.annualSavingsEur > 0)
  assert.ok(Math.abs(roi.beforeAnnualCostEur - roi.afterAnnualCostEur -
    roi.annualSavingsEur) < 0.001)
})

test('all-electric saves standing charges only after connection removal is confirmed', () => {
  const advice = getHeatPumpAdvice(home)
  const roi = calculateHeatPumpROI({
    model: advice.suggestedModel,
    annualHeatDemandKwh: advice.annualHeatDemandKwh,
    totalGasUseM3: 1200,
    gasStandingCostEur: 425,
    gasConnectionRemoved: true,
    gasPricePerM3: 1.35,
    electricPricePerKwh: 0.27,
    flowTemperature: advice.flowTemperature,
    investmentEur: advice.suggestedModel.finalPriceEur,
  })
  assert.equal(roi.gasStandingSavingsEur, 425)
})

test('legacy all-electric estimates do not retain automatic fixed-charge savings', () => {
  const result = normalizeHeatPumpROIResult({
    model: { config: 'all-electric' },
    annualGasRemainingM3: 0,
    gasStandingCostBeforeEur: 425,
    gasStandingSavingsEur: 425,
    annualSavingsEur: 1000,
    afterAnnualCostEur: 500,
    investmentEur: 10000,
  })
  assert.equal(result.gasStandingSavingsEur, 0)
  assert.equal(result.afterAnnualCostEur, 925)
  assert.equal(result.annualSavingsEur, 575)
})

test('hybrid saves 80% of household gas but keeps standing gas costs', () => {
  const advice = getHeatPumpAdvice({ ...home, heat_insulation: 'average', heat_emitters: 'radiators' })
  const roi = calculateHeatPumpROI({
    model: findHeatPump('vaillant-pro-7-hybrid'),
    annualHeatDemandKwh: advice.annualHeatDemandKwh,
    totalGasUseM3: 1200,
    gasStandingCostEur: 425,
    gasPricePerM3: 1.35,
    electricPricePerKwh: 0.27,
    hybridCoveragePct: advice.hybridCoveragePct,
    flowTemperature: advice.flowTemperature,
    investmentEur: findHeatPump('vaillant-pro-7-hybrid').finalPriceEur,
  })
  assert.equal(roi.annualGasAvoidedM3, 960)
  assert.equal(roi.annualGasRemainingM3, 240)
  assert.equal(roi.gasStandingSavingsEur, 0)
  assert.equal(roi.annualHotWaterElectricityKwh, 0)
})

test('all fourteen supplied final prices remain unique and usable', () => {
  assert.equal(HEAT_PUMP_PRODUCTS.length, 14)
  assert.equal(new Set(HEAT_PUMP_PRODUCTS.map((product) => product.id)).size, 14)
  const expectedFinalPrices = {
    'vaillant-pro-11-all-electric': 12275.63,
    'vaillant-pro-11-hybrid': 7443.74,
    'vaillant-pro-5-all-electric': 11877.79,
    'vaillant-pro-5-hybrid': 6882.54,
    'vaillant-pro-7-all-electric': 11803.49,
    'vaillant-pro-7-hybrid': 6971.60,
    'weheat-blackbird-p60-hybrid': 8475.63,
    'weheat-blackbird-p60-all-electric': 14005.03,
    'weheat-blackbird-p80-hybrid': 8605.52,
    'weheat-blackbird-p80-all-electric': 14208.43,
    'weheat-flint-p40-hybrid': 5572.48,
    'weheat-flint-p40-all-electric': 10718.00,
    'weheat-sparrow-p60-hybrid': 8042.75,
    'weheat-sparrow-p60-all-electric': 13572.15,
  }
  for (const [id, expectedPrice] of Object.entries(expectedFinalPrices)) {
    const product = findHeatPump(id)
    assert.equal(product?.finalPriceEur, expectedPrice, `${id} final price`)
    assert.ok(
      Math.abs(product.catalogPriceEur - product.subsidyEur - expectedPrice) < 0.005,
      `${id} price breakdown`,
    )
  }
  assert.ok(HEAT_PUMP_PRODUCTS.every((product) => product.finalPriceEur > 0))
})