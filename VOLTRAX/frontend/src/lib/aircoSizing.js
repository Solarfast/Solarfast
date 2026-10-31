// Area-based sizing is only a starting point; installation requires a room-by-room check.
// Source provides the good/standard/poor insulation W/m² guide:
// https://www.aircokenner.nl/capaciteit
export const AIRCO_CAPACITY_GUIDANCE_SOURCE = 'https://www.aircokenner.nl/capaciteit'
export const AIRCO_WATTS_PER_M2 = Object.freeze({
  good: 80,
  average: 100,
  poor: 130,
  unknown: 100,
})
export const AIRCO_AVERAGE_EFFICIENCY = Object.freeze({
  seer: 6.5,
  scop: 4,
})
export const AIRCO_AVERAGE_COOLING_FULL_LOAD_HOURS_PER_YEAR = 200
export const AIRCO_AVERAGE_THERMAL_DEMAND_KWH_PER_M2_YEAR = Object.freeze({
  heating: Object.freeze({ good: 35, average: 50, poor: 70, unknown: 50 }),
})
export const AIRCO_STANDARD_COOLING_CLASSES_KW = Object.freeze([
  2, 2.5, 3.5, 4, 5, 6, 7, 9, 12,
])
export const AIRCO_SINGLE_SPLIT_MODELS = Object.freeze([
  { brand: 'Haier', range: 'Pearl Premium', capacityKw: 2.7 },
  { brand: 'Haier', range: 'Pearl Premium', capacityKw: 3.6 },
  { brand: 'Haier', range: 'Pearl Premium', capacityKw: 5.3 },
  { brand: 'Haier', range: 'Pearl Premium', capacityKw: 7.1 },
  { brand: 'Haier', range: 'Revive Plus', capacityKw: 2.7 },
  { brand: 'Haier', range: 'Revive Plus', capacityKw: 3.5 },
  { brand: 'Haier', range: 'Revive Plus', capacityKw: 4.8 },
  { brand: 'Haier', range: 'Revive Plus', capacityKw: 6.2 },
  { brand: 'LG', range: 'Standard Plus', model: 'PC09ST', capacityKw: 2.5 },
  { brand: 'LG', range: 'Standard Plus', model: 'PC12ST', capacityKw: 3.5 },
  { brand: 'LG', range: 'Standard Plus', model: 'PC18ST', capacityKw: 5 },
  { brand: 'LG', range: 'Standard Plus', model: 'PC24ST', capacityKw: 6.6 },
])

export const AIRCO_MULTI_SPLIT_PACKAGES = Object.freeze([
  { brand: 'Haier', range: 'Pearl Premium', indoorCapacitiesKw: [2.5, 2.5], outdoorCapacityKw: 5 },
  { brand: 'Haier', range: 'Pearl Premium', indoorCapacitiesKw: [3.5, 3.5], outdoorCapacityKw: 7 },
  { brand: 'Haier', range: 'Pearl Premium', indoorCapacitiesKw: [5.3, 5.3], outdoorCapacityKw: 10.5 },
  { brand: 'Haier', range: 'Pearl Premium', indoorCapacitiesKw: [2.5, 2.5, 2.5], outdoorCapacityKw: 7 },
  { brand: 'Haier', range: 'Pearl Premium', indoorCapacitiesKw: [3.5, 3.5, 3.5], outdoorCapacityKw: 10.5 },
  { brand: 'Haier', range: 'Pearl Premium', indoorCapacitiesKw: [2.5, 2.5, 2.5, 2.5], outdoorCapacityKw: 10.5 },
  { brand: 'LG', range: 'Standard Plus', indoorCapacitiesKw: [2.5, 3.5], outdoorCapacityKw: 5.3 },
  { brand: 'LG', range: 'Standard Plus', indoorCapacitiesKw: [2.5, 5], outdoorCapacityKw: 7 },
  { brand: 'LG', range: 'Standard Plus', indoorCapacitiesKw: [2.5, 2.5, 5], outdoorCapacityKw: 7.9 },
  { brand: 'LG', range: 'Standard Plus', indoorCapacitiesKw: [2.5, 2.5], outdoorCapacityKw: 4.7 },
  { brand: 'LG', range: 'Standard Plus', indoorCapacitiesKw: [2.5, 2.5, 2.5], outdoorCapacityKw: 6.2 },
  { brand: 'LG', range: 'Standard Plus', indoorCapacitiesKw: [2.5, 2.5, 2.5, 2.5], outdoorCapacityKw: 7 },
])

export function estimateAircoAnnualElectricity(rooms, goal) {
  if (!Array.isArray(rooms) || !rooms.length || !['cooling', 'cooling-heating'].includes(goal)) return null
  const parsedRooms = rooms.map((room) => ({
    areaM2: Number(String(room?.areaM2 ?? '').trim().replace(',', '.')),
    insulationLevel: room?.insulationLevel,
  }))
  if (parsedRooms.some(({ areaM2, insulationLevel }) =>
    !Number.isFinite(areaM2) || areaM2 <= 0 ||
    !Object.hasOwn(AIRCO_AVERAGE_THERMAL_DEMAND_KWH_PER_M2_YEAR.heating, insulationLevel),
  )) return null

  const coolingThermalKwh = parsedRooms.reduce(
    (sum, room) => sum + (
      room.areaM2 * AIRCO_WATTS_PER_M2[room.insulationLevel] / 1000 *
      AIRCO_AVERAGE_COOLING_FULL_LOAD_HOURS_PER_YEAR
    ),
    0,
  )
  const heatingThermalKwh = goal === 'cooling-heating'
    ? parsedRooms.reduce(
      (sum, room) => sum + room.areaM2 * AIRCO_AVERAGE_THERMAL_DEMAND_KWH_PER_M2_YEAR.heating[room.insulationLevel],
      0,
    )
    : null

  return {
    seer: AIRCO_AVERAGE_EFFICIENCY.seer,
    scop: AIRCO_AVERAGE_EFFICIENCY.scop,
    coolingEquivalentFullLoadHoursPerYear: AIRCO_AVERAGE_COOLING_FULL_LOAD_HOURS_PER_YEAR,
    coolingThermalKwh,
    coolingElectricityKwh: coolingThermalKwh / AIRCO_AVERAGE_EFFICIENCY.seer,
    heatingThermalKwh,
    heatingElectricityKwh: heatingThermalKwh === null
      ? null
      : heatingThermalKwh / AIRCO_AVERAGE_EFFICIENCY.scop,
  }
}

export function getSmallestSingleSplitOptions(requiredCapacityKw) {
  if (!Number.isFinite(requiredCapacityKw) || requiredCapacityKw <= 0) return []
  const ranges = [...new Set(AIRCO_SINGLE_SPLIT_MODELS.map((model) => `${model.brand}|${model.range}`))]
  return ranges
    .map((rangeKey) => AIRCO_SINGLE_SPLIT_MODELS
      .filter((model) => `${model.brand}|${model.range}` === rangeKey && model.capacityKw >= requiredCapacityKw)
      .sort((a, b) => a.capacityKw - b.capacityKw)[0])
    .filter(Boolean)
    .sort((a, b) => a.capacityKw - b.capacityKw)
}

export function getSuitableMultiSplitPackages(roomRequirements) {
  if (!Array.isArray(roomRequirements) || roomRequirements.length < 2 || roomRequirements.length > 4) return []
  const roomNeeds = roomRequirements.map((room) => room.recommendedCapacityKw).sort((a, b) => b - a)
  return AIRCO_MULTI_SPLIT_PACKAGES
    .filter((pack) => {
      if (pack.indoorCapacitiesKw.length !== roomNeeds.length) return false
      const indoorSizes = [...pack.indoorCapacitiesKw].sort((a, b) => b - a)
      return roomNeeds.every((need, index) => indoorSizes[index] >= need)
    })
    .sort((a, b) =>
      a.indoorCapacitiesKw.reduce((sum, size) => sum + size, 0) -
      b.indoorCapacitiesKw.reduce((sum, size) => sum + size, 0),
    )
}

const parseArea = (value, key, errors) => {
  if (value === '' || value === null || value === undefined || String(value).trim() === '') {
    errors[key] = 'required'
    return null
  }

  const parsed = Number(String(value).trim().replace(',', '.'))
  if (!Number.isFinite(parsed)) {
    errors[key] = 'invalid'
    return null
  }
  if (parsed < 0 || parsed > 1000) {
    errors[key] = 'out-of-range'
    return null
  }
  return parsed
}

const nextStandardCoolingClass = (kw) =>
  AIRCO_STANDARD_COOLING_CLASSES_KW.find((capacity) => capacity >= kw) ?? null

export function calculateAircoCapacity(input = {}) {
  const errors = {}
  const rooms = Array.isArray(input.rooms) ? input.rooms : []
  if (rooms.length < 1 || rooms.length > 4) errors.roomCount = 'required'
  if (!['cooling', 'cooling-heating'].includes(input.goal)) errors.goal = 'required'

  const calculatedRooms = rooms.map((room, index) => {
    const areaM2 = parseArea(room.areaM2, `room${index + 1}Area`, errors)
    if (!Object.hasOwn(AIRCO_WATTS_PER_M2, room.insulationLevel)) {
      errors[`room${index + 1}Insulation`] = 'required'
    }
    if (areaM2 === 0) errors[`room${index + 1}Area`] = 'at-least-one-area'
    const wattsPerM2 = AIRCO_WATTS_PER_M2[room.insulationLevel]
    const estimatedCapacityKw = areaM2 !== null && wattsPerM2
      ? areaM2 * wattsPerM2 / 1000
      : null
    const recommendedCapacityKw = estimatedCapacityKw === null
      ? null
      : nextStandardCoolingClass(estimatedCapacityKw)
    if (estimatedCapacityKw !== null && recommendedCapacityKw === null) {
      errors[`room${index + 1}Area`] = 'requires-professional-sizing'
    }
    return { areaM2, insulationLevel: room.insulationLevel, wattsPerM2, estimatedCapacityKw, recommendedCapacityKw }
  })

  if (calculatedRooms.length > 1 && calculatedRooms.some((room) => room.recommendedCapacityKw === null)) {
    errors.roomCount = 'requires-professional-sizing'
  }

  if (Object.keys(errors).length) {
    return { status: 'incomplete', productType: 'airco', errors }
  }

  const totalEstimatedCapacityKw = calculatedRooms.reduce((sum, room) => sum + room.estimatedCapacityKw, 0)
  return {
    status: 'ready',
    productType: 'airco',
    goal: input.goal,
    systemType: calculatedRooms.length === 1 ? 'single-split' : 'multi-split',
    rooms: calculatedRooms,
    totalAreaM2: calculatedRooms.reduce((sum, room) => sum + room.areaM2, 0),
    totalEstimatedCapacityKw,
    hasUnknownInsulation: calculatedRooms.some((room) => room.insulationLevel === 'unknown'),
  }
}
