import { calculateHeatPumpROI } from './heatPumpROI.js'
import { getHeatPumpAdvice } from './heatPumpAdvice.js'
import { findHeatPump } from './heatPumpProducts.js'

const homeInput = {
  heat_home_type: 'terraced',
  heat_build_period: '2005-2020',
  heat_area_m2: 110,
  heat_gas_usage: 1250,
  heat_insulation: 'good',
  heat_energy_label: 'B',
  heat_insulation_roof: 'yes',
  heat_insulation_walls: 'yes',
  heat_insulation_floor: 'yes',
  heat_insulation_glazing: 'yes',
  heat_emitters: 'floor',
  heat_preference: 'all-electric',
}

const advice = getHeatPumpAdvice(homeInput)
if (!advice?.suggestedModel) {
  throw new Error('Could not prepare the illustrative heat-pump preview model.')
}

const model = findHeatPump(advice.suggestedModel.id)
if (!model) {
  throw new Error('The illustrative heat-pump preview model is missing.')
}

const calculation = calculateHeatPumpROI({
  model,
  annualHeatDemandKwh: advice.annualHeatDemandKwh,
  gasPricePerM3: 1.35,
  electricPricePerKwh: 0.27,
  investmentEur: model.finalPriceEur,
  totalGasUseM3: 1250,
  gasStandingCostEur: 425,
  gasConnectionRemoved: true,
  flowTemperature: advice.flowTemperature,
  hybridCoveragePct: advice.hybridCoveragePct,
})

export const previewResult = {
  ...calculation,
  electricPricePerKwh: 0.27,
  home: {
    type: 'terraced',
    buildPeriod: '2005-2020',
    areaM2: 110,
    areaRange: '100-124',
    gasUseM3: 1250,
    gasUseRange: '',
    insulation: advice.insulationLevel,
    energyLabel: 'B',
    insulationDetails: advice.insulationDetails,
    insulationParts: advice.insulationParts,
    emitters: 'floor',
    boilerAgeYears: 12,
    contractType: 'variable',
    statedElectricPricePerKwh: 0.27,
  },
  advice,
}