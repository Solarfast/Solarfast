const INPUT_KEYS = [
  'annualConsumptionKwh',
  'annualProductionKwh',
  'annualExportKwh',
  'purchasePriceEurPerKwh',
  'feedInCompensationEurPerKwh',
]

export function calculateSalderingImpact(input) {
  const values = {
    annualConsumptionKwh: Number(input?.annualConsumptionKwh),
    annualProductionKwh: Number(input?.annualProductionKwh),
    annualExportKwh: Number(input?.annualExportKwh),
    purchasePriceEurPerKwh: Number(input?.purchasePriceEurPerKwh),
    feedInCompensationEurPerKwh: Number(input?.feedInCompensationEurPerKwh),
    annualFeedInCostsEur: Number(input?.annualFeedInCostsEur ?? 0),
  }

  for (const key of INPUT_KEYS) {
    if (!Number.isFinite(values[key]) || values[key] < 0) {
      throw new RangeError(`invalid-${key}`)
    }
  }
  if (!Number.isFinite(values.annualFeedInCostsEur) || values.annualFeedInCostsEur < 0) {
    throw new RangeError('invalid-annualFeedInCostsEur')
  }
  if (values.annualConsumptionKwh <= 0 || values.annualProductionKwh <= 0) {
    throw new RangeError('consumption-and-production-must-be-positive')
  }
  if (values.annualExportKwh > values.annualProductionKwh) {
    throw new RangeError('export-cannot-exceed-production')
  }

  const ownSolarUseKwh = values.annualProductionKwh - values.annualExportKwh
  if (ownSolarUseKwh > values.annualConsumptionKwh) {
    throw new RangeError('solar-self-use-cannot-exceed-consumption')
  }

  const gridImportKwh = Math.max(0, values.annualConsumptionKwh - ownSolarUseKwh)
  const salderedKwh = Math.min(gridImportKwh, values.annualExportKwh)
  const costsWithSalderingEur =
    (gridImportKwh - salderedKwh) * values.purchasePriceEurPerKwh
    - (values.annualExportKwh - salderedKwh) * values.feedInCompensationEurPerKwh
    + values.annualFeedInCostsEur
  const costsWithoutSalderingEur =
    gridImportKwh * values.purchasePriceEurPerKwh
    - values.annualExportKwh * values.feedInCompensationEurPerKwh
    + values.annualFeedInCostsEur
  const extraPerYearEur = salderedKwh
    * (values.purchasePriceEurPerKwh - values.feedInCompensationEurPerKwh)

  return {
    ...values,
    ownSolarUseKwh,
    gridImportKwh,
    salderedKwh,
    costsWithSalderingEur,
    costsWithoutSalderingEur,
    extraPerYearEur,
    extraPerMonthEur: extraPerYearEur / 12,
    extraPerDayEur: extraPerYearEur / 365,
  }
}
