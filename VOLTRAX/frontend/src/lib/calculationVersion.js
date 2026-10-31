// Bump when server-side savings assumptions change so cached result pages refresh.
export const CALCULATION_RESULTS_VERSION = 'solar-attribution-battery-balance-v19'

export function shouldRefreshSavedBatteryResult(savedResult, savedInput, storedVersion) {
  const isBatteryResult = savedInput?.mode !== 'heat-pump' &&
    savedResult?.kind !== 'heat-pump' &&
    Number(savedInput?.battery_kWh) > 0

  return isBatteryResult && storedVersion !== CALCULATION_RESULTS_VERSION
}

export function restoreBatteryOnlyInvestment(savedInput, savedProducts) {
  const baseInvestment = Number(savedProducts?.baseBatteryInvestment)
  if (!savedInput || !Number.isFinite(baseInvestment) || baseInvestment <= 0) return savedInput
  return { ...savedInput, battery_price: baseInvestment }
}