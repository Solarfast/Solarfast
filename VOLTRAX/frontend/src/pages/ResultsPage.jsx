import React, { useEffect, useState, useRef } from 'react'
import { motion, useInView, useReducedMotion, animate, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ChevronLeft, Battery, ArrowRight, CheckCircle2,
  ChevronDown, Download, Leaf,
  Zap, Clock, Euro
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { trackEvent } from '../lib/analytics.js'
import { HeatPumpResults } from '../components/heatPump/HeatPumpResults.jsx'
import { CombinedResults } from '../components/heatPump/CombinedResults.jsx'
import { WarmtefondsFinancing } from '../components/WarmtefondsFinancing.jsx'
import {
  calculateBatterySolarPackageROI,
  calculateCombinedROI,
  getAdditionalAircoGasSavings,
} from '../lib/combinedROI.js'
import { getBatteryTenYearNet } from '../lib/batteryProjection.js'
import { buildEnergyScenario } from '../lib/energyScenario'
import {
  AIRCO_WATTS_PER_M2,
  estimateAircoAnnualElectricity,
  getSmallestSingleSplitOptions,
} from '../lib/aircoSizing.js'
import { calculateAircoSavings, calculateSolarSavings } from '../lib/productSavings.js'
import {
  CALCULATION_RESULTS_VERSION,
  shouldRefreshSavedBatteryResult,
} from '../lib/calculationVersion'
import {
  getFeedInCostDetails,
  getRemainingAnnualFeedInCost,
} from '../lib/feedInCosts.js'
import './SolarFastMarketing.css'

function fmt(n, d = 0) {
  return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)
}
const ease = [0.22, 1, 0.36, 1]
const RESULTS_MODEL_VERSION_KEY = 'voltrax_results_model_version'
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease } }),
}

function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduceMotion = useReducedMotion()
  const Tag = motion[as] || motion.div
  return (
    <Tag ref={ref} variants={fadeUp} custom={delay}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion || inView ? 'visible' : 'hidden'}
      className={className}>
      {children}
    </Tag>
  )
}

function AnimatedNumber({ to, prefix = '', suffix = '', decimals = 0, className = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const reduceMotion = useReducedMotion()
  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      setVal(decimals > 0 ? parseFloat(to.toFixed(decimals)) : Math.floor(to))
      return undefined
    }
    const ctrl = animate(0, to, {
      duration: 1.6, ease,
      onUpdate: v => setVal(decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.floor(v)),
    })
    return ctrl.stop
  }, [inView, to, decimals, reduceMotion])
  return <span ref={ref} className={className}>{prefix}{fmt(val, decimals)}{suffix}</span>
}

function CollapseCard({ trigger, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="sf-results-card overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="sf-results-card-header w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left hover:bg-black/[0.02] transition-colors"
      >
        {trigger}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }} className="flex-shrink-0">
          <ChevronDown className="w-4 h-4 text-black/40" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-black/[0.07]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function savedBaselineInput(savedInput, savedProducts) {
  if (savedProducts?.batteryWithoutHeatPumpInput) {
    return savedProducts.batteryWithoutHeatPumpInput
  }

  try {
    const form = JSON.parse(sessionStorage.getItem('voltrax_form') || 'null')
    if (!form?.planned_heat_pump) return null

    const baselineScenario = buildEnergyScenario({
      solarProduction: form.zonneproductie,
      annualConsumption: form.jaarverbruik,
      gridExport: form.teruglevering,
      plannedSolarKwh: form.planned_solar ? form.planned_solar_kwh : 0,
      plannedHeatPumpKwh: 0,
      plannedHeatPumpSpaceHeatingKwh: 0,
      plannedHeatPumpHotWaterKwh: 0,
      plannedEvKwh: form.planned_ev ? form.planned_ev_kwh : 0,
      projectedGridExport: null,
    })

    return {
      ...savedInput,
      zonneproductie: baselineScenario.projectedSolarKwh,
      jaarverbruik: baselineScenario.projectedConsumptionKwh,
      teruglevering: baselineScenario.calculationGridExportKwh,
      epex_home_use_kwh: 0,
    }
  } catch {
    return null
  }
}

function getBatteryHomeKwh(result) {
  const delivered = Number(result?.battery_home_delivery_kwh)
  if (Number.isFinite(delivered) && delivered >= 0) return delivered
  const primary = Number(result?.sc_battery_kwh)
  if (Number.isFinite(primary) && primary > 0) return primary
  const legacy = [result?.batterySelfConsumption, result?.bat_shift_kwh]
    .map(Number)
    .find((value) => Number.isFinite(value) && value > 0)
  if (legacy != null) return legacy
  const solarCharge = Number(result?.solar_battery_charge_kwh)
  const solarLoss = Number(result?.solar_battery_loss_kwh)
  return Number.isFinite(solarCharge - solarLoss) && solarCharge > solarLoss
    ? solarCharge - solarLoss
    : 0
}

function BeforeAfter({ r, res, input, lang, returnSummary, showReturnSummary = true }) {
  const currentContractIsDynamic = r.current_dynamic_contract ?? r.dynamic_contract ?? false
  const exportZonder = r.export_kwh_zonder ?? r.t_input ?? 0
  const feedInCost = getFeedInCostDetails(input, exportZonder, r.terugleverkosten_jaar ?? 0)
  const tkJaar = feedInCost.annualCost
  const compensationInput = Number.parseFloat(String(input?.terugleververgoeding_value ?? '').replace(',', '.'))
  const compensationUnit = input?.terugleververgoeding_unit === 'jaar' ? 'jaar' : 'kWh'
  const compensationInputText = Number.isFinite(compensationInput) && compensationInput > 0
    ? `€ ${fmt(compensationInput, 2)}/${compensationUnit}`
    : ''
  const tkRemaining = r.current_fixed_feed_in_cost_removed
    ? 0
    : getRemainingAnnualFeedInCost(input, r, tkJaar)
  const nl = lang === 'nl'
  const yearUnit = nl ? 'kWh/jaar' : 'kWh/year'
  const yearlyKwh = (value) => value == null || !Number.isFinite(Number(value))
    ? '—'
    : `${fmt(value, Number(value) > 0 && Number(value) < 10 ? 1 : 0)} ${yearUnit}`
  const yearlyEuro = (value) => value == null || !Number.isFinite(Number(value))
    ? '—'
    : `€ ${fmt(value, 0)}${res.moneyPerYearUnit}`
  const percent = (value) => value == null || !Number.isFinite(Number(value))
    ? '—'
    : `${fmt(value, Number(value) >= 99.5 ? 2 : 0)}%`
  const annualSolar = r.pv_input ?? input?.zonneproductie
  const selfUsedInsteadOfExport = r.export_shift_kwh
  const annualUse = Number(r.v_input ?? input?.jaarverbruik)
  const batteryHomeKwh = getBatteryHomeKwh(r)
  const batteryTotalDischargeKwh = Number(r.battery_actual_discharge_kwh ?? r.battery_throughput_kwh) || 0
  const batteryTradingKwh = Number(r.battery_trading_discharge_kwh ?? r.epex_throughput_kwh) || 0
  const directSolarKwh = Number(r.sc_direct_kwh) || 0
  const totalSolarToHomeKwh = directSolarKwh + batteryHomeKwh
  const selfUseBeforePct = Number(annualSolar) > 0 ? directSolarKwh / Number(annualSolar) * 100 : Number(r.sc_pct_zonder)
  const selfUseAfterPct = Number(annualSolar) > 0 ? totalSolarToHomeKwh / Number(annualSolar) * 100 : Number(r.sc_pct_met)
  const selfSufficiencyBefore = Number.isFinite(annualUse) && annualUse > 0
    ? directSolarKwh / annualUse * 100
    : r.self_sufficiency_before_pct
  const selfSufficiencyAfter = Number.isFinite(annualUse) && annualUse > 0
    ? totalSolarToHomeKwh / annualUse * 100
    : r.self_sufficiency_after_pct
  const gridImportReduction = Number(r.grid_import_without) - Number(r.grid_import_with)
  const epexIsActive = r.dynamic_contract === true &&
    r.epex_optimization_supported === true &&
    r.smart_annual_low != null && r.smart_annual_high != null
  const epexValue = epexIsActive
    ? `€ ${fmt(r.smart_annual_low, 0)}–€ ${fmt(r.smart_annual_high, 0)}${res.moneyPerYearUnit}`
    : (r.dynamic_contract === true
      ? (nl ? 'Niet meegerekend: aansturing niet bevestigd' : 'Not included: control service not confirmed')
      : (nl ? 'Niet actief zonder batterij' : 'Not active without a battery'))
  const afterContract = r.dynamic_contract
    ? (nl ? 'Dynamisch contract + batterij' : 'Dynamic tariff + battery')
    : (nl ? 'Vast contract + batterij' : 'Fixed tariff + battery')
  const feedInBefore = yearlyEuro(tkJaar)
  const feedInAfter = yearlyEuro(tkRemaining)
  const exportCompensationBefore = Number(r.export_revenue_without) || 0
  const exportCompensationAfter = Number(r.export_revenue_with) || 0
  const feedInCostSaving = tkJaar - tkRemaining
  const compensationChange = exportCompensationAfter - exportCompensationBefore
  const settlementNetEffect = feedInCostSaving + compensationChange
  const hasSettlementInputs = (Number(feedInCost.enteredValue) || 0) > 0 || (Number.isFinite(compensationInput) && compensationInput > 0)
  const currentContractLabel = currentContractIsDynamic
    ? (nl ? 'Huidig dynamisch contract' : 'Current dynamic tariff')
    : (nl ? 'Huidig vast contract' : 'Current fixed tariff')
  const feedInCostDifferenceLabel = feedInCostSaving >= 0
    ? (nl ? 'Besparing op terugleverkosten' : 'Export charge savings')
    : (nl ? 'Extra terugleverkosten' : 'Additional export charges')
  const settlementExplanation = [
    feedInCostSaving >= 0
      ? (nl ? `${yearlyEuro(feedInCostSaving)} minder terugleverkosten` : `${yearlyEuro(feedInCostSaving)} lower export charges`)
      : (nl ? `${yearlyEuro(Math.abs(feedInCostSaving))} extra terugleverkosten` : `${yearlyEuro(Math.abs(feedInCostSaving))} additional export charges`),
    compensationChange < -0.005
      ? (nl ? `minus ${yearlyEuro(Math.abs(compensationChange))} lagere terugleververgoeding` : `minus ${yearlyEuro(Math.abs(compensationChange))} lower export compensation`)
      : compensationChange > 0.005
        ? (nl ? `plus ${yearlyEuro(compensationChange)} hogere terugleververgoeding` : `plus ${yearlyEuro(compensationChange)} higher export compensation`)
        : (nl ? 'geen verschil in terugleververgoeding' : 'no change in export compensation'),
  ].join(nl ? ', ' : ', ')
  const comparisonText = {
    current: nl ? 'HUIDIG' : 'CURRENT',
    withBattery: nl ? 'MET BATTERIJ' : 'WITH BATTERY',
    solar: nl ? 'Totale zonneopbrengst' : 'Total solar generation',
    solarSub: nl ? 'Uw jaarlijkse opwek via zonnepanelen' : 'Your yearly solar generation',
    selfUse: nl ? 'Zelfverbruik' : 'Solar power used at home',
    selfUseSub: nl ? 'Aandeel van de zonne-opwek dat u zelf gebruikt' : 'Share of solar generation used in your home',
    directUse: nl ? 'Direct zelfverbruik' : 'Direct solar use',
    directUseSub: nl ? 'Zonnestroom die meteen in huis wordt gebruikt' : 'Solar power used in the home as it is generated',
    batteryTotal: nl ? 'Totaal ontladen uit de batterij' : 'Total battery discharge',
    batteryTotalSub: nl ? 'Naar de woning plus EPEX-handel' : 'Delivered to the home plus EPEX trading',
    batteryHome: nl ? 'Waarvan aan huis geleverd' : 'Of which delivered to the home',
    batteryHomeSub: nl ? 'Verlaagt de stroom die uw woning van het net nodig heeft' : 'Reduces the electricity your home needs from the grid',
    export: nl ? 'Teruglevering aan het net' : 'Electricity sent to the grid',
    exportSub: nl ? 'Overschot na direct gebruik en opslag' : 'Surplus after direct use and storage',
    exportShift: nl ? 'minder teruggeleverd door batterijopslag' : 'less exported because of battery storage',
    selfSufficiency: nl ? 'Zelfvoorzienendheid' : 'Self-sufficiency',
    selfSufficiencySub: nl ? 'Aandeel van uw totale stroomverbruik gedekt door eigen zonnestroom' : 'Share of total electricity use covered by your own solar power',
    annualUse: nl ? 'Stroomverbruik per jaar' : 'Annual electricity use',
    annualUseSub: nl ? 'Uw totale stroomvraag, vóór eigen zonnestroom' : 'Your total electricity demand before solar',
    grid: nl ? 'Netstroom inkoop' : 'Electricity bought from the grid',
    gridSub: nl ? 'Stroom die u nog van uw energieleverancier nodig heeft' : 'Electricity still needed from your supplier',
    epex: nl ? 'Slimme marktoptimalisatie (EPEX)' : 'Smart market optimisation (EPEX)',
    epexSub: epexIsActive
      ? (nl ? 'Geschatte waarde uit dynamische prijsverschillen' : 'Estimated value from dynamic price differences')
      : (nl ? 'Geen opbrengst meegenomen zonder bevestigde handelsaansturing' : 'No revenue included without confirmed trading control'),
    feedIn: nl ? 'Terugleverkosten' : 'Feed-in charges',
    noFeedIn: nl ? 'Deze kosten vervallen na de overstap' : 'These charges end after the switch',
    compensation: nl ? 'Terugleververgoeding' : 'Export compensation',
    compensationBeforeSub: compensationInputText
      ? `${nl ? 'Ingevuld tarief' : 'Entered rate'}: ${compensationInputText}`
      : (nl ? 'Vergoeding voor stroom die u aan het net levert' : 'Payment for electricity exported to the grid'),
    compensationAfterSub: nl
      ? 'Vergoeding over de stroom die na opslag nog wordt teruggeleverd'
      : 'Payment for electricity still exported after battery storage',
    earned: nl ? 'ZO VERDIENT U TERUG' : 'HOW THE BATTERY PAYS BACK',
    payback: nl ? 'Terugverdientijd' : 'Payback time',
    years: nl ? 'jaar' : 'years',
    exportAdjusted: nl
      ? 'De ingevoerde teruglevering was lager dan fysiek mogelijk op basis van opwek en verbruik; daarom is de energiebalans gecorrigeerd.'
      : 'The entered export was physically inconsistent with generation and consumption; the energy balance was corrected.',
  }
  const beforeRows = [
    { label: comparisonText.solar, sub: comparisonText.solarSub, value: yearlyKwh(annualSolar) },
    { label: comparisonText.annualUse, sub: comparisonText.annualUseSub, value: yearlyKwh(annualUse) },
    { label: comparisonText.selfUse, sub: comparisonText.selfUseSub, value: percent(selfUseBeforePct) },
    { label: comparisonText.directUse, sub: comparisonText.directUseSub, value: yearlyKwh(r.sc_direct_kwh) },
    { label: comparisonText.batteryTotal, sub: comparisonText.batteryTotalSub, value: yearlyKwh(0) },
    { label: comparisonText.batteryHome, sub: comparisonText.batteryHomeSub, value: yearlyKwh(0), detail: nl ? 'Geen batterij in de huidige situatie' : 'No battery in the current situation' },
    { label: comparisonText.export, sub: comparisonText.exportSub, value: yearlyKwh(exportZonder) },
    { label: comparisonText.selfSufficiency, sub: comparisonText.selfSufficiencySub, value: percent(selfSufficiencyBefore), detail: `${fmt(r.sc_direct_kwh, 0)} / ${fmt(annualUse, 0)} kWh` },
    { label: comparisonText.grid, sub: comparisonText.gridSub, value: yearlyKwh(r.grid_import_without) },
    { label: comparisonText.epex, sub: comparisonText.epexSub, value: nl ? 'Niet actief' : 'Not active' },
  ]
  const afterRows = [
    { label: comparisonText.solar, sub: comparisonText.solarSub, value: yearlyKwh(annualSolar) },
    { label: comparisonText.annualUse, sub: comparisonText.annualUseSub, value: yearlyKwh(annualUse) },
    { label: comparisonText.selfUse, sub: comparisonText.selfUseSub, value: percent(selfUseAfterPct) },
    { label: comparisonText.directUse, sub: comparisonText.directUseSub, value: yearlyKwh(r.sc_direct_kwh) },
    { label: comparisonText.batteryTotal, sub: comparisonText.batteryTotalSub, value: yearlyKwh(batteryTotalDischargeKwh), emphasis: true },
    {
      label: comparisonText.batteryHome,
      sub: comparisonText.batteryHomeSub,
      value: yearlyKwh(batteryHomeKwh),
      detail: null,
    },
    {
      label: comparisonText.export,
      sub: comparisonText.exportSub,
      value: yearlyKwh(r.export_kwh_with),
      detail: Number(selfUsedInsteadOfExport) > 0 ? `${yearlyKwh(selfUsedInsteadOfExport)} ${comparisonText.exportShift}` : null,
    },
    {
      label: comparisonText.selfSufficiency,
      sub: comparisonText.selfSufficiencySub,
      value: percent(selfSufficiencyAfter),
      detail: `${fmt(totalSolarToHomeKwh, 0)} / ${fmt(annualUse, 0)} kWh`,
    },
    {
      label: comparisonText.grid,
      sub: comparisonText.gridSub,
      value: yearlyKwh(r.grid_import_with),
      detail: gridImportReduction > 0 ? `↓ ${yearlyKwh(gridImportReduction)}` : null,
    },
    {
      label: comparisonText.epex,
      sub: comparisonText.epexSub,
      value: epexValue,
      detail: epexIsActive && batteryTradingKwh > 0
        ? `${fmt(batteryTradingKwh, 0)} ${yearUnit} ${nl ? 'ontladen voor EPEX' : 'discharged for EPEX'}`
        : null,
    },
  ]
  const renderRowCell = (row, isAfter) => (
    <div className={`flex min-h-[92px] items-center justify-between gap-4 rounded-2xl border px-4 py-4 shadow-[0_4px_14px_rgba(22,48,35,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(22,48,35,0.09)] sm:px-5 ${isAfter ? 'border-[#c9ddc8] bg-gradient-to-br from-[#fffef4] via-[#f9faee] to-[#e9f3e7]' : 'border-[#dce3df] bg-gradient-to-br from-white via-[#fbfcfb] to-[#edf1ee]'}`}>
      <div className="min-w-0">
        <div className={`text-base leading-snug ${row.emphasis ? 'font-extrabold text-[#193829]' : 'font-bold text-[#263c31]'}`}>{row.label}</div>
        {row.sub && <div className="mt-1 text-sm leading-5 text-[#526257] sm:text-base">{row.sub}</div>}
        {row.detail && <div className="mt-1 text-sm font-bold leading-5 text-[#276344] sm:text-base">{row.detail}</div>}
      </div>
      <div className={`max-w-[44%] shrink-0 text-right font-extrabold tabular-nums ${row.emphasis ? 'text-xl text-[#193829] sm:text-2xl' : 'text-base text-[#131A20] sm:text-lg'}`}>
        {row.value}
      </div>
    </div>
  )
  const batteryFlowRows = [
    [nl ? 'Zonnestroom opgeslagen, niet teruggeleverd' : 'Solar power stored instead of exported', r.solar_battery_charge_kwh],
    [nl ? 'Netstroom geladen voor EPEX' : 'Grid power charged for EPEX', r.epex_grid_charge_kwh],
    [nl ? 'Totaal geladen' : 'Total charged', r.battery_total_charge_kwh],
    [nl ? 'Uit de batterij ontladen' : 'Energy discharged', r.battery_actual_discharge_kwh],
    [nl ? 'Aan huis geleverd' : 'Delivered to home', r.battery_home_delivery_kwh],
    [nl ? 'Voor handel gebruikt' : 'Used for trading', r.battery_trading_discharge_kwh],
    [nl ? 'Verlies bij laden en ontladen' : 'Charge and discharge losses', r.battery_total_loss_kwh],
  ]
  const batterySavingsRows = [
    [nl ? 'Besparing op de energierekening, zonder EPEX' : 'Bill savings, excluding EPEX', r.bill_savings_annual],
    [nl ? 'EPEX-prijsverschillen' : 'EPEX price differences', null],
    [nl ? 'Totaal geschat voordeel' : 'Total estimated savings', null],
  ]
  const paybackLow = returnSummary?.paybackLow ?? r.payback_low
  const paybackHigh = returnSummary?.paybackHigh ?? r.payback_high
  const paybackText = paybackLow != null && paybackHigh != null
    ? `${fmt(paybackLow, 1)}–${fmt(paybackHigh, 1)} ${comparisonText.years}`
    : '—'

  return (
    <Reveal delay={0.7}>
      <section className="overflow-hidden rounded-[28px] border border-[#d7ded8] bg-gradient-to-b from-white via-[#fbfcfa] to-[#f0f4ef] shadow-[0_22px_60px_rgba(19,26,32,0.12)]">
        <header className="border-b border-white/10 bg-gradient-to-r from-[#142f23] via-[#1c412f] to-[#315b40] px-5 py-6 text-white sm:px-8 sm:py-7">
          <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#FDF891]">
            {res.baTitle}
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {nl ? 'Wat verandert de batterij?' : 'What changes with a battery?'}
          </div>
        </header>
          <div className="p-4 sm:p-6">
            <div className="rounded-3xl border border-[#d5e0d6] bg-gradient-to-br from-[#f2f6f1] via-white to-[#eaf1e8] p-3 shadow-[inset_0_1px_3px_rgba(25,56,41,0.05)] sm:p-5">
              <div className="battery-before-after-scroll overflow-x-auto pb-2">
                <div className="min-w-[680px]">
                  <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    <header className="rounded-2xl border border-[#d8e1dc] bg-gradient-to-br from-white via-white to-[#eaf0ed] px-5 py-6 shadow-[0_10px_28px_rgba(19,26,32,0.07)]">
                      <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#69776e]">{comparisonText.current}</div>
                      <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#131A20] sm:text-3xl">
                        {currentContractIsDynamic ? res.baCurrentDynamic : res.baCurrentFixed}
                      </h3>
                    </header>
                    <header className="rounded-2xl border border-[#b6d0b5] bg-gradient-to-br from-[#fffde8] via-[#f7f7df] to-[#deeddd] px-5 py-6 shadow-[0_14px_34px_rgba(25,56,41,0.14)]">
                      <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#365f43]">{comparisonText.withBattery}</div>
                      <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#193829] sm:text-3xl">{afterContract}</h3>
                    </header>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {beforeRows.map((row, index) => (
                      <div key={`comparison-${row.label}`} className="grid grid-cols-2 items-stretch gap-3 sm:gap-5">
                        {renderRowCell(row, false)}
                        {renderRowCell(afterRows[index], true)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {hasSettlementInputs && (
            <section className="mt-5 rounded-3xl border border-[#d8e2d9] bg-gradient-to-br from-[#f5f7f3] via-white to-[#edf3eb] p-4 shadow-[0_12px_30px_rgba(25,56,41,0.07)] sm:p-6" aria-label={nl ? 'Terugleverkosten en vergoeding' : 'Export charges and compensation'}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#dce3de] bg-gradient-to-br from-white to-[#f7f9f6] p-5 shadow-[0_8px_22px_rgba(19,26,32,0.05)]">
                  <h3 className="text-lg font-extrabold text-[#193829]">{nl ? 'Terugleverkosten' : 'Export charges'}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-base font-semibold text-[#526257]">{currentContractLabel}</div>
                      <div className="mt-1 text-xl font-extrabold tabular-nums text-[#131A20]">{feedInBefore}</div>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-[#526257]">{afterContract}</div>
                      <div className="mt-1 text-xl font-extrabold tabular-nums text-[#131A20]">{feedInAfter}</div>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-[#e2e7e2] pt-3 text-base font-bold text-[#193829]">
                    {feedInCostDifferenceLabel}: {yearlyEuro(Math.abs(feedInCostSaving))}
                  </div>
                  <p className="mt-2 text-base leading-6 text-[#526257]">
                    {r.current_fixed_feed_in_cost_removed
                      ? (nl ? 'Uitgaande van het vervallen van terugleverkosten bij het gekozen dynamische contract.' : 'Assumes export charges end with the selected dynamic tariff.')
                      : (nl ? 'Berekend met uw ingevulde tarief en de resterende teruglevering.' : 'Based on your entered rate and remaining exported electricity.')}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#dce3de] bg-gradient-to-br from-white to-[#f7f9f6] p-5 shadow-[0_8px_22px_rgba(19,26,32,0.05)]">
                  <h3 className="text-lg font-extrabold text-[#193829]">{nl ? 'Terugleververgoeding' : 'Export compensation'}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-base font-semibold text-[#526257]">{currentContractLabel}</div>
                      <div className="mt-1 text-xl font-extrabold tabular-nums text-[#131A20]">{yearlyEuro(exportCompensationBefore)}</div>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-[#526257]">{afterContract}</div>
                      <div className="mt-1 text-xl font-extrabold tabular-nums text-[#131A20]">{yearlyEuro(exportCompensationAfter)}</div>
                    </div>
                  </div>
                  <p className="mt-3 border-t border-[#e2e7e2] pt-3 text-base leading-6 text-[#526257]">
                    {nl
                      ? 'Berekend over de stroom die na direct gebruik en batterijopslag aan het net wordt teruggeleverd.'
                      : 'Calculated on electricity exported after direct use and battery storage.'}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#142f23] via-[#1c412f] to-[#315b40] p-5 text-white shadow-[0_12px_28px_rgba(20,47,35,0.18)] sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div>
                  <h3 className="text-lg font-extrabold">{nl ? 'Netto effect' : 'Net effect'}</h3>
                  <p className="mt-1 text-base leading-6 text-white/85">{settlementExplanation}</p>
                </div>
                <div className="mt-2 shrink-0 text-2xl font-extrabold tabular-nums sm:mt-0">{yearlyEuro(settlementNetEffect)}</div>
              </div>
            </section>
          )}
          <details className="mt-3 rounded-2xl border border-[#d7ded8] bg-[#f7f8f6]">
            <summary className="cursor-pointer px-4 py-3 text-base font-bold text-[#193829]">
              {nl ? 'Bekijk de batterijstromen' : 'View battery energy flows'}
            </summary>
            <div className="grid gap-2 border-t border-[#d7ded8] p-4 sm:grid-cols-2 lg:grid-cols-3">
              {batteryFlowRows.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white p-3">
                  <div className="text-sm font-semibold text-[#526257]">{label}</div>
                  <div className="mt-1 text-lg font-extrabold tabular-nums text-[#131A20]">{yearlyKwh(value)}</div>
                </div>
              ))}
              <div className="rounded-xl bg-white p-3">
                <div className="text-sm font-semibold text-[#526257]">{batterySavingsRows[0][0]}</div>
                <div className="mt-1 text-lg font-extrabold tabular-nums text-[#131A20]">{yearlyEuro(batterySavingsRows[0][1])}</div>
              </div>
              {epexIsActive && (
                <>
                  <div className="rounded-xl bg-white p-3">
                    <div className="text-sm font-semibold text-[#526257]">{batterySavingsRows[1][0]}</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-[#131A20]">
                      {yearlyEuro(r.smart_annual_low)}–{yearlyEuro(r.smart_annual_high)}
                    </div>
                    <div className="mt-1 text-sm leading-5 text-[#526257]">
                      {nl ? 'Bestaande EPEX-aanname: € 0,24–€ 0,26 per ontladen kWh × 75%.' : 'Existing EPEX assumption: €0.24–€0.26 per discharged kWh × 75%.'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#fffde0] p-3">
                    <div className="text-sm font-semibold text-[#3b573f]">{batterySavingsRows[2][0]}</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-[#131A20]">
                      {yearlyEuro(r.total_annual_low)}–{yearlyEuro(r.total_annual_high)}
                    </div>
                  </div>
                </>
              )}
              <div className="rounded-xl border border-[#d7ded8] bg-white p-3 text-sm font-medium leading-6 text-[#39473d] sm:col-span-2 lg:col-span-3">
                {nl
                  ? `Elke kWh die de batterij aan huis levert, vervangt 1 kWh netinkoop. De eurobesparing rekent ook gemiste terugleververgoeding en verliezen mee. EPEX staat apart en gebruikt alleen de resterende laadcycli.`
                  : `Each kWh the battery delivers to the home replaces 1 kWh bought from the grid. The euro saving also accounts for foregone export compensation and losses. EPEX is separate and uses only the remaining cycles.`}
              </div>
              {Number(r.battery_unused_potential_low_kwh) >= 0 && Number(r.battery_unused_potential_high_kwh) >= Number(r.battery_unused_potential_low_kwh) && (
                <div className="rounded-xl bg-white p-3">
                  <div className="text-sm font-semibold text-[#526257]">{nl ? 'Niet benut cycluspotentieel' : 'Unused cycle potential'}</div>
                  <div className="mt-1 text-lg font-extrabold tabular-nums text-[#131A20]">
                    {fmt(r.battery_unused_potential_low_kwh, 0)}–{fmt(r.battery_unused_potential_high_kwh, 0)} {yearUnit}
                  </div>
                  <div className="mt-1 text-sm leading-5 text-[#526257]">
                    {nl ? 'Modelruimte, geen beschikbare of gegarandeerde stroom.' : 'Modelled headroom, not available or guaranteed energy.'}
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-white p-3">
                <div className="text-sm font-semibold text-[#526257]">{nl ? 'Cyclusaanname' : 'Cycle assumption'}</div>
                <div className="mt-1 text-lg font-extrabold text-[#131A20]">350–380 {nl ? 'per jaar' : 'per year'}</div>
              </div>
            </div>
          </details>
        {r.export_input_adjusted && (
          <p className="mx-4 mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-950 sm:mx-6">
            {comparisonText.exportAdjusted}
          </p>
        )}
        {showReturnSummary && (
          <footer className="mx-4 mb-4 flex flex-col gap-2 rounded-2xl bg-[#193829] p-5 text-white sm:mx-6 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#FDF891]">{comparisonText.earned}</div>
            </div>
            <div className="flex items-baseline gap-3 sm:border-l sm:border-white/20 sm:pl-6">
              <div className="text-sm font-semibold text-white/80">{comparisonText.payback}</div>
              <div className="text-xl font-extrabold text-white">{paybackText}</div>
            </div>
          </footer>
        )}
      </section>
    </Reveal>
  )
}

function HeatPumpReportPage({ result, lang, navigate }) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const heatPumpFinancingPrice = Number(result?.heatPumpROI?.investmentEur ?? result?.investmentEur) || 0
  const downloadPdf = async () => {
    setPdfLoading(true)
    try {
      const [{ pdf }, { HeatPumpPDFReport }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/heatPump/HeatPumpPDFReport.jsx'),
      ])
      const blob = await pdf(<HeatPumpPDFReport result={result} lang={lang} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `SolarFast-Warmtepomprapport-${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()
      trackEvent('report_pdf_downloaded', { type: 'heat_pump' })
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="sf-results min-h-screen bg-[#F7F8FA] text-[#131A20]">
      <header className="sf-results-header sticky top-0 z-40 flex items-center justify-between border-b border-black/[0.08] bg-white/95 px-4 py-3.5 sm:px-6">
        <button onClick={() => navigate('/calculator', { state: { step: 6 } })} className="flex items-center gap-1.5 text-sm font-semibold text-black/55 hover:text-black/80">
          <ChevronLeft className="h-4 w-4" /> {lang === 'nl' ? 'Aanpassen' : 'Adjust'}
        </button>
        <button onClick={() => navigate('/')}><img src="/assets/solarfast-brand/logo-black.svg" alt="SolarFast" className="h-7 w-auto" /></button>
        <button onClick={downloadPdf} disabled={pdfLoading} className="flex items-center gap-1.5 rounded-full bg-[#131A20] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#29343c] disabled:opacity-60">
          <Download className="h-3 w-3" /> {pdfLoading ? (lang === 'nl' ? 'Laden...' : 'Loading...') : (lang === 'nl' ? 'Download PDF' : 'Download PDF')}
        </button>
      </header>
      <main className="px-4 py-6 pb-20 sm:px-6">
        <h1 className="sr-only">{lang === 'nl' ? 'Resultaten van uw warmtepompberekening' : 'Heat pump estimate results'}</h1>
        <HeatPumpResults result={result} lang={lang} />
        <WarmtefondsFinancing
          lang={lang}
          items={[{ type: 'heat-pump', label: lang === 'nl' ? 'Warmtepomp' : 'Heat pump', amount: heatPumpFinancingPrice }]}
        />
      </main>
    </div>
  )
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const baseResults = t.results
  const [results, setResults] = useState(null)
  const [input, setInput] = useState(null)
  const [products, setProducts] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [refreshingResults, setRefreshingResults] = useState(false)
  const [resultsRefreshError, setResultsRefreshError] = useState(false)
  const [addMeasure, setAddMeasure] = useState('')
  const [addMeasureBusy, setAddMeasureBusy] = useState(false)
  const [addMeasureError, setAddMeasureError] = useState('')
  const [addMeasureNotice, setAddMeasureNotice] = useState('')
  const [addMeasureForm, setAddMeasureForm] = useState({
    annualKwh: '',
    areaM2: '',
    insulation: 'average',
    aircoGoal: 'cooling',
    existingHeatingSystem: '',
    investmentEur: '',
    cheapChargePrice: '0.15',
  })
  const res = products?.energy?.hasPlannedChanges
    ? {
        ...baseResults,
        currentSituation: lang === 'nl' ? 'Gepland scenario zonder batterij' : 'Planned scenario without battery',
        withoutBattery: lang === 'nl' ? 'Zonder batterij' : 'Without battery',
        withBattery: lang === 'nl' ? 'Gepland scenario met batterij' : 'Planned scenario with battery',
      }
    : baseResults

  useEffect(() => {
    let active = true
    const storedResults = sessionStorage.getItem('voltrax_results')
    const storedInput = sessionStorage.getItem('voltrax_input')
    const storedProducts = sessionStorage.getItem('voltrax_products')
    const savedResult = storedResults ? JSON.parse(storedResults) : null
    const savedInput = storedInput ? JSON.parse(storedInput) : null
    const savedProductsData = storedProducts ? JSON.parse(storedProducts) : null

    if (savedResult) setResults(savedResult)
    if (savedInput) {
      setInput(savedInput)
      setProducts(savedProductsData)
      if (savedProductsData?.baseBatteryResults) {
        setAddMeasureNotice(lang === 'nl'
          ? 'Deze uitslag bevat een eerder toegevoegd product.'
          : 'This result includes a previously added product.')
      }
    } else if (
      import.meta.env.DEV &&
      ['1', 'combined'].includes(new URLSearchParams(window.location.search).get('preview'))
    ) {
      const devR = {"smart_daily_low":0.9,"smart_daily_high":1.42,"smart_annual_low":329,"smart_annual_high":520,"bill_savings_annual":420,"bill_savings_monthly":35,"total_annual_low":749,"total_annual_high":940,"total_daily_low":3.01,"total_daily_high":3.7,"payback_low":5.9,"payback_high":7.3,"zelfverbruik_voor":71.9,"zelfverbruik_na":90.4,"netonafhankelijkheid":39.5,"teruglevering_voor":28.1,"teruglevering_na":8.0,"bat_shift_kwh":592,"saved_terugleverkosten":286,"lost_terugleververgoeding":0,"grid_import_without":1500,"grid_cost_without":420,"export_revenue_without":45,"net_annual_cost_without":775,"grid_cost_with":254,"export_kwh_with":256,"sc_direct_kwh":2300,"sc_battery_kwh":592,"sc_pct_zonder":71.9,"sc_pct_met":90.4,"grid_import_with":908,"grid_import_besparing_kwh":592,"grid_import_besparing_eur":166,"export_kwh_zonder":900,"export_shift_kwh":592,"export_revenue_loss_eur":32,"battery_arbitrage_eur":0,"net_energy_saving_eur":420,"pE_used":0.28,"pT_used":0.05,"pv_input":3200,"v_input":3800,"t_input":900,"batterySelfConsumption":592,"totalSelfConsumption":2892,"ems_solar_cycles":97,"ems_total_cycles":417,"ems_cycli":320,"spread_low":0.12,"spread_high":0.19,"dynamic_contract":false,"garantie_bonus":0,"escalation_eur_low":240,"escalation_eur_high":301,"sald_protection_eur":111,"ems_physics_low":329,"ems_physics_high":520,"battery_charge_kwh":644,"shift_pct":72,"net_voor_pct":39.5,"net_na_pct":23.9}
      Object.assign(devR, {
        smart_daily_low: 0.81,
        smart_daily_high: 1.03,
        smart_annual_low: 293.86,
        smart_annual_high: 374.32,
        smart_monthly_low: 24.49,
        smart_monthly_high: 31.19,
        ems_physics_low: 293.86,
        ems_physics_high: 374.32,
        battery_arbitrage_eur: 334.09,
        total_annual_low: 683.96,
        total_annual_high: 764.41,
        total_daily_low: 2.64,
        total_daily_high: 3.09,
        payback_low: 7.1,
        payback_high: 8.3,
        ems_cycli: 176.4,
        ems_total_cycles: 355.7,
        epex_throughput_kwh: 1776.07,
        epex_throughput_low_kwh: 1632.57,
        epex_throughput_high_kwh: 1919.57,
        battery_trading_discharge_kwh: 1776.07,
        epex_grid_charge_kwh: 1869.55,
        battery_home_delivery_kwh: 1716,
        battery_actual_discharge_kwh: 3491.77,
        battery_total_charge_kwh: 3675.55,
        battery_total_loss_kwh: 183.78,
        battery_throughput_kwh: 3491.77,
        battery_utilization_pct: 73.4,
        net_annual_cost_with: 1850,
        pv_input: 4000,
        v_input: 8939,
        t_input: 1806,
        export_kwh_zonder: 1806,
        export_kwh_with: 0,
        sc_direct_kwh: 2194,
        sc_battery_kwh: 1716,
        sc_pct_zonder: 54.9,
        sc_pct_met: 97.7,
        sc_total_kwh: 3910,
        grid_import_without: 6745,
        grid_import_with: 5029.3,
        grid_import_besparing_kwh: 1716,
        battery_charge_kwh: 1806,
        batterySelfConsumption: 1716,
        totalSelfConsumption: 3910,
        self_sufficiency_before_pct: 24.5,
        self_sufficiency_after_pct: 43.74,
        terugleverkosten_jaar: 199,
        saved_terugleverkosten: 179,
        dynamic_contract: true,
        current_dynamic_contract: false,
        current_fixed_feed_in_cost_removed: true,
        terugleverkosten_na: 0,
        switch_to_dynamic_annual_low: 544,
        switch_to_dynamic_annual_high: 707,
        switch_to_dynamic_monthly_low: 45.33,
        switch_to_dynamic_monthly_high: 58.92,
      })
      const devI = {"battery_kWh":10.6,"battery_price":8000,"terugleverkosten_value":400,"terugleverkosten_unit":"jaar"}
      setResults(devR)
      if (new URLSearchParams(window.location.search).get('preview') === 'combined') {
        const devHeatPumpROI = {
          annualSavingsEur: 830,
          investmentEur: 6200,
          annualHeatDemandKwh: 14000,
          annualHeatPumpElectricityKwh: 3939,
          annualGasBeforeM3: 1100,
          annualGasRemainingM3: 1000,
          annualGasAvoidedM3: 100,
          gasPricePerM3: 1.55,
          gasStandingCostBeforeEur: 0,
          gasStandingSavingsEur: 0,
          beforeAnnualCostEur: 2500,
          afterAnnualCostEur: 1670,
          paybackYears: 7.5,
          roiPct: 13.4,
          tenYearNetEur: 2100,
          electricityPerGasM3: 2.4,
          electricPricePerKwh: 0.252,
          scopUsed: 4.0,
          scop35: 4.2,
          scop55: 3.4,
          flowTemperature: 35,
          boilerEfficiencyPct: 90,
          home: {
            type: 'semi-detached',
            buildPeriod: '1975-1990',
            areaM2: 140,
            gasUseM3: 1100,
            insulation: 'average',
            emitters: 'radiators',
            boilerAgeYears: 12,
            contractType: 'dynamic',
            statedElectricPricePerKwh: 0.28,
          },
          advice: {
            estimatedSpaceGasM3: 950,
            requiredKw: 7,
            recommendedConfig: 'hybrid',
          },
          model: {
            brand: 'Vaillant',
            model: 'aroTHERM plus',
            kw: 7,
            config: 'hybrid',
          },
          extras: { solar: { selected: false }, ev: { selected: false } },
        }
        setInput({ ...devI, battery_price: 8500 })
        setProducts({
          mode: 'combination',
          battery: { brand: 'HYXiPower', model: 'All-in-One', kWh: 10.6, phase: '3-phase' },
          plannedHeatPump: {
            selected: true,
            model: { brand: 'Vaillant', model: 'aroTHERM plus' },
            annualKwh: 3939,
            price: 6200,
          },
          addOnInvestment: 0,
          energy: {
            hasPlannedChanges: true,
            projectedSolarKwh: 4000,
            projectedConsumptionKwh: 8939,
            projectedExportKwh: 1806,
            heatPumpSolarOverlapKwh: 394,
            heatPumpSeasonalGridImportKwh: 3545,
            forecastWasAdjusted: false,
            exportMethod: 'seasonal-load-estimate',
          },
          batteryWithoutHeatPumpResults: {
            net_annual_cost_without: 2100,
            net_annual_cost_with: 1280,
            export_kwh_with: 900,
            sc_battery_kwh: 900,
            dynamic_contract: true,
            smart_annual_low: 544,
            smart_annual_high: 707,
            epex_throughput_kwh: 3321,
            battery_throughput_kwh: 4832,
          },
          batteryComparisonUnavailable: false,
          heatPumpROI: devHeatPumpROI,
        })
      } else {
        setInput(devI)
        setProducts({ battery: { brand: 'HYXiPower', model: 'All-in-One', kWh: 10.6 }, energy: { hasPlannedChanges: false } })
      }
    } else {
      navigate('/calculator', { state: { step: 6 } })
    }

    const needsRefresh = shouldRefreshSavedBatteryResult(
      savedResult,
      savedInput,
      sessionStorage.getItem(RESULTS_MODEL_VERSION_KEY),
    )

    if (!needsRefresh) return () => { active = false }

    setRefreshingResults(true)
    const refreshSavedResults = async () => {
      try {
        const refreshedInput = {
          ...savedInput,
          epex_optimization_supported: Number(savedInput?.battery_kWh) > 0,
          epex_home_use_kwh: savedProductsData?.plannedHeatPump?.selected
            ? (Number(savedProductsData?.energy?.heatPumpSeasonalGridImportKwh) || 0)
              + (savedProductsData?.plannedAirco?.selected
                ? Number(savedProductsData.plannedAirco.annualKwh) || 0
                : 0)
            : Number(savedInput?.epex_home_use_kwh) || 0,
          battery_cheap_charge_price_eur_per_kwh:
            Number(savedInput?.battery_cheap_charge_price_eur_per_kwh)
            || Number(savedProductsData?.energy?.batteryCheapChargePriceEurPerKwh)
            || 0.15,
        }
        const response = await axios.post('/api/calculate', refreshedInput)
        if (!active) return

        setResults(response.data)
        sessionStorage.setItem('voltrax_results', JSON.stringify(response.data))
        sessionStorage.setItem('voltrax_input', JSON.stringify(refreshedInput))

        let refreshedProducts = savedProductsData
        if (
          savedProductsData?.batteryWithoutHeatPumpResults &&
          !savedProductsData?.batteryComparisonUnavailable
        ) {
          const baselineInput = savedBaselineInput(refreshedInput, savedProductsData)
          if (!baselineInput) throw new Error('Could not rebuild the saved comparison input')
          baselineInput.epex_optimization_supported = Number(baselineInput.battery_kWh) > 0
          const baselineResponse = await axios.post('/api/calculate', baselineInput)
          if (!active) return

          refreshedProducts = {
            ...savedProductsData,
            batteryWithoutHeatPumpResults: baselineResponse.data,
            batteryWithoutHeatPumpInput: baselineInput,
          }
          setProducts(refreshedProducts)
          sessionStorage.setItem('voltrax_products', JSON.stringify(refreshedProducts))
        }

        sessionStorage.setItem(RESULTS_MODEL_VERSION_KEY, CALCULATION_RESULTS_VERSION)
      } catch {
        if (active) setResultsRefreshError(true)
      } finally {
        if (active) setRefreshingResults(false)
      }
    }

    refreshSavedResults()
    return () => { active = false }
  }, [navigate])

  if (!results) return (
    <div className="sf-results min-h-screen bg-[#F7F8FA] flex items-center justify-center font-['Plus_Jakarta_Sans']">
      <div className="text-black/50 text-sm animate-pulse">{res.loading}</div>
    </div>
  )

  if (results.kind === 'heat-pump') {
    return <HeatPumpReportPage result={results} lang={lang} navigate={navigate} />
  }

  const battery_price = input?.battery_price || 9000
  const battery_kWh   = input?.battery_kWh   || 15.9
  const isDynamic     = results?.dynamic_contract || false
  const currentContractIsDynamic = results?.current_dynamic_contract ?? isDynamic
  const showSwitchSavings = !currentContractIsDynamic &&
    isDynamic &&
    results?.switch_to_dynamic_annual_low != null &&
    results?.switch_to_dynamic_annual_high != null
  const switchToDynamicMonthlyLow = results?.switch_to_dynamic_monthly_low ??
    results?.switch_to_dynamic_annual_low / 12
  const switchToDynamicMonthlyHigh = results?.switch_to_dynamic_monthly_high ??
    results?.switch_to_dynamic_annual_high / 12
  const perMaandLow   = results.total_annual_low / 12
  const perMaandHigh  = results.total_annual_high / 12
  const batteryTenYearResults = products?.baseBatteryResults || results
  const batteryTenYearInvestment = Number(products?.baseBatteryInvestment ?? battery_price)
  const batteryTenYearNet = getBatteryTenYearNet(batteryTenYearResults, batteryTenYearInvestment)
  const displayedTenYearNet = Number(products?.addOnInvestment) > 0 &&
    results?.package_roi_complete === true &&
    results?.ten_year_net_low_eur != null && results?.ten_year_net_high_eur != null
    ? { low: results.ten_year_net_low_eur, high: results.ten_year_net_high_eur }
    : batteryTenYearNet
  const displayedInvestment = Number(products?.addOnInvestment) > 0
    ? Number(products?.baseBatteryInvestment || 0) + Number(products.addOnInvestment)
    : Number(products?.baseBatteryInvestment ?? battery_price)
  const isCombination = products?.mode === 'combination' && !!products?.heatPumpROI
  const additionalProductNames = [
    products?.plannedSolar?.selected && (lang === 'nl' ? 'zonnepanelen' : 'solar panels'),
    products?.plannedAirco?.selected && (lang === 'nl' ? 'airco' : 'air conditioning'),
    products?.plannedEv?.selected && (lang === 'nl' ? 'laadpaal' : 'EV charger'),
  ].filter(Boolean)
  const additionalProductsHavePrices = additionalProductNames.length > 0 &&
    [products?.plannedSolar, products?.plannedAirco, products?.plannedEv]
      .filter((item) => item?.selected)
      .every((item) => Number(item.price) > 0)
  const additionalProductInvestment = additionalProductsHavePrices
    ? [products?.plannedSolar, products?.plannedAirco, products?.plannedEv]
        .filter((item) => item?.selected)
        .reduce((sum, item) => sum + Number(item.price), 0)
    : null
  const additionalAircoGasSavingsEur = products?.plannedAirco?.selected
    ? getAdditionalAircoGasSavings(products.plannedAirco.savings, products.heatPumpROI)
    : 0
  const additionalProductsModeled =
    !products?.plannedSolar?.selected &&
    !products?.plannedEv?.selected &&
    (!products?.plannedAirco?.selected || additionalAircoGasSavingsEur !== null)
  const combinedROI = isCombination
    ? calculateCombinedROI({
        batteryResults: results,
        batteryWithoutHeatPumpResults: products?.batteryWithoutHeatPumpResults,
        batteryInvestmentEur: products?.baseBatteryInvestment ?? input?.battery_price,
        heatPumpROI: products.heatPumpROI,
        additionalInvestmentEur: additionalProductInvestment,
        hasAdditionalInvestment: additionalProductNames.length > 0,
        additionalProductsModeled,
        additionalGasSavingsEur: additionalAircoGasSavingsEur || 0,
      })
    : null
  const solarBatteryPackageROI = products?.plannedSolar?.selected &&
    !products?.plannedHeatPump?.selected &&
    !products?.plannedEv?.selected
    ? calculateBatterySolarPackageROI({
        baselineResults: products?.solarBatteryPackageBaselineResults,
        combinedResults: results,
        batteryInvestmentEur: products?.baseBatteryInvestment ?? input?.battery_price,
        solarInvestmentEur: products?.plannedSolar?.price,
      })
    : null
  const beforeAddOnROI = isCombination && Number(products?.addOnInvestment) > 0
    ? calculateCombinedROI({
        batteryResults: products?.baseBatteryResults,
        batteryWithoutHeatPumpResults: products?.batteryWithoutHeatPumpResults,
        batteryInvestmentEur: products?.baseBatteryInvestment ?? input?.battery_price,
        heatPumpROI: products.heatPumpROI,
      })
    : null
  const hasCombinedQuotes = isCombination &&
    Number(products?.baseBatteryInvestment ?? input?.battery_price) > 0 &&
    Number(products?.heatPumpROI?.investmentEur) > 0 &&
    (additionalProductNames.length === 0 || additionalProductsHavePrices)
  const hasPositiveCombinedSavings = Number(combinedROI?.annualLowEur) > 0 &&
    Number(combinedROI?.annualHighEur) > 0
  const formatKwh = (value) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { maximumFractionDigits: 1 }).format(value || 0)
  const formatEuro = (value) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0)
  const formatEuroRate = (value) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(value || 0)
  const batteryOnlyResults = products?.batteryScenarioResults ||
    products?.baseBatteryResults ||
    (isCombination ? products?.batteryWithoutHeatPumpResults : results)
  const batteryOnlyInvestment = Number(products?.baseBatteryInvestment ?? input?.battery_price) || 0
  const batterySavingsLow = Number(batteryOnlyResults?.total_annual_low)
  const batterySavingsHigh = Number(batteryOnlyResults?.total_annual_high)
  const hasBatteryROI = batteryOnlyResults?.total_annual_low != null &&
    batteryOnlyResults?.total_annual_high != null &&
    Number.isFinite(batterySavingsLow) && Number.isFinite(batterySavingsHigh) &&
    batteryOnlyInvestment > 0
  const productROI = (annualLow, annualHigh, investment) => {
    const amount = Number(investment)
    const low = Number(annualLow)
    const high = Number(annualHigh)
    if (!(amount > 0) || annualLow == null || annualHigh == null ||
      !Number.isFinite(low) || !Number.isFinite(high)) return null
    return {
      annual: `${formatEuro(low)}–${formatEuro(high)}`,
      roi: `${formatKwh(low / amount * 100)}–${formatKwh(high / amount * 100)}%`,
      payback: low > 0 && high > 0
        ? `${formatKwh(amount / high)}–${formatKwh(amount / low)} ${lang === 'nl' ? 'jaar' : 'years'}`
        : (lang === 'nl' ? 'Niet terugverdiend in deze schatting' : 'No payback in this estimate'),
    }
  }
  const aircoAddOnEstimate = addMeasure === 'airco' && Number(addMeasureForm.areaM2) > 0
    ? estimateAircoAnnualElectricity(
        [{ areaM2: addMeasureForm.areaM2, insulationLevel: addMeasureForm.insulation }],
        addMeasureForm.aircoGoal,
      )
    : null
  const localizedBatteryModel = (model) => lang === 'nl' ? model.replace(/(\d+)\.(?=\d)/g, '$1,') : model
  const batteryModelName = products?.battery
    ? [
        products.battery.brand,
        String(products.battery.model || '').replace(/\s*\d+(?:[.,]\d+)?\s*kWh\s*$/i, '').trim(),
      ].filter(Boolean).join(' ')
    : ''
  const batteryProductLabel = products?.battery
    ? [batteryModelName ? localizedBatteryModel(batteryModelName) : '', `${formatKwh(products.battery.kWh)} kWh`].filter(Boolean).join(' · ')
    : null
  const plannedSolarProduction = Number(products?.plannedSolar?.annualKwh) || 0
  const solarEnergy = products?.energy
  const backendExportWithoutBattery = Number(results?.export_kwh_zonder)
  const totalProjectedExport = Number.isFinite(backendExportWithoutBattery)
    ? backendExportWithoutBattery
    : Number(solarEnergy?.projectedExportKwh)
  const currentSolarExport = Number(solarEnergy?.currentExportKwh) || 0
  const modeledPlannedSolarDirectUse = Number(solarEnergy?.plannedSolarDirectUseKwh)
  const addedSolarExport = plannedSolarProduction > 0 && Number.isFinite(modeledPlannedSolarDirectUse)
    ? Math.max(0, plannedSolarProduction - Math.min(plannedSolarProduction, modeledPlannedSolarDirectUse))
    : plannedSolarProduction > 0 && Number.isFinite(totalProjectedExport)
    ? Math.min(plannedSolarProduction, Math.max(
        0,
        totalProjectedExport - currentSolarExport,
      ))
    : null
  const compensationInput = Number(input?.terugleververgoeding_value) || 0
  const exportPriceEurPerKwh = input?.terugleververgoeding_unit === 'jaar'
    ? compensationInput / Math.max(1, totalProjectedExport || addedSolarExport)
    : compensationInput
  const feedInCostInput = Number(input?.terugleverkosten_value) || 0
  const addedSolarFeedInCosts = addedSolarExport == null
    ? 0
    : input?.terugleverkosten_unit === 'kWh'
      ? addedSolarExport * feedInCostInput
      : feedInCostInput * Math.min(1, addedSolarExport / Math.max(1, totalProjectedExport || addedSolarExport))
  const solarSavings = products?.plannedSolar?.selected
    && addedSolarExport != null
    ? calculateSolarSavings({
        investmentEur: Number(products.plannedSolar.price) || 0,
        annualProductionKwh: plannedSolarProduction,
        directSelfUseKwh: Math.min(plannedSolarProduction, Math.max(0, plannedSolarProduction - addedSolarExport)),
        electricityPriceEurPerKwh: Number(input?.prijsInkoop) || 0,
        exportPriceEurPerKwh,
        annualFeedInCostsEur: addedSolarFeedInCosts,
        annualMaintenanceEur: 0,
      })
    : null
  const warmtefondsItems = [
    {
      type: 'battery',
      label: lang === 'nl' ? 'Thuisbatterij' : 'Home battery',
      amount: Number(products?.baseBatteryInvestment ?? input?.battery_price) || 0,
    },
    ...(products?.plannedHeatPump?.selected ? [{
      type: 'heat-pump',
      label: lang === 'nl' ? 'Warmtepomp' : 'Heat pump',
      amount: Number(products.plannedHeatPump.price) || 0,
    }] : []),
    ...(products?.plannedSolar?.selected ? [{
      type: 'solar',
      label: lang === 'nl' ? 'Zonnepanelen' : 'Solar panels',
      amount: Number(products.plannedSolar.price) || 0,
    }] : []),
  ]
  const productRows = products ? [
    products.plannedSolar?.selected && { key: 'solar', label: lang === 'nl' ? 'Zonnepanelen' : 'Solar panels', kWh: products.plannedSolar.annualKwh, price: products.plannedSolar.price },
    products.plannedHeatPump?.selected && {
      key: 'heat-pump',
      label: lang === 'nl' ? 'Warmtepomp' : 'Heat pump',
      model: products.plannedHeatPump.model
        ? `${products.plannedHeatPump.model.brand} ${products.plannedHeatPump.model.model}`
        : null,
      kWh: products.plannedHeatPump.annualKwh,
      price: products.plannedHeatPump.price,
    },
    products.plannedEv?.selected && { key: 'ev', label: lang === 'nl' ? 'Laadpaal / elektrisch rijden' : 'EV charger / driving', kWh: products.plannedEv.annualKwh, price: products.plannedEv.price },
    products.plannedAirco?.selected && {
      key: 'airco',
      label: lang === 'nl' ? 'Airco' : 'Air conditioning',
      model: products.plannedAirco.model
        ? [products.plannedAirco.model.brand, products.plannedAirco.model.range, products.plannedAirco.model.model].filter(Boolean).join(' ')
        : null,
      kWh: products.plannedAirco.annualKwh,
      price: products.plannedAirco.price,
    },
  ].filter(Boolean) : []
  const batteryHomeKwh = getBatteryHomeKwh(results)
  const batteryTotalDischargeKwh = Number(results?.battery_actual_discharge_kwh ?? results?.battery_throughput_kwh) || 0
  const batteryTradingDischargeKwh = Number(results?.battery_trading_discharge_kwh ?? results?.epex_throughput_kwh) || 0
  const productImpactCards = [
    products?.battery && {
      key: 'battery',
      title: lang === 'nl' ? 'Thuisbatterij' : 'Home battery',
      model: batteryProductLabel,
      impactLabel: lang === 'nl' ? 'Totaal ontladen uit batterij' : 'Total battery discharge',
      impact: `${formatKwh(batteryTotalDischargeKwh)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
      description: lang === 'nl'
        ? `${formatKwh(batteryHomeKwh)} kWh naar huis, waaronder ${formatKwh(Number(results?.epex_home_delivery_kwh) || 0)} kWh goedkoop geladen voor huisverbruik · ${formatKwh(batteryTradingDischargeKwh)} kWh verhandeld via EPEX.`
        : `${formatKwh(batteryHomeKwh)} kWh to the home, including ${formatKwh(Number(results?.epex_home_delivery_kwh) || 0)} kWh charged cheaply for home use · ${formatKwh(batteryTradingDischargeKwh)} kWh traded via EPEX.`,
      price: Number(products?.baseBatteryInvestment ?? input?.battery_price) || 0,
      image: String(products.battery.brand || '').toLowerCase() === 'hyxipower'
        ? '/assets/products/hyxipower-15-9.webp'
        : null,
      imageAlt: batteryProductLabel || 'HYXiPower thuisbatterij',
      detail: products.battery.phase
        ? (products.battery.phase === '1-phase' ? (lang === 'nl' ? '1-fase aansluiting' : 'Single-phase connection') : (lang === 'nl' ? '3-fase aansluiting' : 'Three-phase connection'))
        : null,
      roi: (isCombination || additionalProductNames.length > 0) ? {
          ...(hasBatteryROI
            ? {
            ...productROI(batterySavingsLow, batterySavingsHigh, batteryOnlyInvestment),
            annualLabel: lang === 'nl' ? 'Batterij bespaart per jaar' : 'Battery savings per year',
            roiLabel: lang === 'nl' ? 'ROI per jaar' : 'ROI per year',
            paybackLabel: lang === 'nl' ? 'Terugverdientijd batterij' : 'Battery payback',
              }
            : {
                annual: lang === 'nl' ? 'Niet berekend' : 'Not calculated',
                roi: lang === 'nl' ? 'Niet berekend' : 'Not calculated',
                payback: lang === 'nl' ? 'Niet berekend' : 'Not calculated',
                annualLabel: lang === 'nl' ? 'Batterij bespaart per jaar' : 'Battery savings per year',
                roiLabel: lang === 'nl' ? 'ROI per jaar' : 'ROI per year',
                paybackLabel: lang === 'nl' ? 'Terugverdientijd batterij' : 'Battery payback',
                note: lang === 'nl' ? 'De vergelijking met alleen de batterij ontbreekt.' : 'The battery-only comparison is unavailable.',
              }),
        } : null,
    },
    ...productRows.map((row, index) => ({
      key: `product-${index}`,
      title: row.label,
      model: row.model,
      impactLabel: row.key === 'solar'
        ? (lang === 'nl' ? 'Extra zonnestroom' : 'Additional solar power')
        : (lang === 'nl' ? 'Extra stroomverbruik' : 'Additional electricity use'),
      impact: `+${formatKwh(row.kWh)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
      description: row.key === 'solar'
        ? (lang === 'nl' ? 'Levert extra zonnestroom voor gebruik in huis of teruglevering.' : 'Adds solar power for home use or export.')
        : row.key === 'heat-pump'
          ? (lang === 'nl' ? 'Verwarmt de woning met stroom en verlaagt het gasverbruik volgens deze berekening.' : 'Heats the home with electricity and lowers gas use in this estimate.')
          : row.key === 'airco'
            ? (lang === 'nl'
                ? 'Koelt en/of verwarmt de ruimte. Het extra verbruik is meegenomen in de batterijberekening; beschikbare opgeslagen stroom kan aan het huis worden geleverd.'
                : 'Cools and/or heats the room. Its added use is included in the battery calculation; available stored power can be delivered to the home.')
            : (lang === 'nl' ? 'Laadt de auto thuis. Dit stroomverbruik is aan het jaarverbruik toegevoegd.' : 'Charges the car at home. This electricity use is added to annual demand.'),
      extraSummary: row.key === 'airco' && Number(products.energy?.addedBatteryHomeKwh) > 0
        ? {
            label: lang === 'nl' ? 'Extra batterijlevering aan huis in dit scenario' : 'Additional battery power delivered to the home',
            value: `${formatKwh(products.energy.addedBatteryHomeKwh)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
          }
        : null,
      price: Number(row.price) || 0,
      investmentEditable: row.key === 'solar',
      details: row.key === 'solar' && solarSavings?.scenarios?.realistic
        ? (() => {
            const flow = solarSavings.scenarios.realistic.energyFlows
            const selfUseValue = flow.directSelfUseKwh * (Number(input?.prijsInkoop) || 0)
            const exportValue = flow.exportedKwh * exportPriceEurPerKwh
            return [
              {
                label: lang === 'nl' ? 'Zelf gebruikt' : 'Used at home',
                value: `${formatKwh(flow.directSelfUseKwh)} kWh × ${formatEuroRate(Number(input?.prijsInkoop) || 0)}/kWh = ${formatEuro(selfUseValue)}/${lang === 'nl' ? 'jaar' : 'year'}`,
              },
              {
                label: lang === 'nl' ? 'Teruggeleverd' : 'Exported',
                value: `${formatKwh(flow.exportedKwh)} kWh × ${formatEuroRate(exportPriceEurPerKwh)}/kWh = ${formatEuro(exportValue)}/${lang === 'nl' ? 'jaar' : 'year'}`,
              },
              ...(addedSolarFeedInCosts > 0 ? [{
                label: lang === 'nl' ? 'Terugleverkosten' : 'Feed-in charges',
                value: `−${formatEuro(addedSolarFeedInCosts)}/${lang === 'nl' ? 'jaar' : 'year'}`,
              }] : []),
            ]
          })()
        : [],
      roi: row.key === 'heat-pump'
        ? products?.heatPumpROI
          ? {
            annual: products.heatPumpROI.annualSavingsEur == null ? null : formatEuro(products.heatPumpROI.annualSavingsEur),
            roi: products.heatPumpROI.roiPct == null || !Number.isFinite(Number(products.heatPumpROI.roiPct)) ? null : `${formatKwh(products.heatPumpROI.roiPct)}%`,
            payback: Number(products.heatPumpROI.paybackYears) > 0
              ? `${formatKwh(products.heatPumpROI.paybackYears)} ${lang === 'nl' ? 'jaar' : 'years'}`
              : (lang === 'nl' ? 'Niet beschikbaar' : 'Not available'),
            annualLabel: lang === 'nl' ? 'Warmtepomp bespaart per jaar' : 'Heat-pump savings per year',
            roiLabel: lang === 'nl' ? 'ROI warmtepomp' : 'Heat-pump ROI',
            paybackLabel: lang === 'nl' ? 'Terugverdientijd warmtepomp' : 'Heat-pump payback',
            note: lang === 'nl' ? 'Warmtepompmodel; niet optellen bij het totaal hieronder.' : 'Heat-pump model estimate; do not add to the total below.',
          }
          : {
              annual: lang === 'nl' ? 'Niet berekend' : 'Not calculated',
              roi: lang === 'nl' ? 'Niet berekend' : 'Not calculated',
              payback: lang === 'nl' ? 'Niet berekend' : 'Not calculated',
              annualLabel: lang === 'nl' ? 'Warmtepomp bespaart per jaar' : 'Heat-pump savings per year',
              roiLabel: lang === 'nl' ? 'ROI warmtepomp' : 'Heat-pump ROI',
              paybackLabel: lang === 'nl' ? 'Terugverdientijd warmtepomp' : 'Heat-pump payback',
              note: lang === 'nl' ? 'De gegevens voor een aparte warmtepompberekening ontbreken.' : 'Inputs for a separate heat-pump estimate are missing.',
            }
        : row.key === 'airco'
          ? {
              annual: products.plannedAirco?.savings?.scenarios?.realistic
                ? `${formatEuro(products.plannedAirco.savings.scenarios.realistic.annualNetSavingsEur)}/${lang === 'nl' ? 'jaar' : 'year'}`
                : (row.kWh == null || !Number.isFinite(Number(row.kWh)) ? null : `${formatKwh(row.kWh)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`),
              roi: products.plannedAirco?.savings?.scenarios?.realistic
                ? `${formatKwh(products.plannedAirco.savings.scenarios.realistic.roiPct)}%`
                : (lang === 'nl' ? 'Niet berekend' : 'Not calculated'),
              payback: products.plannedAirco?.savings?.scenarios?.realistic?.paybackYears > 0
                ? `${formatKwh(products.plannedAirco.savings.scenarios.realistic.paybackYears)} ${lang === 'nl' ? 'jaar' : 'years'}`
                : (products.plannedAirco?.savings?.scenarios?.realistic
                  ? (lang === 'nl' ? 'Geen positieve terugverdientijd' : 'No positive payback')
                  : (lang === 'nl' ? 'Geen terugverdientijd berekend' : 'No payback calculated')),
              annualLabel: lang === 'nl' ? 'Netto aircobesparing per jaar' : 'Net air-conditioner savings per year',
              roiLabel: lang === 'nl' ? 'ROI airco' : 'Air-conditioner ROI',
              paybackLabel: lang === 'nl' ? 'Terugverdientijd' : 'Payback',
              runningCostLabel: lang === 'nl' ? 'Geschatte stroomkosten airco' : 'Estimated AC electricity cost',
              runningCost: row.kWh != null && Number.isFinite(Number(row.kWh)) && results?.pE_used != null && Number.isFinite(Number(results.pE_used))
                ? formatEuro(Number(row.kWh) * Number(results.pE_used))
                : null,
              note: products.plannedAirco?.goal === 'cooling-heating'
                ? (lang === 'nl' ? 'Gasbesparing is berekend voor de verwarmde ruimte; gas voor tapwater en andere kamers blijft staan.' : 'Gas savings are estimated for the heated room; gas for hot water and other rooms remains.')
                : (lang === 'nl' ? 'Een airco voor koeling levert hier geen berekende besparing op. Daarom tonen we geen ROI.' : 'Cooling use has no modeled savings here, so no ROI is shown.'),
            }
          : row.key === 'solar'
            ? {
                annual: solarSavings?.scenarios?.realistic
                  ? `${formatEuro(solarSavings.scenarios.realistic.annualNetSavingsEur)}/${lang === 'nl' ? 'jaar' : 'year'}`
                  : (lang === 'nl' ? 'Niet beschikbaar' : 'Not available'),
                roi: solarSavings?.scenarios?.realistic?.roiPct == null
                  ? null
                  : `${formatKwh(solarSavings.scenarios.realistic.roiPct)}%`,
                payback: solarSavings?.scenarios?.realistic?.paybackYears > 0
                  ? `${formatKwh(solarSavings.scenarios.realistic.paybackYears)} ${lang === 'nl' ? 'jaar' : 'years'}`
                  : (lang === 'nl' ? 'Geen terugverdientijd berekend' : 'No payback calculated'),
                annualLabel: lang === 'nl' ? 'Besparing zonnepanelen' : 'Solar savings',
                roiLabel: lang === 'nl' ? 'ROI zonnepanelen' : 'Solar ROI',
                paybackLabel: lang === 'nl' ? 'Terugverdientijd zonnepanelen' : 'Solar payback',
                note: exportPriceEurPerKwh === 0
                  ? (lang === 'nl'
                    ? 'Terugleververgoeding staat op €0,00/kWh. Daardoor telt alleen stroom mee die u zelf gebruikt.'
                    : 'The export rate is €0.00/kWh, so only electricity used at home adds value.')
                  : (lang === 'nl'
                     ? 'Eigen gebruik en teruglevering zijn geschat met uw aanwezigheid overdag. Dit is indicatief, geen uurmeting.'
                     : 'Self-use and export are estimated from daytime presence. This is indicative, not hourly measurement.'),
              }
            : row.key === 'ev'
              ? {
                  annual: row.kWh == null || !Number.isFinite(Number(row.kWh)) ? null : `${formatKwh(row.kWh)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
                  roi: lang === 'nl' ? 'Niet berekend' : 'Not calculated',
                  payback: lang === 'nl' ? 'Niet berekend' : 'Not calculated',
                  annualLabel: lang === 'nl' ? 'Stroom voor de auto' : 'Electricity for the car',
                  roiLabel: lang === 'nl' ? 'ROI laadpaal' : 'Charger ROI',
                  paybackLabel: lang === 'nl' ? 'Terugverdientijd laadpaal' : 'Charger payback',
                  runningCostLabel: lang === 'nl' ? 'Geschatte stroomkosten' : 'Estimated electricity cost',
                  runningCost: row.kWh != null && Number.isFinite(Number(row.kWh)) && results?.pE_used != null && Number.isFinite(Number(results.pE_used))
                    ? formatEuro(Number(row.kWh) * Number(results.pE_used))
                    : null,
                  chargingComparison: row.kWh != null && Number.isFinite(Number(row.kWh)) && Number(row.kWh) > 0
                    ? (() => {
                        const annualKwh = Number(row.kWh)
                        const publicRate = 0.38
                        const homeRate = Number.isFinite(Number(results?.pE_used)) ? Number(results.pE_used) : 0.27
                        const solarRate = Number.isFinite(Number(results?.pT_used)) ? Number(results.pT_used) : 0.05
                        return {
                          publicCost: formatEuro(annualKwh * publicRate),
                          publicRate: formatEuro(publicRate),
                          homeCost: formatEuro(annualKwh * homeRate),
                          homeRate: formatEuro(homeRate),
                          solarCost: formatEuro(annualKwh * solarRate),
                          solarRate: formatEuro(solarRate),
                          homeSaving: formatEuro(annualKwh * (publicRate - homeRate)),
                          solarSaving: formatEuro(annualKwh * (publicRate - solarRate)),
                        }
                      })()
                    : null,
                  note: lang === 'nl' ? 'Voor besparing/ROI zijn ook de huidige brandstofkosten en gereden kilometers nodig.' : 'Fuel costs and annual mileage are needed to estimate savings and ROI.',
                }
          : null,
      image: row.key === 'solar'
        ? '/assets/products/longi-solar-panel.webp'
        : row.key === 'heat-pump' && row.model?.toLowerCase().includes('vaillant')
          ? '/assets/products/vaillant-heat-pump.webp'
          : row.key === 'heat-pump' && row.model?.toLowerCase().includes('weheat') && row.model.toLowerCase().includes('flint')
              ? '/assets/products/weheat-flint.webp'
            : row.key === 'heat-pump' && row.model?.toLowerCase().includes('weheat') && row.model.toLowerCase().includes('sparrow')
              ? '/assets/products/weheat-sparrow.webp'
              : row.key === 'ev' && products.plannedEv?.model?.brand?.toLowerCase() === 'zaptec'
                ? '/assets/products/zaptec-go-2.webp'
            : row.key === 'ev'
              ? '/assets/products/zaptec-go-2.webp'
              : row.key === 'airco' &&
                  (products.plannedAirco?.brand || products.plannedAirco?.model?.brand)?.toLowerCase() === 'haier'
                ? '/assets/products/haier-airco-indoor.webp'
              : null,
      imageCaption: row.key === 'ev' && products.plannedEv?.model?.brand?.toLowerCase() !== 'zaptec'
        ? (lang === 'nl' ? 'Voorbeeld: Zaptec Go 2' : 'Example: Zaptec Go 2')
        : row.key === 'airco' &&
            (products.plannedAirco?.brand || products.plannedAirco?.model?.brand)?.toLowerCase() === 'haier'
          ? (lang === 'nl' ? 'Haier binnenunit' : 'Haier indoor unit')
          : null,
      imageAlt: row.key === 'airco' &&
          (products.plannedAirco?.brand || products.plannedAirco?.model?.brand)?.toLowerCase() === 'lg' &&
          !products.plannedAirco?.model?.indoorCapacitiesKw?.length
        ? `${row.model || 'LG Standard Plus'} ${lang === 'nl' ? 'binnen- en buitenunit' : 'indoor and outdoor units'}`
        : row.key === 'airco' &&
            (products.plannedAirco?.brand || products.plannedAirco?.model?.brand)?.toLowerCase() === 'haier'
          ? (lang === 'nl' ? 'Haier airco-binnenunit' : 'Haier air-conditioner indoor unit')
        : row.key === 'ev' ? 'Zaptec Go 2' : row.model || row.label,
      imageNotice: null,
      images: row.key === 'airco' &&
          (products.plannedAirco?.brand || products.plannedAirco?.model?.brand)?.toLowerCase() === 'lg' &&
          !products.plannedAirco?.model?.indoorCapacitiesKw?.length
        ? [
            {
              src: '/assets/products/lg-standard-plus-indoor.png',
              alt: lang === 'nl' ? 'LG Standard Plus binnenunit' : 'LG Standard Plus indoor unit',
              label: lang === 'nl' ? 'Binnenunit' : 'Indoor unit',
            },
            {
              src: '/assets/products/lg-standard-plus-outdoor.png',
              alt: lang === 'nl' ? 'LG Standard Plus buitenunit' : 'LG Standard Plus outdoor unit',
              label: lang === 'nl' ? 'Buitenunit' : 'Outdoor unit',
            },
          ]
        : null,
      detail: row.key === 'heat-pump' && products.plannedHeatPump?.model?.kw
        ? `${formatKwh(products.plannedHeatPump.model.kw)} kW`
        : row.key === 'airco' && products.plannedAirco?.areaM2
          ? `${formatKwh(products.plannedAirco.areaM2)} m² · ${products.plannedAirco.goal === 'cooling-heating' ? (lang === 'nl' ? 'koelen en verwarmen' : 'cooling and heating') : (lang === 'nl' ? 'koelen' : 'cooling')}`
          : null,
      details: row.key === 'heat-pump' && products.heatPumpROI?.annualGasBeforeM3 != null && products.heatPumpROI?.annualGasRemainingM3 != null
        ? [{
            label: lang === 'nl' ? 'Minder gas volgens de berekening' : 'Gas reduction in this estimate',
            value: `${formatKwh(Math.max(0, products.heatPumpROI.annualGasBeforeM3 - products.heatPumpROI.annualGasRemainingM3))} m³/${lang === 'nl' ? 'jaar' : 'year'}`,
          }]
        : [],
      beforeAfter: row.key === 'heat-pump' && products.heatPumpROI
        ? {
            beforeTitle: lang === 'nl' ? 'Zonder warmtepomp' : 'Without heat pump',
            afterTitle: lang === 'nl' ? 'Met warmtepomp' : 'With heat pump',
            rows: [
              {
                label: lang === 'nl' ? 'Gasverbruik' : 'Gas use',
                before: `${formatKwh(products.heatPumpROI.annualGasBeforeM3)} m³/${lang === 'nl' ? 'jaar' : 'year'}`,
                after: `${formatKwh(products.heatPumpROI.annualGasRemainingM3)} m³/${lang === 'nl' ? 'jaar' : 'year'}`,
              },
              {
                label: lang === 'nl' ? 'Stroom warmtepomp' : 'Heat-pump electricity',
                before: `0 kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
                after: `${formatKwh(products.heatPumpROI.annualHeatPumpElectricityKwh)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
              },
              {
                label: lang === 'nl' ? 'Jaarlijkse verwarmingskosten' : 'Annual heating costs',
                before: formatEuro(products.heatPumpROI.beforeAnnualCostEur),
                after: formatEuro(products.heatPumpROI.afterAnnualCostEur),
              },
            ],
          }
        : row.key === 'airco' || row.key === 'ev'
          ? {
              beforeTitle: lang === 'nl' ? 'Voor dit product' : 'Before this product',
              afterTitle: lang === 'nl' ? 'Met dit product' : 'With this product',
              rows: [
                {
                  label: lang === 'nl' ? 'Stroomverbruik woning' : 'Home electricity use',
                  before: `${formatKwh(input?.jaarverbruik)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
                  after: `${formatKwh(Number(input?.jaarverbruik || 0) + Number(row.kWh || 0))} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
                },
                ...(results?.pE_used != null && Number.isFinite(Number(results.pE_used))
                  ? [{
                      label: lang === 'nl' ? 'Geschatte extra stroomkosten' : 'Estimated added electricity cost',
                      before: formatEuro(0),
                      after: formatEuro(Number(row.kWh || 0) * Number(results.pE_used)),
                    }]
                  : []),
              ],
            }
          : row.key === 'solar' && products.energy?.projectedSolarKwh != null
            ? {
                beforeTitle: lang === 'nl' ? 'Voor extra panelen' : 'Before extra panels',
                afterTitle: lang === 'nl' ? 'Met extra panelen' : 'With extra panels',
                rows: [{
                  label: lang === 'nl' ? 'Zonne-opwek' : 'Solar generation',
                  before: `${formatKwh(input?.zonneproductie)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
                  after: `${formatKwh(products.energy.projectedSolarKwh)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
                }],
              }
            : null,
      beforeAfter: row.key === 'solar' && results?.export_kwh_zonder != null && results?.export_kwh_with != null
        ? {
            beforeTitle: lang === 'nl' ? 'Zonder batterij' : 'Without battery',
            afterTitle: lang === 'nl' ? 'Met batterij' : 'With battery',
            rows: [{
              label: lang === 'nl' ? 'Teruglevering' : 'Electricity exported',
              before: `${formatKwh(results.export_kwh_zonder)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
              after: `${formatKwh(results.export_kwh_with)} kWh/${lang === 'nl' ? 'jaar' : 'year'}`,
            }],
          }
        : null,
    })),
  ].filter(Boolean)
  const heatPumpModelLabel = [
    products?.heatPumpROI?.model?.brand,
    products?.heatPumpROI?.model?.model,
  ].filter(Boolean).join(' ')

  const batteryTechnicalDetails = (
    <BeforeAfter
      r={results}
      res={res}
      input={input}
      lang={lang}
      returnSummary={isCombination && combinedROI ? {
        annualLow: combinedROI.annualLowEur,
        annualHigh: combinedROI.annualHighEur,
        paybackLow: combinedROI.paybackLowYears,
        paybackHigh: combinedROI.paybackHighYears,
      } : null}
      showReturnSummary={!isCombination || Boolean(combinedROI)}
    />
  )
  const addHouseholdMeasure = (measure) => {
    let savedForm = {}
    try {
      savedForm = JSON.parse(sessionStorage.getItem('voltrax_form') || '{}') || {}
    } catch {
      savedForm = {}
    }
    const isAddOnScenario = Boolean(products?.baseBatteryResults)
    const nextForm = measure === 'heat-pump'
      ? {
          ...savedForm,
          ...(isAddOnScenario ? {
            zonneproductie: String(input?.zonneproductie ?? ''),
            jaarverbruik: String(input?.jaarverbruik ?? ''),
            teruglevering: String(input?.teruglevering ?? ''),
            battery_price: String(input?.battery_price ?? ''),
            planned_solar: false,
            planned_ev: false,
            planned_heat_pump: false,
          } : {}),
          product_mode: 'combination',
          planned_heat_pump: true,
        }
      : { ...savedForm, planned_ev: true }
    sessionStorage.setItem('voltrax_form', JSON.stringify(nextForm))
    navigate('/calculator', { state: { step: 1, addMeasure: measure } })
  }
  const submitElectricalAddOn = async () => {
    setAddMeasureError('')
    setAddMeasureNotice('')
    const parsePositive = (value) => {
      const parsed = Number.parseFloat(String(value ?? '').trim().replace(',', '.'))
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }
    const investment = Number.parseFloat(String(addMeasureForm.investmentEur).replace(',', '.'))
    if (!Number.isFinite(investment) || investment <= 0) {
      setAddMeasureError(lang === 'nl' ? 'Vul de product- en installatieprijs in om de ROI te berekenen.' : 'Enter the product and installation cost to calculate ROI.')
      return
    }
    const cheapChargePrice = Number.parseFloat(String(addMeasureForm.cheapChargePrice).trim().replace(',', '.'))
    if (addMeasure === 'airco' &&
        (!Number.isFinite(cheapChargePrice) || cheapChargePrice <= 0 || cheapChargePrice > 1)) {
      setAddMeasureError(lang === 'nl'
        ? 'Vul een gemiddelde laadprijs tussen € 0,01 en € 1,00 per kWh in.'
        : 'Enter an average charge price between €0.01 and €1.00 per kWh.')
      return
    }
    let extraKwh
    let details
    if (addMeasure === 'airco') {
      const area = parsePositive(addMeasureForm.areaM2)
      const estimate = area && estimateAircoAnnualElectricity(
        [{ areaM2: area, insulationLevel: addMeasureForm.insulation }],
        addMeasureForm.aircoGoal,
      )
      if (!estimate) {
        setAddMeasureError(lang === 'nl' ? 'Vul een geldig ruimte-oppervlak in.' : 'Enter a valid room area.')
        return
      }
      if (estimate.heatingThermalKwh > 0 &&
          !['gas', 'direct-electric', 'none'].includes(addMeasureForm.existingHeatingSystem)) {
        setAddMeasureError(lang === 'nl'
          ? 'Kies welke verwarming de airco vervangt. Zo voorkomen we een verzonnen gasbesparing.'
          : 'Choose which heating source the air conditioner replaces so we do not invent a gas saving.')
        return
      }
      extraKwh = estimate.coolingElectricityKwh + (estimate.heatingElectricityKwh || 0)
      const capacityKw = area * (AIRCO_WATTS_PER_M2[addMeasureForm.insulation] || AIRCO_WATTS_PER_M2.unknown) / 1000
      const model = getSmallestSingleSplitOptions(capacityKw)[0] || null
      const savings = calculateAircoSavings({
        annualHeatDeliveredKwh: estimate.heatingThermalKwh || 0,
        annualCoolingDeliveredKwh: estimate.coolingThermalKwh || 0,
        heatingScop: estimate.scop,
        coolingSeer: estimate.seer,
        existingHeatingSystem: estimate.heatingThermalKwh > 0
          ? addMeasureForm.existingHeatingSystem
          : null,
        directHeaterEfficiency: 1,
        gasEnergyKwhPerM3: 9.77,
        boilerEfficiencyPct: 90,
        gasPricePerM3: 1.55,
        electricityPriceEurPerKwh: Number(input?.pE_used) || Number(input?.prijsInkoop) || 0.30,
        investmentEur: investment,
        annualMaintenanceEur: 0,
      })
      details = {
        areaM2: area,
        insulation: addMeasureForm.insulation,
        goal: addMeasureForm.aircoGoal,
        cheapChargePriceEurPerKwh: cheapChargePrice,
        estimate,
        savings,
        ...(model ? { brand: model.brand, model: { ...model, model: model.model || model.range } } : {}),
      }
    } else {
      extraKwh = parsePositive(addMeasureForm.annualKwh)
      if (!extraKwh) {
        setAddMeasureError(lang === 'nl' ? 'Vul het verwachte jaarverbruik in kWh in.' : 'Enter the expected annual use in kWh.')
        return
      }
      details = { annualKwh: extraKwh }
    }
    if (!input || !Number.isFinite(Number(input.jaarverbruik))) {
      setAddMeasureError(lang === 'nl' ? 'De opgeslagen uitgangsberekening ontbreekt. Bereken eerst de batterij opnieuw.' : 'The saved baseline is missing. Recalculate the battery first.')
      return
    }
    setAddMeasureBusy(true)
    try {
      const scenario = buildEnergyScenario({
        solarProduction: input.zonneproductie,
        annualConsumption: input.jaarverbruik,
        gridExport: input.teruglevering,
        plannedHeatPumpKwh: 0,
        plannedAircoKwh: addMeasure === 'airco' ? extraKwh : 0,
        plannedEvKwh: addMeasure === 'ev' ? extraKwh : 0,
        batteryCapacityKwh: input?.battery_kWh,
      })
      const heatPumpHomeDemand = products?.plannedHeatPump?.selected
        ? Number(products?.energy?.heatPumpSeasonalGridImportKwh) || 0
        : 0
      const nextInput = {
        ...input,
        zonneproductie: scenario.projectedSolarKwh,
        jaarverbruik: scenario.projectedConsumptionKwh,
        teruglevering: scenario.calculationGridExportKwh,
        epex_optimization_supported: Number(input?.battery_kWh) > 0,
        epex_home_use_kwh: heatPumpHomeDemand + (addMeasure === 'airco' ? extraKwh : 0),
        battery_cheap_charge_price_eur_per_kwh: addMeasure === 'airco'
          ? cheapChargePrice
          : Number(input?.battery_cheap_charge_price_eur_per_kwh)
            || Number(products?.energy?.batteryCheapChargePriceEurPerKwh)
            || 0.15,
        // Keep add-on prices out of the battery-only API result. Package
        // investment and payback are calculated separately below.
        battery_price: Number(products?.baseBatteryInvestment ?? input.battery_price ?? 0),
      }
      const response = await axios.post('/api/calculate', nextInput)
      const baselineBatteryHomeKwh = getBatteryHomeKwh(results)
      const addedBatteryHomeKwh = addMeasure === 'airco'
        ? Math.min(
            extraKwh,
            Math.max(0, getBatteryHomeKwh(response.data) - baselineBatteryHomeKwh),
          )
        : 0
      const previousAircoSavings = Number(products?.plannedAirco?.savings?.scenarios?.realistic?.annualNetSavingsEur) || 0
      const addedAircoSavings = addMeasure === 'airco'
        ? Number(details.savings?.scenarios?.realistic?.annualNetSavingsEur) || 0
        : 0
      const aircoAnnualSavings = previousAircoSavings + addedAircoSavings
      const hasHeatPumpCombination = products?.mode === 'combination' && Boolean(products?.heatPumpROI)
      const combinedResults = aircoAnnualSavings && !hasHeatPumpCombination
        ? {
            ...response.data,
            total_annual_low: response.data.total_annual_low + aircoAnnualSavings,
            total_annual_high: response.data.total_annual_high + aircoAnnualSavings,
          }
        : response.data
      combinedResults.total_daily_low = combinedResults.total_annual_low / 365
      combinedResults.total_daily_high = combinedResults.total_annual_high / 365
      const nextProducts = {
        ...(products || {}),
        baseBatteryResults: products?.baseBatteryResults || results,
        baseBatteryInvestment: products?.baseBatteryInvestment ?? Number(input.battery_price || 0),
        batteryScenarioResults: response.data,
        addOnInvestment: Number(products?.addOnInvestment || 0) + investment,
        energy: {
          ...scenario,
          hasPlannedChanges: true,
          addedBatteryHomeKwh,
          batteryCheapChargePriceEurPerKwh: nextInput.battery_cheap_charge_price_eur_per_kwh,
        },
        ...(addMeasure === 'airco'
          ? { plannedAirco: { selected: true, annualKwh: Number(products?.plannedAirco?.annualKwh || 0) + extraKwh, price: Number(products?.plannedAirco?.price || 0) + investment, ...details } }
          : { plannedEv: { selected: true, annualKwh: Number(products?.plannedEv?.annualKwh || 0) + extraKwh, price: Number(products?.plannedEv?.price || 0) + investment } }),
      }
      const packageInvestment = Number(nextProducts.baseBatteryInvestment || 0) + Number(nextProducts.addOnInvestment || 0)
      const hasUnmodeledProduct = Boolean(
        nextProducts.plannedEv?.selected ||
        nextProducts.plannedSolar?.selected ||
        (nextProducts.plannedAirco?.selected && nextProducts.plannedAirco?.savings?.status !== 'ready')
      )
      combinedResults.package_roi_complete = !hasUnmodeledProduct
      if (hasHeatPumpCombination && !hasUnmodeledProduct) {
        const additionalProducts = [
          nextProducts.plannedAirco,
          nextProducts.plannedSolar,
          nextProducts.plannedEv,
        ].filter((product) => product?.selected)
        const additionalPricesComplete = additionalProducts.every((product) => Number(product.price) > 0)
        const modeledAdditionalGasSavings = nextProducts.plannedAirco?.selected
          ? getAdditionalAircoGasSavings(nextProducts.plannedAirco.savings, products.heatPumpROI)
          : 0
        const packageResult = calculateCombinedROI({
          batteryResults: response.data,
          batteryWithoutHeatPumpResults: nextProducts.batteryWithoutHeatPumpResults,
          batteryInvestmentEur: nextProducts.baseBatteryInvestment,
          heatPumpROI: products.heatPumpROI,
          additionalInvestmentEur: additionalPricesComplete
            ? additionalProducts.reduce((sum, product) => sum + Number(product.price), 0)
            : null,
          hasAdditionalInvestment: additionalProducts.length > 0,
          additionalProductsModeled: modeledAdditionalGasSavings !== null,
          additionalGasSavingsEur: modeledAdditionalGasSavings || 0,
        })
        if (packageResult) {
          combinedResults.total_annual_low = packageResult.annualLowEur
          combinedResults.total_annual_high = packageResult.annualHighEur
          combinedResults.total_daily_low = packageResult.annualLowEur / 365
          combinedResults.total_daily_high = packageResult.annualHighEur / 365
          combinedResults.payback_low = packageResult.paybackLowYears
          combinedResults.payback_high = packageResult.paybackHighYears
          combinedResults.ten_year_net_low_eur = packageResult.tenYearNetLowEur
          combinedResults.ten_year_net_high_eur = packageResult.tenYearNetHighEur
        } else {
          combinedResults.package_roi_complete = false
          combinedResults.payback_low = null
          combinedResults.payback_high = null
          combinedResults.ten_year_net_low_eur = null
          combinedResults.ten_year_net_high_eur = null
        }
      }
      if (!hasUnmodeledProduct && packageInvestment > 0 &&
        !hasHeatPumpCombination &&
        combinedResults.total_annual_low > 0 && combinedResults.total_annual_high > 0) {
        combinedResults.payback_low = packageInvestment / combinedResults.total_annual_high
        combinedResults.payback_high = packageInvestment / combinedResults.total_annual_low
        combinedResults.ten_year_net_low_eur = combinedResults.total_annual_low * 10 - packageInvestment
        combinedResults.ten_year_net_high_eur = combinedResults.total_annual_high * 10 - packageInvestment
      } else {
        combinedResults.payback_low = null
        combinedResults.payback_high = null
        combinedResults.ten_year_net_low_eur = null
        combinedResults.ten_year_net_high_eur = null
      }
      setInput(nextInput)
      setProducts(nextProducts)
       setResults(combinedResults)
      sessionStorage.setItem('voltrax_input', JSON.stringify(nextInput))
      sessionStorage.setItem('voltrax_products', JSON.stringify(nextProducts))
       sessionStorage.setItem('voltrax_results', JSON.stringify(combinedResults))
      sessionStorage.setItem(RESULTS_MODEL_VERSION_KEY, CALCULATION_RESULTS_VERSION)
      const formatted = new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { maximumFractionDigits: 0 }).format(extraKwh)
      setAddMeasureNotice(lang === 'nl'
        ? `De uitslag is bijgewerkt met ${formatted} kWh extra verbruik per jaar.`
        : `Results updated with ${formatted} kWh additional annual use.`)
    } catch {
      setAddMeasureError(lang === 'nl'
        ? 'De nieuwe berekening lukte niet. De vorige uitslag is behouden.'
        : 'The updated calculation failed. Your previous result is unchanged.')
    } finally {
      setAddMeasureBusy(false)
    }
  }

  const updateSolarInvestment = (rawValue) => {
    if (!products?.plannedSolar?.selected) return
    const price = rawValue === '' ? '' : Math.max(0, Number(rawValue) || 0)
    const nextProducts = {
      ...products,
      plannedSolar: { ...products.plannedSolar, price },
    }
    nextProducts.addOnInvestment = Math.max(
      0,
      (Number(products.addOnInvestment) || 0)
        + (Number(price) || 0)
        - (Number(products.plannedSolar.price) || 0),
    )
    setProducts(nextProducts)
    sessionStorage.setItem('voltrax_products', JSON.stringify(nextProducts))
    setResults(current => {
      if (!current) return current
      const next = { ...current, package_roi_complete: false, payback_low: null, payback_high: null }
      sessionStorage.setItem('voltrax_results', JSON.stringify(next))
      return next
    })
  }

  const productScenarioCard = (
    <Reveal className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_2px_20px_rgba(0,0,0,0.05)] sm:p-6" delay={0.9}>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-[#23342b]">{lang === 'nl' ? 'Per product' : 'By product'}</h2>
        <p className="mt-1 text-base text-[#526257]">{lang === 'nl' ? 'Dit doet elk gekozen product.' : 'What each selected product does.'}</p>
      </div>
      {products?.plannedSolar?.selected && (
        <div className="mb-5 rounded-2xl border border-[#cbd9cc] bg-[#f3f7f1] p-4" data-testid="solar-battery-package-roi">
          <h3 className="font-extrabold text-[#193829]">
            {lang === 'nl' ? 'Gezamenlijk resultaat: batterij + zonnepanelen' : 'Combined result: battery + solar'}
          </h3>
          {solarBatteryPackageROI ? (
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="block text-[#526257]">{lang === 'nl' ? 'Netto voordeel per jaar' : 'Net benefit per year'}</span>
                <strong>{formatEuro(solarBatteryPackageROI.annualLowEur)}–{formatEuro(solarBatteryPackageROI.annualHighEur)}</strong>
              </p>
              <p>
                <span className="block text-[#526257]">{lang === 'nl' ? 'Terugverdientijd totale investering' : 'Total investment payback'}</span>
                <strong>{solarBatteryPackageROI.paybackLowYears != null && solarBatteryPackageROI.paybackHighYears != null
                  ? `${formatKwh(solarBatteryPackageROI.paybackLowYears)}–${formatKwh(solarBatteryPackageROI.paybackHighYears)} ${lang === 'nl' ? 'jaar' : 'years'}`
                  : (lang === 'nl' ? 'Niet terugverdiend in deze schatting' : 'No payback in this estimate')}</strong>
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#526257]">
              {lang === 'nl'
                ? 'Gezamenlijke terugverdientijd niet berekend: beide investeringsbedragen en de uitgangsvergelijking zijn nodig.'
                : 'Combined payback not calculated: both investment amounts and the baseline comparison are required.'}
            </p>
          )}
          <p className="mt-2 text-xs leading-5 text-[#526257]">
            {lang === 'nl'
              ? 'Vergelijkt de volledige energiekosten vóór producten met de kosten mét batterij en panelen. EPEX telt één keer mee; losse productbesparingen zijn niet opgeteld.'
              : 'Compares whole-home costs before and after both products. EPEX is counted once; standalone product savings are not added.'}
          </p>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {productImpactCards.map((product) => (
          <article key={product.key} className={`overflow-hidden rounded-2xl border border-[#d5dfd3] bg-gradient-to-br from-white to-[#f5f7f0] p-5 shadow-[0_8px_24px_rgba(25,56,41,0.07)] ${product.key === 'battery' ? 'sm:col-span-2' : ''}`}>
            <div className="flex flex-col gap-4 sm:min-h-40 sm:flex-row sm:items-center sm:gap-5">
              {product.images?.length ? (
                <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-52">
                  {product.images.map((image) => (
                    <figure key={image.src} className="min-w-0 text-center">
                      <div className="flex h-36 items-center justify-center rounded-xl bg-[#eef2e9] px-2">
                        <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                      </div>
                      <figcaption className="mt-1 text-sm font-semibold text-[#334b3d]">{image.label}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : product.image ? (
                <div className={`flex w-full shrink-0 items-center justify-center rounded-2xl bg-[#eef2e9] p-4 ${product.key === 'battery' ? 'h-64 sm:h-72 sm:w-64 lg:h-80 lg:w-72' : 'h-56 sm:h-52 sm:w-48'}`}>
                  <img src={product.image} alt={product.imageAlt} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className={`flex h-56 w-full shrink-0 items-center justify-center rounded-2xl bg-[#e8eee6] px-3 text-center text-sm font-semibold text-[#405247] ${product.key === 'battery' ? 'sm:h-72 sm:w-64 lg:h-80 lg:w-72' : 'sm:h-48 sm:w-44'}`}>
                  {product.imageNotice || (lang === 'nl' ? 'Productfoto niet beschikbaar' : 'Product photo unavailable')}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-[#23342b]">{product.title}</h3>
                {product.model && product.model !== product.title && <p className="mt-1 text-base text-[#526257]">{product.model}</p>}
                {product.detail && <p className="mt-1 text-base font-semibold text-[#405247]">{product.detail}</p>}
                {product.imageCaption && <p className="mt-1 text-sm font-semibold text-[#526257]">{product.imageCaption}</p>}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-base font-bold text-[#193829]">{lang === 'nl' ? 'Wat doet dit?' : 'What it does'}</p>
              <p className="mt-1 text-base leading-relaxed text-[#405247]">{product.description}</p>
            </div>
            {product.extraSummary && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#cbd9ca] bg-white px-3 py-2">
                <span className="text-base font-semibold text-[#334b3d]">{product.extraSummary.label}</span>
                <strong className="shrink-0 text-lg text-[#193829]">{product.extraSummary.value}</strong>
              </div>
            )}
            <div className="mt-4 rounded-xl bg-[#e8eee6] p-4">
              <p className="text-base font-semibold text-[#334b3d]">{product.impactLabel}</p>
              <p className="mt-1 text-2xl font-extrabold text-[#193829] sm:text-3xl">{product.impact}</p>
            </div>
            {product.roi && (
              <div className="mt-4 grid gap-3 rounded-lg border border-[#cbd9ca] bg-white p-4 sm:grid-cols-2">
                <p className="text-base text-[#334b3d]">
                  {product.roi.annualLabel || (lang === 'nl' ? 'Jaarlijkse besparing' : 'Annual savings')}<br />
                  <strong className="text-lg text-[#193829]">{product.roi.annual || (lang === 'nl' ? 'Niet beschikbaar' : 'Not available')}</strong>
                </p>
                {product.roi.roi && (
                  <p className="text-base text-[#334b3d]">
                    {product.roi.roiLabel || (lang === 'nl' ? 'ROI per jaar' : 'ROI per year')}<br />
                    <strong className="text-lg text-[#193829]">{product.roi.roi}</strong>
                  </p>
                )}
                <p className="text-base text-[#334b3d]">
                  {product.roi.paybackLabel || (lang === 'nl' ? 'Terugverdientijd' : 'Payback')}<br />
                  <strong className="text-lg text-[#193829]">{product.roi.payback}</strong>
                </p>
                {product.roi.runningCost && (
                  <p className="text-base text-[#334b3d]">
                    {product.roi.runningCostLabel || (lang === 'nl' ? 'Geschatte stroomkosten airco' : 'Estimated AC electricity cost')}<br />
                    <strong className="text-lg text-[#193829]">{product.roi.runningCost}/{lang === 'nl' ? 'jaar' : 'year'}</strong>
                  </p>
                )}
                {product.roi.chargingComparison && (
                  <div className="text-base text-[#334b3d] sm:col-span-2">
                    {lang === 'nl' ? 'Laadkosten per jaar' : 'Annual charging cost'}:
                    {' '}{lang === 'nl' ? 'publiek' : 'public'} ({product.roi.chargingComparison.publicRate}/kWh) · {product.roi.chargingComparison.publicCost};
                    {' '}{lang === 'nl' ? 'thuis' : 'home'} ({product.roi.chargingComparison.homeRate}/kWh) · {product.roi.chargingComparison.homeCost};
                    {' '}{lang === 'nl' ? 'zonne-overschot' : 'solar surplus'} ({product.roi.chargingComparison.solarRate}/kWh) · {product.roi.chargingComparison.solarCost}.
                    <br />
                    <strong className="text-[#193829]">
                      {lang === 'nl' ? 'Voordeel t.o.v. publiek laden' : 'Saving vs public charging'}:
                      {' '}{product.roi.chargingComparison.homeSaving} {lang === 'nl' ? 'thuis' : 'at home'} · {product.roi.chargingComparison.solarSaving} {lang === 'nl' ? 'met zonnestroom' : 'with solar'}
                    </strong>
                  </div>
                )}
                {product.roi.note && <p className="text-base leading-relaxed text-[#334b3d] sm:col-span-2">{product.roi.note}</p>}
              </div>
            )}
            {product.price > 0 && (
              <p className="mt-3 border-t border-[#d5dfd3] pt-3 text-base text-[#405247]">
                {lang === 'nl' ? 'Product en installatie' : 'Product and installation'}: <strong className="text-[#193829]">{formatEuro(product.price)}</strong>
              </p>
            )}
            {product.investmentEditable && (
              <label className="mt-3 block text-base font-semibold text-[#334b3d]">
                {lang === 'nl' ? 'Investering zonnepanelen incl. installatie' : 'Solar investment including installation'}
                <span className="mt-1 flex min-h-12 items-center rounded-lg border border-[#9caf9e] bg-white px-3">
                  <span className="mr-2 text-[#526257]">€</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={products?.plannedSolar?.price ?? ''}
                    onChange={event => updateSolarInvestment(event.target.value)}
                    className="w-full border-0 bg-transparent text-base font-semibold text-[#193829] outline-none focus:ring-0"
                    placeholder={lang === 'nl' ? 'Vul bedrag in' : 'Enter amount'}
                  />
                </span>
              </label>
            )}
            {product.key !== 'battery' && (
              <details className="mt-3 rounded-xl border border-[#d5dfd3] bg-white">
                <summary className="cursor-pointer px-4 py-3 text-base font-bold text-[#244b39]">
                  {lang === 'nl' ? `Bekijk details ${product.title.toLowerCase()}` : `View ${product.title.toLowerCase()} details`}
                </summary>
                <div className="space-y-3 border-t border-[#d5dfd3] p-4 text-base leading-relaxed text-[#334b3d]">
                  {product.beforeAfter && (
                    <section className="space-y-3 border-b border-[#d5dfd3] pb-3">
                      <h4 className="font-extrabold text-[#193829]">
                        {product.beforeAfter.beforeTitle} → {product.beforeAfter.afterTitle}
                      </h4>
                      {product.beforeAfter.rows.map((row) => (
                        <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                          <span>{row.label}</span>
                          <span className="text-right">{row.before}</span>
                          <strong className="text-right text-[#193829]">{row.after}</strong>
                        </div>
                      ))}
                    </section>
                  )}
                  {product.details?.map((item) => (
                    <p key={item.label}>{item.label}: <strong className="text-[#193829]">{item.value}</strong></p>
                  ))}
                  {product.roi?.note && <p>{product.roi.note}</p>}
                  {(!product.details?.length && !product.roi?.note) && (
                    <p>{product.description}</p>
                  )}
                </div>
              </details>
            )}
          </article>
        ))}
      </div>
      {products?.energy?.hasPlannedChanges && (
        <section className="mt-4 rounded-xl bg-[#244b39] p-4 text-white" aria-label={lang === 'nl' ? 'Totaal huishouden' : 'Whole-home total'}>
          <h3 className="text-lg font-extrabold" style={{ color: '#FFFFFF' }}>{lang === 'nl' ? 'Alles samen' : 'All together'}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div><p className="text-base text-white/85">{lang === 'nl' ? 'Zonnepanelen leveren' : 'Solar production'}</p><strong className="text-lg">{formatKwh(products.energy.projectedSolarKwh)} kWh/{lang === 'nl' ? 'jaar' : 'year'}</strong></div>
            <div><p className="text-base text-white/85">{lang === 'nl' ? 'Huis gebruikt' : 'Home uses'}</p><strong className="text-lg">{formatKwh(products.energy.projectedConsumptionKwh)} kWh/{lang === 'nl' ? 'jaar' : 'year'}</strong></div>
            <div><p className="text-base text-white/85">{lang === 'nl' ? 'Terug naar het net' : 'Exported to grid'}</p><strong className="text-lg">{formatKwh(products.energy.projectedExportKwh)} kWh/{lang === 'nl' ? 'jaar' : 'year'}</strong></div>
          </div>
        </section>
      )}
      {products?.plannedEv?.selected && <p className="mt-3 text-base leading-relaxed text-[#405247]">{res.evCoverageNote}</p>}
      {products?.battery?.brand !== 'HYXiPower' && <p className="mt-3 text-base leading-relaxed text-[#405247]">{res.otherBrandAssumptionNote}</p>}
    </Reveal>
  )

  async function handleDownloadPDF() {
    setPdfLoading(true)
    try {
      const [{ pdf }, { PDFReport }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/PDFReport.jsx'),
      ])
      const blob = await pdf(<PDFReport results={results} input={input} products={products} lang={lang} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SolarFast-Energierapport-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      trackEvent('report_pdf_downloaded', { type: 'battery_or_combination' })
      URL.revokeObjectURL(url)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="sf-results min-h-screen bg-[#F7F8FA] text-[#131A20]">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="sf-results-header px-4 sm:px-6 py-3.5 bg-white/95 backdrop-blur-sm border-b border-black/[0.08] grid grid-cols-[1fr_auto_1fr] items-center sticky top-0 z-40">
        <button onClick={() => navigate('/calculator', { state: { step: 6 } })}
          className="justify-self-start flex items-center gap-1.5 text-xs sm:text-sm text-black/55 hover:text-black/80 transition-colors font-semibold whitespace-nowrap">
          <ChevronLeft className="w-4 h-4" /> {res.adjust}
        </button>
        <button onClick={() => navigate('/')} className="justify-self-center flex items-center">
          <img src="/assets/solarfast-brand/logo-black.svg" alt="SolarFast" className="h-6 sm:h-7 w-auto" />
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          className="justify-self-end flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-full bg-[#131A20] text-white hover:bg-[#29343c] transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          <Download className="w-3 h-3" />
          <span className="hidden sm:inline">{pdfLoading ? res.loadingPdf : res.downloadPdf}</span>
          <span className="sm:hidden">{pdfLoading ? '…' : 'PDF'}</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-20 space-y-5">
        <h1 className="sr-only">{lang === 'nl' ? 'Uw SolarFast energierapport' : 'Your SolarFast energy report'}</h1>
        {refreshingResults && (
          <p role="status" className="rounded-xl bg-white px-4 py-3 text-sm text-black/55 shadow-sm">
            {lang === 'nl' ? 'Opgeslagen resultaten bijwerken…' : 'Updating saved results…'}
          </p>
        )}
        {resultsRefreshError && (
          <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {res.epexRefreshError}
          </p>
        )}

        {/* ── BLOK 1: HERO ────────────────────────────────────────────────── */}
        {products?.mode === 'combination' && products?.heatPumpROI ? (
          <CombinedResults
            batteryResults={results}
            batteryWithoutHeatPumpResults={products.batteryWithoutHeatPumpResults}
            batteryComparisonUnavailable={Boolean(products.batteryComparisonUnavailable) || !products.batteryWithoutHeatPumpResults}
              batteryInvestmentEur={products?.baseBatteryInvestment ?? input?.battery_price}
            heatPumpROI={products.heatPumpROI}
            energyScenario={products.energy}
            additionalInvestmentEur={additionalProductInvestment}
            hasAdditionalInvestment={additionalProductNames.length > 0}
            additionalProductsModeled={additionalProductsModeled}
            additionalGasSavingsEur={additionalAircoGasSavingsEur || 0}
            energyScenario={products.energy}
            lang={lang}
          />
        ) : <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible"
          className="bg-[#131A20] rounded-2xl overflow-hidden relative border border-[#131A20]">

          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.05] pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#FDF891]/[0.06] pointer-events-none" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            {/* badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#FDF891] rounded-full px-3 py-1 text-xs font-bold text-[#131A20] mb-5">
              <Leaf className="w-3 h-3 text-[#131A20]" /> {res.personalReport}
            </div>

            {/* label */}
            <div className="text-white/60 text-xs font-bold uppercase tracking-[0.22em] mb-2">
              {results?.package_roi_complete === true
                ? res.combinedAnnualBenefitLabel
                : res.annualBenefitLabel}
            </div>

            {/* BIG NUMBER */}
            <div className="flex flex-wrap items-end gap-x-3 mb-2">
              <span className="text-[3.2rem] sm:text-[4rem] font-extrabold leading-none tracking-tight text-[#FDF891]">
                <AnimatedNumber to={results.total_annual_low} prefix="€" />
              </span>
              <span className="text-2xl font-light text-white/35 mb-2">–</span>
              <span className="text-[3.2rem] sm:text-[4rem] font-extrabold leading-none tracking-tight text-[#FDF891]">
                <AnimatedNumber to={results.total_annual_high} prefix="€" />
              </span>
            </div>

            <p className="text-white/70 text-sm font-medium mb-5">{res.perYear}</p>
            {products?.energy?.hasUnprofiledAdditionalLoads && (
              <p className="mb-5 rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-white/85">
                {lang === 'nl'
                  ? 'Thuisladen is aan het jaarverbruik toegevoegd. De berekening rekent hiervoor geen vaste zonne- of batterijdekking toe.'
                  : 'Home charging is included in annual use. The estimate does not assign a fixed solar or battery share to it.'}
              </p>
            )}
            {Number(input?.battery_kWh) > 0 && results?.dynamic_contract === true && (
              <div className="mb-5 rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-4 py-3 text-white">
                <div className="text-sm font-extrabold">
                  {lang === 'nl'
                    ? 'Batterijberekening: dynamisch energiecontract'
                    : 'Battery calculation: dynamic energy contract'}
                </div>
                <div className="mt-1 text-sm text-white/80">
                  {lang === 'nl'
                    ? `Huidig energiecontract: ${currentContractIsDynamic ? 'dynamisch' : 'vast'}.`
                    : `Current energy contract: ${currentContractIsDynamic ? 'dynamic' : 'fixed'}.`}
                </div>
              </div>
            )}
            {Number(products?.addOnInvestment) > 0 && (
              <p className="mb-5 text-base leading-relaxed text-white">
                {results?.package_roi_complete === true
                  ? (lang === 'nl'
                    ? 'Dit is de gezamenlijke jaarbesparing van batterij en airco, na de extra stroomkosten.'
                    : 'This is the combined annual saving from the battery and air conditioner, after added electricity costs.')
                  : (lang === 'nl'
                    ? 'Dit is het batterijvoordeel bij het nieuwe stroomverbruik. Het complete productrendement is nog niet berekend.'
                    : 'This is the battery benefit at the updated electricity use. Complete product ROI is not yet calculated.')}
              </p>
            )}
            {showSwitchSavings && (
              <div className="text-xs text-white/75 -mt-3 mb-5 space-y-1">
                <p className="font-semibold">{res.dynamicBatteryScenarioNote}</p>
                <p>
                  <span className="font-bold">{res.switchToDynamicLabel}:</span>{' '}
                  € {fmt(results.switch_to_dynamic_annual_low)}–€ {fmt(results.switch_to_dynamic_annual_high)}{res.moneyPerYearUnit}
                  {' · '}{res.perMonth}: € {fmt(switchToDynamicMonthlyLow, 2)}–€ {fmt(switchToDynamicMonthlyHigh, 2)}{res.epexMonthlyUnit}
                </p>
              </div>
            )}

            {/* Payback */}
            {(Number(products?.addOnInvestment) <= 0 || results?.package_roi_complete === true) && <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2 bg-white/[0.08] rounded-xl px-4 py-2.5">
                <Clock className="w-4 h-4 text-[#FDF891] flex-shrink-0" />
                <div>
                  <div className="text-[11px] text-[#FDF891] font-bold uppercase tracking-[0.14em]">
                    {res.payback}
                  </div>
                  <div className="text-white font-extrabold text-lg leading-tight">
                    {results.payback_low == null || results.payback_high == null
                      ? (lang === 'nl' ? 'Geen terugverdientijd' : 'No payback')
                      : <>
                          <AnimatedNumber to={results.payback_low} decimals={1} />
                          {' – '}
                          <AnimatedNumber to={results.payback_high} decimals={1} suffix={` ${res.year}`} />
                        </>}
                  </div>
                </div>
              </div>
            </div>}

            {/* Divider */}
            <div className="my-5 h-px bg-white/15" />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white/[0.06] border border-white/10 rounded-xl p-3 sm:p-4">
                <div className="text-white/60 text-xs font-medium mb-1">{res.perMonth}</div>
                <div className="font-extrabold text-sm sm:text-base text-white leading-tight">
                  € <AnimatedNumber to={perMaandLow} decimals={2} /> – <AnimatedNumber to={perMaandHigh} decimals={2} />
                </div>
              </div>
              <div className="bg-white/[0.06] border border-white/10 rounded-xl p-3 sm:p-4">
                <div className="text-white/60 text-xs font-medium mb-1">{res.perDayLabel}</div>
                <div className="font-extrabold text-sm sm:text-base text-white leading-tight">
                  € <AnimatedNumber to={results.total_daily_low} decimals={2} /> – <AnimatedNumber to={results.total_daily_high} decimals={2} />
                </div>
              </div>
              <div className="bg-white/[0.06] border border-white/10 rounded-xl p-3 sm:p-4">
                <div className="text-white/60 text-[10px] sm:text-xs font-medium mb-1">
                  {Number(products?.addOnInvestment) > 0
                    ? (lang === 'nl' ? 'Totale investering · incl. installatie' : 'Total investment · incl. installation')
                    : `${res.investment} · ${lang === 'nl' ? 'incl. btw + installatie' : 'incl. VAT + installation'}`}
                </div>
                <div className="font-extrabold text-sm sm:text-base text-white leading-tight">
                  € <AnimatedNumber to={displayedInvestment} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>}

        {products && productScenarioCard}
        <div className="mt-5">{batteryTechnicalDetails}</div>

        <Reveal className="rounded-2xl border border-[#244b39]/15 bg-[#eef3ec] p-5 sm:p-7" delay={0.25}>
          <h2 className="text-xl font-extrabold text-[#1c3829]">
            {lang === 'nl' ? 'Nog een product toevoegen?' : 'Add another product?'}
          </h2>
          <p className="mt-1 text-sm text-[#526257]">
            {lang === 'nl'
              ? 'Elk gekozen product krijgt een eigen overzicht. De totale uitkomst wordt daarna opnieuw berekend.'
              : 'Each selected product gets its own breakdown. The combined result is then recalculated.'}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              aria-pressed={addMeasure === 'heat-pump'}
              onClick={() => { setAddMeasure('heat-pump'); setAddMeasureError(''); setAddMeasureNotice('') }}
              className={`min-h-12 rounded-xl px-4 py-3 text-left text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244b39] ${addMeasure === 'heat-pump' ? 'bg-[#244b39] text-white' : 'border border-[#244b39]/20 bg-white text-[#244b39]'}`}
            >
              {lang === 'nl' ? 'Warmtepomp' : 'Heat pump'}
            </button>
            <button
              type="button"
              aria-pressed={addMeasure === 'airco'}
              disabled={Boolean(products?.plannedAirco?.selected)}
              onClick={() => { setAddMeasure('airco'); setAddMeasureError(''); setAddMeasureNotice('') }}
              className={`min-h-12 rounded-xl px-4 py-3 text-left text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244b39] disabled:cursor-not-allowed disabled:opacity-60 ${addMeasure === 'airco' ? 'bg-[#244b39] text-white' : 'border border-[#244b39]/20 bg-white text-[#244b39]'}`}
            >
              {products?.plannedAirco?.selected
                ? (lang === 'nl' ? 'Airco toegevoegd' : 'Air conditioning added')
                : (lang === 'nl' ? 'Airco' : 'Air conditioning')}
            </button>
            <button
              type="button"
              aria-pressed={addMeasure === 'ev'}
              disabled={Boolean(products?.plannedEv?.selected)}
              onClick={() => { setAddMeasure('ev'); setAddMeasureError(''); setAddMeasureNotice('') }}
              className={`min-h-12 rounded-xl px-4 py-3 text-left text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244b39] disabled:cursor-not-allowed disabled:opacity-60 ${addMeasure === 'ev' ? 'bg-[#244b39] text-white' : 'border border-[#244b39]/20 bg-white text-[#244b39]'}`}
            >
              {products?.plannedEv?.selected
                ? (lang === 'nl' ? 'Laadpaal toegevoegd' : 'EV charger added')
                : (lang === 'nl' ? 'Laadpaal / elektrisch rijden' : 'EV charger / driving')}
            </button>
          </div>
          {addMeasure === 'heat-pump' && (
            <div className="mt-4 rounded-xl bg-white p-4">
              <p className="text-sm text-[#526257]">
                {lang === 'nl'
                  ? 'We nemen uw batterijgegevens mee. In de volgende stap vult u onder meer gasverbruik, woningisolatie en afgiftesysteem in; daarna verschijnt de nieuwe gezamenlijke uitslag.'
                  : 'Your battery details are retained. The next steps ask for gas use, home insulation and heating emitters before showing the updated combined result.'}
              </p>
              <button type="button" onClick={() => addHouseholdMeasure('heat-pump')} className="mt-3 rounded-xl bg-[#244b39] px-5 py-3 text-sm font-bold text-white hover:bg-[#183c2b]">
                {lang === 'nl' ? 'Warmtepompgegevens invullen' : 'Enter heat-pump details'}
              </button>
            </div>
          )}
          {(addMeasure === 'airco' || addMeasure === 'ev') && (
            <div className="mt-4 grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-2">
              {addMeasure === 'airco' ? (
                <>
                  <label className="text-sm font-semibold text-[#244b39]">
                    {lang === 'nl' ? 'Te koelen / verwarmen ruimte' : 'Room to cool / heat'}
                    <span className="mt-1 block">
                      <input type="number" min="1" step="1" value={addMeasureForm.areaM2} onChange={(event) => setAddMeasureForm((current) => ({ ...current, areaM2: event.target.value }))} className="w-full rounded-lg border border-black/15 px-3 py-2 text-[#131A20]" placeholder="bijv. 35 m²" />
                    </span>
                  </label>
                  <label className="text-sm font-semibold text-[#244b39]">
                    {lang === 'nl' ? 'Isolatie' : 'Insulation'}
                    <select value={addMeasureForm.insulation} onChange={(event) => setAddMeasureForm((current) => ({ ...current, insulation: event.target.value }))} className="mt-1 block w-full rounded-lg border border-black/15 px-3 py-2 text-[#131A20]">
                      <option value="good">{lang === 'nl' ? 'Goed' : 'Good'}</option>
                      <option value="average">{lang === 'nl' ? 'Gemiddeld' : 'Average'}</option>
                      <option value="poor">{lang === 'nl' ? 'Matig / slecht' : 'Poor'}</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-[#244b39]">
                    {lang === 'nl' ? 'Gebruik' : 'Use'}
                    <select value={addMeasureForm.aircoGoal} onChange={(event) => setAddMeasureForm((current) => ({ ...current, aircoGoal: event.target.value }))} className="mt-1 block w-full rounded-lg border border-black/15 px-3 py-2 text-[#131A20]">
                      <option value="cooling">{lang === 'nl' ? 'Alleen koelen' : 'Cooling only'}</option>
                      <option value="cooling-heating">{lang === 'nl' ? 'Koelen en verwarmen' : 'Cooling and heating'}</option>
                    </select>
                  </label>
                  {addMeasureForm.aircoGoal === 'cooling-heating' && (
                    <label className="text-sm font-semibold text-[#244b39]">
                      {lang === 'nl' ? 'Huidige verwarming' : 'Current heating'}
                      <select
                        value={addMeasureForm.existingHeatingSystem}
                        onChange={(event) => setAddMeasureForm((current) => ({
                          ...current,
                          existingHeatingSystem: event.target.value,
                        }))}
                        className="mt-1 block w-full rounded-lg border border-black/15 px-3 py-2 text-[#131A20]"
                      >
                        <option value="">{lang === 'nl' ? 'Kies…' : 'Select…'}</option>
                        <option value="gas">{lang === 'nl' ? 'Cv-ketel op gas' : 'Gas boiler'}</option>
                        <option value="direct-electric">{lang === 'nl' ? 'Elektrische verwarming' : 'Direct electric heating'}</option>
                        <option value="none">{lang === 'nl' ? 'Warmtepomp / anders / weet ik niet' : 'Heat pump / other / unsure'}</option>
                      </select>
                    </label>
                  )}
                </>
              ) : (
                <label className="text-sm font-semibold text-[#244b39]">
                  {lang === 'nl' ? 'Verwacht extra laadverbruik per jaar' : 'Expected additional charging per year'}
                  <span className="mt-1 block">
                    <input type="number" min="1" step="50" value={addMeasureForm.annualKwh} onChange={(event) => setAddMeasureForm((current) => ({ ...current, annualKwh: event.target.value }))} className="w-full rounded-lg border border-black/15 px-3 py-2 text-[#131A20]" placeholder="bijv. 2.000 kWh" />
                  </span>
                </label>
              )}
              <label className="text-sm font-semibold text-[#244b39]">
                {lang === 'nl' ? 'Product + installatieprijs (nodig voor ROI)' : 'Product + installation cost (required for ROI)'}
                <span className="mt-1 block">
                  <input type="number" min="0" step="100" value={addMeasureForm.investmentEur} onChange={(event) => setAddMeasureForm((current) => ({ ...current, investmentEur: event.target.value }))} className="w-full rounded-lg border border-black/15 px-3 py-2 text-[#131A20]" placeholder="€" />
                </span>
              </label>
              {aircoAddOnEstimate && (
                <p className="sm:col-span-2 rounded-lg bg-[#eef3ec] px-3 py-2 text-sm text-[#244b39]">
                  {lang === 'nl'
                    ? `Gemiddelde schatting: ${formatKwh(aircoAddOnEstimate.coolingElectricityKwh)} kWh/jaar koelen${aircoAddOnEstimate.heatingElectricityKwh == null ? '' : ` + ${formatKwh(aircoAddOnEstimate.heatingElectricityKwh)} kWh/jaar verwarmen`}.`
                    : `Average estimate: ${formatKwh(aircoAddOnEstimate.coolingElectricityKwh)} kWh/year cooling${aircoAddOnEstimate.heatingElectricityKwh == null ? '' : ` + ${formatKwh(aircoAddOnEstimate.heatingElectricityKwh)} kWh/year heating`}.`}
                </p>
              )}
              {addMeasure === 'airco' && (
                <label className="text-sm font-semibold text-[#244b39]">
                  {lang === 'nl' ? 'Gemiddelde goedkope laadprijs' : 'Average low-price charging rate'}
                  <span className="mt-1 flex items-center gap-2">
                    <span>€</span>
                    <input
                      type="number"
                      min="0.01"
                      max="1"
                      step="0.01"
                      value={addMeasureForm.cheapChargePrice}
                      onChange={(event) => setAddMeasureForm((current) => ({ ...current, cheapChargePrice: event.target.value }))}
                      className="w-full rounded-lg border border-black/15 px-3 py-2 text-[#131A20]"
                    />
                    <span>/kWh</span>
                  </span>
                  <span className="mt-1 block font-normal text-[#526257]">
                    {lang === 'nl' ? 'Standaard € 0,15/kWh; pas aan op basis van uw contract.' : 'Default €0.15/kWh; adjust to your tariff.'}
                  </span>
                </label>
              )}
              <div className="sm:col-span-2">
                <button type="button" disabled={addMeasureBusy} onClick={submitElectricalAddOn} className="rounded-xl bg-[#244b39] px-5 py-3 text-sm font-bold text-white hover:bg-[#183c2b] disabled:cursor-wait disabled:opacity-60">
                  {addMeasureBusy ? (lang === 'nl' ? 'Nieuwe ROI berekenen…' : 'Recalculating ROI…') : (lang === 'nl' ? 'Herbereken batterij-ROI' : 'Recalculate battery ROI')}
                </button>
                <p className="mt-2 text-xs text-[#526257]">
                  {lang === 'nl'
                    ? 'Gasprijs €1,55/m³ · cv-rendement 90% · tapwatergas blijft staan.'
                    : 'Gas €1.55/m³ · boiler efficiency 90% · hot-water gas remains.'}
                </p>
              </div>
            </div>
          )}
          {addMeasureError && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{addMeasureError}</p>}
          {addMeasureNotice && (
            <div role="status" className="mt-3 rounded-xl border border-[#244b39]/15 bg-white p-4">
              <p className="text-sm font-semibold text-[#244b39]">{addMeasureNotice}</p>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="block text-xs text-[#526257]">{lang === 'nl' ? 'Jaarvoordeel vóór toevoegen' : 'Annual benefit before adding'}</span>
                  <strong>{isCombination
                    ? (beforeAddOnROI ? `${formatEuro(beforeAddOnROI.annualLowEur)}–${formatEuro(beforeAddOnROI.annualHighEur)}` : (lang === 'nl' ? 'Niet berekend' : 'Not calculated'))
                    : `${formatEuro(products?.baseBatteryResults?.total_annual_low)}–${formatEuro(products?.baseBatteryResults?.total_annual_high)}`}</strong>
                </p>
                <p>
                  <span className="block text-xs text-[#526257]">{lang === 'nl' ? 'Jaarvoordeel na toevoegen' : 'Annual benefit after adding'}</span>
                  <strong>{isCombination
                    ? (combinedROI ? `${formatEuro(combinedROI.annualLowEur)}–${formatEuro(combinedROI.annualHighEur)}` : (lang === 'nl' ? 'Niet berekend' : 'Not calculated'))
                    : `${formatEuro(results?.total_annual_low)}–${formatEuro(results?.total_annual_high)}`}</strong>
                </p>
                <p>
                  <span className="block text-xs text-[#526257]">{lang === 'nl' ? 'Terugverdientijd vóór' : 'Payback before'}</span>
                  <strong>{isCombination
                    ? (beforeAddOnROI?.paybackLowYears != null && beforeAddOnROI?.paybackHighYears != null
                      ? `${formatKwh(beforeAddOnROI.paybackLowYears)}–${formatKwh(beforeAddOnROI.paybackHighYears)} ${lang === 'nl' ? 'jaar' : 'years'}`
                      : (lang === 'nl' ? 'Niet berekend' : 'Not calculated'))
                    : `${formatKwh(products?.baseBatteryResults?.payback_low)}–${formatKwh(products?.baseBatteryResults?.payback_high)} ${lang === 'nl' ? 'jaar' : 'years'}`}</strong>
                </p>
                <p>
                  <span className="block text-xs text-[#526257]">{lang === 'nl' ? 'Terugverdientijd na' : 'Payback after'}</span>
                  <strong>{isCombination
                    ? (combinedROI?.paybackLowYears != null && combinedROI?.paybackHighYears != null
                      ? `${formatKwh(combinedROI.paybackLowYears)}–${formatKwh(combinedROI.paybackHighYears)} ${lang === 'nl' ? 'jaar' : 'years'}`
                      : (lang === 'nl' ? 'Niet berekend' : 'Not calculated'))
                    : `${formatKwh(results?.payback_low)}–${formatKwh(results?.payback_high)} ${lang === 'nl' ? 'jaar' : 'years'}`}</strong>
                </p>
              </div>
            </div>
          )}
          <p className="mt-3 text-xs leading-5 text-[#526257]">
            {lang === 'nl'
              ? 'Na toevoegen worden het jaarverbruik, de netto-teruglevering en de batterijterugverdientijd opnieuw berekend.'
              : 'After adding a measure, annual use, net exports and battery payback are recalculated.'}
          </p>
        </Reveal>
        {products?.heatPumpROI && (
          isCombination ? (
            <details className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
              <summary className="flex list-none cursor-pointer items-center justify-between gap-4 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fffde0]">
                    <Zap className="h-5 w-5 text-[#131A20]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-[#131A20]">
                      {lang === 'nl' ? 'Warmtepompdetails' : 'Heat-pump details'}
                    </div>
                    <div className="mt-1 truncate text-sm text-[#405247]">
                      {heatPumpModelLabel || (lang === 'nl' ? 'Bekijk de volledige berekening' : 'View the full calculation')}
                    </div>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#405247]">
                  {lang === 'nl' ? 'Details' : 'Details'}
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </span>
              </summary>
              <div className="border-t border-black/[0.07] p-4 sm:p-6">
                <HeatPumpResults
                  result={products.heatPumpROI}
                  lang={lang}
                  combined
                  hideAnnualSummary
                />
              </div>
            </details>
          ) : (
            <HeatPumpResults result={products.heatPumpROI} lang={lang} />
          )
        )}

        {/* ── BLOK 3: SLIMME OPTIMALISATIE (collapsible) ──────────────────── */}
        {!isCombination && <Reveal delay={1.6}>
          <CollapseCard
            trigger={
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#22a55d]/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-[#22a55d]" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-base text-black/85">{res.smartTitle}</div>
                  <div className="text-sm text-black/55 mt-0.5">{res.smartSubTrigger}</div>
                </div>
              </div>
            }
          >
            <div className="pt-4 space-y-4">
              <p className="text-base text-[#334b3d] leading-relaxed">{res.smartP1}</p>
              <div className="space-y-2.5">
                {[res.smartBullet1, res.smartBullet2, res.smartBullet3].map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#22a55d] flex-shrink-0" />
                    <span className="text-base text-[#334b3d]">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </CollapseCard>
        </Reveal>}

        {/* ── WARMTEFONDS ─────────────────────────────────────────────────── */}
        <Reveal delay={2.8} className="space-y-3">

          {/* Bewust verborgen: gebruiker wil de 10-jaars netto-uitkomst niet tonen. */}
          {false && !isCombination && <div className="bg-white rounded-2xl border border-black/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.05)] p-5 sm:p-6 flex flex-col">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-black/50 mb-4">
              {isCombination
                ? (lang === 'nl' ? 'Netto na 10 jaar · combinatie' : '10-year net · combination')
                : res.netResultTitle}
            </div>
            <div className="flex-1 flex flex-col justify-center">
              {isCombination ? (
                <>
                  <div className={`text-3xl font-extrabold mb-1 ${Number(combinedROI?.tenYearNetLowEur) < 0 || Number(combinedROI?.tenYearNetHighEur) < 0 ? 'text-[#a44d3d]' : 'text-[#16804a]'}`}>
                    {hasCombinedQuotes && combinedROI?.tenYearNetLowEur != null && combinedROI?.tenYearNetHighEur != null &&
                    Number.isFinite(Number(combinedROI.tenYearNetLowEur)) && Number.isFinite(Number(combinedROI.tenYearNetHighEur))
                      ? `${formatEuro(combinedROI.tenYearNetLowEur)} – ${formatEuro(combinedROI.tenYearNetHighEur)}`
                      : (lang === 'nl' ? 'Niet beschikbaar' : 'Not available')}
                  </div>
                  {(!hasCombinedQuotes || !hasPositiveCombinedSavings) && (
                    <div className="text-sm text-black/60 leading-relaxed">
                      {!hasCombinedQuotes
                        ? (lang === 'nl' ? 'Vul beide investeringsbedragen in voor het gezamenlijke resultaat.' : 'Enter both investment amounts to see the combined result.')
                        : !combinedROI
                          ? (lang === 'nl' ? 'De vergelijking met het scenario zonder warmtepomp ontbreekt; bereken het rapport opnieuw.' : 'The comparison without the heat pump is missing; recalculate the report.')
                        : (lang === 'nl' ? 'De jaarlijkse besparing is niet in beide scenario’s positief.' : 'Annual savings are not positive in both scenarios.')}
                    </div>
                  )}
                  {hasCombinedQuotes && hasPositiveCombinedSavings && (
                    <div className="text-sm text-black/60 leading-relaxed">
                      {lang === 'nl'
                        ? 'Berekend over 10 jaar op basis van de gezamenlijke jaarbesparing, na aftrek van beide investeringen.'
                        : 'Calculated over 10 years from the combined annual savings, after deducting both investments.'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-3xl font-extrabold text-[#22a55d] mb-1">
                    {displayedTenYearNet
                      ? `€ ${fmt(displayedTenYearNet.low)} – € ${fmt(displayedTenYearNet.high)}`
                      : (lang === 'nl' ? 'Niet beschikbaar' : 'Not available')}
                  </div>
                  <div className="text-sm text-black/60 leading-relaxed">
                    {Number(products?.addOnInvestment) > 0 && results?.package_roi_complete === true
                      ? (lang === 'nl'
                        ? `Na 10 jaar, na aftrek van de totale investering van ${formatEuro(displayedInvestment)}.`
                        : `After 10 years, after subtracting the total investment of ${formatEuro(displayedInvestment)}.`)
                      : Number(products?.addOnInvestment) > 0
                        ? (lang === 'nl'
                          ? `Batterijresultaat; de investering voor extra producten en hun volledige besparing zijn niet meegerekend.`
                          : `Battery result; added-product investments and their full savings are not included.`)
                        : res.netResultSub(fmt(battery_price))}
                  </div>
                </>
              )}
            </div>
          </div>}

          <WarmtefondsFinancing lang={lang} items={warmtefondsItems} />

        </Reveal>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <Reveal className="bg-[#131A20] rounded-2xl p-8 sm:p-10 text-center border border-[#131A20]" delay={3.4}>
          <div className="w-10 h-10 rounded-xl bg-[#FDF891] flex items-center justify-center mx-auto mb-5">
            <Battery className="w-5 h-5 text-[#131A20]" />
          </div>
          <h3 className="font-extrabold text-xl text-white mb-2">{res.ctaTitle}</h3>
          <p className="text-white/70 text-base mb-6 max-w-xs mx-auto leading-relaxed">
            {res.ctaDesc}
          </p>
          <a href="mailto:info@solarfast.nl?subject=Adviesaanvraag%20thuisbatterij"
            className="inline-flex items-center gap-2 bg-[#FDF891] hover:bg-[#f2ea70] text-[#131A20] font-bold text-sm px-8 py-3.5 rounded-full hover:shadow-lg hover:shadow-black/20 transition-all">
            {res.ctaBtn} <ArrowRight className="w-4 h-4" />
          </a>
        </Reveal>

        {/* Disclaimer */}
        <div className="text-center space-y-2.5 pt-1 pb-3">
          <p className="text-base text-black/60 leading-relaxed px-4">{res.disclaimer}</p>
          <button onClick={() => navigate('/calculator', { state: { step: 6 } })}
            className="text-sm text-black/45 hover:text-black/65 transition-colors underline underline-offset-4">
            {res.recalculate}
          </button>
        </div>

      </div>
    </div>
  )
}
