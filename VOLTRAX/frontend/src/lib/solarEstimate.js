export const SOLAR_DAYTIME_PROFILES = Object.freeze({
  often: Object.freeze({ annualConsumptionShare: 0.6 }),
  mixed: Object.freeze({ annualConsumptionShare: 0.45 }),
  away: Object.freeze({ annualConsumptionShare: 0.3 }),
})

export function estimateSolarDirectSelfUse({
  annualProductionKwh,
  annualConsumptionKwh,
  daytimePresence = 'mixed',
}) {
  const production = Math.max(0, Number(annualProductionKwh) || 0)
  const consumption = Math.max(0, Number(annualConsumptionKwh) || 0)
  const profile = SOLAR_DAYTIME_PROFILES[daytimePresence] || SOLAR_DAYTIME_PROFILES.mixed
  const estimatedDirectSelfUseKwh = Math.min(
    production,
    consumption * profile.annualConsumptionShare,
  )

  return {
    annualProductionKwh: production,
    annualConsumptionKwh: consumption,
    daytimePresence: SOLAR_DAYTIME_PROFILES[daytimePresence] ? daytimePresence : 'mixed',
    estimatedDirectSelfUseKwh,
    estimatedExportKwh: production - estimatedDirectSelfUseKwh,
    estimatedSelfUseShareOfConsumption: profile.annualConsumptionShare,
  }
}
