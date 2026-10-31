export const WARMTEFONDS_RATES = {
  7: 0.0457,
  10: 0.046,
  15: 0.0493,
}

export function warmthfondsMonthlyPayment(principal, years, annualEffectiveRate) {
  const amount = Number(principal)
  const months = Number(years) * 12
  const annualRate = Number(annualEffectiveRate)
  if (!(amount > 0) || !(months > 0) || !(annualRate >= 0)) return null
  if (annualRate === 0) return amount / months
  const monthlyRate = (1 + annualRate) ** (1 / 12) - 1
  return amount * monthlyRate / (1 - (1 + monthlyRate) ** -months)
}
