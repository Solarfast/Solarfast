const numberOrZero = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

const daytimeShare = (presence) => ({
  often: 0.6,
  mixed: 0.45,
  away: 0.3,
}[presence] ?? 0.45)

const clamp = (value, min, max) => Math.max(min, Math.min(value, max))

export function buildEnergyScenario({
  solarProduction,
  annualConsumption,
  gridExport,
  plannedSolarKwh,
  plannedHeatPumpKwh,
  plannedHeatPumpSpaceHeatingKwh,
  plannedHeatPumpHotWaterKwh,
  plannedAircoKwh,
  plannedEvKwh,
  projectedGridExport,
  batteryCapacityKwh,
  solarDaytimePresence = 'mixed',
}) {
  const currentSolar = numberOrZero(solarProduction)
  const currentConsumption = numberOrZero(annualConsumption)
  const currentExport = numberOrZero(gridExport)
  const addedSolar = numberOrZero(plannedSolarKwh)
  const addedHeatPump = numberOrZero(plannedHeatPumpKwh)
  const addedHeatPumpSpaceHeating = numberOrZero(plannedHeatPumpSpaceHeatingKwh)
  const addedHeatPumpHotWater = numberOrZero(plannedHeatPumpHotWaterKwh)
  const addedAirco = numberOrZero(plannedAircoKwh)
  const addedEv = numberOrZero(plannedEvKwh)
  const addedConsumption = addedHeatPump + addedAirco + addedEv
  const projectedSolar = currentSolar + addedSolar
  const projectedConsumption = currentConsumption + addedConsumption
  const hasPlannedChanges = addedSolar > 0 || addedConsumption > 0
  // A heat pump's seasonal draw should determine the projected export. A
  // manually entered annual forecast cannot represent that seasonal overlap.
  const parsedOverride = addedHeatPump > 0 || projectedGridExport === '' || projectedGridExport == null
    ? null
    : numberOrZero(projectedGridExport)
  // Outside a heat-pump scenario, zero remains a valid user forecast. Keep it
  // distinct from a blank forecast, which requests an estimate.
  const override = parsedOverride

  // A zero export value is the backend's signal to use its physical overlap estimate.
  const estimateWhenUnspecified = (pv, usage) => Math.max(0, pv - Math.min(pv, 0.45 * usage))
  const normalizeMeasuredExport = (pv, usage, exportValue) => {
    const minimumExport = Math.max(0, pv - usage)
    return Math.max(minimumExport, Math.min(exportValue, pv * 0.97))
  }
  const modeledCurrentExport = currentExport > 0
    ? normalizeMeasuredExport(currentSolar, currentConsumption, currentExport)
    : estimateWhenUnspecified(currentSolar, currentConsumption)
  const directUseWithPlannedSolar = Math.min(
    projectedSolar,
    currentConsumption * daytimeShare(solarDaytimePresence),
  )
  const currentDirectUse = Math.min(currentSolar, Math.max(0, currentSolar - modeledCurrentExport))
  const plannedSolarDirectUseKwh = Math.min(
    addedSolar,
    Math.max(0, directUseWithPlannedSolar - currentDirectUse),
  )
  // Heating demand is concentrated in low-solar months. Estimate only a
  // limited overlap with PV (10% space heating, 35% hot water), and never
  // consume more surplus than the current and planned PV actually provide.
  const heatPumpOverlapEstimate = addedHeatPumpSpaceHeating > 0 || addedHeatPumpHotWater > 0
    ? addedHeatPumpSpaceHeating * 0.10 + addedHeatPumpHotWater * 0.35
    : addedHeatPump * 0.10
  const availableSurplusAfterDirectUse = Math.max(
    0,
    modeledCurrentExport + addedSolar - plannedSolarDirectUseKwh,
  )
  const heatPumpSolarOverlapKwh = Math.min(
    heatPumpOverlapEstimate,
    availableSurplusAfterDirectUse,
  )
  const otherAddedConsumption = Math.max(0, addedConsumption - addedHeatPump)

  let projectedExport = modeledCurrentExport
  let exportMethod = currentExport > 0 ? 'current-input' : 'model-estimate'
  let forecastWasAdjusted = false

  if (hasPlannedChanges && override !== null) {
    const minimumExport = Math.max(0, projectedSolar - projectedConsumption)
    projectedExport = clamp(override, minimumExport, projectedSolar * 0.97)
    forecastWasAdjusted = projectedExport !== override
    exportMethod = 'user-forecast'
  } else if (hasPlannedChanges) {
    const minimumExport = Math.max(0, projectedSolar - projectedConsumption)
    // Keep annual export conservative without a measured schedule. The battery
    // calculation still receives the complete added household demand and can
    // deliver available stored energy to it; it does not assign kWh to a
    // particular appliance.
    const annualBalanceEstimate = modeledCurrentExport + addedSolar -
      plannedSolarDirectUseKwh -
      heatPumpSolarOverlapKwh
    projectedExport = clamp(annualBalanceEstimate, minimumExport, projectedSolar * 0.97)
    exportMethod = addedHeatPump > 0
      ? 'seasonal-load-estimate'
      : addedSolar > 0
        ? 'daytime-presence-estimate'
      : otherAddedConsumption > 0
        ? 'unprofiled-load-conservative'
        : 'annual-balance-estimate'
  }

  const zeroExportSignal = Math.min(0.000001, projectedSolar * 0.97)
  return {
    currentSolarKwh: currentSolar,
    currentConsumptionKwh: currentConsumption,
    currentExportKwh: currentExport,
    addedSolarKwh: addedSolar,
    solarDaytimePresence,
    plannedSolarDirectUseKwh,
    addedHeatPumpKwh: addedHeatPump,
    heatPumpSolarOverlapKwh,
    heatPumpSeasonalGridImportKwh: Math.max(0, addedHeatPump - heatPumpSolarOverlapKwh),
    addedAircoKwh: addedAirco,
    aircoCanUseBattery: addedAirco > 0 && numberOrZero(batteryCapacityKwh) > 0,
    addedEvKwh: addedEv,
    unprofiledLoadSolarOverlapKwh: otherAddedConsumption > 0 ? 0 : null,
    addedConsumptionKwh: addedConsumption,
    projectedSolarKwh: projectedSolar,
    projectedConsumptionKwh: projectedConsumption,
    projectedExportKwh: projectedExport,
    calculationGridExportKwh: hasPlannedChanges
      ? (projectedExport === 0 ? zeroExportSignal : projectedExport)
      : currentExport,
    hasPlannedChanges,
    exportMethod,
    // Only EV charging remains explicitly unprofiled in the UI. Airco demand is
    // included in the battery scenario, where the battery can serve the home.
    hasUnprofiledAdditionalLoads: addedEv > 0,
    hasUnprofiledEvLoad: addedEv > 0,
    forecastWasAdjusted,
  }
}

export function splitHeatPumpElectricity({
  annualKwh,
  solarOverlapKwh,
  solarBatterySupplyKwh,
  cheapBatterySupplyKwh,
}) {
  const totalKwh = numberOrZero(annualKwh)
  const solarKwh = Math.min(totalKwh, numberOrZero(solarOverlapKwh))
  const remainingAfterSolarKwh = Math.max(0, totalKwh - solarKwh)
  const solarBatteryKwh = Math.min(
    remainingAfterSolarKwh,
    numberOrZero(solarBatterySupplyKwh),
  )
  const cheapBatteryKwh = Math.min(
    Math.max(0, remainingAfterSolarKwh - solarBatteryKwh),
    numberOrZero(cheapBatterySupplyKwh),
  )
  const batteryKwh = solarBatteryKwh + cheapBatteryKwh

  return {
    totalKwh,
    solarKwh,
    solarBatteryKwh,
    cheapBatteryKwh,
    batteryKwh,
    gridKwh: Math.max(0, remainingAfterSolarKwh - batteryKwh),
  }
}

export function calculateSolarCoverage({
  annualSolarKwh,
  annualConsumptionKwh,
  directSolarKwh,
  solarBatteryKwh,
}) {
  const production = Math.max(0, numberOrZero(annualSolarKwh))
  const consumption = Math.max(0, numberOrZero(annualConsumptionKwh))
  const direct = Math.min(production, Math.max(0, numberOrZero(directSolarKwh)))
  const solarBattery = Math.min(
    Math.max(0, production - direct),
    Math.max(0, numberOrZero(solarBatteryKwh)),
  )
  const solarUsedKwh = Math.min(production, direct + solarBattery)
  return {
    solarUsedKwh,
    selfConsumptionPercent: production > 0 ? solarUsedKwh / production * 100 : null,
    selfSufficiencyPercent: consumption > 0 ? Math.min(100, solarUsedKwh / consumption * 100) : null,
  }
}