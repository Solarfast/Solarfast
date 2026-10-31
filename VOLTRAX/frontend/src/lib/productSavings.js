import { estimateSolarDirectSelfUse } from './solarEstimate.js'

export const PRODUCT_SAVINGS_PERIODS_YEARS = Object.freeze([5, 10, 15, 20, 25])
export const LONGI_PANEL_WP = 485

const numeric = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(String(value).trim().replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function calculateAircoElectricityUse(input = {}) {
  const annualHeat = numeric(input.annualHeatDeliveredKwh)
  const heatingScop = numeric(input.heatingScop)
  const annualCooling = numeric(input.annualCoolingDeliveredKwh)
  const coolingSeer = numeric(input.coolingSeer)
  return {
    heatPumpElectricityKwh: annualHeat > 0 && heatingScop > 0
      ? annualHeat / heatingScop
      : null,
    coolingElectricityKwh: annualCooling > 0 && coolingSeer > 0
      ? annualCooling / coolingSeer
      : null,
  }
}

function readNumber(input, key, errors, { min = 0, max = Infinity, optional = false } = {}) {
  const raw = input?.[key]
  if (raw === '' || raw === null || raw === undefined) {
    if (!optional) errors[key] = 'required'
    return optional ? 0 : null
  }
  const value = numeric(raw)
  if (value === null) {
    errors[key] = 'invalid'
    return null
  }
  if (value < min || value > max) {
    errors[key] = 'out-of-range'
    return null
  }
  return value
}

function readRates(rates, requiredKeys) {
  if (!rates || typeof rates !== 'object') return null
  const parsed = {}
  for (const key of requiredKeys) {
    parsed[key] = numeric(rates[key])
    if (parsed[key] === null || parsed[key] < 0) return null
  }
  return parsed
}

function buildFinancialScenario({
  annualGrossSavingsEur,
  annualExtraCostsEur,
  investmentEur,
  subsidyEur,
  energyFlows,
}) {
  const annualNetSavingsEur = annualGrossSavingsEur - annualExtraCostsEur
  const netInvestmentEur = Math.max(0, investmentEur - subsidyEur)

  return {
    annualGrossSavingsEur,
    annualExtraCostsEur,
    annualNetSavingsEur,
    grossInvestmentEur: investmentEur,
    confirmedSubsidyEur: subsidyEur,
    netInvestmentEur,
    roiPct: netInvestmentEur > 0 ? annualNetSavingsEur / netInvestmentEur * 100 : null,
    paybackYears: netInvestmentEur > 0 && annualNetSavingsEur > 0
      ? netInvestmentEur / annualNetSavingsEur
      : null,
    energyFlows,
    projections: PRODUCT_SAVINGS_PERIODS_YEARS.map((years) => {
      const cumulativeOperatingSavingsEur = annualNetSavingsEur * years
      return {
        years,
        cumulativeOperatingSavingsEur,
        netFinancialResultEur: cumulativeOperatingSavingsEur - netInvestmentEur,
      }
    }),
  }
}

function prepareCommon(input, errors, assumptions) {
  const investmentEur = readNumber(input, 'investmentEur', errors)
  const confirmedSubsidyEur = input?.subsidyConfirmed
    ? readNumber(input, 'confirmedSubsidyEur', errors)
    : 0
  const annualMaintenanceEur = readNumber(input, 'annualMaintenanceEur', errors, { optional: true })

  if (input?.annualMaintenanceEur === '' || input?.annualMaintenanceEur == null) {
    assumptions.push('maintenance-excluded')
  }
  if (input?.subsidyConfirmed && investmentEur !== null &&
      confirmedSubsidyEur !== null && confirmedSubsidyEur > investmentEur) {
    errors.confirmedSubsidyEur = 'exceeds-investment'
  }
  if (!input?.subsidyConfirmed && numeric(input?.confirmedSubsidyEur) > 0) {
    assumptions.push('unconfirmed-subsidy-excluded')
  }

  return { investmentEur, confirmedSubsidyEur, annualMaintenanceEur }
}

function incomplete(productType, errors, assumptions = []) {
  return {
    status: 'incomplete',
    productType,
    errors,
    missingFields: Object.keys(errors),
    assumptions,
  }
}

function assembleScenarios({
  productType,
  input,
  requiredRateKeys,
  energyFlows,
  calculateGrossSavings,
  annualExtraCostsEur,
  calculateExtraCosts,
  calculateScenarioEnergyFlows,
  investmentEur,
  confirmedSubsidyEur,
  assumptions,
}) {
  const realisticRates = readRates(input, requiredRateKeys)
  if (!realisticRates) {
    const errors = Object.fromEntries(requiredRateKeys.map((key) => [key, 'required']))
    return incomplete(productType, errors, assumptions)
  }

  const makeScenario = (rates) => buildFinancialScenario({
    annualGrossSavingsEur: calculateGrossSavings(rates),
    annualExtraCostsEur: calculateExtraCosts
      ? calculateExtraCosts(rates)
      : annualExtraCostsEur,
    investmentEur,
    subsidyEur: confirmedSubsidyEur,
    energyFlows: calculateScenarioEnergyFlows
      ? calculateScenarioEnergyFlows(rates)
      : energyFlows,
  })

  const cautiousRates = readRates(input?.scenarioRates?.cautious, requiredRateKeys)
  const favorableRates = readRates(input?.scenarioRates?.favorable, requiredRateKeys)
  assumptions.push('current-tariffs-held-constant')
  assumptions.push('no-degradation-maintenance-or-replacement-unless-entered')

  return {
    status: 'ready',
    productType,
    scenarios: {
      cautious: cautiousRates ? makeScenario(cautiousRates) : null,
      realistic: makeScenario(realisticRates),
      favorable: favorableRates ? makeScenario(favorableRates) : null,
    },
    assumptions,
    dataOrigin: 'user-provided',
  }
}

export function calculateSolarSavings(input = {}) {
  const errors = {}
  const assumptions = ['solar-standalone-not-additive-to-battery-calculation']
  const common = prepareCommon(input, errors, assumptions)
  const productionKwh = readNumber(input, 'annualProductionKwh', errors, { min: Number.EPSILON })
  const suppliedDirectUse = input.directSelfUseKwh === '' || input.directSelfUseKwh == null
    ? null
    : readNumber(input, 'directSelfUseKwh', errors)
  const annualConsumptionKwh = suppliedDirectUse === null
    ? readNumber(input, 'annualConsumptionKwh', errors, { min: Number.EPSILON })
    : numeric(input.annualConsumptionKwh)
  const daytimePresence = input.daytimePresence || 'mixed'
  const electricityPriceEurPerKwh = readNumber(input, 'electricityPriceEurPerKwh', errors)
  const exportPriceEurPerKwh = readNumber(input, 'exportPriceEurPerKwh', errors)
  const annualFeedInCostsEur = readNumber(input, 'annualFeedInCostsEur', errors, { optional: true })
  const panelCount = input.panelCount === '' || input.panelCount == null
    ? null
    : numeric(input.panelCount)

  if (input?.annualFeedInCostsEur === '' || input?.annualFeedInCostsEur == null) {
    assumptions.push('feed-in-costs-excluded')
  }
  if (input.panelCount !== '' && input.panelCount != null &&
      (panelCount === null || !Number.isInteger(panelCount) || panelCount < 1)) {
    errors.panelCount = 'invalid'
  }
  if (productionKwh !== null && suppliedDirectUse !== null && suppliedDirectUse > productionKwh) {
    errors.directSelfUseKwh = 'exceeds-production'
  }
  if (Object.keys(errors).length) return incomplete('solar', errors, assumptions)

  const solarEstimate = suppliedDirectUse === null
    ? estimateSolarDirectSelfUse({
        annualProductionKwh: productionKwh,
        annualConsumptionKwh,
        daytimePresence,
      })
    : {
        estimatedDirectSelfUseKwh: suppliedDirectUse,
        estimatedExportKwh: productionKwh - suppliedDirectUse,
        daytimePresence,
      }
  if (suppliedDirectUse === null) {
    assumptions.push('solar-self-use-estimated-from-daytime-presence')
  }
  const directSelfUseKwh = solarEstimate.estimatedDirectSelfUseKwh
  const exportedKwh = productionKwh - directSelfUseKwh
  const energyFlows = {
    annualProductionKwh: productionKwh,
    directSelfUseKwh,
    annualConsumptionKwh,
    daytimePresence,
    selfUseEstimated: suppliedDirectUse === null,
    exportedKwh,
    installedCapacityKwp: panelCount > 0
      ? panelCount * LONGI_PANEL_WP / 1000
      : null,
    panelWp: LONGI_PANEL_WP,
  }
  const annualExtraCostsEur = annualFeedInCostsEur + common.annualMaintenanceEur

  return assembleScenarios({
    productType: 'solar',
    input: { ...input, electricityPriceEurPerKwh, exportPriceEurPerKwh },
    requiredRateKeys: ['electricityPriceEurPerKwh', 'exportPriceEurPerKwh'],
    energyFlows,
    calculateGrossSavings: (rates) =>
      directSelfUseKwh * rates.electricityPriceEurPerKwh +
      exportedKwh * rates.exportPriceEurPerKwh,
    annualExtraCostsEur,
    investmentEur: common.investmentEur,
    confirmedSubsidyEur: common.confirmedSubsidyEur,
    assumptions,
  })
}

export function calculateInsulationSavings(input = {}) {
  const errors = {}
  const assumptions = ['transmission-only-estimate', 'standalone-not-additive-to-heat-pump-or-battery']
  const common = prepareCommon(input, errors, assumptions)
  const areaM2 = readNumber(input, 'areaM2', errors, { min: Number.EPSILON })
  const uValueBefore = readNumber(input, 'uValueBefore', errors, { min: Number.EPSILON })
  const uValueAfter = readNumber(input, 'uValueAfter', errors)
  const heatingDegreeDays18C = readNumber(input, 'heatingDegreeDays18C', errors, { min: Number.EPSILON })
  const annualSpaceHeatDemandKwh = readNumber(input, 'annualSpaceHeatDemandKwh', errors, { min: Number.EPSILON })

  if (!['wall', 'floor', 'roof', 'glazing'].includes(input.part)) {
    errors.part = 'required'
  }
  if (!['gas', 'heat-pump', 'direct-electric'].includes(input.heatingSystem)) {
    errors.heatingSystem = 'required'
  }
  if (uValueBefore !== null && uValueAfter !== null && uValueAfter >= uValueBefore) {
    errors.uValueAfter = 'must-be-lower-than-before'
  }

  let gasEnergyKwhPerM3 = null
  let boilerEfficiencyPct = null
  let scop = null
  if (input.heatingSystem === 'gas') {
    gasEnergyKwhPerM3 = readNumber(input, 'gasEnergyKwhPerM3', errors, { min: Number.EPSILON })
    boilerEfficiencyPct = readNumber(input, 'boilerEfficiencyPct', errors, { min: Number.EPSILON, max: 100 })
  }
  if (input.heatingSystem === 'heat-pump') {
    scop = readNumber(input, 'scop', errors, { min: 1, max: 8 })
  }
  if (Object.keys(errors).length) return incomplete('insulation', errors, assumptions)

  const theoreticalHeatLossReductionKwh =
    areaM2 * (uValueBefore - uValueAfter) * heatingDegreeDays18C * 24 / 1000
  const usefulHeatSavedKwh = Math.min(theoreticalHeatLossReductionKwh, annualSpaceHeatDemandKwh)
  const energyFlows = {
    part: input.part || 'unspecified',
    areaM2,
    theoreticalHeatLossReductionKwh,
    usefulHeatSavedKwh,
    heatingSystem: input.heatingSystem,
    gasAvoidedM3: input.heatingSystem === 'gas'
      ? usefulHeatSavedKwh / (gasEnergyKwhPerM3 * boilerEfficiencyPct / 100)
      : 0,
    electricityAvoidedKwh: input.heatingSystem === 'heat-pump'
      ? usefulHeatSavedKwh / scop
      : input.heatingSystem === 'direct-electric' ? usefulHeatSavedKwh : 0,
  }
  const annualExtraCostsEur = common.annualMaintenanceEur
  const requiredRateKeys = input.heatingSystem === 'gas'
    ? ['gasPricePerM3']
    : ['electricityPriceEurPerKwh']

  return assembleScenarios({
    productType: 'insulation',
    input,
    requiredRateKeys,
    energyFlows,
    calculateGrossSavings: (rates) => input.heatingSystem === 'gas'
      ? energyFlows.gasAvoidedM3 * rates.gasPricePerM3
      : energyFlows.electricityAvoidedKwh * rates.electricityPriceEurPerKwh,
    annualExtraCostsEur,
    investmentEur: common.investmentEur,
    confirmedSubsidyEur: common.confirmedSubsidyEur,
    assumptions,
  })
}

export function calculateAircoSavings(input = {}) {
  const errors = {}
  const assumptions = ['user-entered-annual-heat-and-cooling-delivery', 'standalone-not-additive-to-heat-pump-or-battery']
  const common = prepareCommon(input, errors, assumptions)
  const annualHeatDeliveredKwh = readNumber(input, 'annualHeatDeliveredKwh', errors, { optional: true })
  const annualCoolingDeliveredKwh = readNumber(input, 'annualCoolingDeliveredKwh', errors, { optional: true })
  const heatingInUse = annualHeatDeliveredKwh > 0
  const coolingInUse = annualCoolingDeliveredKwh > 0
  const heatingScop = heatingInUse
    ? readNumber(input, 'heatingScop', errors, { min: 1, max: 8 })
    : 0
  const coolingSeer = coolingInUse
    ? readNumber(input, 'coolingSeer', errors, { min: 1, max: 15 })
    : 0

  if (!heatingInUse && !coolingInUse) {
    errors.annualHeatDeliveredKwh = 'at-least-one-airco-use'
  }
  if (heatingInUse && !['gas', 'direct-electric', 'none'].includes(input.existingHeatingSystem)) {
    errors.existingHeatingSystem = 'required'
  }
  let gasEnergyKwhPerM3 = null
  let boilerEfficiencyPct = null
  let annualGasUseM3 = null
  const directHeaterEfficiency = heatingInUse && input.existingHeatingSystem === 'direct-electric'
    ? readNumber(input, 'directHeaterEfficiency', errors, { min: 0.1, max: 1 })
    : null
  if (heatingInUse && input.existingHeatingSystem === 'gas') {
    gasEnergyKwhPerM3 = readNumber(input, 'gasEnergyKwhPerM3', errors, { min: Number.EPSILON })
    boilerEfficiencyPct = readNumber(input, 'boilerEfficiencyPct', errors, { min: Number.EPSILON, max: 100 })
    annualGasUseM3 = readNumber(input, 'annualGasUseM3', errors, { min: Number.EPSILON })
  }
  if (Object.keys(errors).length) return incomplete('airco', errors, assumptions)

  const annualElectricityUse = calculateAircoElectricityUse(input)
  const heatPumpElectricityKwh = annualElectricityUse.heatPumpElectricityKwh ?? 0
  const coolingElectricityKwh = annualElectricityUse.coolingElectricityKwh ?? 0
  const avoidedGasM3 = heatingInUse && input.existingHeatingSystem === 'gas'
    ? Math.min(
      annualGasUseM3,
      annualHeatDeliveredKwh / (gasEnergyKwhPerM3 * boilerEfficiencyPct / 100),
    )
    : 0
  const avoidedElectricityKwh = heatingInUse && input.existingHeatingSystem === 'direct-electric'
    ? annualHeatDeliveredKwh / directHeaterEfficiency
    : 0
  const energyFlows = {
    annualHeatDeliveredKwh,
    annualCoolingDeliveredKwh,
    heatPumpElectricityKwh,
    coolingElectricityKwh,
    avoidedGasM3,
    annualGasUseM3,
    avoidedElectricityKwh,
    directHeaterEfficiency,
    existingHeatingSystem: heatingInUse ? input.existingHeatingSystem : null,
  }
  const annualExtraCostsEur = common.annualMaintenanceEur
  const requiredRateKeys = [
    ...(heatingInUse && input.existingHeatingSystem === 'gas' ? ['gasPricePerM3'] : []),
    ...(heatingInUse || coolingInUse ? ['electricityPriceEurPerKwh'] : []),
  ]

  return assembleScenarios({
    productType: 'airco',
    input,
    requiredRateKeys,
    energyFlows,
    calculateGrossSavings: (rates) => !heatingInUse
      ? 0
      : input.existingHeatingSystem === 'gas'
        ? avoidedGasM3 * rates.gasPricePerM3
        : avoidedElectricityKwh * rates.electricityPriceEurPerKwh,
    annualExtraCostsEur,
    calculateExtraCosts: (rates) =>
      annualExtraCostsEur +
      (heatPumpElectricityKwh + coolingElectricityKwh) * rates.electricityPriceEurPerKwh,
    calculateScenarioEnergyFlows: (rates) => ({
      ...energyFlows,
      heatingElectricityCostEur: heatPumpElectricityKwh * rates.electricityPriceEurPerKwh,
      coolingElectricityCostEur: coolingElectricityKwh * rates.electricityPriceEurPerKwh,
      totalElectricityCostEur: (heatPumpElectricityKwh + coolingElectricityKwh) *
        rates.electricityPriceEurPerKwh,
    }),
    investmentEur: common.investmentEur,
    confirmedSubsidyEur: common.confirmedSubsidyEur,
    assumptions,
  })
}

export function calculateProductSavings(input = {}) {
  if (input.productType === 'solar') return calculateSolarSavings(input)
  if (input.productType === 'insulation') return calculateInsulationSavings(input)
  if (input.productType === 'airco') return calculateAircoSavings(input)
  return {
    status: 'unsupported',
    productType: input.productType || null,
    errors: { productType: 'unsupported' },
    missingFields: ['productType'],
    assumptions: [],
  }
}
