import React from 'react'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pdf } from '@react-pdf/renderer'
import { PDFReport } from '../src/components/PDFReport.jsx'
import { HeatPumpPDFReport } from '../src/components/heatPump/HeatPumpPDFReport.jsx'
import { calculateHeatPumpROI } from '../src/lib/heatPumpROI.js'

const outputDirectory = process.env.PDF_SMOKE_OUTPUT_DIR ||
  path.resolve(process.cwd(), '../../.agents/outputs/pdf-layout-smoke')

const longModelName = [
  'aroTHERM pro commercial extended configuration',
  'high-capacity cascade-ready inverter module',
  'weather-compensated hybrid installation package',
  'with low-noise outdoor unit and integrated controls',
].join(' ')

const longSubsidyNote = [
  'Subsidy estimate for this test only: the final amount depends on the selected product code,',
  'installation date, application requirements, proof of payment, and the current official scheme.',
  'The amount shown is not a guarantee of eligibility or approval. The installer and homeowner',
  'must verify the applicable conditions and submit the required documents to the relevant authority.',
  'This intentionally long note checks that subsidy explanations wrap inside the PDF price section.',
].join(' ')

const heatPumpModel = {
  id: 'pdf-layout-smoke-model',
  brand: 'Vaillant',
  model: longModelName,
  kw: 12,
  config: 'hybrid',
  scop35: 4.8,
  scop55: 3.7,
  scopEstimated: false,
  catalogPriceEur: 128750,
  subsidyEur: 18950,
  finalPriceEur: 109800,
  priceSource: 'test fixture',
  source: 'test fixture',
  subsidyNote: longSubsidyNote,
}

const heatPumpResult = {
  ...calculateHeatPumpROI({
    model: heatPumpModel,
    annualHeatDemandKwh: 14800,
    gasPricePerM3: 1.45,
    electricPricePerKwh: 0.29,
    investmentEur: 109800,
    totalGasUseM3: 2150,
    gasStandingCostEur: 510,
    flowTemperature: 55,
  }),
  home: {
    type: 'detached',
    buildPeriod: 'pre-1975',
    areaM2: 245,
    gasUseM3: 2150,
    insulation: 'average',
    energyLabel: 'C',
    insulationDetails: { roof: 'partial', walls: 'none', floor: 'partial', glazing: 'double' },
    insulationParts: ['roof', 'walls', 'floor', 'glazing'],
    emitters: `Radiators and mixed emitters with a long customer-supplied description: ${'verification '.repeat(18)}`,
    boilerAgeYears: 18,
    contractType: 'dynamic',
    statedElectricPricePerKwh: 0.32,
  },
  advice: {
    estimatedSpaceGasM3: 1875,
    requiredKw: 14.5,
    recommendedConfig: 'hybrid',
    heatingMethodNeedsReview: true,
  },
  extras: {
    solar: { selected: true, annualKwh: 8200, price: 29750 },
    ev: { selected: true, annualKwh: 6400, price: 18500 },
  },
}
heatPumpResult.model.subsidyNote = longSubsidyNote

const batteryResults = {
  pv_input: 12600,
  v_input: 8900,
  t_input: 6100,
  pE_used: 0.34,
  pT_used: 0.08,
  total_annual_low: 1250000,
  total_annual_high: 2450000,
  total_daily_low: 3424.66,
  total_daily_high: 6712.33,
  dynamic_contract: true,
  current_dynamic_contract: false,
  switch_to_dynamic_annual_low: 120000,
  switch_to_dynamic_annual_high: 190000,
  switch_to_dynamic_monthly_low: 10000,
  switch_to_dynamic_monthly_high: 15833.33,
  sc_direct_kwh: 3650,
  sc_pct_zonder: 29,
  sc_pct_met: 83,
  self_sufficiency_before_pct: 41,
  self_sufficiency_after_pct: 93,
  export_kwh_zonder: 6100,
  export_kwh_with: 1400,
  grid_import_without: 5250,
  grid_import_with: 720,
  grid_import_besparing_kwh: 4530,
  totalSelfConsumption: 11200,
  batterySelfConsumption: 7550,
  battery_throughput_kwh: 8900,
  smart_annual_low: 225000,
  smart_annual_high: 310000,
  smart_monthly_low: 18750,
  smart_monthly_high: 25833.33,
  epex_throughput_low_kwh: 7500,
  epex_throughput_high_kwh: 9800,
  net_energy_saving_eur: 940000,
  net_annual_cost_with: 2750,
  ems_physics_low: 225000,
  ems_physics_high: 310000,
  escalation_eur_low: 45000,
  escalation_eur_high: 81000,
  sald_protection_eur: 27500,
  garantie_bonus: 12500,
  payback_low: 0.5,
  payback_high: 0.8,
}

const normalResults = {
  ...batteryResults,
  total_annual_low: 1650,
  total_annual_high: 2350,
  total_daily_low: 4.52,
  total_daily_high: 6.44,
  switch_to_dynamic_annual_low: 120,
  switch_to_dynamic_annual_high: 190,
  switch_to_dynamic_monthly_low: 10,
  switch_to_dynamic_monthly_high: 15.83,
  smart_annual_low: 450,
  smart_annual_high: 640,
  smart_monthly_low: 37.5,
  smart_monthly_high: 53.33,
  net_energy_saving_eur: 800,
  ems_physics_low: 450,
  ems_physics_high: 640,
  escalation_eur_low: 120,
  escalation_eur_high: 250,
  sald_protection_eur: 150,
  garantie_bonus: 90,
  payback_low: 5.3,
  payback_high: 7.6,
}

const combinationProducts = {
  mode: 'combination',
  battery: {
    brand: 'HYXiPower',
    model: `X-Home 15.9 kWh ${'modular high-voltage storage system '.repeat(5)}`,
    phase: '3-phase',
  },
  plannedSolar: { selected: true, annualKwh: 8200, price: 29750 },
  plannedHeatPump: {
    selected: true,
    annualKwh: heatPumpResult.annualHeatPumpElectricityKwh,
    price: 109800,
    model: { brand: heatPumpModel.brand, model: longModelName },
  },
  plannedEv: { selected: true, annualKwh: 6400, price: 18500 },
  addOnInvestment: 148050,
  energy: {
    hasPlannedChanges: true,
    projectedSolarKwh: 20800,
    projectedConsumptionKwh: 30100,
    projectedExportKwh: 4300,
    forecastWasAdjusted: true,
    exportMethod: 'user-forecast',
    heatPumpSolarOverlapKwh: 3200,
  },
  batteryWithoutHeatPumpResults: { net_annual_cost_without: 12500 },
  heatPumpROI: heatPumpResult,
}

const input = { battery_price: 999999, battery_kWh: 15.9 }

const cases = [
  {
    name: 'energy-report-nl',
    element: <PDFReport results={normalResults} input={{ battery_price: 12500, battery_kWh: 10 }} products={null} lang="nl" debugLayout />,
  },
  {
    name: 'combined-report-nl',
    element: <PDFReport results={batteryResults} input={input} products={combinationProducts} lang="nl" debugLayout />,
  },
  {
    name: 'combined-report-en',
    element: <PDFReport results={batteryResults} input={input} products={combinationProducts} lang="en" debugLayout />,
  },
  {
    name: 'heat-pump-report-nl',
    element: <HeatPumpPDFReport result={heatPumpResult} lang="nl" debugLayout />,
  },
  {
    name: 'heat-pump-report-en',
    element: <HeatPumpPDFReport result={heatPumpResult} lang="en" debugLayout />,
  },
]

await fs.mkdir(outputDirectory, { recursive: true })

const originalInfo = console.info
const originalWarn = console.warn
const overflowWarnings = []
let layoutEntries = 0
const verboseGeometry = process.env.PDF_SMOKE_VERBOSE === '1'

console.info = (message, details) => {
  if (String(message).includes('PDF layout')) {
    layoutEntries += 1
    if (verboseGeometry && (
      details?.type === 'PAGE' ||
      ['report-hero-kpi', 'report-situation-cards', 'report-before-after-cards', 'financial-summary-card'].includes(details?.element)
    )) originalInfo(message, details)
  }
  else originalInfo(message, details)
}
console.warn = (...args) => {
  if (String(args[0]).includes('PDF overflow')) overflowWarnings.push(args)
  else originalWarn(...args)
}

try {
  for (const testCase of cases) {
    const stream = await pdf(testCase.element).toBuffer()
    const chunks = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const buffer = Buffer.concat(chunks)
    if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      throw new Error(`${testCase.name} did not produce a PDF file`)
    }
    const outputPath = path.join(outputDirectory, `${testCase.name}.pdf`)
    await fs.writeFile(outputPath, buffer)
    console.log(`${testCase.name}: rendered ${buffer.length} bytes → ${outputPath}`)
  }
} finally {
  console.info = originalInfo
  console.warn = originalWarn
}

if (layoutEntries < 30) {
  throw new Error(`Expected per-element geometry logs; received only ${layoutEntries}`)
}

if (overflowWarnings.length) {
  console.error(`PDF geometry warnings: ${overflowWarnings.length}`)
  overflowWarnings.slice(0, 20).forEach((warning) => console.error(...warning))
  throw new Error('One or more elements exceed the page or reserved footer area.')
}

console.log(`Validated ${cases.length} generated PDFs and ${layoutEntries} element geometry records.`)