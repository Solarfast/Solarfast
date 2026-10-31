// Illustrative assumptions, not manufacturer guarantees. In particular, boiler
// efficiency, gas energy content and hybrid coverage vary by household.
export const DEFAULT_HEAT_ASSUMPTIONS = Object.freeze({
  annualHeatDemandKwh: 10000,
  gasPricePerM3: 1.35,
  electricPricePerKwh: 0.27,
  gasStandingCostEur: 425,
  boilerEfficiencyPct: 90,
  gasEnergyKwhPerM3: 9.77,
  // Scenario: hybrid replaces the estimated space-heating share (80% of total gas).
  hybridCoveragePct: 100,
  flowTemperature: 55,
})

const numeric = (value) => {
  if (value === '' || value == null) return NaN
  return Number(String(value).replace(',', '.'))
}

export function calculateHeatPumpROI({
  model,
  annualHeatDemandKwh,
  gasPricePerM3,
  electricPricePerKwh,
  boilerEfficiencyPct = 90,
  gasEnergyKwhPerM3 = 9.77,
  hybridCoveragePct = 70,
  flowTemperature = 55,
  customScop,
  investmentEur,
  totalGasUseM3,
  gasStandingCostEur = 425,
  gasConnectionRemoved = false,
  hotWaterScop = 2.5,
}) {
  if (!model || !['hybrid', 'all-electric'].includes(model.config)) {
    throw new Error('Select a heat-pump model.')
  }
  const demand = numeric(annualHeatDemandKwh)
  const gasPrice = numeric(gasPricePerM3)
  const electricityPrice = numeric(electricPricePerKwh)
  const boilerEfficiency = numeric(boilerEfficiencyPct)
  const gasEnergy = numeric(gasEnergyKwhPerM3)
  const coverage = model.config === 'all-electric' ? 100 : numeric(hybridCoveragePct)
  const temperature = Number(flowTemperature)
  const publishedScop = temperature === 35 ? model.scop35 : model.scop55
  const scop = customScop === '' || customScop == null ? publishedScop : numeric(customScop)
  const price = investmentEur === '' || investmentEur == null ? 0 : numeric(investmentEur)
  const totalGas = totalGasUseM3 == null ? null : numeric(totalGasUseM3)
  const standingCost = totalGas === null ? 0 : numeric(gasStandingCostEur)
  const waterScop = numeric(hotWaterScop)

  if (!(demand > 0 && gasPrice >= 0 && electricityPrice >= 0 &&
    boilerEfficiency > 0 && boilerEfficiency <= 100 &&
    gasEnergy > 0 && coverage > 0 && coverage <= 100 &&
    [35, 55].includes(temperature) && scop >= 1 && scop <= 8 &&
    Number.isFinite(price) && price >= 0 &&
    (totalGas === null || totalGas > 0) && standingCost >= 0 &&
    waterScop >= 1 && waterScop <= 8)) {
    throw new Error('Check the heat demand, tariffs, efficiency and investment assumptions.')
  }

  const heatingGasM3 = demand / (gasEnergy * boilerEfficiency / 100)
  const coveredHeatKwh = demand * coverage / 100
  const hotWaterGasM3 = model.config === 'all-electric' && totalGas !== null
    ? Math.max(0, totalGas - heatingGasM3) : 0
  const annualHotWaterHeatKwh = hotWaterGasM3 * gasEnergy * boilerEfficiency / 100
  const annualHotWaterElectricityKwh = annualHotWaterHeatKwh / waterScop
  const annualGasAvoidedM3 = Math.min(totalGas ?? Infinity, coveredHeatKwh /
    (gasEnergy * boilerEfficiency / 100) + hotWaterGasM3)
  const annualGasRemainingM3 = totalGas === null ? null : Math.max(0, totalGas - annualGasAvoidedM3)
  const annualHeatPumpElectricityKwh = coveredHeatKwh / scop + annualHotWaterElectricityKwh
  const electricityPerGasM3 = annualHeatPumpElectricityKwh / annualGasAvoidedM3
  const gasStandingSavingsEur = gasConnectionRemoved && model.config === 'all-electric' &&
    annualGasRemainingM3 === 0 ? standingCost : 0
  const annualSavingsEur = annualGasAvoidedM3 * gasPrice +
    gasStandingSavingsEur - annualHeatPumpElectricityKwh * electricityPrice
  const annualGasBeforeM3 = totalGas ?? heatingGasM3
  const beforeAnnualCostEur = annualGasBeforeM3 * gasPrice + standingCost
  const afterAnnualCostEur = beforeAnnualCostEur - annualSavingsEur

  return {
    kind: 'heat-pump',
    model: {
      id: model.id, brand: model.brand, model: model.model, kw: model.kw,
      config: model.config, scopEstimated: Boolean(model.scopEstimated),
      catalogPriceEur: model.catalogPriceEur,
      subsidyEur: model.subsidyEur,
      finalPriceEur: model.finalPriceEur,
      priceSource: model.priceSource,
    },
    annualHeatDemandKwh: demand,
    coveredHeatKwh,
    annualHeatPumpElectricityKwh,
    annualHotWaterHeatKwh,
    annualHotWaterElectricityKwh,
    hotWaterScop: waterScop,
    annualGasBeforeM3,
    annualGasRemainingM3,
    gasStandingCostBeforeEur: standingCost,
    gasStandingSavingsEur,
    gasConnectionRemoved: Boolean(gasConnectionRemoved),
    beforeAnnualCostEur,
    afterAnnualCostEur,
    annualGasAvoidedM3,
    electricityPerGasM3,
    annualSavingsEur,
    roiPct: price > 0 ? annualSavingsEur / price * 100 : null,
    paybackYears: price > 0 && annualSavingsEur > 0 ? price / annualSavingsEur : null,
    tenYearNetEur: price > 0 ? annualSavingsEur * 10 - price : null,
    scopUsed: scop,
    scop35: model.scop35,
    scop55: model.scop55,
    flowTemperature: temperature,
    gasPricePerM3: gasPrice,
    electricPricePerKwh: electricityPrice,
    boilerEfficiencyPct: boilerEfficiency,
    gasEnergyKwhPerM3: gasEnergy,
    hybridCoveragePct: coverage,
    investmentEur: price,
    source: model.source,
    hybridGasSource: 'https://www.rvo.nl/nieuws/warmtepompen-verlagen-energieverbruik',
  }
}

export function normalizeHeatPumpROIResult(result) {
  if (!result) return result

  const standingCost = Number.isFinite(Number(result.gasStandingCostBeforeEur))
    ? Math.max(0, Number(result.gasStandingCostBeforeEur))
    : 0
  const storedSavings = Number.isFinite(Number(result.gasStandingSavingsEur))
    ? Math.max(0, Number(result.gasStandingSavingsEur))
    : 0
  const gasRemoved = result.model?.config === 'all-electric' &&
    result.gasConnectionRemoved === true &&
    Number(result.annualGasRemainingM3) === 0
  const allowedSavings = gasRemoved ? standingCost : 0
  const savingsCorrection = allowedSavings - storedSavings
  const costCorrection = storedSavings - allowedSavings
  const storedAnnualSavings = Number(result.annualSavingsEur)
  const storedAfterCost = Number(result.afterAnnualCostEur)
  const investment = Number(result.investmentEur)
  const annualSavings = Number.isFinite(storedAnnualSavings)
    ? storedAnnualSavings + savingsCorrection
    : result.annualSavingsEur

  return {
    ...result,
    gasConnectionRemoved: result.gasConnectionRemoved === true,
    gasStandingSavingsEur: allowedSavings,
    afterAnnualCostEur: Number.isFinite(storedAfterCost)
      ? storedAfterCost + costCorrection
      : result.afterAnnualCostEur,
    annualSavingsEur: annualSavings,
    roiPct: Number.isFinite(annualSavings) && investment > 0
      ? annualSavings / investment * 100
      : null,
    paybackYears: Number.isFinite(annualSavings) && investment > 0 && annualSavings > 0
      ? investment / annualSavings
      : null,
    tenYearNetEur: Number.isFinite(annualSavings) && investment > 0
      ? annualSavings * 10 - investment
      : null,
  }
}