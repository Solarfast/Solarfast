// The heat-pump figure nets its extra electricity at the full import tariff.
// Battery savings are measured against the same projected load WITH the heat
// pump, so adding the two benefits does not credit its electricity twice.
export function calculateCombinedROI({ batteryResults, batteryInvestmentEur, heatPumpROI }) {
  if (!batteryResults || !heatPumpROI) return null
  const batteryLow = Number(batteryResults.total_annual_low)
  const batteryHigh = Number(batteryResults.total_annual_high)
  const heatAnnual = Number(heatPumpROI.annualSavingsEur)
  const batteryPrice = Number(batteryInvestmentEur)
  if (![batteryLow, batteryHigh, heatAnnual, batteryPrice].every(Number.isFinite) || batteryPrice <= 0) return null

  const annualLowEur = Math.min(batteryLow, batteryHigh) + heatAnnual
  const annualHighEur = Math.max(batteryLow, batteryHigh) + heatAnnual
  const quotedHeatPrice = Number(heatPumpROI.investmentEur)
  const heatInvestmentEur = Number.isFinite(quotedHeatPrice) && quotedHeatPrice > 0
    ? quotedHeatPrice
    : null
  const totalInvestmentEur = heatInvestmentEur === null ? null : batteryPrice + heatInvestmentEur

  return {
    batteryAnnualLowEur: Math.min(batteryLow, batteryHigh),
    batteryAnnualHighEur: Math.max(batteryLow, batteryHigh),
    heatAnnualEur: heatAnnual,
    annualLowEur,
    annualHighEur,
    batteryInvestmentEur: batteryPrice,
    heatInvestmentEur,
    totalInvestmentEur,
    paybackLowYears: totalInvestmentEur !== null && annualHighEur > 0 ? totalInvestmentEur / annualHighEur : null,
    paybackHighYears: totalInvestmentEur !== null && annualLowEur > 0 ? totalInvestmentEur / annualLowEur : null,
    roiLowPct: totalInvestmentEur !== null ? annualLowEur / totalInvestmentEur * 100 : null,
    roiHighPct: totalInvestmentEur !== null ? annualHighEur / totalInvestmentEur * 100 : null,
    tenYearNetLowEur: totalInvestmentEur !== null ? annualLowEur * 10 - totalInvestmentEur : null,
    tenYearNetHighEur: totalInvestmentEur !== null ? annualHighEur * 10 - totalInvestmentEur : null,
  }
}