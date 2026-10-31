import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateAircoElectricityUse,
  calculateAircoSavings,
  calculateInsulationSavings,
  calculateSolarSavings,
  PRODUCT_SAVINGS_PERIODS_YEARS,
} from './productSavings.js'

test('airco annual electricity preview uses delivered energy divided by SEER and SCOP independently', () => {
  assert.deepEqual(calculateAircoElectricityUse({
    annualHeatDeliveredKwh: '7000',
    heatingScop: '4',
    annualCoolingDeliveredKwh: '600',
    coolingSeer: '6',
  }), {
    heatPumpElectricityKwh: 1750,
    coolingElectricityKwh: 100,
  })
  assert.deepEqual(calculateAircoElectricityUse({
    annualHeatDeliveredKwh: '7000',
    heatingScop: '',
    annualCoolingDeliveredKwh: '0',
    coolingSeer: '6',
  }), {
    heatPumpElectricityKwh: null,
    coolingElectricityKwh: null,
  })
})

test('airco heating offsets gas at the assumed seasonal COP and subtracts its added electricity cost', () => {
  const result = calculateAircoSavings({
    annualHeatDeliveredKwh: 10000,
    annualCoolingDeliveredKwh: 0,
    heatingScop: 4,
    existingHeatingSystem: 'gas',
    annualGasUseM3: 1000,
    gasEnergyKwhPerM3: 9.77,
    boilerEfficiencyPct: 90,
    gasPricePerM3: 1.35,
    electricityPriceEurPerKwh: 0.30,
    investmentEur: 2400,
    annualMaintenanceEur: 0,
  })
  const realistic = result.scenarios.realistic
  assert.equal(result.status, 'ready')
  assert.equal(realistic.energyFlows.heatPumpElectricityKwh, 2500)
  assert.equal(realistic.energyFlows.avoidedGasM3, 1000)
  assert.ok(Math.abs(realistic.annualNetSavingsEur - 600) < 0.02)
  assert.ok(Math.abs(realistic.paybackYears - 4) < 0.02)
})

test('solar savings balance production between direct use and export', () => {
  const result = calculateSolarSavings({
    annualProductionKwh: '4000',
    directSelfUseKwh: '1600',
    panelCount: '7',
    electricityPriceEurPerKwh: '0.30',
    exportPriceEurPerKwh: '0.05',
    annualFeedInCostsEur: '20',
    annualMaintenanceEur: '50',
    investmentEur: '5000',
    confirmedSubsidyEur: '1000',
    subsidyConfirmed: false,
    scenarioRates: {
      cautious: { electricityPriceEurPerKwh: '0.25', exportPriceEurPerKwh: '0.02' },
      favorable: { electricityPriceEurPerKwh: '0.35', exportPriceEurPerKwh: '0.08' },
    },
  })

  assert.equal(result.status, 'ready')
  assert.equal(result.scenarios.realistic.energyFlows.exportedKwh, 2400)
  assert.equal(result.scenarios.realistic.energyFlows.installedCapacityKwp, 3.395)
  assert.equal(result.scenarios.realistic.annualGrossSavingsEur, 600)
  assert.equal(result.scenarios.realistic.annualExtraCostsEur, 70)
  assert.equal(result.scenarios.realistic.annualNetSavingsEur, 530)
  assert.equal(result.scenarios.realistic.netInvestmentEur, 5000)
  assert.equal(result.scenarios.realistic.projections[0].years, 5)
  assert.equal(result.scenarios.realistic.projections.at(-1).years, 25)
  assert.equal(result.scenarios.cautious.annualNetSavingsEur, 378)
  assert.equal(result.scenarios.favorable.annualNetSavingsEur, 682)
  assert.ok(result.assumptions.includes('unconfirmed-subsidy-excluded'))
})

test('solar product result estimates annual savings from 30 percent self-use and 70 percent export', () => {
  const productionKwh = 4500
  const exportKwh = Math.round(productionKwh * 0.7)
  const result = calculateSolarSavings({
    annualProductionKwh: productionKwh,
    directSelfUseKwh: productionKwh - exportKwh,
    electricityPriceEurPerKwh: 0.28,
    exportPriceEurPerKwh: 0.05,
    annualFeedInCostsEur: 0,
    investmentEur: 6000,
  })

  assert.equal(result.status, 'ready')
  assert.equal(result.scenarios.realistic.energyFlows.exportedKwh, 3150)
  assert.equal(result.scenarios.realistic.annualGrossSavingsEur, 535.5)
  assert.equal(result.scenarios.realistic.annualNetSavingsEur, 535.5)
  assert.ok(Math.abs(result.scenarios.realistic.paybackYears - (6000 / 535.5)) < 1e-10)
})

test('solar estimate derives self-use and export from household use and daytime presence', () => {
  const result = calculateSolarSavings({
    annualProductionKwh: 4500,
    annualConsumptionKwh: 4000,
    daytimePresence: 'often',
    electricityPriceEurPerKwh: 0.30,
    exportPriceEurPerKwh: 0.05,
    investmentEur: 6000,
  })

  assert.equal(result.status, 'ready')
  assert.equal(result.scenarios.realistic.energyFlows.directSelfUseKwh, 2400)
  assert.equal(result.scenarios.realistic.energyFlows.exportedKwh, 2100)
  assert.equal(result.scenarios.realistic.annualGrossSavingsEur, 825)
  assert.equal(result.scenarios.realistic.paybackYears, 6000 / 825)
  assert.ok(result.assumptions.includes('solar-self-use-estimated-from-daytime-presence'))
})

test('solar calculation rejects self-consumption greater than production', () => {
  const result = calculateSolarSavings({
    annualProductionKwh: '4000',
    directSelfUseKwh: '4100',
    electricityPriceEurPerKwh: '0.30',
    exportPriceEurPerKwh: '0.05',
    investmentEur: '5000',
  })

  assert.equal(result.status, 'incomplete')
  assert.equal(result.errors.directSelfUseKwh, 'exceeds-production')
  assert.equal(result.scenarios, undefined)
})

test('insulation estimate caps heat saved at the entered space-heating demand', () => {
  const result = calculateInsulationSavings({
    part: 'roof',
    areaM2: '100',
    uValueBefore: '1.5',
    uValueAfter: '0.5',
    heatingDegreeDays18C: '2000',
    annualSpaceHeatDemandKwh: '4000',
    heatingSystem: 'gas',
    gasEnergyKwhPerM3: '9.77',
    boilerEfficiencyPct: '90',
    gasPricePerM3: '1.35',
    investmentEur: '8000',
    confirmedSubsidyEur: '2000',
    subsidyConfirmed: true,
    annualMaintenanceEur: '50',
  })

  assert.equal(result.status, 'ready')
  assert.equal(result.scenarios.realistic.energyFlows.theoreticalHeatLossReductionKwh, 4800)
  assert.equal(result.scenarios.realistic.energyFlows.usefulHeatSavedKwh, 4000)
  assert.equal(result.scenarios.realistic.netInvestmentEur, 6000)
  assert.equal(result.scenarios.realistic.annualExtraCostsEur, 50)
  assert.equal(result.scenarios.realistic.projections.length, PRODUCT_SAVINGS_PERIODS_YEARS.length)
})

test('insulation requires a building element instead of silently estimating an unspecified area', () => {
  const result = calculateInsulationSavings({
    part: '',
    areaM2: '100',
    uValueBefore: '1.5',
    uValueAfter: '0.5',
    heatingDegreeDays18C: '2000',
    annualSpaceHeatDemandKwh: '4000',
    heatingSystem: 'gas',
    gasEnergyKwhPerM3: '9.77',
    boilerEfficiencyPct: '90',
    gasPricePerM3: '1.35',
    investmentEur: '8000',
  })

  assert.equal(result.status, 'incomplete')
  assert.equal(result.errors.part, 'required')
})

test('airco scenarios apply each scenario electricity tariff to its added consumption', () => {
  const result = calculateAircoSavings({
    annualHeatDeliveredKwh: '7000',
    annualCoolingDeliveredKwh: '500',
    heatingScop: '4',
    coolingSeer: '2.5',
    existingHeatingSystem: 'gas',
    annualGasUseM3: 1000,
    gasEnergyKwhPerM3: '9.77',
    boilerEfficiencyPct: '90',
    gasPricePerM3: '1.35',
    electricityPriceEurPerKwh: '0.27',
    investmentEur: '3000',
    annualMaintenanceEur: '100',
    scenarioRates: {
      cautious: { gasPricePerM3: '1.10', electricityPriceEurPerKwh: '0.20' },
      favorable: { gasPricePerM3: '1.60', electricityPriceEurPerKwh: '0.35' },
    },
  })

  assert.equal(result.status, 'ready')
  assert.equal(result.scenarios.realistic.energyFlows.heatPumpElectricityKwh, 1750)
  assert.equal(result.scenarios.realistic.energyFlows.coolingElectricityKwh, 200)
  assert.equal(result.scenarios.realistic.energyFlows.heatingElectricityCostEur, 1750 * 0.27)
  assert.equal(result.scenarios.realistic.energyFlows.coolingElectricityCostEur, 200 * 0.27)
  assert.equal(result.scenarios.realistic.energyFlows.totalElectricityCostEur, 1950 * 0.27)
  assert.equal(
    result.scenarios.realistic.annualExtraCostsEur,
    100 + 1950 * 0.27,
  )
  assert.notEqual(
    result.scenarios.cautious.annualExtraCostsEur,
    result.scenarios.favorable.annualExtraCostsEur,
  )
})

test('negative annual savings never produce a positive payback period', () => {
  const result = calculateAircoSavings({
    annualHeatDeliveredKwh: '7000',
    annualCoolingDeliveredKwh: '1000',
    heatingScop: '1',
    coolingSeer: '2',
    existingHeatingSystem: 'direct-electric',
    directHeaterEfficiency: '1',
    electricityPriceEurPerKwh: '0.27',
    investmentEur: '3000',
    annualMaintenanceEur: '0',
  })

  assert.equal(result.status, 'ready')
  assert.ok(result.scenarios.realistic.annualNetSavingsEur < 0)
  assert.equal(result.scenarios.realistic.energyFlows.avoidedElectricityKwh, 7000)
  assert.equal(result.scenarios.realistic.paybackYears, null)
})

test('airco cooling-only estimate needs no heating inputs and counts electricity as an added cost', () => {
  const result = calculateAircoSavings({
    annualHeatDeliveredKwh: '0',
    annualCoolingDeliveredKwh: '1200',
    coolingSeer: '4',
    electricityPriceEurPerKwh: '0.30',
    investmentEur: '1000',
    annualMaintenanceEur: '0',
  })

  assert.equal(result.status, 'ready')
  assert.equal(result.scenarios.realistic.energyFlows.heatPumpElectricityKwh, 0)
  assert.equal(result.scenarios.realistic.energyFlows.coolingElectricityKwh, 300)
  assert.equal(result.scenarios.realistic.energyFlows.existingHeatingSystem, null)
  assert.equal(result.scenarios.realistic.annualGrossSavingsEur, 0)
  assert.equal(result.scenarios.realistic.annualExtraCostsEur, 90)
  assert.equal(result.scenarios.realistic.annualNetSavingsEur, -90)
  assert.equal(result.scenarios.realistic.paybackYears, null)
})

test('airco heating with unknown or non-gas baseline does not claim avoided gas', () => {
  const result = calculateAircoSavings({
    annualHeatDeliveredKwh: 5000,
    annualCoolingDeliveredKwh: 0,
    heatingScop: 4,
    existingHeatingSystem: 'none',
    electricityPriceEurPerKwh: 0.30,
    investmentEur: 3000,
    annualMaintenanceEur: 0,
  })

  assert.equal(result.status, 'ready')
  assert.equal(result.scenarios.realistic.energyFlows.avoidedGasM3, 0)
  assert.equal(result.scenarios.realistic.energyFlows.heatPumpElectricityKwh, 1250)
  assert.equal(result.scenarios.realistic.annualGrossSavingsEur, 0)
  assert.equal(result.scenarios.realistic.annualNetSavingsEur, -375)
  assert.equal(result.scenarios.realistic.paybackYears, null)
})

test('airco heat-only estimate does not require cooling SEER', () => {
  const result = calculateAircoSavings({
    annualHeatDeliveredKwh: '4000',
    annualCoolingDeliveredKwh: '0',
    heatingScop: '4',
    existingHeatingSystem: 'direct-electric',
    directHeaterEfficiency: '1',
    electricityPriceEurPerKwh: '0.25',
    investmentEur: '2000',
    annualMaintenanceEur: '0',
  })

  assert.equal(result.status, 'ready')
  assert.equal(result.scenarios.realistic.energyFlows.heatPumpElectricityKwh, 1000)
  assert.equal(result.scenarios.realistic.energyFlows.coolingElectricityKwh, 0)
  assert.equal(result.scenarios.realistic.energyFlows.avoidedElectricityKwh, 4000)
  assert.equal(result.scenarios.realistic.annualNetSavingsEur, 750)
})

test('airco savings require at least one positive annual heating or cooling load', () => {
  const result = calculateAircoSavings({
    annualHeatDeliveredKwh: '0',
    annualCoolingDeliveredKwh: '0',
    investmentEur: '1000',
  })

  assert.equal(result.status, 'incomplete')
  assert.equal(result.errors.annualHeatDeliveredKwh, 'at-least-one-airco-use')
})
