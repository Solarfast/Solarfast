export const STANDARD_BATTERY_MAX_KWH = 15.9
export const HIGH_ANNUAL_ENERGY_TRIGGER_KWH = 6000

const asNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const compareByRoi = (left, right) => {
  const leftRoi = Number.isFinite(Number(left.roi_pct)) ? Number(left.roi_pct) : Number.NEGATIVE_INFINITY
  const rightRoi = Number.isFinite(Number(right.roi_pct)) ? Number(right.roi_pct) : Number.NEGATIVE_INFINITY
  return rightRoi - leftRoi
    || asNumber(left.battery_kWh) - asNumber(right.battery_kWh)
    || asNumber(left.battery_price) - asNumber(right.battery_price)
}

export function shouldOfferLargerBatteryAlternative({
  projectedConsumptionKwh,
  projectedSolarKwh,
  plannedSolar,
  plannedHeatPump,
  plannedEv,
}) {
  return asNumber(projectedConsumptionKwh) >= HIGH_ANNUAL_ENERGY_TRIGGER_KWH
    || asNumber(projectedSolarKwh) >= HIGH_ANNUAL_ENERGY_TRIGGER_KWH
    || Boolean(plannedSolar)
    || Boolean(plannedHeatPump)
    || Boolean(plannedEv)
}

export function selectStandardBatteryRecommendation(recommendations = []) {
  const standardSizes = recommendations.filter(
    (item) => asNumber(item.battery_kWh) <= STANDARD_BATTERY_MAX_KWH,
  )
  if (standardSizes.length === 0) return null

  const positiveRoiOptions = standardSizes
    .filter((item) => asNumber(item.roi_pct) > 0)
    .sort(compareByRoi)
  if (positiveRoiOptions.length > 0) return positiveRoiOptions[0]

  return standardSizes.find((item) => item.balanced_fit)
    || [...standardSizes].sort((left, right) => (
      asNumber(left.battery_kWh) - asNumber(right.battery_kWh)
      || asNumber(left.battery_price) - asNumber(right.battery_price)
    ))[0]
}

export function selectScenarioPrimaryBatteryRecommendation(
  recommendations = [],
  allowLargerFinancialRecommendation = false,
) {
  const standardRecommendation = selectStandardBatteryRecommendation(recommendations)
  if (!standardRecommendation || !allowLargerFinancialRecommendation) {
    return standardRecommendation
  }

  const largerFinancialRecommendations = recommendations
    .filter((item) => (
      asNumber(item.battery_kWh) > asNumber(standardRecommendation.battery_kWh)
      && item.recommended === true
      && asNumber(item.incremental_roi_pct) > 0
      && asNumber(item.roi_pct) > 0
    ))
    .sort((left, right) => (
      asNumber(right.incremental_roi_pct) - asNumber(left.incremental_roi_pct)
      || compareByRoi(left, right)
    ))

  return largerFinancialRecommendations[0] || standardRecommendation
}

export function selectLargerBatteryAlternative(
  recommendations = [],
  primaryRecommendation,
  shouldShow = false,
) {
  if (!shouldShow || !primaryRecommendation) return null

  const largerSizes = recommendations.filter(
    (item) => asNumber(item.battery_kWh) > asNumber(primaryRecommendation.battery_kWh),
  )
  if (largerSizes.length === 0) return null

  const positiveRoiOptions = largerSizes
    .filter((item) => asNumber(item.roi_pct) > 0)
    .sort(compareByRoi)
  if (positiveRoiOptions.length > 0) return positiveRoiOptions[0]

  return largerSizes.find((item) => item.balanced_fit)
    || [...largerSizes].sort((left, right) => (
      asNumber(left.battery_kWh) - asNumber(right.battery_kWh)
      || asNumber(left.battery_price) - asNumber(right.battery_price)
    ))[0]
}