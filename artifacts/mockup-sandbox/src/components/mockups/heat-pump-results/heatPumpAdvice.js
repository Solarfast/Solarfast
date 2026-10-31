import { HEAT_PUMP_PRODUCTS } from './heatPumpProducts.js'

export const HOME_TYPES = ['apartment', 'terraced', 'end-terrace', 'semi-detached', 'detached']
export const BUILD_PERIODS = ['pre-1975', '1975-1990', '1990-2005', '2005-2020', 'post-2020']
export const INSULATION_LEVELS = ['good', 'average', 'poor']
export const INSULATION_PARTS = ['roof', 'walls', 'floor', 'glazing']
export const INSULATION_ANSWERS = ['yes', 'no', 'unknown']
export const ENERGY_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'unknown']
export const EMITTER_TYPES = ['radiators', 'floor', 'mixed', 'air-conditioning']

export const HEATED_AREA_RANGES = [
  { id: '20-49', min: 20, max: 49 },
  { id: '50-74', min: 50, max: 74 },
  { id: '75-99', min: 75, max: 99 },
  { id: '100-124', min: 100, max: 124 },
  { id: '125-149', min: 125, max: 149 },
  { id: '150-199', min: 150, max: 199 },
  { id: '200-249', min: 200, max: 249 },
  { id: '250-299', min: 250, max: 299 },
  { id: '300-399', min: 300, max: 399 },
  { id: '400-499', min: 400, max: 499 },
  { id: '500-749', min: 500, max: 749 },
  { id: '750-1000', min: 750, max: 1000 },
]

export const ANNUAL_GAS_RANGES = [
  { id: '1-499', min: 1, max: 499 },
  { id: '500-749', min: 500, max: 749 },
  { id: '750-999', min: 750, max: 999 },
  { id: '1000-1249', min: 1000, max: 1249 },
  { id: '1250-1499', min: 1250, max: 1499 },
  { id: '1500-1999', min: 1500, max: 1999 },
  { id: '2000-2499', min: 2000, max: 2499 },
  { id: '2500-2999', min: 2500, max: 2999 },
  { id: '3000-3999', min: 3000, max: 3999 },
  { id: '4000-4999', min: 4000, max: 4999 },
  { id: '5000-7499', min: 5000, max: 7499 },
  { id: '7500-9999', min: 7500, max: 9999 },
  { id: '10000-14999', min: 10000, max: 14999 },
  { id: '15000-20000', min: 15000, max: 20000 },
]

const LOSS_WATTS_PER_M2 = {
  'pre-1975': 85,
  '1975-1990': 70,
  '1990-2005': 57,
  '2005-2020': 44,
  'post-2020': 34,
}
const HOME_FACTOR = {
  apartment: 0.72,
  terraced: 0.85,
  'end-terrace': 1,
  'semi-detached': 1.08,
  detached: 1.2,
}
const INSULATION_FACTOR = { good: 0.78, average: 1, poor: 1.22 }
const GAS_ENERGY = 9.77
const BOILER_EFFICIENCY = 90
// Household gas includes hot water and cooking. Only the space-heating share
// is used for projected heating savings; this is an estimate, not a measurement.
const HEATING_SHARE = 0.8

const num = (value) => Number(String(value ?? '').replace(',', '.'))

export function getInsulationLevel(parts, legacyLevel = '') {
  if (!Array.isArray(parts)) {
    return INSULATION_LEVELS.includes(legacyLevel) ? legacyLevel : ''
  }

  const selectedCount = new Set(parts.filter((part) => INSULATION_PARTS.includes(part))).size
  if (selectedCount === INSULATION_PARTS.length) return 'good'
  if (selectedCount >= 2) return 'average'
  return 'poor'
}

export function getRangeById(id, ranges) {
  return ranges.find((range) => range.id === id) || null
}

export function getRangeForValue(value, ranges) {
  const parsed = num(value)
  if (!Number.isFinite(parsed)) return null
  return ranges.find((range) => parsed >= range.min && parsed <= range.max) || null
}

export function getRangeMidpoint(range) {
  return range ? Math.round((range.min + range.max) / 2) : null
}

export function getHomeInsulationLevel(form) {
  const hasDetailedAnswers = INSULATION_PARTS.some((part) =>
    INSULATION_ANSWERS.includes(form[`heat_insulation_${part}`]),
  ) || ENERGY_LABELS.includes(form.heat_energy_label)

  if (!hasDetailedAnswers) {
    return getInsulationLevel(form.heat_insulation_parts, form.heat_insulation)
  }

  const labelScore = {
    A: 3, B: 3, C: 1, D: 1, E: -1, F: -1, G: -1, unknown: 0,
  }[form.heat_energy_label] ?? 0
  const detailScore = INSULATION_PARTS.reduce((score, part) => {
    const answer = form[`heat_insulation_${part}`]
    if (answer === 'yes') return score + 1
    if (answer === 'no') return score - 1
    return score
  }, 0)
  const score = labelScore + detailScore
  return score >= 3 ? 'good' : score >= 1 ? 'average' : 'poor'
}

export function getHomeInsulationParts(form) {
  const hasDetailedAnswers = INSULATION_PARTS.some((part) =>
    INSULATION_ANSWERS.includes(form[`heat_insulation_${part}`]),
  ) || ENERGY_LABELS.includes(form.heat_energy_label)
  if (hasDetailedAnswers) {
    return INSULATION_PARTS.filter((part) => form[`heat_insulation_${part}`] === 'yes')
  }
  if (Array.isArray(form.heat_insulation_parts)) {
    return INSULATION_PARTS.filter((part) => form.heat_insulation_parts.includes(part))
  }
  return form.heat_insulation === 'good' ? [...INSULATION_PARTS] : []
}

export function getHeatPumpAdvice(form) {
  const area = num(form.heat_area_m2)
  const gas = num(form.heat_gas_usage)
  const insulationLevel = getHomeInsulationLevel(form)
  if (!HOME_TYPES.includes(form.heat_home_type) ||
    !BUILD_PERIODS.includes(form.heat_build_period) ||
    !INSULATION_LEVELS.includes(insulationLevel) ||
    !EMITTER_TYPES.includes(form.heat_emitters) ||
    !Number.isFinite(area) || area < 20 || area > 1000 ||
    !Number.isFinite(gas) || gas <= 0 || gas > 20000) return null

  const requiredKw = Math.max(2, area * LOSS_WATTS_PER_M2[form.heat_build_period] *
    HOME_FACTOR[form.heat_home_type] * INSULATION_FACTOR[insulationLevel] / 1000)
  const annualHeatDemandKwh = gas * HEATING_SHARE * GAS_ENERGY * BOILER_EFFICIENCY / 100
  const lowTemperature = form.heat_emitters === 'floor'
  const allElectricSuitable = insulationLevel === 'good' &&
    form.heat_build_period !== 'pre-1975' &&
    ['floor', 'mixed'].includes(form.heat_emitters)
  const recommendedConfig = allElectricSuitable ? 'all-electric' : 'hybrid'
  // Hybrid replaces the estimated space-heating portion: 80% of total gas.
  // This is an illustrative total-household reduction requested by the owner.
  const hybridCoveragePct = 100
  const flowTemperature = lowTemperature ? 35 : 55

  const suggestedModel = HEAT_PUMP_PRODUCTS
    .filter((product) => product.config === (form.heat_preference || recommendedConfig))
    .filter((product) => (product.maxKw ?? product.kw) >= requiredKw)
    .sort((a, b) => (a.maxKw ?? a.kw) - (b.maxKw ?? b.kw) ||
      a.finalPriceEur - b.finalPriceEur)[0] || null

  return {
    requiredKw: Math.round(requiredKw * 10) / 10,
    annualHeatDemandKwh,
    estimatedSpaceGasM3: gas * HEATING_SHARE,
    recommendedConfig,
    insulationLevel,
    energyLabel: ENERGY_LABELS.includes(form.heat_energy_label) ? form.heat_energy_label : '',
    insulationParts: getHomeInsulationParts(form),
    insulationDetails: Object.fromEntries(INSULATION_PARTS.map((part) => [
      part,
      INSULATION_ANSWERS.includes(form[`heat_insulation_${part}`])
        ? form[`heat_insulation_${part}`]
        : '',
    ])),
    suggestedModel,
    sizingNeedsReview: !suggestedModel,
    flowTemperature,
    hybridCoveragePct,
    lowTemperature,
    heatingMethodNeedsReview: form.heat_emitters === 'air-conditioning',
  }
}

export function effectiveHeatElectricityPrice(price) {
  const parsed = num(price)
  if (!Number.isFinite(parsed) || parsed < 0) return NaN
  // Dynamic-market value is modeled from the battery's EPEX estimate, not as
  // an arbitrary percentage discount on heat-pump electricity.
  return parsed
}

export function getCombinationContractDefaults(currentContractType) {
  const contractType = ['fixed', 'variable', 'dynamic'].includes(currentContractType)
    ? currentContractType
    : 'dynamic'
  return {
    heatContractType: contractType,
    dynamicContract: contractType === 'dynamic',
  }
}