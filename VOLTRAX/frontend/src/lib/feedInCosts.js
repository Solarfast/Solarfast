function nonNegativeNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export function getAnnualFeedInCosts(input, annualExportKwh, fallback = 0) {
  return getFeedInCostDetails(input, annualExportKwh, fallback).annualCost
}

export function getFeedInCostDetails(input, annualExportKwh, fallback = 0) {
  const enteredValue = input?.terugleverkosten_value
  if (enteredValue === undefined || enteredValue === null || enteredValue === '') {
    return {
      enteredValue: null,
      unit: 'jaar',
      annualCost: nonNegativeNumber(fallback),
    }
  }

  const cost = nonNegativeNumber(enteredValue)
  const unit = input.terugleverkosten_unit === 'kWh' ? 'kWh' : 'jaar'
  const annualCost = unit === 'kWh'
    ? cost * nonNegativeNumber(annualExportKwh)
    : cost

  return {
    enteredValue: cost,
    unit,
    annualCost,
  }
}

export function getRemainingAnnualFeedInCost(input, results, currentAnnualCost = 0) {
  const modeled = results?.terugleverkosten_na
  if (modeled !== null && modeled !== undefined && Number.isFinite(Number(modeled))) {
    return Math.max(0, Number(modeled))
  }

  const entered = input?.terugleverkosten_value
  const rate = entered === '' || entered == null ? null : nonNegativeNumber(entered)
  const unit = input?.terugleverkosten_unit === 'kWh' ? 'kWh' : 'jaar'
  if (unit === 'kWh' && rate !== null) {
    return rate * nonNegativeNumber(results?.export_kwh_with)
  }
  return nonNegativeNumber(currentAnnualCost)
}