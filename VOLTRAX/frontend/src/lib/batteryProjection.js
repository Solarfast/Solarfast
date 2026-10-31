function finite(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function getBatteryTenYearNet(result, investment) {
  const price = finite(investment)
  const annualLow = finite(result?.total_annual_low)
  const annualHigh = finite(result?.total_annual_high)
  if (price === null || annualLow === null || annualHigh === null) return null

  const storedLow = finite(result?.ten_year_net_low_eur)
  const storedHigh = finite(result?.ten_year_net_high_eur)
  return {
    low: storedLow ?? annualLow * 10 - price,
    high: storedHigh ?? annualHigh * 10 - price,
  }
}
