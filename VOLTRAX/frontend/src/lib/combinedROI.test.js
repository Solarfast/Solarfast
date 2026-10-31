import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateBatterySolarPackageROI,
  calculateCombinedROI,
  calculateHeatPumpAnnualCostAfterBattery,
  calculateHeatPumpMarginalElectricityCost,
  getAdditionalAircoGasSavings,
} from './combinedROI.js'

const baselineCosts = {
  net_annual_cost_without: 4000,
}

const combinedBatteryCosts = {
  net_annual_cost_with: 2800,
  dynamic_contract: true,
  smart_annual_low: 400,
  smart_annual_high: 600,
}

test('battery plus solar package ROI compares whole-house costs and counts EPEX once', () => {
  const result = calculateBatterySolarPackageROI({
    baselineResults: { net_annual_cost_without: 4000 },
    combinedResults: {
      net_annual_cost_with: 2800,
      dynamic_contract: true,
      smart_annual_low: 400,
      smart_annual_high: 600,
    },
    batteryInvestmentEur: 5000,
    solarInvestmentEur: 6000,
  })

  assert.equal(result.annualLowEur, 1600)
  assert.equal(result.annualHighEur, 1800)
  assert.equal(result.investmentEur, 11000)
  assert.equal(result.paybackLowYears, 11000 / 1800)
  assert.equal(result.paybackHighYears, 11000 / 1600)
})

const allElectricHeatPump = {
  annualGasBeforeM3: 1200,
  annualGasRemainingM3: 0,
  gasPricePerM3: 1.35,
  gasStandingCostBeforeEur: 425,
  gasConnectionRemoved: true,
  model: { config: 'all-electric' },
  investmentEur: 10000,
}

test('combined ROI compares whole-house costs and includes the separate EPEX estimate once', () => {
  const result = calculateCombinedROI({
    batteryResults: combinedBatteryCosts,
    batteryWithoutHeatPumpResults: baselineCosts,
    batteryInvestmentEur: 7000,
    heatPumpROI: allElectricHeatPump,
  })

  assert.equal(result.baselineAnnualCostEur, 6045)
  assert.equal(result.combinedAnnualCostBeforeEpexEur, 2800)
  assert.equal(result.annualSavingsBeforeEpexEur, 3245)
  assert.equal(result.standingGasSavingsEur, 425)
  assert.equal(result.annualLowEur, 3645)
  assert.equal(result.annualHighEur, 3845)
  assert.equal(result.totalInvestmentEur, 17000)
  assert.equal(result.paybackLowYears, 17000 / 3845)
  assert.equal(result.paybackHighYears, 17000 / 3645)
  assert.equal(result.tenYearNetLowEur, 36450 - 17000)
  assert.equal(result.tenYearNetHighEur, 38450 - 17000)
})

test('heat-pump electricity cost uses the household bill difference after solar and battery', () => {
  const result = calculateHeatPumpMarginalElectricityCost({
    batteryOnlyResults: { net_annual_cost_with: 400 },
    combinedBatteryResults: { net_annual_cost_with: 560 },
    heatPumpElectricityKwh: 2000,
  })
  assert.deepEqual(result, {
    annualCostEur: 160,
    effectivePricePerKwh: 0.08,
    heatPumpElectricityKwh: 2000,
  })
})

test('heat-pump annual cost replaces retail-priced battery kWh with its cheap charging cost', () => {
  const result = calculateHeatPumpAnnualCostAfterBattery({
    standaloneAnnualCostEur: 1000,
    heatPumpElectricityPriceEurPerKwh: 0.28,
    heatPumpBatteryKwh: 500,
    totalEpexHomeDeliveryKwh: 1000,
    totalEpexHomeChargeCostEur: 157.89,
  })
  assert.ok(Math.abs(result - 938.945) < 1e-9)
})

test('heat-pump annual cost stays unchanged when no cheap battery energy is allocated', () => {
  assert.equal(calculateHeatPumpAnnualCostAfterBattery({
    standaloneAnnualCostEur: 1000,
    heatPumpElectricityPriceEurPerKwh: 0.28,
    heatPumpBatteryKwh: 0,
    totalEpexHomeDeliveryKwh: 0,
    totalEpexHomeChargeCostEur: 0,
  }), 1000)
})

test('solar-charged battery energy is valued at its lost export price, not retail', () => {
  assert.equal(calculateHeatPumpAnnualCostAfterBattery({
    standaloneAnnualCostEur: 1000,
    heatPumpElectricityPriceEurPerKwh: 0.28,
    heatPumpSolarBatteryKwh: 200,
    solarBatteryOpportunityPriceEurPerKwh: 0.07,
  }), 958)
})

test('heat-pump marginal price is unavailable without both comparable household bills', () => {
  assert.equal(calculateHeatPumpMarginalElectricityCost({
    batteryOnlyResults: null,
    combinedBatteryResults: { net_annual_cost_with: 500 },
    heatPumpElectricityKwh: 2000,
  }), null)
})

test('unconfirmed gas removal keeps fixed gas charges in the combined scenario', () => {
  const result = calculateCombinedROI({
    batteryResults: combinedBatteryCosts,
    batteryWithoutHeatPumpResults: baselineCosts,
    batteryInvestmentEur: 7000,
    heatPumpROI: { ...allElectricHeatPump, gasConnectionRemoved: false },
  })

  assert.equal(result.standingGasSavingsEur, 0)
  assert.equal(result.standingGasCostAfterEur, 425)
  assert.equal(result.annualLowEur, 3220)
  assert.equal(result.annualHighEur, 3420)
})

test('combined savings are unavailable if the no-product baseline is missing', () => {
  const result = calculateCombinedROI({
    batteryResults: combinedBatteryCosts,
    batteryWithoutHeatPumpResults: null,
    batteryInvestmentEur: 7000,
    heatPumpROI: allElectricHeatPump,
  })

  assert.equal(result, null)
})

test('annual savings remain available without a heat-pump quote, but payback does not', () => {
  const result = calculateCombinedROI({
    batteryResults: combinedBatteryCosts,
    batteryWithoutHeatPumpResults: baselineCosts,
    batteryInvestmentEur: 7000,
    heatPumpROI: { ...allElectricHeatPump, investmentEur: null },
  })

  assert.equal(result.totalInvestmentEur, null)
  assert.equal(result.paybackLowYears, null)
  assert.equal(result.tenYearNetLowEur, null)
})

test('combined package return includes an added air-conditioner investment', () => {
  const result = calculateCombinedROI({
    batteryResults: { ...combinedBatteryCosts, net_annual_cost_with: 3100 },
    batteryWithoutHeatPumpResults: baselineCosts,
    batteryInvestmentEur: 7000,
    heatPumpROI: allElectricHeatPump,
    additionalInvestmentEur: 3000,
    hasAdditionalInvestment: true,
    additionalProductsModeled: true,
  })

  assert.equal(result.totalInvestmentEur, 20000)
  assert.equal(result.annualLowEur, 3345)
  assert.equal(result.annualHighEur, 3545)
  assert.equal(result.paybackLowYears, 20000 / 3545)
  assert.equal(result.paybackHighYears, 20000 / 3345)
})

test('package ROI is unavailable when an added product has no modeled financial effect', () => {
  const result = calculateCombinedROI({
    batteryResults: combinedBatteryCosts,
    batteryWithoutHeatPumpResults: baselineCosts,
    batteryInvestmentEur: 7000,
    heatPumpROI: allElectricHeatPump,
    additionalInvestmentEur: 3000,
    hasAdditionalInvestment: true,
  })

  assert.equal(result, null)
})

test('combined package payback stays unavailable when an added product has no entered price', () => {
  const result = calculateCombinedROI({
    batteryResults: combinedBatteryCosts,
    batteryWithoutHeatPumpResults: baselineCosts,
    batteryInvestmentEur: 7000,
    heatPumpROI: allElectricHeatPump,
    additionalInvestmentEur: null,
    hasAdditionalInvestment: true,
    additionalProductsModeled: true,
  })

  assert.equal(result.annualLowEur, 3645)
  assert.equal(result.totalInvestmentEur, null)
  assert.equal(result.paybackLowYears, null)
})

test('modeled product combinations use their full household energy cost, not a fixed savings figure', () => {
  const additions = [
    { names: ['airco'], investment: 2400, annualCost: 3100 },
    { names: ['charger'], investment: 1800, annualCost: 3400 },
    { names: ['solar'], investment: 3500, annualCost: 2200 },
    { names: ['airco', 'charger'], investment: 4200, annualCost: 3700 },
    { names: ['airco', 'charger', 'solar'], investment: 7700, annualCost: 2500 },
  ]

  for (const scenario of additions) {
    const result = calculateCombinedROI({
      batteryResults: { ...combinedBatteryCosts, net_annual_cost_with: scenario.annualCost },
      batteryWithoutHeatPumpResults: baselineCosts,
      batteryInvestmentEur: 7000,
      heatPumpROI: allElectricHeatPump,
      additionalInvestmentEur: scenario.investment,
      hasAdditionalInvestment: true,
      additionalProductsModeled: true,
    })

    assert.equal(result.totalInvestmentEur, 17000 + scenario.investment, scenario.names.join('+'))
    assert.equal(result.annualLowEur, 6045 - scenario.annualCost + 400, scenario.names.join('+'))
    assert.equal(result.annualHighEur, 6045 - scenario.annualCost + 600, scenario.names.join('+'))
    assert.equal(result.roiLowPct, result.annualLowEur / result.totalInvestmentEur * 100)
    assert.equal(result.paybackLowYears, result.totalInvestmentEur / result.annualHighEur)
  }
})

test('a modeled airco adds only gas savings not already represented in household electricity costs', () => {
  const hybrid = {
    ...allElectricHeatPump,
    model: { config: 'hybrid' },
    annualGasRemainingM3: 220,
    gasPricePerM3: 1.55,
    gasConnectionRemoved: false,
  }
  const aircoGasSavings = getAdditionalAircoGasSavings({
    status: 'ready',
    scenarios: { realistic: { annualGrossSavingsEur: 500 } },
  }, hybrid)
  assert.equal(aircoGasSavings, 341)

  const result = calculateCombinedROI({
    batteryResults: combinedBatteryCosts,
    batteryWithoutHeatPumpResults: baselineCosts,
    batteryInvestmentEur: 7000,
    heatPumpROI: hybrid,
    additionalInvestmentEur: 2000,
    hasAdditionalInvestment: true,
    additionalProductsModeled: true,
    additionalGasSavingsEur: aircoGasSavings,
  })
  assert.equal(result.annualLowEur, 3460)
  assert.equal(result.annualHighEur, 3660)
  assert.equal(result.totalInvestmentEur, 19000)
})

test('100 deterministic mixed-household scenarios preserve the whole-house ROI arithmetic', () => {
  for (let i = 1; i <= 100; i += 1) {
    const baselineElectric = 2500 + i * 17
    const combinedElectric = 1800 + i * 13
    const gasBefore = 500 + i * 6
    const gasAfter = i * 1.2
    const gasRate = 1.1 + (i % 10) * 0.05
    const epexLow = 100 + i * 2
    const epexHigh = epexLow + 75
    const aircoGas = Math.min(i * 4, gasAfter * gasRate)
    const investment = 9000 + i * 31
    const result = calculateCombinedROI({
      batteryResults: {
        net_annual_cost_with: combinedElectric,
        dynamic_contract: true,
        smart_annual_low: epexLow,
        smart_annual_high: epexHigh,
      },
      batteryWithoutHeatPumpResults: { net_annual_cost_without: baselineElectric },
      batteryInvestmentEur: investment / 2,
      heatPumpROI: {
        annualGasBeforeM3: gasBefore,
        annualGasRemainingM3: gasAfter,
        gasPricePerM3: gasRate,
        gasStandingCostBeforeEur: 0,
        investmentEur: investment / 2,
        model: { config: 'hybrid' },
      },
      additionalInvestmentEur: 1200,
      hasAdditionalInvestment: true,
      additionalProductsModeled: true,
      additionalGasSavingsEur: aircoGas,
    })
    const before = baselineElectric + gasBefore * gasRate
    const after = combinedElectric + gasAfter * gasRate
    assert.ok(Math.abs(result.annualLowEur - (before - after + aircoGas + epexLow)) < 1e-8, `case ${i}`)
    assert.ok(Math.abs(result.annualHighEur - (before - after + aircoGas + epexHigh)) < 1e-8, `case ${i}`)
    assert.ok(Math.abs(result.totalInvestmentEur - (investment + 1200)) < 1e-8, `case ${i}`)
    assert.ok(result.paybackLowYears <= result.paybackHighYears, `payback order case ${i}`)
  }
})