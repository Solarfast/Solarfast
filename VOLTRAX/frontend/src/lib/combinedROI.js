const finiteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function calculateHeatPumpAnnualCostAfterBattery({
  standaloneAnnualCostEur,
  heatPumpElectricityPriceEurPerKwh,
  heatPumpSolarBatteryKwh,
  solarBatteryOpportunityPriceEurPerKwh,
  heatPumpBatteryKwh,
  totalEpexHomeDeliveryKwh,
  totalEpexHomeChargeCostEur,
}) {
  const baseCost = finiteNumber(standaloneAnnualCostEur)
  if (baseCost === null) return null
  const hpBatteryKwh = Math.max(0, finiteNumber(heatPumpBatteryKwh) ?? 0)
  const totalHomeDelivery = Math.max(0, finiteNumber(totalEpexHomeDeliveryKwh) ?? 0)
  const retailPrice = finiteNumber(heatPumpElectricityPriceEurPerKwh)
  const totalChargeCost = finiteNumber(totalEpexHomeChargeCostEur)
  const hpSolarBatteryKwh = Math.max(0, finiteNumber(heatPumpSolarBatteryKwh) ?? 0)
  const solarOpportunityPrice = Math.max(0, finiteNumber(solarBatteryOpportunityPriceEurPerKwh) ?? 0)
  const solarBatterySaving = retailPrice === null
    ? 0
    : hpSolarBatteryKwh * Math.max(0, retailPrice - solarOpportunityPrice)
  let adjustedCost = baseCost - solarBatterySaving
  if (hpBatteryKwh === 0 || totalHomeDelivery === 0 || retailPrice === null || totalChargeCost === null) {
    return adjustedCost
  }

  const allocatedBatteryKwh = Math.min(hpBatteryKwh, totalHomeDelivery)
  const allocatedCheapChargeCost = totalChargeCost * allocatedBatteryKwh / totalHomeDelivery
  adjustedCost -= allocatedBatteryKwh * retailPrice - allocatedCheapChargeCost
  return adjustedCost
}

// Attribute only the change in the household's net electricity bill to the
// added heat-pump load. This naturally includes PV/battery energy and the
// export revenue it displaces; it does not assume every heat-pump kWh costs
// the full import tariff.
export function calculateHeatPumpMarginalElectricityCost({
  combinedBatteryResults,
  batteryOnlyResults,
  heatPumpElectricityKwh,
}) {
  const combinedBill = finiteNumber(combinedBatteryResults?.net_annual_cost_with)
  const batteryOnlyBill = finiteNumber(batteryOnlyResults?.net_annual_cost_with)
  const heatPumpKwh = finiteNumber(heatPumpElectricityKwh)
  if (combinedBill === null || batteryOnlyBill === null || !(heatPumpKwh > 0)) return null
  const annualCostEur = combinedBill - batteryOnlyBill
  return {
    annualCostEur,
    effectivePricePerKwh: annualCostEur / heatPumpKwh,
    heatPumpElectricityKwh: heatPumpKwh,
  }
}

// The household electricity result already includes an air conditioner's
// electricity use. Only add its avoided gas cost here, never its standalone
// net saving (which would subtract that electricity a second time).
export function getAdditionalAircoGasSavings(aircoSavings, heatPumpROI) {
  const scenario = aircoSavings?.status === 'ready'
    ? aircoSavings.scenarios?.realistic
    : null
  if (!scenario) return null

  const grossGasSavings = finiteNumber(scenario.annualGrossSavingsEur)
  if (grossGasSavings === null) return null
  const heatDelivered = finiteNumber(scenario.energyFlows?.annualHeatDeliveredKwh)
  if (heatDelivered > 0 && scenario.energyFlows?.existingHeatingSystem !== 'gas') return null
  const remainingGasM3 = finiteNumber(heatPumpROI?.annualGasRemainingM3)
  const gasPricePerM3 = finiteNumber(heatPumpROI?.gasPricePerM3)
  if (remainingGasM3 === null || gasPricePerM3 === null) return null

  return Math.min(Math.max(0, grossGasSavings), Math.max(0, remainingGasM3 * gasPricePerM3))
}

// Compare the full household energy costs without either product to the costs
// with both products. The EPEX estimate is separate from the API's annual-cost
// fields, so it is included once here rather than adding standalone savings.
export function calculateCombinedROI({
  batteryResults,
  batteryWithoutHeatPumpResults,
  batteryInvestmentEur,
  heatPumpROI,
  additionalInvestmentEur = 0,
  hasAdditionalInvestment = false,
  additionalProductsModeled = false,
  additionalGasSavingsEur = 0,
}) {
  if (!batteryResults || !batteryWithoutHeatPumpResults || !heatPumpROI) return null
  // An accessory price alone is not its savings model. Never report the
  // battery/heat-pump return as if it were the return of an unmodeled package.
  if (hasAdditionalInvestment && !additionalProductsModeled) return null

  const baselineElectricityCostEur = finiteNumber(
    batteryWithoutHeatPumpResults.net_annual_cost_without,
  )
  const combinedElectricityCostEur = finiteNumber(batteryResults.net_annual_cost_with)
  const gasBeforeM3 = finiteNumber(heatPumpROI.annualGasBeforeM3)
  const gasAfterM3 = finiteNumber(heatPumpROI.annualGasRemainingM3)
  const gasPricePerM3 = finiteNumber(heatPumpROI.gasPricePerM3)
  const standingGasCostEur = finiteNumber(heatPumpROI.gasStandingCostBeforeEur)
  const batteryPrice = finiteNumber(batteryInvestmentEur)
  const additionalGasSavings = finiteNumber(additionalGasSavingsEur)

  if ([
    baselineElectricityCostEur,
    combinedElectricityCostEur,
    gasBeforeM3,
    gasAfterM3,
    gasPricePerM3,
    standingGasCostEur,
    batteryPrice,
    additionalGasSavings,
  ].some((value) => value === null) ||
    gasBeforeM3 < 0 || gasAfterM3 < 0 || gasPricePerM3 < 0 ||
    standingGasCostEur < 0 || batteryPrice <= 0) {
    return null
  }

  const gasConnectionRemoved = heatPumpROI.model?.config === 'all-electric' &&
    heatPumpROI.gasConnectionRemoved === true &&
    gasAfterM3 === 0
  const standingGasSavingsEur = gasConnectionRemoved ? standingGasCostEur : 0
  const standingGasCostAfterEur = standingGasCostEur - standingGasSavingsEur
  const gasCostBeforeEur = gasBeforeM3 * gasPricePerM3 + standingGasCostEur
  const gasCostAfterEur = gasAfterM3 * gasPricePerM3 + standingGasCostAfterEur
  const baselineAnnualCostEur = baselineElectricityCostEur + gasCostBeforeEur
  const combinedAnnualCostBeforeEpexEur = combinedElectricityCostEur + gasCostAfterEur
  const annualSavingsBeforeEpexEur =
    baselineAnnualCostEur - combinedAnnualCostBeforeEpexEur + additionalGasSavings

  const hasDynamicOptimization = batteryResults.dynamic_contract === true
  const epexAnnualLow = hasDynamicOptimization
    ? finiteNumber(batteryResults.smart_annual_low)
    : 0
  const epexAnnualHigh = hasDynamicOptimization
    ? finiteNumber(batteryResults.smart_annual_high)
    : 0
  if (epexAnnualLow === null || epexAnnualHigh === null) return null

  const annualLowEur = annualSavingsBeforeEpexEur + Math.min(epexAnnualLow, epexAnnualHigh)
  const annualHighEur = annualSavingsBeforeEpexEur + Math.max(epexAnnualLow, epexAnnualHigh)
  const quotedHeatPrice = finiteNumber(heatPumpROI.investmentEur)
  const heatInvestmentEur = quotedHeatPrice !== null && quotedHeatPrice > 0
    ? quotedHeatPrice
    : null
  const additionalInvestment = finiteNumber(additionalInvestmentEur)
  const totalInvestmentEur = heatInvestmentEur === null ||
    (hasAdditionalInvestment && (additionalInvestment === null || additionalInvestment <= 0))
    ? null
    : batteryPrice + heatInvestmentEur + (hasAdditionalInvestment ? additionalInvestment : 0)

  return {
    baselineElectricityCostEur,
    combinedElectricityCostEur,
    gasCostBeforeEur,
    gasCostAfterEur,
    baselineAnnualCostEur,
    combinedAnnualCostBeforeEpexEur,
    annualSavingsBeforeEpexEur,
    additionalGasSavingsEur: additionalGasSavings,
    standingGasCostEur,
    standingGasCostAfterEur,
    standingGasSavingsEur,
    gasConnectionRemoved,
    epexAnnualLowEur: Math.min(epexAnnualLow, epexAnnualHigh),
    epexAnnualHighEur: Math.max(epexAnnualLow, epexAnnualHigh),
    hasDynamicOptimization,
    annualLowEur,
    annualHighEur,
    batteryInvestmentEur: batteryPrice,
    heatInvestmentEur,
    additionalInvestmentEur: hasAdditionalInvestment ? additionalInvestment : 0,
    totalInvestmentEur,
    paybackLowYears: totalInvestmentEur !== null && annualHighEur > 0
      ? totalInvestmentEur / annualHighEur
      : null,
    paybackHighYears: totalInvestmentEur !== null && annualLowEur > 0
      ? totalInvestmentEur / annualLowEur
      : null,
    roiLowPct: totalInvestmentEur !== null ? annualLowEur / totalInvestmentEur * 100 : null,
    roiHighPct: totalInvestmentEur !== null ? annualHighEur / totalInvestmentEur * 100 : null,
    tenYearNetLowEur: totalInvestmentEur !== null ? annualLowEur * 10 - totalInvestmentEur : null,
    tenYearNetHighEur: totalInvestmentEur !== null ? annualHighEur * 10 - totalInvestmentEur : null,
  }
}

export function calculateBatterySolarPackageROI({
  baselineResults,
  combinedResults,
  batteryInvestmentEur,
  solarInvestmentEur,
}) {
  const baselineCost = finiteNumber(baselineResults?.net_annual_cost_without)
  const combinedCost = finiteNumber(combinedResults?.net_annual_cost_with)
  const batteryInvestment = finiteNumber(batteryInvestmentEur)
  const solarInvestment = finiteNumber(solarInvestmentEur)
  if ([baselineCost, combinedCost, batteryInvestment, solarInvestment].some((value) => value === null) ||
      batteryInvestment <= 0 || solarInvestment <= 0) return null

  const dynamic = combinedResults.dynamic_contract === true
  const epexLow = dynamic ? finiteNumber(combinedResults.smart_annual_low) : 0
  const epexHigh = dynamic ? finiteNumber(combinedResults.smart_annual_high) : 0
  if (epexLow === null || epexHigh === null) return null
  const annualLowEur = baselineCost - combinedCost + Math.min(epexLow, epexHigh)
  const annualHighEur = baselineCost - combinedCost + Math.max(epexLow, epexHigh)
  const investmentEur = batteryInvestment + solarInvestment
  return {
    baselineAnnualCostEur: baselineCost,
    combinedAnnualCostEur: combinedCost,
    annualLowEur,
    annualHighEur,
    investmentEur,
    paybackLowYears: annualHighEur > 0 ? investmentEur / annualHighEur : null,
    paybackHighYears: annualLowEur > 0 ? investmentEur / annualLowEur : null,
  }
}