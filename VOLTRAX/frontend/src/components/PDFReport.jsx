import React from 'react'
import { Document, Link, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import {
  calculateCombinedROI,
  calculateHeatPumpAnnualCostAfterBattery,
  getAdditionalAircoGasSavings,
} from '../lib/combinedROI'
import { normalizeHeatPumpROIResult } from '../lib/heatPumpROI'
import { splitHeatPumpElectricity } from '../lib/energyScenario'
import {
  getFeedInCostDetails,
  getRemainingAnnualFeedInCost,
} from '../lib/feedInCosts'
import { createPdfLayoutLogger } from '../lib/pdfLayoutDebug'

function fmt(n, d = 0) {
  if (n === undefined || n === null || isNaN(n)) return '—'
  const fixed = Number(n).toFixed(d)
  const [int, dec] = fixed.split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return d > 0 ? `${intFmt},${dec}` : intFmt
}

const EUR   = '\u20AC'
const DASH  = '\u2013'
const TIMES = '\u00D7'
const MIN   = '\u2212'
const DOT   = '\u00B7'

const G       = '#55775D'
const DARK    = '#244B39'
const G_LIGHT = '#E9EEE5'
const G_BDR   = '#C8D5C7'
const TEXT    = '#23342B'
const MID     = '#5E7063'
const LIGHT   = '#78877C'
const XLGHT   = '#D3DDD2'
const BDR     = '#DCE3D9'
const BDR2    = '#EBEFE8'
const WHITE   = '#FBFAF6'
const RED     = '#DC2626'
const AMBER   = '#D97706'

// A4 = 595 pt wide. Margins 40pt each side → content = 515 pt.
// Each situGrid column in a 4-col row: (515 − 3×8) / 4 = 122.75 → use 122
const COL4 = 122
const PAGE_HEADER_HEIGHT = 72
const PAGE_FOOTER_HEIGHT = 42

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', backgroundColor: WHITE, color: TEXT,
    paddingTop: PAGE_HEADER_HEIGHT, paddingBottom: PAGE_FOOTER_HEIGHT,
  },

  accentBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 4, backgroundColor: G,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  hdr: {
    position: 'absolute', top: 4, left: 0, right: 0, height: PAGE_HEADER_HEIGHT - 4,
    backgroundColor: DARK, paddingHorizontal: 40, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  hdrLogo:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.5 },
  hdrAccent: { color: G },
  hdrSub:    { fontSize: 7.5, color: 'rgba(255,255,255,0.32)', marginTop: 5 },
  hdrRight:  { alignItems: 'flex-end' },
  hdrLabel:  { fontSize: 6.5, color: 'rgba(255,255,255,0.36)', letterSpacing: 1.8, marginBottom: 6 },
  hdrDate:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE },

  // ── Hero ─────────────────────────────────────────────────────────────────
  hero:        { backgroundColor: DARK, paddingHorizontal: 40, paddingTop: 8, paddingBottom: 12 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 20 },
  heroEye:     { fontSize: 7, color: 'rgba(255,255,255,0.32)', letterSpacing: 2.2, marginBottom: 8 },
  heroAmt:     { fontSize: 38, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: -1, lineHeight: 1.1, marginBottom: 5, maxWidth: '100%' },
  heroSub:     { fontSize: 8.5, color: 'rgba(255,255,255,0.26)', marginBottom: 4 },
  heroBadge:   {
    alignSelf: 'flex-start', marginBottom: 18,
    backgroundColor: 'rgba(34,165,93,0.18)',
    borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10,
    borderWidth: 1, borderColor: 'rgba(34,165,93,0.35)',
  },
  heroBadgeTxt: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: G, letterSpacing: 0.6 },
  heroBoxRow:   { flexDirection: 'row', gap: 8 },
  heroBox:      { flex: 1, minWidth: 0, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 9, paddingVertical: 13, paddingHorizontal: 12 },
  heroBoxLbl:   { fontSize: 6.5, color: 'rgba(255,255,255,0.30)', marginBottom: 5 },
  heroBoxVal:   { fontSize: 11.5, fontFamily: 'Helvetica-Bold', color: WHITE, flexShrink: 1, lineHeight: 1.2 },

  // ── Body ─────────────────────────────────────────────────────────────────
  body: { paddingHorizontal: 40, paddingTop: 10, paddingBottom: 0 },

  eye: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: XLGHT, letterSpacing: 2.2, marginBottom: 8 },

  // ── Situation grid — explicit 4-col rows ──────────────────────────────────
  situRow:  { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginBottom: 8 },
  situItem: {
    width: COL4, backgroundColor: '#F8FAFC',
    borderRadius: 8, padding: 11,
    borderWidth: 1, borderColor: BDR,
  },
  situLbl:  { fontSize: 6.5, color: LIGHT, marginBottom: 4 },
  situVal:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: TEXT, marginBottom: 2 },
  situUnit: { fontSize: 7, color: MID },

  // ── Two-column row ────────────────────────────────────────────────────────
  twoCol: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    flex: 1, minWidth: 0, borderRadius: 11,
    borderWidth: 1, borderColor: BDR,
    padding: 16,
  },
  cardGreen: {
    flex: 1, borderRadius: 11,
    borderWidth: 1, borderColor: G_BDR,
    backgroundColor: G_LIGHT, padding: 16,
  },
  cardEye:       { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: LIGHT, letterSpacing: 1.3, marginBottom: 4 },
  cardEyeGreen:  { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: G,     letterSpacing: 1.3, marginBottom: 4 },
  cardTitle:     { fontSize: 11.5, fontFamily: 'Helvetica-Bold', color: TEXT, marginBottom: 13 },
  cardTitleDark: { fontSize: 11.5, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 13 },

  // ── Data rows ─────────────────────────────────────────────────────────────
  dr: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BDR2,
  },
  drG: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#D1FAE5',
  },
  drLeft:  { flex: 1, minWidth: 0, paddingRight: 8 },
  drLbl:   { fontSize: 8.5, color: MID },
  drSub:   { fontSize: 6.5, color: LIGHT, marginTop: 2 },
  drVal:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TEXT, maxWidth: '48%', flexShrink: 1, textAlign: 'right', lineHeight: 1.2 },
  drValG:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: G, maxWidth: '48%', flexShrink: 1, textAlign: 'right', lineHeight: 1.2 },
  drValR:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: RED, maxWidth: '48%', flexShrink: 1, textAlign: 'right', lineHeight: 1.2 },
  heatCompareHeader: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: BDR },
  heatCompareRow: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: BDR2 },
  heatCompareLabel: { flex: 1, fontSize: 7, color: MID, paddingRight: 5 },
  heatCompareValue: { width: 76, fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'right', color: TEXT, flexShrink: 1 },
  heatCompareHead: { width: 76, fontSize: 6.5, fontFamily: 'Helvetica-Bold', textAlign: 'right', color: LIGHT, flexShrink: 1 },

  // ── Financial table (page 2) ──────────────────────────────────────────────
  tr: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: BDR2,
  },
  trLeft:  { flex: 1, minWidth: 0, paddingRight: 12 },
  trLbl:   { fontSize: 9.5, color: MID },
  trLblB:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: TEXT },
  trSub:   { fontSize: 7, color: LIGHT, marginTop: 2 },
  trVal:   { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: TEXT,  textAlign: 'right', maxWidth: '42%', flexShrink: 1, lineHeight: 1.2 },
  trValG:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: G,    textAlign: 'right', maxWidth: '42%', flexShrink: 1, lineHeight: 1.2 },
  trValR:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: RED,  textAlign: 'right', maxWidth: '42%', flexShrink: 1, lineHeight: 1.2 },

  // ── Total row ─────────────────────────────────────────────────────────────
  totRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 13, paddingBottom: 7,
    borderTopWidth: 2, borderTopColor: G, marginTop: 3,
  },
  totLbl: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: DARK },
  totSub: { fontSize: 7.5, color: LIGHT, marginTop: 4 },
  totVal: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: G, maxWidth: '50%', flexShrink: 1, textAlign: 'right', lineHeight: 1.15 },

  // ── ROI boxes ─────────────────────────────────────────────────────────────
  roiRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  roiBox: { flex: 1, minWidth: 0, backgroundColor: G_LIGHT, borderRadius: 9, paddingVertical: 11, paddingHorizontal: 12 },
  roiLbl: { fontSize: 7, color: G, marginBottom: 4 },
  roiVal: { maxWidth: '100%', fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DARK, flexShrink: 1, minWidth: 0, lineHeight: 1.2 },

  // ── Bullet list ───────────────────────────────────────────────────────────
  bRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 7 },
  bDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: G, marginTop: 3.5 },
  bTxt: { fontSize: 8.5, color: MID, flex: 1, lineHeight: 1.5 },

  // ── Contact bar ───────────────────────────────────────────────────────────
  cBar: {
    backgroundColor: DARK, borderRadius: 11,
    paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: PAGE_FOOTER_HEIGHT,
    borderTopWidth: 1, borderTopColor: BDR,
    paddingHorizontal: 40, paddingVertical: 7,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: WHITE,
  },
  fTxt:   { flex: 1, fontSize: 6.5, color: LIGHT, lineHeight: 1.25 },
  fBrand: { width: 140, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: MID, textAlign: 'center' },
  financialDisclaimer: { fontSize: 7, color: MID, lineHeight: 1.35, marginTop: 10 },
})

function DR({ lbl, sub, val, g, r, style }) {
  const displaySub = typeof lbl === 'string' && lbl.toLowerCase().includes('epex') && typeof sub === 'string'
    ? sub.split(' · ')[0]
    : sub
  return (
    <View style={style || s.dr}>
      <View style={s.drLeft}>
        <Text style={s.drLbl}>{lbl}</Text>
        {displaySub ? <Text style={s.drSub}>{displaySub}</Text> : null}
      </View>
      <Text style={g ? s.drValG : r ? s.drValR : s.drVal}>{val}</Text>
    </View>
  )
}

function HeatCompareRow({ lbl, before, after, strong = false }) {
  const valueStyle = strong ? [s.heatCompareValue, { color: G }] : s.heatCompareValue
  return (
    <View style={s.heatCompareRow}>
      <Text style={s.heatCompareLabel}>{lbl}</Text>
      <Text style={valueStyle}>{before}</Text>
      <Text style={valueStyle}>{after}</Text>
    </View>
  )
}

// Chunk an array into rows of n for explicit grid rendering
function chunkArray(arr, n) {
  const rows = []
  for (let i = 0; i < arr.length; i += n) rows.push(arr.slice(i, i + n))
  return rows
}

export function PDFReport({ results: rv, input, products, lang = 'nl', debugLayout }) {
  const price   = input?.battery_price || 9000
  const kWh     = input?.battery_kWh   || 15.9
  const isEnglish = lang === 'en'
  const copy = isEnglish ? {
    reportTitle: 'SolarFast Personal Energy Report',
    reportSubject: 'battery calculation',
    partnerCountry: 'HYXiPower · partner in the Netherlands',
    footerContact: 'www.solarfast.nl · info@solarfast.nl · HYXiPower partner',
    reportLabel: 'PERSONAL ENERGY REPORT',
    annualBenefit: 'ESTIMATED ANNUAL SAVINGS WITH HOME BATTERY',
    combinedAnnualBenefit: 'ESTIMATED COMBINED ANNUAL SAVINGS',
    benefitDescription: 'Based on the selected battery, your energy use and the contract scenario shown.',
    batteryDynamicNote: 'This estimate uses dynamic prices. Your actual savings may differ if you keep a fixed tariff.',
    combinedBenefitDescription: 'Change in whole-house annual energy costs; no standalone savings are added',
    combinedInvestment: 'Total investment (battery + heat pump)',
    batteryContribution: 'Annual energy costs without both products',
    heatContribution: 'Combined annual costs before EPEX battery-trading value',
    epexContribution: 'Modeled EPEX battery-trading value (included once)',
    batterySpecific: 'Battery-specific',
    batterySpecificHeadline: 'Battery-specific calculation',
    combinedMethod: 'The combined result compares total annual household energy costs before and after both products. Standalone savings are not added; modeled EPEX battery trading is counted once. Separate solar/EV costs and savings are excluded.',
    combinedUnavailable: 'A required no-heat-pump baseline is missing, so no combined financial result is calculated. Recalculate the report to restore the comparison.',
    gasHeatingSource: 'RVO Installatiemonitor 3.0: observed hybrid space-heating gas reductions vary by home',
    dynamicContract: 'Dynamic energy contract',
    fixedContract: 'Fixed energy contract',
    currentContract: 'Current energy contract',
    batteryScenarioContract: 'Calculated battery scenario',
    switchToDynamicLabel: 'Difference from switching to dynamic (included above)',
    switchToDynamicMonthly: 'Average switching savings per month',
    perMonth: 'Per month',
    payback: 'Payback period',
    years: 'years',
    netAfter10: 'Net after 10 years',
    perDay: 'Per day',
    yourSituation: 'YOUR SITUATION',
    solarGeneration: 'Solar generation',
    annualConsumption: 'Annual consumption',
    gridExport: 'Grid export before battery',
    purchasePrice: 'Electricity purchase price',
    feedInTariff: 'Feed-in tariff',
    selectedCapacity: 'Selected capacity',
    homeBattery: 'home battery',
    investmentIncludingInstall: 'Investment incl. installation',
    total: 'total',
    perYear: 'per year',
    energyAnalysis: 'ENERGY ANALYSIS: BEFORE AND AFTER THE BATTERY',
    currentSituation: 'CURRENT SITUATION',
    withoutBattery: 'Without battery',
    totalAnnualGeneration: 'total annual generation',
    directSelfConsumption: 'Direct self-consumption',
    percentOfConsumption: '% of solar generation used',
    returnedToGrid: 'Sent to grid without battery',
    unusedSurplus: 'unused surplus',
    gridPurchase: 'Grid electricity purchased',
    fullRatePaid: 'paid at the full rate',
    feedInCosts: 'Feed-in costs',
    supplierCharge: 'charged by your supplier',
    withBattery: 'WITH BATTERY',
    withBatteryTitle: 'With battery',
    sameAsCurrent: 'same as current situation',
    totalSelfConsumption: 'Total self-consumption',
    direct: 'direct',
    batteryShort: 'battery',
    stillExported: 'Remaining export after battery use',
    usedInsteadOfExported: 'kWh less sent to grid after battery storage',
    lessPurchasedFromGrid: 'kWh less purchased from the grid using battery power',
    energySavings: 'Energy savings',
    netSelfConsumptionExclEpex: 'net self-consumption, excl. EPEX',
    emsMarketOptimisation: 'Estimated value from dynamic charging and discharging (EPEX)',
    epexArbitrage: 'Estimated value from modeled low-price charging and higher-price discharging',
    epexThroughput: (low, high) => `Modelled EPEX throughput: ${low}–${high} kWh/year`,
    epexInactive: 'Not included without a dynamic tariff and modeled battery movement',
    indicativeNonBinding: 'Indicative calculation — no obligation',
    page: 'Page',
    of: 'of',
    financialOverview: 'Financial overview',
    fullCalculation: 'Full calculation',
    step1: 'Step 1 — Base energy savings',
    avoidedGridPurchase: 'kWh of avoided grid purchases',
    missedExportRevenue: 'missed export revenue',
    feedInCostSuffix: 'feed-in costs',
    step2: 'Step 2 — Dynamic-price battery charging and discharging (EPEX)',
    days: '365 days',
    tradingBenefit: 'Indicative estimate',
    dailyMarketTrading: 'Separate estimate; not an imbalance-market payment',
    step3: 'Step 3 — Energy price increase',
    informativeForecastBase: 'Informative forecast — not in baseline',
    perYearShort: '/yr',
    perDayShort: '/day',
    step4: 'Step 4 — Net-metering protection',
    phaseOut: 'phase-out 2027–2031',
    step5: 'Step 5 — Capacity-based estimate adjustment',
    basedOnCapacity: 'Based on the capacity assumption in this estimate',
    totalAnnualBenefit: 'Total annual benefit',
    investment: 'investment',
    benefitPerMonth: 'Benefit per month',
    summary: 'SUMMARY',
    contract: 'Contract',
    currentSelfConsumption: 'Solar self-consumption rate now',
    batterySelfConsumption: 'Solar self-consumption rate with battery',
    selfSufficiency: 'Demand covered by own solar',
    batteryThroughput: 'Total battery output (home + EPEX)',
    batteryThroughputSub: (home, epex) => `${home} kWh delivered at home + ${epex} kWh discharged for EPEX`,
    batteryFlowLabel: 'Battery charge / conversion loss',
    batteryFlowSub: 'Charge minus conversion losses equals discharge; EPEX charging uses electricity from the grid.',
    avoidedPurchases: 'Grid purchases avoided',
    nationalHeatFund: 'NATIONAL HEAT FUND',
    possibleZeroInterest: 'Check current Warmtefonds terms',
    heatFundLoan: 'Loan terms are set by the fund',
    heatFundIncome: 'Eligibility depends on personal circumstances',
    termUpTo: 'Rates, amounts and terms can change',
    applicationArranged: 'Check current details directly with the Warmtefonds',
    separateQuote: 'Discuss a project proposal',
    brochureProvided: 'Ask SolarFast about product information',
    epexModelDisclaimer: 'Estimate: 350–380 total battery cycles/year, including solar shifting; EPEX uses only remaining cycles. Model value: €0.24–€0.26 per discharged kWh × 0.75, with 95% efficiency. This is not an imbalance-market payment. Taxes and supplier/trading fees are not modeled separately. 10-year net assumes unchanged annual savings; excludes degradation, maintenance, replacement and tariff changes.',
    actualResultsMayVary: 'Actual results may vary',
    scenarioTitle: 'Selected products and energy assumptions',
    battery: 'Selected battery',
    batteryInvestment: 'Battery investment, incl. installation and VAT',
    solar: 'Additional solar generation',
    heatPump: 'Additional heat-pump electricity use',
    ev: 'Additional home EV-charging use',
    annualValues: 'Annual values after planned products',
    production: 'generation',
    consumption: 'use',
    export: 'grid export',
    estimated: 'Annual-balance estimate',
    forecast: 'User-entered forecast',
    forecastAdjusted: 'User forecast adjusted to the physical annual energy balance',
    addOnInvestment: 'Entered investment for other products',
    solarPrice: 'Additional solar panels',
    heatPumpPrice: 'Heat pump',
    evPrice: 'EV charger / electric car',
    phase1: 'single phase',
    phase3: 'three phase',
    otherBrandNote: 'The existing battery savings model is used; actual performance can vary by product and installation.',
    evNote: 'The EV value is added as annual home-charging demand. It does not assume the battery supplies all charger electricity.',
    heatSavings: 'Heat-pump contribution to combined savings',
    heatReturn: 'Heat-pump payback (separate)',
    heatMethod: 'Annual before-and-after energy costs; this heat-pump saving is shown separately in the combined result.',
    heatScopSource: 'Vaillant aroTHERM pro published SCOP specifications',
    homeInputs: 'Home and sizing inputs',
    homeType: 'Home type',
    buildPeriod: 'Build period',
    heatedArea: 'Heated area',
    totalGasUse: 'Total annual gas use',
    spaceHeatingGas: 'Estimated space-heating gas',
    insulation: 'Insulation',
    emitters: 'Heat emitters',
    boilerAge: 'Boiler age',
    heatContract: 'Heat-pump electricity contract',
    statedHeatElectricity: 'Stated electricity price',
    requiredHeatCapacity: 'Estimated required capacity',
    recommendedHeatConfig: 'Preliminary recommended configuration',
    effectiveHeatElectricity: 'Effective electricity tariff used',
    dynamicHeatTariffNote: 'Any 10% heat-electricity tariff adjustment is limited to the battery + heat-pump combination with a dynamic contract; the effective rate shown above is the one used in this estimate.',
    heatBefore: 'Before',
    heatAfter: 'After',
    heatGasUse: 'Annual gas use',
    heatElectricityUse: 'Heat-pump electricity',
    heatPumpSolarOverlap: 'Estimated heat-pump electricity coinciding with solar',
    heatPumpSolarBatterySupply: 'Heat-pump power from solar-charged battery',
    heatPumpCheapBatterySupply: 'Heat-pump power from low-price battery charging',
    heatPumpPowerAfterSolar: 'Heat-pump grid demand after solar and battery',
    heatFixedCost: 'Fixed gas charges',
    heatFixedSavings: 'Estimated fixed gas-charge savings',
    heatTotalCost: 'Annual heating/gas costs',
    heatFixedCostNote: 'Fixed gas-charge savings apply only if the network operator removes the gas connection and meter. Hybrid systems keep fixed charges.',
    heatPriceIncluded: 'Selected product price (VAT incl., after subsidy)',
    heatWeheatScop: 'WeHeat SCOP is illustrative, not verified as a manufacturer-published value.',
  } : {
    reportTitle: 'SolarFast Persoonlijk Energierapport',
    reportSubject: 'batterijberekening',
    partnerCountry: 'HYXiPower · partner Nederland',
    footerContact: 'www.solarfast.nl · info@solarfast.nl · HYXiPower partner',
    reportLabel: 'PERSOONLIJK ENERGIERAPPORT',
    annualBenefit: 'GESCHATTE JAARLIJKSE BESPARING MET THUISBATTERIJ',
    combinedAnnualBenefit: 'GESCHATTE GEZAMENLIJKE JAARLIJKSE BESPARING',
    benefitDescription: 'Op basis van de gekozen batterij, uw energieverbruik en het getoonde contractscenario.',
    batteryDynamicNote: 'Deze berekening gebruikt dynamische prijzen. Uw werkelijke besparing kan afwijken als u een vast contract houdt.',
    combinedBenefitDescription: 'Verschil in totale jaarlijkse energiekosten; losse besparingen worden niet opgeteld',
    combinedInvestment: 'Totale investering (batterij + warmtepomp)',
    batteryContribution: 'Jaarlijkse energiekosten zonder beide producten',
    heatContribution: 'Jaarlijkse kosten met combinatie, vóór EPEX-batterijhandel',
    epexContribution: 'Gemodelleerde EPEX-batterijhandel (één keer verwerkt)',
    batterySpecific: 'Alleen batterij',
    batterySpecificHeadline: 'Berekening alleen batterij',
    combinedMethod: 'Het combinatieresultaat vergelijkt de totale jaarlijkse energiekosten vóór en na beide producten. Losse besparingen worden niet opgeteld; gemodelleerde EPEX-batterijhandel telt één keer mee. Aparte kosten en besparingen voor zonnepanelen/EV zijn uitgesloten.',
    combinedUnavailable: 'De benodigde vergelijking zonder warmtepomp ontbreekt. Daarom is geen gecombineerd financieel resultaat berekend. Bereken het rapport opnieuw om de vergelijking te herstellen.',
    gasHeatingSource: 'RVO Installatiemonitor 3.0: waargenomen besparing op ruimteverwarmingsgas in hybride woningen verschilt per woning',
    dynamicContract: 'Dynamisch energiecontract',
    fixedContract: 'Vast energiecontract',
    currentContract: 'Huidig energiecontract',
    batteryScenarioContract: 'Berekend batterijscenario',
    switchToDynamicLabel: 'Verschil door overstap naar dynamisch (al inbegrepen)',
    switchToDynamicMonthly: 'Gemiddelde overstapbesparing per maand',
    perMonth: 'Per maand',
    payback: 'Terugverdientijd',
    years: 'jaar',
    netAfter10: 'Netto na 10 jaar',
    perDay: 'Per dag',
    yourSituation: 'UW SITUATIE',
    solarGeneration: 'Zonne-opwek',
    annualConsumption: 'Jaarverbruik',
    gridExport: 'Teruglevering vóór batterij',
    purchasePrice: 'Inkoopprijs',
    feedInTariff: 'Teruglevertarief',
    selectedCapacity: 'Gekozen capaciteit',
    homeBattery: 'thuisbatterij',
    investmentIncludingInstall: 'Investering incl. inst.',
    total: 'totaal',
    perYear: 'per jaar',
    energyAnalysis: 'ENERGIEANALYSE: VOOR EN NA DE BATTERIJ',
    currentSituation: 'HUIDIGE SITUATIE',
    withoutBattery: 'Zonder batterij',
    totalAnnualGeneration: 'totale jaarlijkse opwek',
    directSelfConsumption: 'Direct zelfverbruik',
    percentOfConsumption: '% van de zonne-opwek',
    returnedToGrid: 'Naar het net zonder batterij',
    unusedSurplus: 'onbenut overschot',
    gridPurchase: 'Inkoop van net',
    fullRatePaid: 'betaalt u vol tarief',
    feedInCosts: 'Terugleverkosten',
    supplierCharge: 'aan uw leverancier',
    withBattery: 'MET BATTERIJ',
    withBatteryTitle: 'Met batterij',
    sameAsCurrent: 'gelijk aan huidige situatie',
    totalSelfConsumption: 'Totaal zelfverbruik',
    direct: 'direct',
    batteryShort: 'batterij',
    stillExported: 'Resterend naar het net na batterijgebruik',
    usedInsteadOfExported: 'kWh minder naar het net door batterijopslag',
    lessPurchasedFromGrid: 'kWh minder ingekocht door verbruik uit batterij',
    energySavings: 'Energiebesparing',
    netSelfConsumptionExclEpex: 'netto zelfverbruik, excl. EPEX',
    emsMarketOptimisation: 'Geschatte waarde dynamisch laden en ontladen (EPEX)',
    epexArbitrage: 'Geschatte waarde van laden bij lagere en ontladen bij hogere prijzen',
    epexThroughput: (low, high) => `EPEX-doorvoer: ${low}–${high} kWh/jaar`,
    epexInactive: 'Niet meegerekend zonder dynamisch contract en gemodelleerde batterijbeweging',
    indicativeNonBinding: 'Indicatieve berekening – vrijblijvend',
    page: 'Pagina',
    of: 'van',
    financialOverview: 'Financieel overzicht',
    fullCalculation: 'Volledige berekening',
    step1: 'Stap 1 — Basis energiebesparing',
    avoidedGridPurchase: 'kWh vermeden inkoop',
    missedExportRevenue: 'gemiste exportopbrengst',
    feedInCostSuffix: 'TK',
    step2: 'Stap 2 — Dynamisch laden en ontladen (EPEX)',
    days: '365 dagen',
    tradingBenefit: 'Indicatieve schatting',
    dailyMarketTrading: 'Aparte schatting; geen vergoeding van de onbalansmarkt',
    step3: 'Stap 3 — Energieprijsstijging',
    informativeForecastBase: 'Informatieve prognose — niet in basislijn',
    perYearShort: '/jr',
    perDayShort: '/dag',
    step4: 'Stap 4 — Salderingsbescherming',
    phaseOut: 'afbouw 2027–2031',
    step5: 'Stap 5 — Capaciteitsaanpassing in deze schatting',
    basedOnCapacity: 'Gebaseerd op de capaciteit die in deze schatting is aangenomen',
    totalAnnualBenefit: 'Totaal jaarlijks voordeel',
    investment: 'investering',
    benefitPerMonth: 'Per maand voordeel',
    summary: 'SAMENVATTING',
    contract: 'Contract',
    currentSelfConsumption: 'Zelfverbruik zonne-opwek nu',
    batterySelfConsumption: 'Zelfverbruik zonne-opwek met batterij',
    selfSufficiency: 'Verbruik gedekt door eigen zonnestroom',
    batteryThroughput: 'Totaal ontladen (woning + EPEX)',
    batteryThroughputSub: (home, epex) => `${home} kWh aan huis + ${epex} kWh ontladen voor EPEX`,
    batteryFlowLabel: 'Batterij geladen / omzettingsverlies',
    batteryFlowSub: 'Laadstroom min omzettingsverlies is de ontladen stroom; EPEX gebruikt stroom uit het net.',
    avoidedPurchases: 'Inkoop bespaard',
    nationalHeatFund: 'NATIONAAL WARMTEFONDS',
    possibleZeroInterest: 'Controleer actuele voorwaarden bij het Warmtefonds',
    heatFundLoan: 'Leenvoorwaarden worden door het fonds bepaald',
    heatFundIncome: 'Geschiktheid hangt af van uw persoonlijke situatie',
    termUpTo: 'Rente, bedragen en voorwaarden kunnen wijzigen',
    applicationArranged: 'Controleer actuele informatie rechtstreeks bij het Warmtefonds',
    separateQuote: 'Bespreek een projectvoorstel',
    brochureProvided: 'Vraag SolarFast naar productinformatie',
    epexModelDisclaimer: 'Schatting: 350–380 totale batterijcycli per jaar, inclusief zonne-opslag; EPEX gebruikt alleen de resterende cycli. Modelwaarde: €0,24–€0,26 per ontladen kWh × 0,75 en 95% rendement. Dit is geen vergoeding van de onbalansmarkt. Belastingen en leveranciers-/transactiekosten zijn niet apart gemodelleerd. Netto na 10 jaar gaat uit van gelijke jaarbesparing; degradatie, onderhoud, vervanging en tariefwijzigingen tellen niet mee.',
    actualResultsMayVary: 'Werkelijke resultaten kunnen afwijken',
    scenarioTitle: 'Gekozen producten en energieaannames',
    battery: 'Gekozen batterij',
    batteryInvestment: 'Batterij-investering incl. installatie en btw',
    solar: 'Extra zonneproductie',
    heatPump: 'Extra stroomverbruik warmtepomp',
    ev: 'Extra verbruik thuis laden',
    annualValues: 'Jaarwaarden na geplande producten',
    production: 'opwek',
    consumption: 'verbruik',
    export: 'teruglevering',
    estimated: 'Schatting op basis van jaarbalans',
    forecast: 'Door u opgegeven prognose',
    forecastAdjusted: 'Prognose aangepast aan de fysieke jaarbalans',
    addOnInvestment: 'Opgegeven investering andere producten',
    solarPrice: 'Extra zonnepanelen',
    heatPumpPrice: 'Warmtepomp',
    evPrice: 'Laadpaal / elektrische auto',
    phase1: '1-fase',
    phase3: '3-fase',
    otherBrandNote: 'Het bestaande batterijbesparingsmodel is gebruikt; werkelijke prestaties kunnen per product en installatie verschillen.',
    evNote: 'De EV-invoer telt mee als extra jaarlijkse thuislaadvraag. Er wordt niet aangenomen dat de batterij alle laadpaalstroom levert.',
    heatSavings: 'Warmtepompbijdrage aan gezamenlijke besparing',
    heatReturn: 'Terugverdientijd warmtepomp (apart)',
    heatMethod: 'Jaarlijkse energiekosten voor en na; deze warmtepompbesparing staat apart in het gecombineerde resultaat.',
    heatScopSource: 'Gepubliceerde SCOP-productspecificaties Vaillant aroTHERM pro',
    homeInputs: 'Woning- en dimensioneringsinvoer',
    homeType: 'Woningtype',
    buildPeriod: 'Bouwperiode',
    heatedArea: 'Verwarmd oppervlak',
    totalGasUse: 'Totaal jaarlijks gasverbruik',
    spaceHeatingGas: 'Geschat gas voor ruimteverwarming',
    insulation: 'Isolatie',
    emitters: 'Afgiftesysteem',
    boilerAge: 'Leeftijd cv-ketel',
    heatContract: 'Stroomcontract warmtepomp',
    statedHeatElectricity: 'Opgegeven stroomprijs',
    requiredHeatCapacity: 'Geschat benodigd vermogen',
    recommendedHeatConfig: 'Voorlopig aanbevolen configuratie',
    effectiveHeatElectricity: 'Effectief stroomtarief in berekening',
    dynamicHeatTariffNote: 'Een eventuele tariefaanpassing van 10% voor warmtepompstroom geldt uitsluitend voor de combinatie batterij + warmtepomp met een dynamisch contract; het hierboven getoonde effectieve tarief is in deze schatting gebruikt.',
    heatBefore: 'Voor',
    heatAfter: 'Na',
    heatGasUse: 'Jaarlijks gasverbruik',
    heatElectricityUse: 'Stroomverbruik warmtepomp',
    heatPumpSolarOverlap: 'Geschatte warmtepompstroom tegelijk met zonne-opwek',
    heatPumpSolarBatterySupply: 'Warmtepompstroom uit zonnegeladen batterij',
    heatPumpCheapBatterySupply: 'Warmtepompstroom uit goedkoop geladen batterij',
    heatPumpPowerAfterSolar: 'Resterende netstroomvraag warmtepomp',
    heatFixedCost: 'Vaste gaskosten',
    heatFixedSavings: 'Geschatte besparing vaste gaskosten',
    heatTotalCost: 'Jaarlijkse verwarmings- en gaskosten',
    heatFixedCostNote: 'Besparing op vaste gaskosten geldt alleen als de netbeheerder de gasaansluiting en meter verwijdert. Hybride systemen behouden vaste kosten.',
    heatPriceIncluded: 'Gekozen productprijs (incl. btw, na subsidie)',
    heatWeheatScop: 'WeHeat-SCOP is illustratief en niet geverifieerd als door de fabrikant gepubliceerd cijfer.',
  }
  const fmtProductKwh = (value) => new Intl.NumberFormat(isEnglish ? 'en-NL' : 'nl-NL', { maximumFractionDigits: 1 }).format(value || 0)
  const fmtProductEuro = (value) => `${EUR} ${new Intl.NumberFormat(isEnglish ? 'en-NL' : 'nl-NL', { maximumFractionDigits: 0 }).format(value || 0)}`
  const heatHome = products?.heatPumpROI?.home || {}
  const kWhLbl  = `${fmtProductKwh(kWh)} kWh`
  const localizeModel = (model) => isEnglish ? model : model.replace(/(\d+)\.(?=\d)/g, '$1,')
  const batteryProductLabel = products?.battery
    ? `${products.battery.brand ? `${products.battery.brand} ` : ''}${localizeModel(products.battery.model)}`
    : `${isEnglish ? 'Battery' : 'Batterij'} ${kWhLbl}`
  const productEnergyRows = products ? [
    products.plannedSolar?.selected && { lbl: copy.solar, kWh: products.plannedSolar.annualKwh, price: products.plannedSolar.price, priceLbl: copy.solarPrice },
    products.plannedHeatPump?.selected && {
      lbl: products.plannedHeatPump.model
        ? `${copy.heatPump}: ${products.plannedHeatPump.model.brand} ${products.plannedHeatPump.model.model}`
        : copy.heatPump,
      kWh: products.plannedHeatPump.annualKwh,
      price: products.plannedHeatPump.price,
      priceLbl: copy.heatPumpPrice,
    },
    products.plannedEv?.selected && { lbl: copy.ev, kWh: products.plannedEv.annualKwh, price: products.plannedEv.price, priceLbl: copy.evPrice },
  ].filter(Boolean) : []
  const mndLow  = rv.total_annual_low / 12
  const mndHigh = rv.total_annual_high / 12
  const winst10_low  = rv.ten_year_net_low_eur
  const winst10_high = rv.ten_year_net_high_eur
  const feedInCost = getFeedInCostDetails(
    input,
    rv.export_kwh_zonder ?? rv.t_input ?? 0,
    rv.terugleverkosten_jaar ?? 0,
  )
  const tk = feedInCost.enteredValue ?? 0
  const tkUnit = feedInCost.unit
  const tkJaar = feedInCost.annualCost
  const tkRemaining = getRemainingAnnualFeedInCost(input, rv, tkJaar)
  const tkSaved = Number.isFinite(Number(rv.saved_terugleverkosten))
    ? Math.max(0, Number(rv.saved_terugleverkosten))
    : Math.max(0, tkJaar - tkRemaining)
  const hasFeedInCosts = tk > 0 || tkJaar > 0
  const feedInCostValue = tkUnit === 'kWh' && tk > 0
    ? `${MIN}${EUR} ${fmt(tk, 2)}/kWh`
    : `${MIN}${EUR} ${fmt(tkJaar)}${copy.perYearShort}`
  const feedInCostSub = tkUnit === 'kWh' && tk > 0
    ? `${copy.supplierCharge} · ≈ ${MIN}${EUR} ${fmt(tkJaar)}${copy.perYearShort}`
    : copy.supplierCharge
  const today   = new Date().toLocaleDateString(isEnglish ? 'en-NL' : 'nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  const isDynamic = rv.dynamic_contract === true
  const currentContractIsDynamic = rv.current_dynamic_contract ?? isDynamic
  const showSwitchSavings = !currentContractIsDynamic &&
    isDynamic &&
    rv.switch_to_dynamic_annual_low != null &&
    rv.switch_to_dynamic_annual_high != null
  const switchMonthlyLow = rv.switch_to_dynamic_monthly_low ?? rv.switch_to_dynamic_annual_low / 12
  const switchMonthlyHigh = rv.switch_to_dynamic_monthly_high ?? rv.switch_to_dynamic_annual_high / 12
  const isCombination = products?.mode === 'combination' && Boolean(products?.heatPumpROI)
  const normalizedHeatPumpROI = normalizeHeatPumpROIResult(products?.heatPumpROI)
  const additionalProducts = [
    products?.plannedSolar,
    products?.plannedAirco,
    products?.plannedEv,
  ].filter((product) => product?.selected)
  const additionalProductsModeled =
    !products?.plannedSolar?.selected &&
    !products?.plannedEv?.selected &&
    (!products?.plannedAirco?.selected ||
      getAdditionalAircoGasSavings(products.plannedAirco.savings, normalizedHeatPumpROI) !== null)
  const additionalInvestmentEur = additionalProducts.length > 0 &&
    additionalProducts.every((product) => Number(product.price) > 0)
    ? additionalProducts.reduce((sum, product) => sum + Number(product.price), 0)
    : null
  const additionalGasSavingsEur = products?.plannedAirco?.selected
    ? getAdditionalAircoGasSavings(products.plannedAirco.savings, normalizedHeatPumpROI)
    : 0
  const combinedROI = isCombination
    ? calculateCombinedROI({
        batteryResults: rv,
        batteryWithoutHeatPumpResults: products?.batteryWithoutHeatPumpResults,
        batteryInvestmentEur: price,
        heatPumpROI: normalizedHeatPumpROI,
        additionalInvestmentEur,
        hasAdditionalInvestment: additionalProducts.length > 0,
        additionalProductsModeled,
        additionalGasSavingsEur: additionalGasSavingsEur || 0,
      })
    : null
  const annualLow = isCombination ? combinedROI?.annualLowEur : rv.total_annual_low
  const annualHigh = isCombination ? combinedROI?.annualHighEur : rv.total_annual_high
  const annualMonthlyLow = annualLow == null ? null : annualLow / 12
  const annualMonthlyHigh = annualHigh == null ? null : annualHigh / 12
  const combinedNetLow = combinedROI?.tenYearNetLowEur
  const combinedNetHigh = combinedROI?.tenYearNetHighEur
  const combinedPayback = combinedROI?.paybackLowYears == null || combinedROI?.paybackHighYears == null
    ? (combinedROI?.totalInvestmentEur == null
      ? (isEnglish ? 'Not available' : 'Niet beschikbaar')
      : (isEnglish ? 'No positive savings in both scenarios' : 'Niet in beide scenario’s positieve besparing'))
    : `${fmt(combinedROI.paybackLowYears, 1)} ${DASH} ${fmt(combinedROI.paybackHighYears, 1)} ${copy.years}`
  const batteryPayback = rv.payback_low == null || rv.payback_high == null
    ? (isEnglish ? 'No payback' : 'Geen terugverdientijd')
    : `${fmt(rv.payback_low, 1)} ${DASH} ${fmt(rv.payback_high, 1)} ${copy.years}`

  // Situation tiles
  const situTiles = [
    { lbl: copy.solarGeneration,            val: fmt(rv.pv_input),                unit: isEnglish ? 'kWh/year' : 'kWh/jaar' },
    { lbl: copy.annualConsumption,           val: fmt(rv.v_input),                 unit: isEnglish ? 'kWh/year' : 'kWh/jaar' },
    { lbl: copy.gridExport,          val: fmt(rv.t_input),                 unit: isEnglish ? 'kWh/year' : 'kWh/jaar' },
    { lbl: copy.purchasePrice,            val: `${EUR} ${fmt(rv.pE_used, 2)}`,  unit: 'per kWh' },
    { lbl: copy.feedInTariff,       val: `${EUR} ${fmt(rv.pT_used, 2)}`,  unit: 'per kWh' },
    { lbl: copy.selectedCapacity,     val: kWhLbl,                          unit: products?.battery?.brand || copy.homeBattery },
    { lbl: isCombination ? copy.batteryInvestment : copy.investmentIncludingInstall, val: `${EUR} ${fmt(price)}`, unit: copy.total },
    ...(hasFeedInCosts ? [{
      lbl: copy.feedInCosts,
      val: tkUnit === 'kWh' && tk > 0 ? `${EUR} ${fmt(tk, 2)}` : `${EUR} ${fmt(tkJaar)}`,
      unit: tkUnit === 'kWh' && tk > 0 ? 'per kWh' : copy.perYear,
    }] : []),
  ]
  const situRows = chunkArray(situTiles, 4)

  const ReportHeader = ({ financial = false }) => (
    <>
      <View
        id={financial ? 'financial-report-accent' : 'report-accent'}
        style={s.accentBar}
        fixed
      />
      <View
        id={financial ? 'financial-report-header' : 'report-header'}
        style={s.hdr}
        fixed
      >
        <View>
          <Text style={s.hdrLogo}>SOLAR<Text style={s.hdrAccent}>FAST</Text></Text>
          {!financial && <Text style={s.hdrSub}>{copy.partnerCountry}</Text>}
        </View>
        <View style={s.hdrRight}>
          <Text style={s.hdrLabel}>{financial ? copy.financialOverview : copy.reportLabel}</Text>
          <Text style={s.hdrDate}>{today}</Text>
        </View>
      </View>
    </>
  )

  const HeroKPI = ({ children }) => (
    <View id="report-hero-kpi" style={s.hero} wrap={false}>{children}</View>
  )

  const SituationCards = ({ children }) => (
    <View id="report-situation-cards" style={{ marginBottom: 4 }} wrap={false}>
      {children}
    </View>
  )

  const ProductCards = ({ children }) => (
    <View id="report-product-cards" style={{ marginBottom: 4 }} wrap={false}>
      {children}
    </View>
  )

  const BeforeAfterCards = ({ children }) => (
    <View id="report-before-after-cards" style={{ marginBottom: 4 }} wrap={false}>
      {children}
    </View>
  )

  const FinancialOverview = ({ children }) => (
    <View id="report-financial-overview">{children}</View>
  )

  const ReportFooter = ({ left, right }) => (
    <View id="report-footer" style={s.footer} fixed>
      <Text style={s.fTxt}>{left}</Text>
      <Text
        style={s.fBrand}
        render={({ pageNumber, totalPages }) =>
          `SOLARFAST · ${copy.page} ${pageNumber} ${copy.of} ${totalPages}`}
      />
      <Text style={[s.fTxt, { textAlign: 'right' }]}>{right}</Text>
    </View>
  )

  return (
    <Document
      title={copy.reportTitle}
      author="SolarFast"
      subject={`${batteryProductLabel} ${copy.reportSubject}`}
      onRender={createPdfLayoutLogger('SolarFast energy report', debugLayout)}
    >

      {/* ═══════════════════════════════════════════════════
          PAGINA 1 — Situatie & energieanalyse
      ═══════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page} wrap>

        {/* Header */}
        <ReportHeader />

        {/* Hero */}
        <HeroKPI>
          <View style={s.heroDivider} />
          <Text style={s.heroEye}>{isCombination ? copy.combinedAnnualBenefit : copy.annualBenefit}</Text>
          <Text style={s.heroAmt}>
            {isCombination && !combinedROI ? '—' : `${EUR} ${fmt(annualLow)} ${DASH} ${EUR} ${fmt(annualHigh)}`}
          </Text>
          <Text style={s.heroSub}>
            {isCombination ? copy.combinedBenefitDescription : copy.benefitDescription}
          </Text>
          {isCombination && (
            <Text style={s.heroSub}>
              {combinedROI ? copy.combinedMethod : copy.combinedUnavailable}
            </Text>
          )}
          {!isCombination && Number(input?.battery_kWh) > 0 && (
            <View style={s.heroBadge}>
              <Text style={s.heroBadgeTxt}>
                {copy.currentContract}: {currentContractIsDynamic ? copy.dynamicContract : copy.fixedContract}
                {' · '}
                {copy.batteryScenarioContract}: {isDynamic ? copy.dynamicContract : copy.fixedContract}
              </Text>
            </View>
          )}
          {!isCombination && isDynamic && !currentContractIsDynamic && (
            <Text style={s.heroSub}>{copy.batteryDynamicNote}</Text>
          )}
          <View style={s.heroBoxRow}>
            {(isCombination ? [
              { lbl: copy.perMonth, val: combinedROI ? `${EUR} ${fmt(annualMonthlyLow, 2)} ${DASH} ${fmt(annualMonthlyHigh, 2)}` : '—' },
              { lbl: copy.combinedInvestment, val: combinedROI?.totalInvestmentEur == null ? '—' : `${EUR} ${fmt(combinedROI.totalInvestmentEur)}` },
              { lbl: copy.payback, val: combinedPayback },
              { lbl: copy.netAfter10, val: combinedNetLow == null || combinedNetHigh == null ? '—' : `${EUR} ${fmt(combinedNetLow)} ${DASH} ${EUR} ${fmt(combinedNetHigh)}` },
            ] : [
              { lbl: copy.perMonth,        val: `${EUR} ${fmt(mndLow, 2)} ${DASH} ${fmt(mndHigh, 2)}` },
              { lbl: copy.payback, val: batteryPayback },
              { lbl: copy.netAfter10, val: `${EUR} ${fmt(winst10_low)} ${DASH} ${EUR} ${fmt(winst10_high)}` },
              { lbl: copy.perDay,          val: `${EUR} ${fmt(rv.total_daily_low, 2)} ${DASH} ${fmt(rv.total_daily_high, 2)}` },
            ]).map((b, i) => (
              <View key={i} style={s.heroBox}>
                <Text style={s.heroBoxLbl}>{b.lbl}</Text>
                <Text style={s.heroBoxVal}>{b.val}</Text>
              </View>
            ))}
          </View>
        </HeroKPI>

        {/* Body */}
        <View style={s.body}>

          {/* Uw situatie — explicit 4-col rows */}
          <SituationCards>
          <Text style={s.eye}>{copy.yourSituation}</Text>
          {situRows.map((row, ri) => (
            <View key={ri} style={[s.situRow, ri === situRows.length - 1 ? { marginBottom: 12 } : {}]} wrap={false}>
              {row.map((item, ci) => (
                <View key={ci} style={s.situItem} wrap={false}>
                  <Text style={s.situLbl}>{item.lbl}</Text>
                  <Text style={s.situVal}>{item.val}</Text>
                  <Text style={s.situUnit}>{item.unit}</Text>
                </View>
              ))}
              {/* Fill empty cells in last row */}
              {row.length < 4 && Array.from({ length: 4 - row.length }).map((_, i) => (
                <View key={`empty-${i}`} style={{ width: COL4 }} />
              ))}
            </View>
          ))}
          </SituationCards>

          {products && (
            <ProductCards>
            <>
              <Text style={s.eye}>{copy.scenarioTitle.toLocaleUpperCase(isEnglish ? 'en-NL' : 'nl-NL')}</Text>
              <View style={[s.twoCol, { marginBottom: 18 }]} wrap={false}>
                <View id="selected-product-card" style={[s.card, { padding: 10 }]} wrap={false}>
                  <DR
                    lbl={copy.battery}
                    val={`${batteryProductLabel}${products.battery?.phase ? ` · ${products.battery.phase === '1-phase' ? copy.phase1 : copy.phase3}` : ''}`}
                  />
                  <DR lbl={copy.batteryInvestment} val={fmtProductEuro(price)} />
                  {productEnergyRows.map((row, index) => (
                    <DR
                      key={`planned-${index}`}
                      lbl={row.lbl}
                      val={`+${fmtProductKwh(row.kWh)} kWh/${isEnglish ? 'year' : 'jaar'}${row.price > 0 ? ` · ${fmtProductEuro(row.price)}` : ''}`}
                    />
                  ))}
                  {products.addOnInvestment > 0 && <DR lbl={copy.addOnInvestment} val={fmtProductEuro(products.addOnInvestment)} />}
                   {products.heatPumpROI && (() => {
                     const hp = normalizedHeatPumpROI
                     const isWeHeat = String(hp.model?.brand || '').toLowerCase().includes('weheat')
                     const hpElectricityKwh = Number(hp.annualHeatPumpElectricityKwh || 0)
                     const solarOverlapRaw = products?.energy?.heatPumpSolarOverlapKwh
                     const solarOverlapKwh = solarOverlapRaw == null || !Number.isFinite(Number(solarOverlapRaw))
                       ? null
                       : Number(solarOverlapRaw)
                     const heatPumpEnergySplit = solarOverlapKwh == null
                       ? null
                       : splitHeatPumpElectricity({
                           annualKwh: hpElectricityKwh,
                           solarOverlapKwh,
                            solarBatterySupplyKwh: rv?.sc_battery_kwh,
                            cheapBatterySupplyKwh: rv?.epex_home_delivery_kwh,
                         })
                     const gasStandingCost = Math.max(0, Number(hp.gasStandingCostBeforeEur) || 0)
                     const gasRemoved = hp.model?.config === 'all-electric' &&
                       hp.gasConnectionRemoved === true &&
                       Number(hp.annualGasRemainingM3) === 0
                     const gasStandingSavings = gasRemoved ? gasStandingCost : 0
                     const afterHeatPumpCost = calculateHeatPumpAnnualCostAfterBattery({
                       standaloneAnnualCostEur: Number(hp.afterAnnualCostEur || 0) +
                         (Number(hp.gasStandingSavingsEur) || 0) - gasStandingSavings,
                       heatPumpElectricityPriceEurPerKwh: hp.electricPricePerKwh,
                        heatPumpSolarBatteryKwh: heatPumpEnergySplit?.solarBatteryKwh,
                        solarBatteryOpportunityPriceEurPerKwh: rv?.pT_used,
                        heatPumpBatteryKwh: heatPumpEnergySplit?.cheapBatteryKwh,
                       totalEpexHomeDeliveryKwh: rv?.epex_home_delivery_kwh,
                       totalEpexHomeChargeCostEur: rv?.epex_home_charge_cost_eur,
                     })
                     return (
                       <>
                         <View style={s.heatCompareHeader}>
                           <Text style={s.heatCompareLabel} />
                           <Text style={s.heatCompareHead}>{copy.heatBefore}</Text>
                           <Text style={s.heatCompareHead}>{copy.heatAfter}</Text>
                         </View>
                         <HeatCompareRow
                           lbl={copy.heatGasUse}
                           before={`${fmtProductKwh(hp.annualGasBeforeM3)} m³/${isEnglish ? 'year' : 'jaar'}`}
                           after={`${fmtProductKwh(hp.annualGasRemainingM3)} m³/${isEnglish ? 'year' : 'jaar'}`}
                         />
                         <HeatCompareRow
                           lbl={copy.heatElectricityUse}
                           before={`0 kWh/${isEnglish ? 'year' : 'jaar'}`}
                           after={`${fmtProductKwh(hpElectricityKwh)} kWh/${isEnglish ? 'year' : 'jaar'}`}
                         />
                         <HeatCompareRow
                           lbl={copy.heatPumpSolarOverlap}
                           before="—"
                           after={heatPumpEnergySplit == null ? '—' : `${fmtProductKwh(heatPumpEnergySplit.solarKwh)} kWh/${isEnglish ? 'year' : 'jaar'}`}
                         />
                         <HeatCompareRow
                            lbl={copy.heatPumpSolarBatterySupply}
                           before="—"
                            after={heatPumpEnergySplit == null ? '—' : `${fmtProductKwh(heatPumpEnergySplit.solarBatteryKwh)} kWh/${isEnglish ? 'year' : 'jaar'}`}
                          />
                          <HeatCompareRow
                            lbl={copy.heatPumpCheapBatterySupply}
                            before="—"
                            after={heatPumpEnergySplit == null ? '—' : `${fmtProductKwh(heatPumpEnergySplit.cheapBatteryKwh)} kWh/${isEnglish ? 'year' : 'jaar'}`}
                         />
                         <HeatCompareRow
                           lbl={copy.heatPumpPowerAfterSolar}
                           before="—"
                           after={heatPumpEnergySplit == null ? '—' : `${fmtProductKwh(heatPumpEnergySplit.gridKwh)} kWh/${isEnglish ? 'year' : 'jaar'}`}
                         />
                         <HeatCompareRow
                           lbl={copy.heatFixedCost}
                           before={fmtProductEuro(gasStandingCost)}
                           after={fmtProductEuro(gasStandingCost - gasStandingSavings)}
                         />
                         <HeatCompareRow
                           lbl={copy.heatFixedSavings}
                           before="—"
                           after={fmtProductEuro(gasStandingSavings)}
                         />
                         <HeatCompareRow
                           lbl={copy.heatTotalCost}
                           before={fmtProductEuro(hp.beforeAnnualCostEur)}
                           after={fmtProductEuro(afterHeatPumpCost)}
                           strong
                         />
                         <DR lbl={copy.heatPriceIncluded} val={hp.investmentEur == null ? '—' : fmtProductEuro(hp.investmentEur)} />
                         <DR lbl={copy.heatReturn} val={hp.paybackYears == null ? '—' : `${fmtProductKwh(hp.paybackYears)} ${copy.years}`} />
                         <Text style={s.drSub}>{copy.heatFixedCostNote}</Text>
                         <Text style={s.drSub}>{isWeHeat ? copy.heatWeheatScop : copy.heatMethod}</Text>
                         {!isWeHeat && String(hp.model?.brand || '').toLowerCase().includes('vaillant') && (
                           <Link src="https://www.vaillant.nl/producten/arothermpro" style={s.drSub}>{copy.heatScopSource}</Link>
                         )}
                         {isCombination && (
                           <>
                             {hp.model?.config === 'hybrid' && (
                               <Link src="https://www.rvo.nl/nieuws/warmtepompen-verlagen-energieverbruik" style={s.drSub}>{copy.gasHeatingSource}</Link>
                             )}
                             {heatHome.contractType === 'dynamic' && <Text style={s.drSub}>{copy.dynamicHeatTariffNote}</Text>}
                           </>
                         )}
                       </>
                     )
                   })()}
                </View>
                <View id="planned-energy-card" style={[s.card, { padding: 10 }]} wrap={false}>
                  {products.energy?.hasPlannedChanges ? (
                    <>
                      <View style={{ paddingVertical: 6 }}>
                        <Text style={s.drLbl}>{copy.annualValues}</Text>
                        <Text style={[s.drVal, { textAlign: 'left', marginTop: 4, lineHeight: 1.35 }]}>
                          {fmtProductKwh(products.energy.projectedSolarKwh)} {copy.production}
                          {' · '}{fmtProductKwh(products.energy.projectedConsumptionKwh)} {copy.consumption}
                          {' · '}{fmtProductKwh(products.energy.projectedExportKwh)} {copy.export}
                        </Text>
                        <Text style={s.drSub}>
                          {products.energy.forecastWasAdjusted
                            ? copy.forecastAdjusted
                            : products.energy.exportMethod === 'user-forecast' ? copy.forecast : copy.estimated}
                        </Text>
                      </View>
                      {products.plannedEv?.selected && <Text style={s.drSub}>{copy.evNote}</Text>}
                    </>
                  ) : (
                    <DR lbl={copy.annualValues} val={isEnglish ? 'Current annual inputs' : 'Huidige jaarinvoer'} />
                  )}
                  {products.battery?.brand !== 'HYXiPower' && (
                    <Text style={[s.drSub, { marginTop: 8 }]}>{copy.otherBrandNote}</Text>
                  )}
                </View>
              </View>
            </>
            </ProductCards>
          )}

          {/* Energieanalyse */}
          <BeforeAfterCards>
          <Text style={s.eye}>{isCombination ? `${copy.batterySpecific} · ${copy.energyAnalysis}` : copy.energyAnalysis}</Text>
          <View style={s.twoCol} wrap={false}>

            {/* Zonder batterij */}
            <View id="before-energy-card" style={s.card} wrap={false}>
              <Text style={s.cardEye}>{copy.currentSituation}</Text>
              <Text style={s.cardTitle}>{copy.withoutBattery}</Text>
              <DR lbl={copy.solarGeneration}           val={`${fmt(rv.pv_input)} kWh`}            sub={copy.totalAnnualGeneration} />
              <DR lbl={copy.directSelfConsumption}   val={`${fmt(rv.sc_direct_kwh)} kWh`}        sub={`${fmt(rv.sc_pct_zonder, 0)}${copy.percentOfConsumption}`} />
              <DR lbl={copy.selfSufficiency} val={`${fmt(rv.self_sufficiency_before_pct ?? 0, 0)}%`} />
              <DR lbl={copy.returnedToGrid} val={`${fmt(rv.export_kwh_zonder)} kWh`}    sub={copy.unusedSurplus} r />
              <DR lbl={copy.gridPurchase}        val={`${fmt(rv.grid_import_without)} kWh`}  sub={copy.fullRatePaid} r />
              {hasFeedInCosts && <DR lbl={copy.feedInCosts} val={feedInCostValue} sub={feedInCostSub} r />}
            </View>

            {/* Met batterij */}
            <View id="after-energy-card" style={s.cardGreen} wrap={false}>
              <Text style={s.cardEyeGreen}>{products?.battery?.brand ? `${isEnglish ? 'WITH' : 'MET'} ${products.battery.brand.toUpperCase()}` : copy.withBattery}</Text>
              <Text style={s.cardTitleDark}>{copy.withBatteryTitle}</Text>
              <DR style={s.drG} lbl={copy.solarGeneration}           val={`${fmt(rv.pv_input)} kWh`}                 sub={copy.sameAsCurrent} />
              <DR style={s.drG} lbl={copy.totalSelfConsumption}   val={`${fmt(rv.totalSelfConsumption)} kWh`}     sub={`${fmt(rv.sc_direct_kwh)} ${copy.direct} + ${fmt(rv.batterySelfConsumption)} ${copy.batteryShort}`} g />
              <DR style={s.drG} lbl={copy.selfSufficiency} val={`${fmt(rv.self_sufficiency_after_pct ?? 0, 0)}%`} g />
              <DR style={s.drG} lbl={copy.batteryThroughput} val={`${fmt(rv.battery_actual_discharge_kwh ?? rv.battery_throughput_kwh ?? 0)} kWh/${isEnglish ? 'year' : 'jaar'}`} sub={copy.batteryThroughputSub(fmt(rv.battery_home_delivery_kwh ?? rv.sc_battery_kwh ?? 0), fmt(rv.battery_trading_discharge_kwh ?? rv.epex_throughput_kwh ?? 0))} g />
              <DR style={s.drG} lbl={copy.batteryFlowLabel} val={`${fmt(rv.battery_total_charge_kwh ?? 0)} / ${fmt(rv.battery_total_loss_kwh ?? 0)} kWh`} sub={copy.batteryFlowSub} />
              <DR style={s.drG} lbl={copy.stillExported}     val={`${fmt(rv.export_kwh_with)} kWh`}          sub={`${fmt(rv.export_kwh_zonder - rv.export_kwh_with)} ${copy.usedInsteadOfExported}`} />
              <DR style={s.drG} lbl={copy.gridPurchase}        val={`${fmt(rv.grid_import_with)} kWh`}         sub={`${fmt(rv.grid_import_besparing_kwh)} ${copy.lessPurchasedFromGrid}`} g />
              {hasFeedInCosts && <DR style={s.drG} lbl={copy.feedInCosts} val={`${MIN}${EUR} ${fmt(tkRemaining, 2)}${copy.perYearShort}`} sub={copy.supplierCharge} r />}
              <DR style={s.drG} lbl={copy.energySavings}      val={`+${EUR} ${fmt(rv.net_energy_saving_eur)}${copy.perYearShort}`} sub={copy.netSelfConsumptionExclEpex} g />
              <DR
                style={s.drG}
                lbl={copy.emsMarketOptimisation}
                val={`+${EUR} ${fmt(rv.smart_annual_low)}${DASH}${EUR}${fmt(rv.smart_annual_high)}${copy.perYearShort}`}
                sub={`${copy.perMonth}: ${EUR}${fmt(rv.smart_monthly_low ?? (rv.smart_annual_low || 0) / 12, 2)}${DASH}${EUR}${fmt(rv.smart_monthly_high ?? (rv.smart_annual_high || 0) / 12, 2)} · ${isDynamic ? `${copy.epexArbitrage} · ${copy.epexThroughput(fmt(rv.epex_throughput_low_kwh ?? rv.epex_throughput_kwh ?? 0), fmt(rv.epex_throughput_high_kwh ?? rv.epex_throughput_kwh ?? 0))}` : copy.epexInactive}`}
                g
              />
            </View>
          </View>
          </BeforeAfterCards>
        </View>

        {/* Footer P1 */}
        <ReportFooter left={copy.footerContact} right={copy.indicativeNonBinding} />
      </Page>

      {/* ═══════════════════════════════════════════════════
          PAGINA 2 — Financieel overzicht
      ═══════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page} wrap>

        {/* Header */}
        <ReportHeader financial />

        <FinancialOverview>
        <View style={[s.body, { paddingTop: isCombination ? 16 : 22, paddingBottom: 0 }]}>
          <View style={[s.twoCol, { alignItems: 'stretch' }]} wrap={false}>

            {/* LEFT — financial table */}
            <View id="financial-calculation-card" style={[s.card, { flex: 55 }]} wrap={false}>
              <Text style={s.cardEye}>{copy.financialOverview.toLocaleUpperCase(isEnglish ? 'en-NL' : 'nl-NL')}</Text>
              <Text style={[s.cardTitle, { marginBottom: 10 }]}>{isCombination ? copy.batterySpecificHeadline : copy.fullCalculation}</Text>

              {[
                {
                  lbl: copy.step1,
                  sub: `${fmt(rv.grid_import_besparing_kwh)} ${copy.avoidedGridPurchase} ${MIN} ${copy.missedExportRevenue}${tkSaved > 0 ? ` + ${EUR}${fmt(tkSaved, 2)} ${copy.feedInCostSuffix}` : ''}`,
                  val: `+${EUR} ${fmt(rv.net_energy_saving_eur)}`, col: 'g',
                },
                {
                  lbl: copy.step2,
                  sub: rv.smart_monthly_high
                     ? `${copy.perMonth}: ${EUR}${fmt(rv.smart_monthly_low ?? rv.smart_annual_low / 12, 2)}${DASH}${EUR}${fmt(rv.smart_monthly_high, 2)} · ${copy.tradingBenefit}`
                     : copy.epexInactive,
                  val: `+${EUR} ${fmt(rv.smart_annual_low)} ${DASH} ${EUR} ${fmt(rv.smart_annual_high)}${copy.perYearShort}`, col: 'g',
                },
                {
                  lbl: copy.step3,
                  sub: `${copy.informativeForecastBase} · CBS +5%${copy.perYearShort}`,
                  val: `${EUR} ${fmt(rv.escalation_eur_low)} ${DASH} ${EUR} ${fmt(rv.escalation_eur_high)}`,
                },
                ...(rv.sald_protection_eur != null ? [{
                  lbl: copy.step4,
                  sub: `${copy.informativeForecastBase} · ${copy.phaseOut}`,
                  val: `${EUR} ${fmt(rv.sald_protection_eur)}`,
                }] : []),
                ...((rv.garantie_bonus || 0) > 0 ? [{
                  lbl: copy.step5,
                  sub: copy.basedOnCapacity,
                  val: `+${EUR} ${fmt(rv.garantie_bonus)}`, col: 'g',
                }] : []),
                ].map((row, i) => (
                <View key={i} style={[s.tr, isCombination && { paddingVertical: 5 }]}>
                  <View style={s.trLeft}>
                    <Text style={row.bold ? s.trLblB : s.trLbl}>{row.lbl}</Text>
                    {row.sub ? <Text style={s.trSub}>{row.sub}</Text> : null}
                  </View>
                  <Text style={
                    row.col === 'g' ? s.trValG :
                    row.col === 'r' ? s.trValR :
                    row.bold        ? { fontSize: 10, fontFamily: 'Helvetica-Bold', color: TEXT, textAlign: 'right' } :
                    s.trVal
                  }>{row.val}</Text>
                </View>
              ))}

              {/* Total */}
              {isCombination && (
                <>
                  <View style={[s.tr, { paddingVertical: 5 }]}>
                    <View style={s.trLeft}><Text style={s.trLbl}>{copy.batteryContribution}</Text></View>
                    <Text style={s.trVal}>{combinedROI ? `${EUR} ${fmt(combinedROI.baselineAnnualCostEur)}${copy.perYearShort}` : '—'}</Text>
                  </View>
                  <View style={[s.tr, { paddingVertical: 5 }]}>
                    <View style={s.trLeft}><Text style={s.trLbl}>{copy.heatContribution}</Text></View>
                    <Text style={s.trVal}>{combinedROI ? `${EUR} ${fmt(combinedROI.combinedAnnualCostBeforeEpexEur)}${copy.perYearShort}` : '—'}</Text>
                  </View>
                  <View style={[s.tr, { paddingVertical: 5 }]}>
                    <View style={s.trLeft}><Text style={s.trLbl}>{copy.epexContribution}</Text></View>
                    <Text style={s.trValG}>{combinedROI ? `${EUR} ${fmt(combinedROI.epexAnnualLowEur)} ${DASH} ${EUR} ${fmt(combinedROI.epexAnnualHighEur)}${copy.perYearShort}` : '—'}</Text>
                  </View>
                  <View style={[s.tr, { paddingVertical: 5 }]}>
                    <View style={s.trLeft}><Text style={s.trLbl}>{copy.batteryInvestment}</Text></View>
                    <Text style={s.trVal}>{combinedROI ? `${EUR} ${fmt(combinedROI.batteryInvestmentEur)}` : '—'}</Text>
                  </View>
                  <View style={[s.tr, { paddingVertical: 5 }]}>
                    <View style={s.trLeft}><Text style={s.trLbl}>{copy.heatPumpPrice}</Text></View>
                    <Text style={s.trVal}>{combinedROI?.heatInvestmentEur == null ? '—' : `${EUR} ${fmt(combinedROI.heatInvestmentEur)}`}</Text>
                  </View>
                </>
              )}
              <View style={s.totRow}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                  <Text style={s.totLbl}>{copy.totalAnnualBenefit}</Text>
                  <Text style={s.totSub}>
                    {isCombination
                      ? `${copy.battery} + ${copy.heatPumpPrice} · ${copy.combinedInvestment}: ${combinedROI?.totalInvestmentEur == null ? '—' : `${EUR} ${fmt(combinedROI.totalInvestmentEur)}`}`
                      : `${batteryProductLabel} ${DASH} ${copy.investment} ${EUR} ${fmt(price)}`}
                  </Text>
                </View>
                <Text style={isCombination ? [s.totVal, { fontSize: 14, flexShrink: 1, textAlign: 'right', marginRight: 3 }] : s.totVal}>
                  {isCombination && !combinedROI ? '—' : `${EUR} ${fmt(annualLow)} ${DASH} ${fmt(annualHigh)}${copy.perYearShort}`}
                </Text>
              </View>

              {/* ROI boxes */}
              <View style={s.roiRow}>
                {[
                  { lbl: copy.payback, val: isCombination ? combinedPayback : batteryPayback },
                  { lbl: copy.netAfter10, val: isCombination
                    ? (combinedNetLow == null || combinedNetHigh == null ? '—' : `${EUR} ${fmt(combinedNetLow)} ${DASH} ${EUR} ${fmt(combinedNetHigh)}`)
                    : `${EUR} ${fmt(winst10_low)} ${DASH} ${EUR} ${fmt(winst10_high)}` },
                  { lbl: copy.benefitPerMonth, val: isCombination ? (combinedROI ? `${EUR} ${fmt(annualMonthlyLow, 2)}${DASH}${fmt(annualMonthlyHigh, 2)}` : '—') : `${EUR} ${fmt(mndLow, 2)}${DASH}${fmt(mndHigh, 2)}` },
                ].map((b, i) => (
                  <View key={i} style={s.roiBox}>
                    <Text style={s.roiLbl}>{b.lbl}</Text>
                    <Text style={s.roiVal}>{b.val}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* RIGHT */}
              <View id="financial-summary-column" style={{ flex: 39, minWidth: 0, gap: 12 }} wrap={false}>

              {/* Key stats recap */}
              <View
                id="financial-summary-card"
                style={[s.card, { backgroundColor: DARK, borderColor: DARK, flexGrow: 0, flexShrink: 0, flexBasis: 'auto' }]}
                wrap={false}
              >
                <Text style={[s.cardEye, { color: 'rgba(255,255,255,0.35)' }]}>{copy.summary}</Text>
                <Text style={[s.cardTitle, { color: WHITE, marginBottom: 14, fontSize: 9, width: '100%', minWidth: 0, lineHeight: 1.25 }]}>
                  {isCombination ? `${copy.batterySpecific}: ${batteryProductLabel}` : batteryProductLabel}
                </Text>
                {[
                  { lbl: copy.currentContract, val: currentContractIsDynamic ? copy.dynamicContract : copy.fixedContract },
                  { lbl: copy.batteryScenarioContract, val: isDynamic ? copy.dynamicContract : copy.fixedContract },
                  ...(showSwitchSavings ? [
                    {
                      lbl: copy.switchToDynamicLabel,
                      val: `${EUR}${fmt(rv.switch_to_dynamic_annual_low)}${DASH}${EUR}${fmt(rv.switch_to_dynamic_annual_high)}/yr`,
                    },
                    {
                      lbl: copy.switchToDynamicMonthly,
                      val: `${EUR}${fmt(switchMonthlyLow, 2)}${DASH}${EUR}${fmt(switchMonthlyHigh, 2)}/month`,
                    },
                  ] : []),
                  { lbl: copy.currentSelfConsumption, val: `${fmt(rv.sc_pct_zonder, 0)}%` },
                  { lbl: copy.batterySelfConsumption, val: `${fmt(rv.sc_pct_met, 0)}%` },
                  { lbl: copy.selfSufficiency, val: `${fmt(rv.self_sufficiency_after_pct ?? 0, 0)}%` },
                  { lbl: copy.avoidedPurchases, val: `${fmt(rv.grid_import_besparing_kwh)} kWh${copy.perYearShort}` },
                ].map((row, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 5,
                    paddingVertical: 6, paddingRight: 6,
                    borderBottomWidth: 1, borderBottomColor: '#303943',
                  }}>
                    <Text style={{ width: '49%', minWidth: 0, paddingRight: 4, fontSize: 7.5, color: 'rgba(255,255,255,0.40)', lineHeight: 1.2 }}>{row.lbl}</Text>
                    <Text style={{ width: '43%', minWidth: 0, flexShrink: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'right', lineHeight: 1.2 }}>{row.val}</Text>
                  </View>
                ))}
              </View>

              {/* Warmtefonds */}
              <View
                id="national-heat-fund-card"
                style={[s.card, { backgroundColor: G_LIGHT, borderColor: G_BDR, flexGrow: 0, flexShrink: 0, flexBasis: 'auto' }]}
                wrap={false}
              >
                <Text style={s.cardEyeGreen}>{copy.nationalHeatFund}</Text>
                <Text style={[s.cardTitle, { color: DARK, marginBottom: 12, fontSize: 10.5 }]}>{copy.possibleZeroInterest}</Text>
                {[
                  copy.heatFundLoan,
                  copy.heatFundIncome,
                  copy.termUpTo,
                  copy.applicationArranged,
                ].map((txt, i) => (
                  <View key={i} style={s.bRow}>
                    <View style={s.bDot} />
                    <Text style={s.bTxt}>{txt}</Text>
                  </View>
                ))}
              </View>

            </View>
          </View>

          {/* Contact bar */}
          <View style={s.cBar} wrap={false}>
            <View style={{ width: '30%', minWidth: 0 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 4 }}>
                SOLAR<Text style={s.hdrAccent}>FAST</Text>
              </Text>
              <Text style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.35)' }}>
                {copy.partnerCountry}
              </Text>
            </View>
            <View style={{ width: '32%', alignItems: 'center', minWidth: 0 }}>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE }}>info@solarfast.nl</Text>
              <Text style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>www.solarfast.nl</Text>
            </View>
            <View style={{ width: '30%', alignItems: 'flex-end', minWidth: 0 }}>
              <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: 'rgba(255,255,255,0.75)' }}>
                {copy.separateQuote}
              </Text>
              <Text style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.30)', marginTop: 3 }}>
                {copy.brochureProvided}
              </Text>
            </View>
          </View>
        </View>
        </FinancialOverview>

        {/* Footer P2 */}
        <ReportFooter left={copy.epexModelDisclaimer} right={copy.actualResultsMayVary} />
      </Page>

    </Document>
  )
}
