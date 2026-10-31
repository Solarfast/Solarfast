import React, { useState, useEffect, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Sun, Zap, ArrowUpDown, Euro, Battery, ChevronLeft,
  ChevronRight, Info, Check, Shield, AlertTriangle
} from 'lucide-react'
import axios from 'axios'
import { useLanguage } from '../context/LanguageContext'
import { trackEvent } from '../lib/analytics.js'
import { BATTERY_BRANDS, BATTERY_PRODUCTS } from '../lib/energyProducts'
import { buildEnergyScenario } from '../lib/energyScenario'
import {
  HIGH_ANNUAL_ENERGY_TRIGGER_KWH,
  selectLargerBatteryAlternative,
  selectScenarioPrimaryBatteryRecommendation,
  shouldOfferLargerBatteryAlternative,
} from '../lib/batteryRecommendation'
import { findHeatPump } from '../lib/heatPumpProducts'
import { DEFAULT_HEAT_ASSUMPTIONS, calculateHeatPumpROI } from '../lib/heatPumpROI'
import { heatPumpCopy } from '../lib/heatPumpCopy'
import { CALCULATION_RESULTS_VERSION } from '../lib/calculationVersion'
import { getCalculationErrorMessage } from '../lib/calculationError'
import {
  ENERGY_LABELS,
  getHeatPumpAdvice,
  INSULATION_ANSWERS,
  INSULATION_PARTS,
  effectiveHeatElectricityPrice,
  getCombinationContractDefaults,
} from '../lib/heatPumpAdvice'
import HeatPumpQuestionnaire from '../components/heatPump/HeatPumpQuestionnaire'
import SafetySources from '../components/heatPump/SafetySources'
import ProductSavingsEstimator from '../components/productSavings/ProductSavingsEstimator.jsx'
import './CalculatorPage.css'
import './SolarFastMarketing.css'

const STEP_ICONS = [
  <Sun className="w-4 h-4" />,
  <Zap className="w-4 h-4" />,
  <ArrowUpDown className="w-4 h-4" />,
  <Euro className="w-4 h-4" />,
  <Battery className="w-4 h-4" />,
  <Euro className="w-4 h-4" />,
]

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir) => ({ x: dir > 0 ? -48 : 48, opacity: 0, transition: { duration: 0.08 } }),
}

function Tooltip({ text }) {
  const [show, setShow] = useState(false)
  const tooltipId = useId()
  return (
    <span className="relative ml-1.5 inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        aria-expanded={show}
        aria-describedby={show ? tooltipId : undefined}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(true)}
        className="inline-grid h-7 w-7 place-items-center rounded-full text-[#607568] hover:bg-[#e9eee5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#567a5f]"
      >
      <Info
        aria-hidden="true"
        className="h-4 w-4"
      />
      </button>
      {show && (
        <span id={tooltipId} role="tooltip" className="absolute bottom-9 left-0 z-50 w-56 rounded-xl border border-[#d4ddd2] bg-[#193829] p-3 text-xs leading-relaxed text-[#fbfaf6] shadow-lg">
          {text}
        </span>
      )}
    </span>
  )
}

function NumericInput({ label, value, onChange, unit, tooltip, placeholder, autoFocus, disabled = false }) {
  const id = useId()
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-semibold text-[#131A20] mb-2">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className="w-full bg-[#F9F7F4] border border-gray-200 rounded-2xl px-5 py-3.5 text-[#131A20] text-lg font-bold placeholder-gray-300 focus:outline-none focus:border-[#131A20] focus:ring-2 focus:ring-gray-100 transition-all pr-20 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        {unit && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">{unit}</span>
        )}
      </div>
    </div>
  )
}

function UnitToggle({ value, options, onChange }) {
  return (
    <div className="inline-flex bg-gray-100 rounded-full p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            value === opt.value
              ? 'bg-white text-[#131A20] shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function HintCard({ children }) {
  return (
    <div className="bg-[#F9F7F4] rounded-2xl p-4 text-sm text-gray-500 flex gap-3">
      <Info className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
      <p className="leading-relaxed">{children}</p>
    </div>
  )
}

function EnergyAddOnCard({ title, description, enabled, onToggle, children }) {
  return (
    <div className={`sf-calculator-card rounded-2xl border-2 transition-colors ${
      enabled ? 'border-[#22a55d] bg-[#f4fbf6]' : 'border-gray-200 bg-white'
    }`}>
      <button
        type="button"
        aria-pressed={enabled}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-4 text-left"
      >
        <span>
          <span className="block font-bold text-[#131A20]">{title}</span>
          <span className="block text-xs text-gray-400 mt-0.5">{description}</span>
        </span>
        <span className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
          enabled ? 'bg-[#22a55d] border-[#22a55d] text-white' : 'border-gray-300 text-transparent'
        }`}>
          <Check className="w-3.5 h-3.5" />
        </span>
      </button>
      {enabled && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function StepShell({ title, subtitle, children, icon }) {
  return (
    <section className="sf-calc-step-shell">
      <div className="sf-calc-step-heading">
        {icon && <div className="sf-calc-step-icon" aria-hidden="true">{icon}</div>}
        <div className="sf-calc-step-heading-copy">
          <h2 className="sf-calc-step-title">{title}</h2>
          <p className="sf-calc-step-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="sf-calc-step-content">{children}</div>
    </section>
  )
}

const parseNum = (v) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? null : n
}
const parseStrictNum = (value) => {
  if (value === '' || value == null) return null
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function BatteryHeatPumpCalculator() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, lang } = useLanguage()
  const c = t.calc
  const hpCopy = heatPumpCopy[lang] || heatPumpCopy.en
  const heatKwhPerYear = lang === 'nl' ? 'kWh/jaar' : 'kWh/year'
  const formatRate = (value) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
  const formatEnergyValue = (value) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    maximumFractionDigits: 1,
  }).format(value)

  const [step, setStep] = useState(location.state?.step ?? 1)
  const [dir, setDir] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [batteryRecommendations, setBatteryRecommendations] = useState(null)
  const [batteryRecommendationError, setBatteryRecommendationError] = useState(false)
  const [batteryFinancialRecommendations, setBatteryFinancialRecommendations] = useState(null)
  const [batteryFinancialError, setBatteryFinancialError] = useState(false)

  const [formData, setFormData] = useState(() => {
    const defaults = {
      solar_setup: 'existing',
      zonneproductie: '',
      jaarverbruik: '',
      teruglevering: '',
      prijsInkoop: '',
      terugleververgoeding_value: '',
      terugleververgoeding_unit: 'kWh',
      terugleverkosten_value: '',
      terugleverkosten_unit: 'jaar',
      battery_kWh: 15.9,
      battery_price: '',
      battery_product_id: '',
      battery_phase: '',
      battery_backup_required: false,
      battery_mode: 'catalog',
      planned_solar: false,
      planned_solar_kwh: '',
      planned_solar_price: '',
      planned_heat_pump: false,
      planned_heat_pump_kwh: '',
      planned_heat_pump_price: '',
      planned_ev: false,
      planned_ev_kwh: '',
      planned_ev_price: '',
      projected_grid_export: '',
      solar_daytime_presence: 'mixed',
      dynamic_contract: false,
      battery_cheap_charge_price_eur_per_kwh: '0.15',
      product_mode: '',
      product_mode_confirmed: false,
      heat_home_type: '',
      heat_build_period: '',
      heat_area_m2: '',
      heat_area_range: '',
      heat_energy_label: '',
      heat_gas_usage: '',
      heat_gas_range: '',
      heat_insulation: '',
      heat_emitters: '',
      heat_insulation_roof: '',
      heat_insulation_walls: '',
      heat_insulation_floor: '',
      heat_insulation_glazing: '',
      heat_boiler_age: '',
      heat_contract_type: '',
      heat_preference: '',
      heat_gas_price: String(DEFAULT_HEAT_ASSUMPTIONS.gasPricePerM3),
      heat_gas_standing_cost: String(DEFAULT_HEAT_ASSUMPTIONS.gasStandingCostEur),
      heat_gas_connection_removed: false,
      heat_electric_price: String(DEFAULT_HEAT_ASSUMPTIONS.electricPricePerKwh),
      heat_boiler_efficiency: String(DEFAULT_HEAT_ASSUMPTIONS.boilerEfficiencyPct),
      heat_gas_energy: String(DEFAULT_HEAT_ASSUMPTIONS.gasEnergyKwhPerM3),
      heat_hybrid_coverage: String(DEFAULT_HEAT_ASSUMPTIONS.hybridCoveragePct),
      heat_flow_temperature: String(DEFAULT_HEAT_ASSUMPTIONS.flowTemperature),
      heat_custom_scop: '',
      heat_pump_product_id: '',
      heat_pump_price: '',
    }
    try {
      const saved = JSON.parse(sessionStorage.getItem('voltrax_form') || 'null')
      if (!saved) return defaults
      const isLegacyForm = !('battery_mode' in saved) && !('battery_product_id' in saved)
      return {
        ...defaults,
        ...saved,
        heat_gas_price: String(saved.heat_gas_price) === '1.35'
          ? String(DEFAULT_HEAT_ASSUMPTIONS.gasPricePerM3)
          : (saved.heat_gas_price ?? defaults.heat_gas_price),
        // Earlier range selections stored a midpoint in this field. Clear those
        // values so a calculated estimate is not silently presented as exact use.
        heat_gas_usage: saved.heat_gas_range ? '' : (saved.heat_gas_usage ?? ''),
        heat_gas_range: '',
        terugleververgoeding_value: saved.terugleververgoeding_value === '' && saved.prijsTeruglevering
          ? saved.prijsTeruglevering
          : (saved.terugleververgoeding_value ?? ''),
        product_mode: saved.product_mode_confirmed === true
          ? (saved.product_mode || (saved.planned_heat_pump ? 'combination' : 'battery'))
          : '',
        product_mode_confirmed: saved.product_mode_confirmed === true,
        battery_mode: isLegacyForm ? 'manual' : (saved.battery_mode || 'catalog'),
        battery_phase: saved.battery_product_id
          ? (BATTERY_PRODUCTS.find((product) => product.id === saved.battery_product_id)?.phase || saved.battery_phase || '')
          : (saved.battery_phase || ''),
      }
    } catch {
      return defaults
    }
  })
  const [selectedBrand, setSelectedBrand] = useState('HYXiPower')

  const updateMany = (patch) => setFormData((prev) => {
    const next = { ...prev, ...patch }
    sessionStorage.setItem('voltrax_form', JSON.stringify(next))
    return next
  })
  const update = (key, val) => updateMany({ [key]: val })

  const selectedBatteryProduct = BATTERY_PRODUCTS.find((product) => product.id === formData.battery_product_id)
  const chooseBatteryPhase = (phase) => {
    const compatibleBrands = BATTERY_BRANDS.filter((brand) =>
      BATTERY_PRODUCTS.some((product) => product.brand === brand && product.phase === phase),
    )
    if (!compatibleBrands.includes(selectedBrand)) {
      setSelectedBrand(compatibleBrands[0] || BATTERY_BRANDS[0])
    }

    const selectedModelNeedsClearing = selectedBatteryProduct && selectedBatteryProduct.phase !== phase
    updateMany({
      battery_phase: phase,
      ...(selectedModelNeedsClearing ? { battery_product_id: '', battery_price: '' } : {}),
    })
  }
  const heatAdvice = getHeatPumpAdvice(formData)
  const selectedHeatPump = findHeatPump(formData.heat_pump_product_id) || heatAdvice?.suggestedModel
  const heatHome = {
    type: formData.heat_home_type,
    buildPeriod: formData.heat_build_period,
    areaM2: parseStrictNum(formData.heat_area_m2),
    areaRange: formData.heat_area_range,
    gasUseM3: parseStrictNum(formData.heat_gas_usage),
    gasUseRange: formData.heat_gas_range,
    insulation: heatAdvice?.insulationLevel || formData.heat_insulation,
    energyLabel: formData.heat_energy_label,
    insulationDetails: Object.fromEntries(INSULATION_PARTS.map((part) => [
      part,
      formData[`heat_insulation_${part}`] || '',
    ])),
    emitters: formData.heat_emitters,
    boilerAgeYears: parseStrictNum(formData.heat_boiler_age),
    contractType: formData.heat_contract_type,
    statedElectricPricePerKwh: parseStrictNum(formData.heat_electric_price),
    gasStandingCostEur: formData.heat_gas_standing_cost === ''
      ? 0
      : parseStrictNum(formData.heat_gas_standing_cost),
    gasConnectionRemoved: formData.heat_gas_connection_removed === true,
  }
  const heatPumpOnly = formData.product_mode === 'heat-pump'
  const isHeatCombination = formData.product_mode === 'combination' && formData.planned_heat_pump
  const heatPumpElectricityPrice = effectiveHeatElectricityPrice(formData.heat_electric_price, {
    isCombination: isHeatCombination,
    isDynamic: formData.heat_contract_type === 'dynamic',
  })
  const heatGasStandingCost = formData.heat_gas_standing_cost === ''
    ? 0
    : parseStrictNum(formData.heat_gas_standing_cost)
  const heatCoverageValue = selectedHeatPump?.config === 'all-electric'
    ? 100
    : heatAdvice?.hybridCoveragePct
  const heatScopValue = selectedHeatPump
    ? (heatAdvice?.flowTemperature === 35 ? selectedHeatPump.scop35 : selectedHeatPump.scop55)
    : null
  const heatInputsAreFinite = [
    heatAdvice?.annualHeatDemandKwh,
    parseStrictNum(formData.heat_gas_price),
    heatPumpElectricityPrice,
    heatGasStandingCost,
    DEFAULT_HEAT_ASSUMPTIONS.boilerEfficiencyPct,
    DEFAULT_HEAT_ASSUMPTIONS.gasEnergyKwhPerM3,
    heatCoverageValue,
    heatAdvice?.flowTemperature,
    heatScopValue,
  ].every(Number.isFinite) && heatGasStandingCost >= 0
  const heatPriceOverride = heatPumpOnly ? formData.heat_pump_price : formData.planned_heat_pump_price
  const heatInvestmentInput = heatPriceOverride === ''
    ? selectedHeatPump?.finalPriceEur
    : parseStrictNum(heatPriceOverride)
  const heatInvestmentIsFinite = Number.isFinite(heatInvestmentInput) && heatInvestmentInput > 0
  let heatPumpROI = null
  if (selectedHeatPump && heatAdvice && formData.heat_contract_type &&
      heatInputsAreFinite && heatInvestmentIsFinite) {
    try {
      heatPumpROI = { ...calculateHeatPumpROI({
        model: selectedHeatPump,
        annualHeatDemandKwh: heatAdvice.annualHeatDemandKwh,
        gasPricePerM3: formData.heat_gas_price,
        electricPricePerKwh: heatPumpElectricityPrice,
        boilerEfficiencyPct: DEFAULT_HEAT_ASSUMPTIONS.boilerEfficiencyPct,
        gasEnergyKwhPerM3: DEFAULT_HEAT_ASSUMPTIONS.gasEnergyKwhPerM3,
        hybridCoveragePct: heatAdvice.hybridCoveragePct,
        flowTemperature: heatAdvice.flowTemperature,
        investmentEur: heatInvestmentInput,
        totalGasUseM3: formData.heat_gas_usage,
        gasStandingCostEur: heatGasStandingCost,
        gasConnectionRemoved: formData.heat_gas_connection_removed === true,
      }), advice: heatAdvice, home: heatHome }
    } catch {
      heatPumpROI = null
    }
  }
  const combinationAdviceReady = !isHeatCombination
    || Boolean(formData.heat_pump_product_id && heatPumpROI)
  const plannedSolarKwh = formData.planned_solar ? parseNum(formData.planned_solar_kwh) || 0 : 0
  const plannedHeatPumpKwh = formData.planned_heat_pump
    ? (heatPumpROI?.annualHeatPumpElectricityKwh ?? 0)
    : 0
  const plannedHeatPumpHotWaterKwh = formData.planned_heat_pump
    ? (heatPumpROI?.annualHotWaterElectricityKwh ?? 0)
    : 0
  const plannedHeatPumpSpaceHeatingKwh = Math.max(
    0, plannedHeatPumpKwh - plannedHeatPumpHotWaterKwh,
  )
  const plannedEvKwh = formData.planned_ev ? parseNum(formData.planned_ev_kwh) || 0 : 0
  const energyScenario = buildEnergyScenario({
    solarProduction: formData.zonneproductie,
    annualConsumption: formData.jaarverbruik,
    gridExport: formData.teruglevering,
    plannedSolarKwh,
    solarDaytimePresence: formData.solar_daytime_presence,
    plannedHeatPumpKwh,
    plannedHeatPumpSpaceHeatingKwh,
    plannedHeatPumpHotWaterKwh,
    plannedEvKwh,
    projectedGridExport: formData.projected_grid_export,
  })

  useEffect(() => {
    if (selectedBatteryProduct) setSelectedBrand(selectedBatteryProduct.brand)
  }, [selectedBatteryProduct])

  useEffect(() => {
    if (step !== 5 || heatPumpOnly) return undefined
    if (isHeatCombination && !combinationAdviceReady) {
      setBatteryRecommendations(null)
      setBatteryFinancialRecommendations(null)
      setBatteryRecommendationError(false)
      setBatteryFinancialError(false)
      return undefined
    }
    if (!formData.battery_phase) {
      setBatteryRecommendations(null)
      setBatteryFinancialRecommendations(null)
      setBatteryRecommendationError(false)
      setBatteryFinancialError(false)
      return undefined
    }
    if (formData.battery_backup_required && formData.battery_phase !== '3-phase') {
      setBatteryRecommendations([])
      setBatteryFinancialRecommendations([])
      setBatteryRecommendationError(false)
      setBatteryFinancialError(false)
      return undefined
    }
    const phaseProducts = BATTERY_PRODUCTS.filter((product) => product.phase === formData.battery_phase)
    const recommendationProducts = phaseProducts.filter((product) =>
      product.brand === 'HYXiPower' && (!formData.battery_backup_required || product.backupCapable),
    )
    const financialProducts = phaseProducts.filter((product) =>
      !formData.battery_backup_required || product.backupCapable,
    )
    if (recommendationProducts.length === 0 || financialProducts.length === 0) {
      setBatteryRecommendations([])
      setBatteryFinancialRecommendations([])
      setBatteryRecommendationError(false)
      setBatteryFinancialError(false)
      return undefined
    }
    let cancelled = false
    setBatteryRecommendations(null)
    setBatteryFinancialRecommendations(null)
    setBatteryRecommendationError(false)
    setBatteryFinancialError(false)
    const calculation = {
      zonneproductie: energyScenario.projectedSolarKwh,
      jaarverbruik: energyScenario.projectedConsumptionKwh,
      teruglevering: energyScenario.calculationGridExportKwh,
      prijsInkoop: parseNum(formData.prijsInkoop) ?? 0.28,
      prijsTeruglevering: 0,
      battery_kWh: 1,
      battery_price: 1,
      terugleververgoeding_value: parseStrictNum(formData.terugleververgoeding_value) ?? 0,
      terugleververgoeding_unit: formData.terugleververgoeding_unit,
      terugleverkosten_value: parseStrictNum(formData.terugleverkosten_value) ?? 0,
      terugleverkosten_unit: formData.terugleverkosten_unit,
      dynamic_contract: Boolean(formData.dynamic_contract),
      epex_optimization_supported: true,
      epex_home_use_kwh: formData.planned_heat_pump
        ? energyScenario.heatPumpSeasonalGridImportKwh
        : 0,
      battery_cheap_charge_price_eur_per_kwh:
        parseStrictNum(formData.battery_cheap_charge_price_eur_per_kwh) ?? 0.15,
    }
    const requestRecommendations = (products) => axios.post('/api/recommend-batteries', {
      calculation,
      candidates: products.map((product) => ({
        product_id: product.id,
        battery_kWh: product.kWh,
        battery_price: product.price,
      })),
    })
    Promise.allSettled([
      requestRecommendations(recommendationProducts),
      requestRecommendations(financialProducts),
    ]).then(([primaryResult, financialResult]) => {
      if (!cancelled) {
        if (primaryResult.status === 'fulfilled') {
          setBatteryRecommendations(primaryResult.value.data.recommendations || [])
        } else {
          setBatteryRecommendations([])
          setBatteryRecommendationError(true)
        }
        if (financialResult.status === 'fulfilled') {
          setBatteryFinancialRecommendations(financialResult.value.data.recommendations || [])
        } else {
          setBatteryFinancialRecommendations([])
          setBatteryFinancialError(true)
        }
      }
    })
    return () => { cancelled = true }
  }, [
    step,
    heatPumpOnly,
    isHeatCombination,
    combinationAdviceReady,
    selectedHeatPump?.id,
    plannedHeatPumpKwh,
    energyScenario.heatPumpSeasonalGridImportKwh,
    energyScenario.projectedSolarKwh,
    energyScenario.projectedConsumptionKwh,
    energyScenario.calculationGridExportKwh,
    formData.prijsInkoop,
    formData.terugleververgoeding_value,
    formData.terugleververgoeding_unit,
    formData.terugleverkosten_value,
    formData.terugleverkosten_unit,
    formData.dynamic_contract,
    formData.battery_cheap_charge_price_eur_per_kwh,
    formData.battery_phase,
    formData.battery_backup_required,
  ])

  const canNext = useCallback(() => {
    if (heatPumpOnly) {
      if (step === 1) return formData.product_mode_confirmed === true
      if (step === 2) return Boolean(formData.heat_home_type && formData.heat_build_period &&
        Number.isFinite(parseStrictNum(formData.heat_area_m2)) &&
        parseStrictNum(formData.heat_area_m2) >= 20 && parseStrictNum(formData.heat_area_m2) <= 1000)
      if (step === 3) {
        const gas = parseStrictNum(formData.heat_gas_usage)
        const age = parseStrictNum(formData.heat_boiler_age)
        const insulationAnswersComplete = INSULATION_PARTS.every((part) =>
          INSULATION_ANSWERS.includes(formData[`heat_insulation_${part}`]),
        )
        return gas > 0 && gas <= 20000 &&
          ENERGY_LABELS.includes(formData.heat_energy_label) &&
          insulationAnswersComplete &&
          Boolean(formData.heat_emitters) &&
          (formData.heat_boiler_age === '' || (age >= 0 && age <= 80))
      }
      if (step === 4) {
        const price = parseStrictNum(formData.heat_electric_price)
        const gas = parseStrictNum(formData.heat_gas_price)
        return Boolean(formData.heat_contract_type) && price > 0 && gas >= 0
      }
      if (step === 5) {
        const validOptionalPrice = (value) => value === ''
          || value == null
          || (parseStrictNum(value) !== null && parseStrictNum(value) >= 0)
        const cheapChargePrice = parseStrictNum(formData.battery_cheap_charge_price_eur_per_kwh)
        const heatPumpChargePriceIsValid = !formData.planned_heat_pump ||
          (cheapChargePrice != null && cheapChargePrice >= 0.01 && cheapChargePrice <= 1)
        const solarIsValid = !formData.planned_solar
          || (parseStrictNum(formData.planned_solar_kwh) !== null && parseStrictNum(formData.planned_solar_kwh) > 0)
        const evIsValid = !formData.planned_ev
          || (parseStrictNum(formData.planned_ev_kwh) !== null && parseStrictNum(formData.planned_ev_kwh) > 0)
        return Boolean(selectedHeatPump && heatPumpROI)
          && solarIsValid
          && evIsValid
          && validOptionalPrice(formData.planned_solar_price)
          && validOptionalPrice(formData.planned_ev_price)
          && heatPumpChargePriceIsValid
      }
      if (step === 6) return heatInvestmentIsFinite && Boolean(heatPumpROI)
    }
    if (step === 1) {
      if (!formData.product_mode_confirmed) return false
      return formData.solar_setup === 'new'
        ? formData.planned_solar && parseNum(formData.planned_solar_kwh) > 0
        : parseNum(formData.zonneproductie) > 0
    }
    if (step === 2) return parseNum(formData.jaarverbruik) > 0
    if (step === 3) {
      const tv = parseNum(formData.teruglevering)
      return tv !== null && tv >= 0
    }
    if (step === 4) {
      const inkoop = parseNum(formData.prijsInkoop)
      const vergoeding = parseStrictNum(formData.terugleververgoeding_value)
      const kosten = parseStrictNum(formData.terugleverkosten_value)
      return (inkoop === null || inkoop > 0) &&
        (formData.terugleververgoeding_value === '' || vergoeding >= 0) &&
        (formData.terugleverkosten_value === '' || kosten >= 0)
    }
    if (step === 5) {
      const batteryIsValid = Boolean(formData.battery_phase) && (formData.battery_mode === 'manual'
        ? parseNum(formData.battery_kWh) > 0
        : Boolean(selectedBatteryProduct && selectedBatteryProduct.kWh > 0))
      const backupChoiceIsValid = !formData.battery_backup_required || (
        formData.battery_phase === '3-phase'
        && formData.battery_mode === 'catalog'
        && selectedBatteryProduct?.brand === 'HYXiPower'
        && Boolean(selectedBatteryProduct?.backupCapable)
      )
      const solarIsValid = !formData.planned_solar || parseNum(formData.planned_solar_kwh) > 0
      const heatPumpIsValid = !formData.planned_heat_pump
        || Boolean(formData.heat_pump_product_id && selectedHeatPump && heatPumpROI
          && ENERGY_LABELS.includes(formData.heat_energy_label)
          && INSULATION_PARTS.every((part) =>
            INSULATION_ANSWERS.includes(formData[`heat_insulation_${part}`]),
          ))
      const evIsValid = !formData.planned_ev || parseNum(formData.planned_ev_kwh) > 0
      const addOnPricesValid = [
        formData.planned_solar_price,
        formData.planned_ev_price,
      ].every((value) => parseNum(value) === null || parseNum(value) >= 0) &&
        (!formData.planned_heat_pump || heatInvestmentIsFinite)
      const exportForecast = formData.planned_heat_pump
        || formData.projected_grid_export === ''
        || (parseStrictNum(formData.projected_grid_export) !== null && parseStrictNum(formData.projected_grid_export) >= 0)
      return batteryIsValid && backupChoiceIsValid && solarIsValid && heatPumpIsValid && evIsValid && addOnPricesValid && exportForecast
    }
    if (step === 6) return parseNum(formData.battery_price) > 0
    return true
  }, [step, formData, selectedBatteryProduct, selectedHeatPump, heatPumpROI, heatPumpOnly, heatInvestmentIsFinite])

  const goNext = useCallback(() => {
    if (!canNext()) return
    trackEvent('calculator_step_completed', { step })
    setDir(1)
    setStep((s) => Math.min(s + 1, 6))
  }, [canNext, step])

  const goPrev = () => { setDir(-1); setStep((s) => Math.max(s - 1, 1)) }

  useEffect(() => {
    const root = document.documentElement
    const previousBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    root.style.scrollBehavior = previousBehavior
  }, [step])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && step < 6 && canNext()) goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step, canNext, goNext])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (heatPumpOnly) {
        if (!heatPumpROI || !heatInvestmentIsFinite) {
          throw new Error(hpCopy.invalidHeat)
        }
        const extras = {
          solar: {
            selected: Boolean(formData.planned_solar),
            annualKwh: formData.planned_solar ? parseStrictNum(formData.planned_solar_kwh) : 0,
            price: formData.planned_solar ? parseStrictNum(formData.planned_solar_price) : null,
          },
          ev: {
            selected: Boolean(formData.planned_ev),
            annualKwh: formData.planned_ev ? parseStrictNum(formData.planned_ev_kwh) : 0,
            price: formData.planned_ev ? parseStrictNum(formData.planned_ev_price) : null,
          },
        }
        const heatPumpResult = { ...heatPumpROI, extras }
        const heatPumpProducts = {
          mode: 'heat-pump',
          heatPumpROI: heatPumpResult,
          extras,
          plannedSolar: extras.solar,
          plannedEv: extras.ev,
          plannedHeatPump: {
            selected: true,
            annualKwh: heatPumpROI.annualHeatPumpElectricityKwh,
            price: heatInvestmentInput,
            model: heatPumpROI.model,
          },
        }
        const heatPumpInput = {
          mode: 'heat-pump',
          annualHeatDemandKwh: heatPumpROI.annualHeatDemandKwh,
          gasPricePerM3: heatPumpROI.gasPricePerM3,
          electricPricePerKwh: heatPumpROI.electricPricePerKwh,
          boilerEfficiencyPct: heatPumpROI.boilerEfficiencyPct,
          gasEnergyKwhPerM3: heatPumpROI.gasEnergyKwhPerM3,
          flowTemperature: heatPumpROI.flowTemperature,
          scop: heatPumpROI.scopUsed,
          hybridCoveragePct: heatPumpROI.hybridCoveragePct,
          investmentEur: heatPumpROI.investmentEur,
          extras,
          advice: heatAdvice,
          home: heatHome,
        }
        sessionStorage.setItem('voltrax_results', JSON.stringify(heatPumpResult))
        sessionStorage.setItem('voltrax_input', JSON.stringify(heatPumpInput))
        sessionStorage.setItem('voltrax_products', JSON.stringify(heatPumpProducts))
        trackEvent('main_calculation_completed', { type: 'heat_pump' })
        navigate('/results')
        return
      }
      const scenario = buildEnergyScenario({
        solarProduction: formData.zonneproductie,
        annualConsumption: formData.jaarverbruik,
        gridExport: formData.teruglevering,
        plannedSolarKwh: formData.planned_solar ? formData.planned_solar_kwh : 0,
        solarDaytimePresence: formData.solar_daytime_presence,
        plannedHeatPumpKwh,
        plannedHeatPumpSpaceHeatingKwh,
        plannedHeatPumpHotWaterKwh,
        plannedEvKwh: formData.planned_ev ? formData.planned_ev_kwh : 0,
        projectedGridExport: formData.projected_grid_export,
      })
      const batteryCapacity = formData.battery_mode === 'manual'
        ? parseNum(formData.battery_kWh)
        : selectedBatteryProduct?.kWh
      const productCost = (enabled, value) => enabled ? (parseNum(value) || 0) : 0
      const addOnInvestment =
        productCost(formData.planned_solar, formData.planned_solar_price)
        + productCost(formData.planned_heat_pump, heatInvestmentInput)
        + productCost(formData.planned_ev, formData.planned_ev_price)
      const payload = {
        zonneproductie: scenario.projectedSolarKwh,
        jaarverbruik: scenario.projectedConsumptionKwh,
        teruglevering: scenario.calculationGridExportKwh,
        prijsInkoop: parseNum(formData.prijsInkoop) || 0.28,
        prijsTeruglevering: 0,
        terugleververgoeding_value: parseStrictNum(formData.terugleververgoeding_value) ?? 0,
        terugleververgoeding_unit: formData.terugleververgoeding_unit,
        terugleverkosten_value: parseNum(formData.terugleverkosten_value) || 0,
        terugleverkosten_unit: formData.terugleverkosten_unit,
        battery_kWh: batteryCapacity,
        battery_price: parseNum(formData.battery_price) || 0,
        dynamic_contract: formData.dynamic_contract,
        epex_optimization_supported: true,
        epex_home_use_kwh: formData.planned_heat_pump
          ? scenario.heatPumpSeasonalGridImportKwh
          : 0,
        battery_cheap_charge_price_eur_per_kwh:
          parseStrictNum(formData.battery_cheap_charge_price_eur_per_kwh) ?? 0.15,
      }
      const productScenario = {
        mode: formData.product_mode,
        battery: selectedBatteryProduct
          ? {
              brand: selectedBatteryProduct.brand,
              model: selectedBatteryProduct.model,
              phase: selectedBatteryProduct.phase,
              kWh: selectedBatteryProduct.kWh,
            }
          : { brand: '', model: c.customBatteryLabel, phase: formData.battery_phase || '', kWh: batteryCapacity },
        plannedSolar: {
          selected: Boolean(formData.planned_solar),
          annualKwh: formData.planned_solar ? parseNum(formData.planned_solar_kwh) || 0 : 0,
          price: productCost(formData.planned_solar, formData.planned_solar_price),
          daytimePresence: formData.solar_daytime_presence,
        },
        plannedHeatPump: {
          selected: Boolean(formData.planned_heat_pump),
          annualKwh: formData.planned_heat_pump ? plannedHeatPumpKwh : 0,
          price: productCost(formData.planned_heat_pump, heatInvestmentInput),
          model: formData.planned_heat_pump && selectedHeatPump
            ? {
                id: selectedHeatPump.id,
                brand: selectedHeatPump.brand,
                model: selectedHeatPump.model,
                kw: selectedHeatPump.kw,
                config: selectedHeatPump.config,
              }
            : null,
        },
        heatPumpROI: formData.planned_heat_pump ? heatPumpROI : null,
        plannedEv: {
          selected: Boolean(formData.planned_ev),
          annualKwh: formData.planned_ev ? parseNum(formData.planned_ev_kwh) || 0 : 0,
          price: productCost(formData.planned_ev, formData.planned_ev_price),
        },
        addOnInvestment,
        energy: {
          ...scenario,
          batteryCheapChargePriceEurPerKwh: payload.battery_cheap_charge_price_eur_per_kwh,
        },
      }
      const res = await axios.post('/api/calculate', payload)
      let solarBatteryPackageBaseline = {}
      if (formData.planned_solar && plannedSolarKwh > 0 &&
          !formData.planned_heat_pump && !formData.planned_ev) {
        try {
          const baseline = await axios.post('/api/calculate', {
            ...payload,
            zonneproductie: parseNum(formData.zonneproductie) || 0,
            jaarverbruik: parseNum(formData.jaarverbruik) || 0,
            teruglevering: parseNum(formData.teruglevering) || 0,
            battery_kWh: 0,
            battery_price: 0,
            epex_optimization_supported: false,
            epex_home_use_kwh: 0,
          })
          solarBatteryPackageBaseline = { solarBatteryPackageBaselineResults: baseline.data }
        } catch {
          solarBatteryPackageBaseline = { solarBatteryPackageBaselineUnavailable: true }
        }
      }
      let batteryComparison = {}
      if (formData.planned_heat_pump && plannedHeatPumpKwh > 0 && Number(batteryCapacity) > 0) {
        const energyWithoutHeatPump = buildEnergyScenario({
          solarProduction: formData.zonneproductie,
          annualConsumption: formData.jaarverbruik,
          gridExport: formData.teruglevering,
          plannedSolarKwh: formData.planned_solar ? formData.planned_solar_kwh : 0,
          solarDaytimePresence: formData.solar_daytime_presence,
          plannedHeatPumpKwh: 0,
          plannedHeatPumpSpaceHeatingKwh: 0,
          plannedHeatPumpHotWaterKwh: 0,
          plannedEvKwh: formData.planned_ev ? formData.planned_ev_kwh : 0,
          projectedGridExport: null,
        })
        try {
          const withoutHeatPumpPayload = {
            ...payload,
            zonneproductie: energyWithoutHeatPump.projectedSolarKwh,
            jaarverbruik: energyWithoutHeatPump.projectedConsumptionKwh,
            teruglevering: energyWithoutHeatPump.calculationGridExportKwh,
            epex_home_use_kwh: 0,
          }
          const baseline = await axios.post('/api/calculate', withoutHeatPumpPayload)
          batteryComparison = {
            batteryWithoutHeatPumpResults: baseline.data,
            batteryWithoutHeatPumpInput: withoutHeatPumpPayload,
            batteryComparisonUnavailable: false,
          }
        } catch {
          batteryComparison = {
            batteryComparisonUnavailable: true,
          }
        }
      }
      sessionStorage.setItem('voltrax_results', JSON.stringify(res.data))
      sessionStorage.setItem('voltrax_results_model_version', CALCULATION_RESULTS_VERSION)
      sessionStorage.setItem('voltrax_input', JSON.stringify(payload))
      sessionStorage.setItem('voltrax_products', JSON.stringify({
        ...productScenario,
        ...batteryComparison,
        ...solarBatteryPackageBaseline,
      }))
      trackEvent('main_calculation_completed', { type: 'battery_or_combination' })
      navigate('/results')
    } catch (error) {
      trackEvent('main_calculation_failed')
      console.error('Calculation request failed', {
        status: error?.response?.status,
        detail: error?.response?.data?.detail,
      })
      setError(getCalculationErrorMessage(error, c))
    } finally {
      setLoading(false)
    }
  }

  const progress = ((step - 1) / 5) * 100
  const STEPS = (heatPumpOnly ? hpCopy.steps : c.steps).map((title, i) => ({ id: i + 1, title, icon: STEP_ICONS[i] }))

  return (
    <div className="sf-calculator sf-calc-page min-h-[100dvh]">
      <header className="sf-calc-topbar">
        <div className="sf-calc-topbar-inner">
          <button
            onClick={() => step > 1 ? goPrev() : navigate('/')}
            className="sf-calc-back"
          >
            <ChevronLeft className="w-4 h-4" /> {step > 1 ? c.prev : c.back}
          </button>
          <button onClick={() => navigate('/')} className="sf-calc-wordmark">
            <img src="/assets/solarfast-brand/logo-black.svg" alt="SolarFast" />
          </button>
          <span className="sf-calc-step-count">{c.stepOf(step, 6)}</span>
        </div>
      </header>

      <div
        className="sf-calc-progress-track"
        role="progressbar"
        aria-label={lang === 'nl' ? 'Voortgang berekening' : 'Calculation progress'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <motion.div
          className="sf-calc-progress-value"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="sf-calc-layout">
        <aside className="sf-calc-step-rail">
          <nav
            className="sf-calc-step-list"
            role="list"
            aria-label={lang === 'nl' ? 'Stappen berekening' : 'Calculation steps'}
          >
            {STEPS.map((s) => (
              <div
                key={s.id}
                role="listitem"
                aria-current={s.id === step ? 'step' : undefined}
                className={`sf-calc-step-item ${
                  s.id === step ? 'is-current' : s.id < step ? 'is-complete' : 'is-upcoming'
                }`}
              >
                <span className="sf-calc-step-marker" aria-hidden="true">
                  {s.id < step ? <Check className="w-3.5 h-3.5" /> : s.icon}
                </span>
                <span className="sf-calc-step-label">{s.title}</span>
              </div>
            ))}
          </nav>
        </aside>

        <main className="sf-calc-content-frame">
          <h1 className="sr-only">
            {lang === 'nl' ? 'Bereken de besparing voor uw woning' : 'Estimate savings for your home'}
          </h1>
          <div className="sf-calc-form-column">
            <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="sf-calc-step-transition"
            >
              {step === 1 && (
                <StepShell
                  title={hpCopy.firstTitle}
                  subtitle={hpCopy.firstSub}
                  icon={<Sun className="w-full h-full" />}
                >
                  <fieldset>
                    <legend className="block text-sm font-semibold text-[#131A20] mb-3">{hpCopy.modesLabel}</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
                      {[
                        {
                          value: 'solar-only',
                          label: lang === 'nl' ? 'Alleen zonnepanelen · zonder batterij' : 'Solar panels only · no battery',
                        },
                        { value: 'battery', label: hpCopy.batteryMode },
                        { value: 'heat-pump', label: hpCopy.heatMode },
                        { value: 'combination', label: hpCopy.combinationMode },
                      ].map((option) => {
                        const selected = formData.product_mode_confirmed && formData.product_mode === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              if (option.value === 'solar-only') {
                                navigate('/calculator?product=solar')
                                return
                              }
                              const combinationContract = option.value === 'combination'
                                ? getCombinationContractDefaults(formData.heat_contract_type)
                                : null
                              updateMany({
                                product_mode: option.value,
                                product_mode_confirmed: true,
                                planned_heat_pump: option.value !== 'battery',
                                ...(combinationContract ? {
                                  heat_contract_type: combinationContract.heatContractType,
                                  dynamic_contract: combinationContract.dynamicContract,
                                } : {}),
                              })
                            }}
                            className={`min-h-[54px] rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                              selected
                                ? 'border-[#22a55d] bg-[#f0fdf4] text-[#131A20]'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                  {heatPumpOnly ? (
                    <HintCard>{hpCopy.modeHint}</HintCard>
                  ) : (
                    <>
                      <fieldset className="space-y-3">
                        <legend className="mb-3 text-sm font-semibold text-[#131A20]">{c.solarSetupLabel}</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { value: 'existing', label: c.solarSetupExisting },
                            { value: 'new', label: c.solarSetupNew },
                          ].map((option) => {
                            const selected = formData.solar_setup === option.value
                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => updateMany(option.value === 'new'
                                  ? {
                                      solar_setup: 'new',
                                      zonneproductie: '0',
                                      teruglevering: '0',
                                      planned_solar: true,
                                      planned_solar_kwh: '',
                                      projected_grid_export: '',
                                    }
                                  : {
                                      solar_setup: 'existing',
                                      zonneproductie: formData.solar_setup === 'new' ? '' : formData.zonneproductie,
                                      planned_solar: false,
                                      planned_solar_kwh: '',
                                      projected_grid_export: '',
                                    })}
                                className={`min-h-[54px] rounded-2xl border-2 px-4 py-3 text-sm font-semibold text-left transition-all ${
                                  selected
                                    ? 'border-[#22a55d] bg-[#f0fdf4] text-[#131A20]'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>
                      <div className="mt-6">
                        {formData.solar_setup === 'new' ? (
                          <>
                            <NumericInput
                              label={c.newSolarYieldLabel}
                              value={formData.planned_solar_kwh}
                              onChange={(value) => {
                                updateMany({
                                  planned_solar_kwh: value,
                                  projected_grid_export: '',
                                })
                              }}
                              unit="kWh/jaar"
                              placeholder="bijv. 4500"
                              autoFocus
                            />
                            <label className="mt-4 block text-sm font-semibold text-[#131A20]">
                              {lang === 'nl' ? 'Bent u overdag meestal thuis?' : 'Are you usually at home during the day?'}
                              <select
                                value={formData.solar_daytime_presence}
                                onChange={(event) => update('solar_daytime_presence', event.target.value)}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                                data-testid="select-solar-daytime-presence"
                              >
                                <option value="often">{lang === 'nl' ? 'Vaak thuis' : 'Often at home'}</option>
                                <option value="mixed">{lang === 'nl' ? 'Soms thuis / wisselend' : 'Sometimes / varies'}</option>
                                <option value="away">{lang === 'nl' ? 'Meestal niet thuis' : 'Usually away'}</option>
                              </select>
                            </label>
                            <HintCard>{c.newSolarExportHint}</HintCard>
                          </>
                        ) : (
                          <>
                            <NumericInput
                              label={c.step1Label}
                              value={formData.zonneproductie}
                              onChange={(v) => update('zonneproductie', v)}
                              unit="kWh/jaar"
                              placeholder="bijv. 4500"
                              tooltip={c.step1Tooltip}
                              autoFocus
                            />
                            <HintCard>{c.step1Hint}</HintCard>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </StepShell>
              )}

              {step === 2 && heatPumpOnly && (
                <StepShell title={hpCopy.homeTitle} subtitle={hpCopy.homeSub} icon={<Zap className="w-full h-full" />}>
                  <HeatPumpQuestionnaire part="home" formData={formData} update={update} updateMany={updateMany}
                    advice={heatAdvice} copy={hpCopy} lang={lang} />
                </StepShell>
              )}

              {step === 2 && !heatPumpOnly && (
                <StepShell title={c.step2Title} subtitle={c.step2Sub} icon={<Zap className="w-full h-full" />}>
                  <NumericInput
                    label={c.step2Label}
                    value={formData.jaarverbruik}
                    onChange={(v) => update('jaarverbruik', v)}
                    unit="kWh/jaar"
                    placeholder="bijv. 3800"
                    tooltip={c.step2Tooltip}
                    autoFocus
                  />
                  <HintCard>{c.step2Hint}</HintCard>
                </StepShell>
              )}

              {step === 3 && heatPumpOnly && (
                <StepShell title={hpCopy.heatingTitle} subtitle={hpCopy.heatingSub} icon={<ArrowUpDown className="w-full h-full" />}>
                  <HeatPumpQuestionnaire part="heating" formData={formData} update={update} updateMany={updateMany}
                    advice={heatAdvice} copy={hpCopy} lang={lang} />
                </StepShell>
              )}

              {step === 3 && !heatPumpOnly && (
                <StepShell title={c.step3Title} subtitle={c.step3Sub} icon={<ArrowUpDown className="w-full h-full" />}>
                  {formData.solar_setup === 'new' ? (
                    <HintCard>{c.noCurrentExport}</HintCard>
                  ) : (
                    <NumericInput
                      label={c.step3Label}
                      value={formData.teruglevering}
                      onChange={(v) => update('teruglevering', v)}
                      unit="kWh/jaar"
                      placeholder="bijv. 2500"
                      tooltip={c.step3Tooltip}
                      autoFocus
                    />
                  )}
                  {(() => {
                    const tv = parseNum(formData.teruglevering)
                    const pv = parseNum(formData.zonneproductie)
                    const vb = parseNum(formData.jaarverbruik)
                    const floor = (pv !== null && vb !== null) ? pv - vb : null
                    if (tv !== null && pv !== null && pv > 0 && tv >= pv * 0.95) {
                      return (
                        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            {lang === 'nl'
                              ? `Uw teruglevering (${Math.round(tv).toLocaleString('nl-NL')} kWh) is bijna gelijk aan uw productie (${Math.round(pv).toLocaleString('nl-NL')} kWh). Klopt dit? Teruglevering is alleen het deel dat u terugstuurt naar het net — niet uw totale zonneopbrengst.`
                              : `Your grid export (${Math.round(tv).toLocaleString('nl-NL')} kWh) is nearly equal to your production (${Math.round(pv).toLocaleString('nl-NL')} kWh). Is this correct? Grid export is only the portion sent back to the grid — not your total solar yield.`
                            }
                          </span>
                        </div>
                      )
                    }
                    if (tv !== null && floor !== null && floor > 0 && tv < floor) {
                      return (
                        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            {lang === 'nl'
                              ? `Met een productie van ${Math.round(pv).toLocaleString('nl-NL')} kWh en een jaarverbruik van ${Math.round(vb).toLocaleString('nl-NL')} kWh is de teruglevering altijd minstens ${Math.round(floor).toLocaleString('nl-NL')} kWh — minder kan fysiek niet. Controleer of u uw tótale jaarverbruik heeft ingevuld en niet alleen de netafname van uw jaarrekening.`
                              : `With a production of ${Math.round(pv).toLocaleString('nl-NL')} kWh and annual consumption of ${Math.round(vb).toLocaleString('nl-NL')} kWh, grid export is always at least ${Math.round(floor).toLocaleString('nl-NL')} kWh — anything lower is physically impossible. Check whether you entered your total annual consumption, not only the grid offtake from your annual statement.`
                            }
                          </span>
                        </div>
                      )
                    }
                    return null
                  })()}
                  <HintCard>{c.step3Hint}</HintCard>
                </StepShell>
              )}

              {step === 4 && heatPumpOnly && (
                <StepShell title={hpCopy.tariffTitle} subtitle={hpCopy.tariffSub} icon={<Euro className="w-full h-full" />}>
                  <HeatPumpQuestionnaire part="tariffs" formData={formData} update={update} updateMany={updateMany}
                    advice={heatAdvice} copy={hpCopy} lang={lang} />
                </StepShell>
              )}

              {step === 4 && !heatPumpOnly && (
                <StepShell title={c.step4Title} subtitle={c.step4Sub} icon={<Euro className="w-full h-full" />}>
                  {/* Dynamic contract toggle */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-[#131A20] mb-3">
                      {c.step4LabelDynamic}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: c.step4DynamicNo, value: false },
                        { label: c.step4DynamicYes, value: true },
                      ].map((opt) => (
                        <button
                          key={String(opt.value)}
                          onClick={() => updateMany({
                            dynamic_contract: opt.value,
                            ...(formData.product_mode === 'combination' && {
                              heat_contract_type: opt.value ? 'dynamic' : 'fixed',
                            }),
                          })}
                          className={`p-4 rounded-2xl border-2 text-sm font-semibold text-left transition-all ${
                            formData.dynamic_contract === opt.value
                              ? 'border-[#22a55d] bg-[#f0fdf4] text-[#131A20]'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-[#405247] font-medium leading-relaxed">
                      {c.step4DynamicHint}
                    </p>
                  </div>

                  <NumericInput
                    label={c.step4LabelInkoop}
                    value={formData.prijsInkoop}
                    onChange={(v) => update('prijsInkoop', v)}
                    unit="euro/kWh"
                    placeholder="bijv. 0,28"
                    tooltip={c.step4TooltipInkoop}
                    autoFocus
                  />
                  {/* Terugleververgoeding */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#131A20]">
                        {c.step4LabelVergoeding}
                        <Tooltip text={c.step4TooltipVergoeding} />
                      </label>
                      <UnitToggle
                        value={formData.terugleververgoeding_unit}
                        options={[
                          { label: c.perKwh, value: 'kWh' },
                          { label: c.perJaar, value: 'jaar' },
                        ]}
                        onChange={(v) => update('terugleververgoeding_unit', v)}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="text" inputMode="decimal"
                        value={formData.terugleververgoeding_value}
                        onChange={(e) => update('terugleververgoeding_value', e.target.value)}
                        placeholder="0"
                        className="w-full bg-[#F9F7F4] border border-gray-200 rounded-2xl px-5 py-3.5 text-[#131A20] text-lg font-bold placeholder-gray-300 focus:outline-none focus:border-[#131A20] focus:ring-2 focus:ring-gray-100 transition-all pr-28"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        euro/{formData.terugleververgoeding_unit}
                      </span>
                    </div>
                  </div>

                  {/* Terugleverkosten */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#131A20]">
                        {c.step4LabelKosten}
                        <Tooltip text={c.step4TooltipKosten} />
                      </label>
                      <UnitToggle
                        value={formData.terugleverkosten_unit}
                        options={[
                          { label: c.perKwh, value: 'kWh' },
                          { label: c.perJaar, value: 'jaar' },
                        ]}
                        onChange={(v) => update('terugleverkosten_unit', v)}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="text" inputMode="decimal"
                        value={formData.terugleverkosten_value}
                        onChange={(e) => update('terugleverkosten_value', e.target.value)}
                        placeholder="0"
                        className="w-full bg-[#F9F7F4] border border-gray-200 rounded-2xl px-5 py-3.5 text-[#131A20] text-lg font-bold placeholder-gray-300 focus:outline-none focus:border-[#131A20] focus:ring-2 focus:ring-gray-100 transition-all pr-28"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        euro/{formData.terugleverkosten_unit}
                      </span>
                    </div>
                  </div>
                </StepShell>
              )}

              {step === 5 && heatPumpOnly && (
                <StepShell title={hpCopy.adviceTitle} subtitle={hpCopy.modelSub} icon={<Battery className="w-full h-full" />}>
                  <HeatPumpQuestionnaire part="model" formData={formData} update={update} updateMany={updateMany}
                    advice={heatAdvice} copy={hpCopy} lang={lang} />
                  <div className="mt-6 space-y-3">
                    <EnergyAddOnCard
                      title={c.plannedSolarTitle}
                      description={c.plannedSolarKwh}
                      enabled={formData.planned_solar}
                      onToggle={() => update('planned_solar', !formData.planned_solar)}
                    >
                      <NumericInput
                        label={c.plannedSolarKwh}
                        value={formData.planned_solar_kwh}
                        onChange={(value) => update('planned_solar_kwh', value)}
                        unit={heatKwhPerYear}
                        placeholder={lang === 'nl' ? 'bijv. 3000' : 'e.g. 3000'}
                      />
                      <label className="mt-3 block text-sm font-semibold text-[#131A20]">
                        {lang === 'nl' ? 'Bent u overdag meestal thuis?' : 'Are you usually at home during the day?'}
                        <select
                          value={formData.solar_daytime_presence}
                          onChange={(event) => update('solar_daytime_presence', event.target.value)}
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                          data-testid="select-planned-solar-daytime-presence"
                        >
                          <option value="often">{lang === 'nl' ? 'Vaak thuis' : 'Often at home'}</option>
                          <option value="mixed">{lang === 'nl' ? 'Soms thuis / wisselend' : 'Sometimes / varies'}</option>
                          <option value="away">{lang === 'nl' ? 'Meestal niet thuis' : 'Usually away'}</option>
                        </select>
                      </label>
                      <NumericInput
                        label={c.plannedSolarPrice}
                        value={formData.planned_solar_price}
                        onChange={(value) => update('planned_solar_price', value)}
                        unit="euro"
                        placeholder={lang === 'nl' ? 'optioneel' : 'optional'}
                      />
                    </EnergyAddOnCard>
                    <EnergyAddOnCard
                      title={c.plannedEvTitle}
                      description={c.plannedEvKwh}
                      enabled={formData.planned_ev}
                      onToggle={() => update('planned_ev', !formData.planned_ev)}
                    >
                      <NumericInput
                        label={c.plannedEvKwh}
                        value={formData.planned_ev_kwh}
                        onChange={(value) => update('planned_ev_kwh', value)}
                        unit={heatKwhPerYear}
                        placeholder={lang === 'nl' ? 'bijv. 1800' : 'e.g. 1800'}
                      />
                      <NumericInput
                        label={c.plannedEvPrice}
                        value={formData.planned_ev_price}
                        onChange={(value) => update('planned_ev_price', value)}
                        unit="euro"
                        placeholder={lang === 'nl' ? 'optioneel' : 'optional'}
                      />
                    </EnergyAddOnCard>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-gray-500">
                    {lang === 'nl'
                      ? 'Extra zonnepanelen en laden worden apart vastgelegd en tellen niet mee in de warmtepompbesparing of ROI.'
                      : 'Planned solar and EV charging are recorded separately and are not included in heat-pump savings or ROI.'}
                  </p>
                  {((formData.planned_solar && !(parseStrictNum(formData.planned_solar_kwh) !== null && parseStrictNum(formData.planned_solar_kwh) > 0))
                    || (formData.planned_ev && !(parseStrictNum(formData.planned_ev_kwh) !== null && parseStrictNum(formData.planned_ev_kwh) > 0))) && (
                    <p role="alert" className="mt-2 text-xs font-semibold text-amber-700">{c.completePlannedKwhHint}</p>
                  )}
                  {[
                    formData.planned_solar_price,
                    formData.planned_ev_price,
                  ].some((value) => value !== '' && !(parseStrictNum(value) !== null && parseStrictNum(value) >= 0)) && (
                    <p role="alert" className="mt-2 text-xs font-semibold text-amber-700">
                      {lang === 'nl'
                        ? 'Vul een lege prijs in of een bedrag van €0 of hoger.'
                        : 'Leave an optional price blank or enter €0 or more.'}
                    </p>
                  )}
                  {!heatPumpROI && selectedHeatPump && (
                    <p role="alert" className="mt-2 text-xs font-semibold text-amber-700">{hpCopy.invalidHeat}</p>
                  )}
                </StepShell>
              )}

              {step === 5 && !heatPumpOnly && (() => {
                const isManual = formData.battery_mode === 'manual'
                const phaseProducts = BATTERY_PRODUCTS.filter((product) => product.phase === formData.battery_phase)
                const phaseProductById = new Map(phaseProducts.map((product) => [product.id, product]))
                const maxPhaseHyxiCapacity = Math.max(
                  0,
                  ...phaseProducts.filter((product) => product.brand === 'HYXiPower').map((product) => product.kWh),
                )
                const maxCatalogHyxiCapacity = Math.max(
                  0,
                  ...BATTERY_PRODUCTS.filter((product) => product.brand === 'HYXiPower').map((product) => product.kWh),
                )
                const phaseLimitsLargerBattery = maxPhaseHyxiCapacity > 0
                  && maxPhaseHyxiCapacity < maxCatalogHyxiCapacity
                const hasLargerBatteryTrigger = shouldOfferLargerBatteryAlternative({
                  projectedConsumptionKwh: energyScenario.projectedConsumptionKwh,
                  projectedSolarKwh: energyScenario.projectedSolarKwh,
                  plannedSolar: formData.planned_solar,
                  plannedHeatPump: formData.planned_heat_pump,
                  plannedEv: formData.planned_ev,
                })
                const phaseRecommendations = (batteryRecommendations || [])
                  .filter((item) => phaseProductById.has(item.product_id))
                const primaryRecommendation = selectScenarioPrimaryBatteryRecommendation(
                  phaseRecommendations,
                  hasLargerBatteryTrigger,
                )
                const primaryProduct = primaryRecommendation
                  ? phaseProductById.get(primaryRecommendation.product_id)
                  : null
                const primaryHasPositiveRoi = Number(primaryRecommendation?.roi_pct) > 0
                const largerAlternativeRecommendation = selectLargerBatteryAlternative(
                  phaseRecommendations,
                  primaryRecommendation,
                  hasLargerBatteryTrigger,
                )
                const largerAlternativeProduct = largerAlternativeRecommendation
                  ? phaseProductById.get(largerAlternativeRecommendation.product_id)
                  : null
                const phaseFinancialRecommendations = (batteryFinancialRecommendations || [])
                  .filter((item) => phaseProductById.has(item.product_id))
                const bestReturnRecommendation = phaseFinancialRecommendations.find((item) => item.recommended)
                const bestReturnProduct = bestReturnRecommendation
                  ? phaseProductById.get(bestReturnRecommendation.product_id)
                  : null
                const bestReturnIsLarger = Boolean(
                  bestReturnProduct && primaryProduct && bestReturnProduct.kWh > primaryProduct.kWh,
                )
                const showBestReturnAlternative = Boolean(
                  bestReturnProduct
                  && primaryProduct
                  && bestReturnProduct.id !== primaryProduct.id
                  && bestReturnProduct.kWh >= primaryProduct.kWh
                  && (!bestReturnIsLarger || hasLargerBatteryTrigger)
                  && bestReturnProduct.id !== largerAlternativeProduct?.id,
                )
                const visibleBrands = BATTERY_BRANDS
                  .filter((brand) => phaseProducts.some((product) => product.brand === brand))
                const visibleProducts = phaseProducts
                  .filter((product) => product.brand === selectedBrand)
                  .sort((a, b) => a.kWh - b.kWh || a.price - b.price)
                const backupPhaseNeedsConfirmation =
                  Boolean(formData.battery_backup_required) && formData.battery_phase !== '3-phase'
                const backupNeedsCompatibleSelection = Boolean(formData.battery_backup_required)
                  && formData.battery_phase === '3-phase'
                  && !(formData.battery_mode === 'catalog'
                    && selectedBatteryProduct?.brand === 'HYXiPower'
                    && selectedBatteryProduct?.backupCapable)
                const hasInvalidPlannedEnergy =
                  (formData.planned_solar && !(parseNum(formData.planned_solar_kwh) > 0))
                  || (formData.planned_heat_pump && !(selectedHeatPump && heatPumpROI))
                  || (formData.planned_ev && !(parseNum(formData.planned_ev_kwh) > 0))
                const formatNumber = (value) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
                  maximumFractionDigits: 1,
                }).format(value || 0)
                const formatMoney = (value) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(value || 0)
                const formatBatteryModel = (product) => lang === 'nl'
                  ? product.model.replace(/(\d+)\.(?=\d)/g, '$1,')
                  : product.model
                const addonsSelected = formData.planned_solar || formData.planned_heat_pump || formData.planned_ev
                return (
                  <StepShell title={c.step5Title} subtitle={c.step5Sub} icon={<Battery className="w-full h-full" />}>
                    <div className="mb-6 flex flex-col">
                      <div className="text-sm font-semibold text-[#131A20] mb-3">{c.batteryCatalogLabel}</div>
                      <div className="mb-4">
                        <div id="battery-phase-label" className="text-sm font-semibold text-[#131A20] mb-1">
                          {c.batteryPhaseQuestion}
                        </div>
                        <p className="text-sm text-[#526257] mb-3">{c.batteryPhaseHint}</p>
                        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="battery-phase-label">
                          {[
                            { value: '1-phase', label: c.phase1 },
                            { value: '3-phase', label: c.phase3 },
                          ].map((option) => (
                            <label key={option.value} className="cursor-pointer">
                              <input
                                className="peer sr-only"
                                type="radio"
                                name="battery-phase"
                                value={option.value}
                                checked={formData.battery_phase === option.value}
                                onChange={() => chooseBatteryPhase(option.value)}
                              />
                              <span className={`flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-sm font-bold transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#131A20] ${
                                formData.battery_phase === option.value
                                  ? 'border-[#22a55d] bg-[#EEF6F1] text-[#131A20]'
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                              }`}>
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4 rounded-2xl border border-[#131A20]/10 bg-[#fffde0] p-4">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            className="mt-0.5 h-4 w-4 accent-[#131A20] focus-visible:ring-2 focus-visible:ring-[#131A20]"
                            type="checkbox"
                            checked={Boolean(formData.battery_backup_required)}
                            onChange={(event) => update('battery_backup_required', event.target.checked)}
                          />
                          <span>
                            <span className="block text-sm font-extrabold text-[#131A20]">{c.batteryBackupQuestion}</span>
                            <span className="mt-1 block text-xs leading-relaxed text-[#131A20]/65">{c.batteryBackupDescription}</span>
                          </span>
                        </label>
                      </div>
                      {formData.battery_phase && (
                        <>
                          <div className="order-2 mb-2">
                            <h3 className="text-sm font-extrabold text-[#131A20]">{c.batteryOtherOptionsTitle}</h3>
                          <p className="mt-1 text-sm text-[#526257]">{c.batteryOtherOptionsHint}</p>
                          </div>
                          <div className="order-2 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={c.batteryCatalogLabel}>
                        {visibleBrands.map((brand) => (
                          <button
                            key={brand}
                            type="button"
                            role="tab"
                            aria-selected={!isManual && selectedBrand === brand}
                            onClick={() => {
                              updateMany(isManual || brand !== selectedBrand
                                ? { battery_mode: 'catalog', battery_product_id: '', battery_price: '' }
                                : { battery_mode: 'catalog' })
                              setSelectedBrand(brand)
                            }}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                              !isManual && selectedBrand === brand
                                ? 'border-[#22a55d] bg-[#EEF6F1] text-[#131A20]'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                        <button
                          type="button"
                          role="tab"
                          aria-selected={isManual}
                          onClick={() => updateMany({ battery_mode: 'manual', battery_product_id: '', battery_price: '' })}
                          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                            isManual
                              ? 'border-[#22a55d] bg-[#EEF6F1] text-[#131A20]'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {c.catalogManual}
                        </button>
                          </div>
                          <p className="order-2 text-sm text-[#526257] mt-1 mb-3">{isManual ? c.customBatteryHint : c.catalogHint}</p>
                        </>
                      )}
                      {!formData.battery_phase && (
                        <p className="text-xs font-semibold text-amber-700 mt-3">{c.selectBatteryPhaseHint}</p>
                      )}
                      {formData.battery_phase && (
                      <div className="order-1 mb-4 rounded-2xl border border-[#131A20]/10 bg-white p-4 sm:p-5" aria-live="polite">
                        {hasLargerBatteryTrigger
                          && formData.battery_phase === '1-phase'
                          && phaseLimitsLargerBattery && (
                          <p role="status" className="mb-3 rounded-xl bg-[#fffde0] p-3 text-xs leading-relaxed text-[#131A20]/75">
                            {lang === 'nl'
                              ? `Met de gekozen 1-faseaansluiting is het grootste HYXiPower-systeem in ons aanbod ${formatNumber(maxPhaseHyxiCapacity)} kWh. Grotere systemen staan als 3-fase vermeld; we wijzigen uw fasekeuze niet automatisch.`
                              : `With the selected single-phase connection, the largest HYXiPower system in our range is ${formatNumber(maxPhaseHyxiCapacity)} kWh. Larger systems are listed as three-phase; we will not change your phase selection automatically.`}
                          </p>
                        )}
                        {!combinationAdviceReady ? (
                          <p role="status" className="text-xs leading-relaxed text-[#131A20]/65">
                            {lang === 'nl'
                              ? 'Vul eerst de warmtepompgegevens in. Daarna adviseren we een batterij die past bij het gecombineerde energieverbruik.'
                              : 'Complete the heat-pump details first. Then we will recommend a battery suited to your combined energy use.'}
                          </p>
                        ) : batteryRecommendations === null ? (
                          <p className="text-xs text-[#131A20]/65">{c.batteryRecommendationLoading}</p>
                        ) : batteryRecommendationError ? (
                          <p role="status" className="text-xs text-amber-800">{c.batteryRecommendationUnavailable}</p>
                        ) : backupPhaseNeedsConfirmation ? (
                          <div className="rounded-xl border border-[#d5ce32] bg-[#fffde0] p-4" role="status">
                            <p className="text-sm font-extrabold text-[#131A20]">{c.batteryBackupPhaseWarning}</p>
                            <p className="mt-2 text-xs leading-relaxed text-[#131A20]/70">{c.batteryBackupPhaseHint}</p>
                            <button
                              type="button"
                              onClick={() => chooseBatteryPhase('3-phase')}
                              className="mt-3 min-h-11 rounded-xl bg-[#131A20] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#29343c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#131A20]"
                            >
                              {c.batteryBackupConfirmPhase}
                            </button>
                          </div>
                        ) : primaryProduct ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#d5ce32] bg-[#fffde0] p-4 sm:p-5">
                              <div className="min-w-0">
                                <span className="inline-flex rounded-full bg-[#131A20] px-3 py-1 text-[11px] font-bold text-[#fdf891]">
                                  {c.batteryRecommendation}
                                </span>
                                <h3 className="mt-3 text-lg font-extrabold leading-snug text-[#131A20]">
                                  {primaryProduct.brand} {formatBatteryModel(primaryProduct)}
                                </h3>
                            <p className="mt-2 text-base leading-relaxed text-[#526257]">
                                  {primaryHasPositiveRoi ? c.batteryRecommendationHint : c.batteryStandardFallbackHint}
                                </p>
                              </div>
                              <div className="shrink-0 rounded-xl bg-white/75 px-4 py-3 text-right">
                                <div className="text-xs text-[#131A20]/60">{formatNumber(primaryProduct.kWh)} kWh</div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#131A20]/45">{c.batteryCatalogPriceLabel}</div>
                                <div className="text-base font-extrabold text-[#131A20]">{formatMoney(primaryProduct.price)}</div>
                              </div>
                            </div>
                            <div className="space-y-1.5 rounded-xl bg-[#f7f8f6] px-4 py-3">
                              <p className="text-sm font-semibold leading-5 text-[#26372e]">
                                {c.batteryRecommendationBasis(
                                  formatNumber(energyScenario.projectedSolarKwh),
                                  formatNumber(energyScenario.projectedConsumptionKwh),
                                  formatNumber(energyScenario.projectedExportKwh),
                                )}
                              </p>
                              <p className="text-sm leading-5 text-[#526257]">{c.batteryCapacityFitNote}</p>
                            </div>
                            {largerAlternativeProduct && largerAlternativeRecommendation && (
                              <div className="rounded-xl border border-[#131A20]/10 bg-[#f7f8f6] p-3">
                                <p className="text-sm leading-relaxed text-[#26372e]">
                                  <strong className="text-[#131A20]">{c.batteryLargerAlternativeLabel}</strong>{' '}
                                  {largerAlternativeProduct.brand} {formatBatteryModel(largerAlternativeProduct)}.
                                  {' '}{c.batteryLargerAlternativeHint(
                                    formatNumber(primaryRecommendation.self_sufficiency_after_pct),
                                    formatNumber(largerAlternativeRecommendation.self_sufficiency_after_pct),
                                  )}
                                </p>
                                <button
                                  type="button"
                                  aria-pressed={formData.battery_product_id === largerAlternativeProduct.id}
                                  onClick={() => {
                                    setSelectedBrand(largerAlternativeProduct.brand)
                                    updateMany({
                                      battery_mode: 'catalog',
                                      battery_product_id: largerAlternativeProduct.id,
                                      battery_phase: largerAlternativeProduct.phase,
                                      battery_kWh: largerAlternativeProduct.kWh,
                                      battery_price: String(largerAlternativeProduct.price),
                                    })
                                  }}
                                  className={`mt-2 min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                    formData.battery_product_id === largerAlternativeProduct.id
                                      ? 'bg-[#131A20] text-white'
                                      : 'bg-white text-[#131A20] hover:bg-[#fdf891]'
                                  }`}
                                >
                                  {formData.battery_product_id === largerAlternativeProduct.id
                                    ? c.productSelected
                                    : c.batteryLargerAlternativeSelect}
                                </button>
                              </div>
                            )}
                            {formData.battery_backup_required && (
                              <p className="text-xs leading-relaxed text-[#131A20]/65">{c.batteryBackupReviewNote}</p>
                            )}
                            <button
                              type="button"
                              aria-pressed={formData.battery_product_id === primaryProduct.id}
                              onClick={() => {
                                setSelectedBrand(primaryProduct.brand)
                                updateMany({
                                  battery_mode: 'catalog',
                                  battery_product_id: primaryProduct.id,
                                  battery_phase: primaryProduct.phase,
                                  battery_kWh: primaryProduct.kWh,
                                  battery_price: String(primaryProduct.price),
                                })
                              }}
                              className={`min-h-11 w-full rounded-xl px-4 py-3 text-sm font-extrabold transition sm:w-auto ${
                                formData.battery_product_id === primaryProduct.id
                                  ? 'bg-[#131A20] text-white'
                                  : 'bg-[#fdf891] text-[#131A20] hover:bg-[#f5ed5b]'
                              }`}
                            >
                              {formData.battery_product_id === primaryProduct.id ? c.productSelected : c.batteryRecommendationSelect}
                            </button>
                            <details className="group rounded-xl border border-[#131A20]/10 bg-white">
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[#131A20] [&::-webkit-details-marker]:hidden">
                                {c.batteryRecommendationDetailsTitle}
                                <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
                              </summary>
                              <div className="space-y-2 border-t border-[#131A20]/10 px-4 py-3 text-sm leading-relaxed text-[#526257]">
                                <p>{c.batteryRecommendationDetailsText(formatNumber(HIGH_ANNUAL_ENERGY_TRIGGER_KWH))}</p>
                                {batteryFinancialError ? (
                                  <p>{c.batteryFinancialUnavailable}</p>
                                ) : (
                                  <>
                                    {showBestReturnAlternative && (
                                      <p><strong className="text-[#131A20]">{c.batteryFinancialAlternative}</strong> {bestReturnProduct.brand} {formatBatteryModel(bestReturnProduct)}</p>
                                    )}
                                    {bestReturnProduct && bestReturnProduct.id === primaryProduct.id && (
                                      <p>{c.batteryFinancialSame}</p>
                                    )}
                                    {!bestReturnProduct && <p>{c.noPositiveBatteryRecommendation}</p>}
                                  </>
                                )}
                              </div>
                            </details>
                          </div>
                        ) : (
                          <p role="status" className="text-xs leading-relaxed text-[#131A20]/65">{c.batteryRecommendationUnavailable}</p>
                        )}
                      </div>
                      )}

                      {formData.battery_phase && (isManual ? (
                        <div className="order-3 space-y-2.5">
                          {c.batteries.map((opt) => {
                            const selected = Number(formData.battery_kWh) === opt.kWh
                            return (
                              <button
                                key={opt.kWh}
                                type="button"
                                onClick={() => updateMany({ battery_mode: 'manual', battery_product_id: '', battery_kWh: opt.kWh, battery_price: '' })}
                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                                  selected ? 'border-[#22a55d] bg-[#f0fdf4]' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-extrabold text-lg text-[#131A20]">{opt.label}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                                  </div>
                                  {selected && <span className="w-6 h-6 rounded-full bg-[#22a55d] flex items-center justify-center flex-shrink-0"><Check className="w-3.5 h-3.5 text-white" /></span>}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="order-3 space-y-2.5" role="tabpanel">
                          {visibleProducts.map((product) => {
                            const selected = formData.battery_product_id === product.id
                            const isPrimaryRecommendation = primaryProduct?.id === product.id
                            return (
                              <button
                                key={product.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => updateMany({
                                  battery_mode: 'catalog',
                                  battery_product_id: product.id,
                                  battery_phase: product.phase,
                                  battery_kWh: product.kWh,
                                  battery_price: String(product.price),
                                })}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                                  selected ? 'border-[#22a55d] bg-[#f0fdf4]' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-extrabold text-base text-[#131A20]">{product.brand} {lang === 'nl' ? product.model.replace(/(\d+)\.(?=\d)/g, '$1,') : product.model}</span>
                                      {isPrimaryRecommendation && <span className="rounded-full bg-[#131A20] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#fdf891]">{c.batteryRecommendedBadge}</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatNumber(product.kWh)} kWh {c.batteryStorageLabel}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="font-extrabold text-[#131A20]">{formatMoney(product.price)}</div>
                                    {selected && <div className="text-[10px] text-[#22a55d] font-bold mt-0.5">{c.productSelected}</div>}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      ))}
                      {backupNeedsCompatibleSelection && (
                        <p role="alert" className="order-3 mt-3 rounded-xl border border-[#131A20]/10 bg-[#fffde0] px-4 py-3 text-xs leading-relaxed text-[#131A20]/70">
                          {c.batteryBackupSelectionRequired}
                        </p>
                      )}
                    </div>

                    <div className="order-4 border-t border-gray-100 pt-6">
                      <h3 className="font-extrabold text-lg text-[#131A20] mb-1">{c.plannedProductsTitle}</h3>
                      <p className="text-xs text-gray-400 mb-4">{c.plannedProductsHint}</p>
                      <div className="space-y-3">
                        {formData.solar_setup === 'new' ? (
                          <div className="sf-calculator-card rounded-2xl border-2 border-[#22a55d] bg-[#f4fbf6] p-4">
                            <div className="mb-3">
                              <div className="font-bold text-[#131A20]">{c.plannedSolarTitle}</div>
                              <div className="mt-1 text-sm text-[#405247]">{c.newSolarAlreadyAdded}</div>
                            </div>
                            <NumericInput
                              label={c.plannedSolarPrice}
                              value={formData.planned_solar_price}
                              onChange={(value) => update('planned_solar_price', value)}
                              unit="euro"
                              placeholder="optioneel"
                            />
                          </div>
                        ) : (
                        <EnergyAddOnCard
                          title={c.plannedSolarTitle}
                          description={c.plannedSolarKwh}
                          enabled={formData.planned_solar}
                          onToggle={() => update('planned_solar', !formData.planned_solar)}
                        >
                          <NumericInput label={c.plannedSolarKwh} value={formData.planned_solar_kwh} onChange={(value) => update('planned_solar_kwh', value)} unit="kWh/jaar" placeholder="bijv. 3000" />
                          <NumericInput label={c.plannedSolarPrice} value={formData.planned_solar_price} onChange={(value) => update('planned_solar_price', value)} unit="euro" placeholder="optioneel" />
                        </EnergyAddOnCard>
                        )}
                        <EnergyAddOnCard
                          title={c.plannedHeatPumpTitle}
                          description={hpCopy.modelTitle}
                          enabled={formData.planned_heat_pump}
                          onToggle={() => {
                            const enablingHeatPump = !formData.planned_heat_pump
                            const combinationContract = enablingHeatPump
                              ? getCombinationContractDefaults(formData.heat_contract_type)
                              : null
                            updateMany({
                              product_mode: enablingHeatPump ? 'combination' : 'battery',
                              planned_heat_pump: enablingHeatPump,
                              ...(combinationContract ? {
                                heat_contract_type: combinationContract.heatContractType,
                                dynamic_contract: combinationContract.dynamicContract,
                              } : {}),
                            })
                          }}
                        >
                          <HeatPumpQuestionnaire part="home" formData={formData} update={update} updateMany={updateMany}
                            advice={heatAdvice} copy={hpCopy} lang={lang} isCombination />
                          <HeatPumpQuestionnaire part="heating" formData={formData} update={update} updateMany={updateMany}
                            advice={heatAdvice} copy={hpCopy} lang={lang} isCombination />
                          <HeatPumpQuestionnaire part="tariffs" formData={formData} update={update} updateMany={updateMany}
                            advice={heatAdvice} copy={hpCopy} lang={lang} isCombination />
                          <HeatPumpQuestionnaire part="model" formData={formData} update={update} updateMany={updateMany}
                            advice={heatAdvice} copy={hpCopy} lang={lang} isCombination />
                          <NumericInput label={hpCopy.priceLabel} value={formData.planned_heat_pump_price}
                            onChange={(value) => update('planned_heat_pump_price', value)} unit="euro"
                            placeholder={selectedHeatPump?.finalPriceEur?.toLocaleString('nl-NL', { minimumFractionDigits: 2 }) || 'bijv. 12000'} />
                          {heatPumpROI && (
                            formData.heat_pump_product_id && (
                            <div className="rounded-xl bg-white border border-[#22a55d]/15 p-3 text-xs text-gray-600 leading-relaxed">
                              {hpCopy.energyEstimate}: <strong>{formatNumber(heatPumpROI.annualHeatPumpElectricityKwh)} {heatKwhPerYear}</strong>.
                              {' '}{hpCopy.ratioLabel}: <strong>{formatRate(heatPumpROI.electricityPerGasM3)} kWh/m³</strong>.
                              {' '}{hpCopy.electricityPrice}: <strong>€{formatRate(heatPumpROI.electricPricePerKwh)}/kWh</strong>.
                              {' '}{hpCopy.heatInvestmentHint}
                            </div>
                            )
                          )}
                          {heatPumpROI && !formData.heat_pump_product_id && (
                            <p role="status" className="text-xs font-semibold text-amber-700">
                              {lang === 'nl'
                                ? 'Kies het geadviseerde warmtepompmodel of een alternatief om het combinatieadvies te berekenen.'
                                : 'Choose the suggested heat-pump model or an alternative to calculate the combined recommendation.'}
                            </p>
                          )}
                          {!heatPumpROI && (
                            <p role="alert" className="text-xs font-semibold text-amber-700">{hpCopy.invalidHeat}</p>
                          )}
                          <SafetySources lang={lang} />
                        </EnergyAddOnCard>
                        <EnergyAddOnCard
                          title={c.plannedEvTitle}
                          description={c.plannedEvKwh}
                          enabled={formData.planned_ev}
                          onToggle={() => update('planned_ev', !formData.planned_ev)}
                        >
                          <NumericInput label={c.plannedEvKwh} value={formData.planned_ev_kwh} onChange={(value) => update('planned_ev_kwh', value)} unit="kWh/jaar" placeholder="bijv. 1800" />
                          <NumericInput label={c.plannedEvPrice} value={formData.planned_ev_price} onChange={(value) => update('planned_ev_price', value)} unit="euro" placeholder="optioneel" />
                        </EnergyAddOnCard>
                      </div>
                    </div>

                    {addonsSelected && (
                      <div className="mt-5">
                        {formData.planned_heat_pump ? (
                          <div className="mb-5">
                            <div className="mb-2 text-sm font-semibold text-[#131A20]">{c.annualExportForecast}</div>
                            <div className="relative flex items-center rounded-2xl border border-gray-200 bg-[#F9F7F4] px-5 py-3.5 pr-24 text-lg font-bold text-[#131A20]">
                              {formData.heat_pump_product_id && heatPumpROI
                                ? formatEnergyValue(energyScenario.projectedExportKwh)
                                : '—'}
                              <span className="absolute right-5 text-sm font-medium text-gray-400">{heatKwhPerYear}</span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-gray-400">
                              {formData.heat_pump_product_id && heatPumpROI
                                ? (lang === 'nl'
                                  ? 'Automatische schatting op basis van uw huidige teruglevering, geplande energieveranderingen en de seizoensverdeling van de warmtepomp; geen gemeten maandprofiel.'
                                  : 'Automatically estimated from your current export, planned energy changes, and the heat pump’s seasonal use; this is not a measured monthly profile.')
                                : (lang === 'nl'
                                  ? 'Kies eerst een warmtepompmodel en vul de gegevens in; daarna wordt de teruglevering automatisch geschat.'
                                  : 'Select a heat-pump model and complete its details first; export will then be estimated automatically.')}
                            </p>
                          </div>
                        ) : (
                          <>
                            <NumericInput
                              label={c.annualExportForecast}
                              value={formData.projected_grid_export}
                              onChange={(value) => update('projected_grid_export', value)}
                              unit="kWh/jaar"
                              placeholder={formatEnergyValue(energyScenario.projectedExportKwh)}
                            />
                            <p className="text-xs text-gray-400 -mt-2 mb-4">{c.annualExportForecastHint}</p>
                            {energyScenario.forecastWasAdjusted && (
                              <p className="text-xs text-amber-700 -mt-3 mb-4">{c.exportForecastAdjustedHint}</p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <div className="mt-5 rounded-2xl bg-[#EEF6F1] p-4">
                      <div className="font-bold text-sm text-[#131A20] mb-1">{c.scenarioProjectionTitle}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        {[
                          [c.scenarioProduction, energyScenario.projectedSolarKwh],
                          [c.scenarioConsumption, energyScenario.projectedConsumptionKwh],
                          [c.scenarioExport, energyScenario.projectedExportKwh],
                        ].map(([label, value]) => (
                          <div key={label} className="bg-white rounded-xl p-3">
                            <div className="text-[10px] text-gray-400 font-semibold mb-1">{label}</div>
                            <div className="font-extrabold text-[#131A20]">{formatNumber(value)} <span className="text-xs font-medium text-gray-400">kWh</span></div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3 leading-relaxed">{c.scenarioProjectionHint}</p>
                      {plannedHeatPumpKwh > 0 && (
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{c.heatPumpSeasonalNote}</p>
                      )}
                      {plannedHeatPumpKwh > 0 && (
                        <div className="mt-4 max-w-sm">
                          <NumericInput
                            label={lang === 'nl' ? 'Gemiddelde goedkope batterijlaadprijs' : 'Average low-price battery charging rate'}
                            value={formData.battery_cheap_charge_price_eur_per_kwh}
                            onChange={(value) => update('battery_cheap_charge_price_eur_per_kwh', value)}
                            unit="€/kWh"
                            placeholder="0,15"
                          />
                          <p className="-mt-3 text-xs leading-relaxed text-gray-500">
                            {lang === 'nl'
                              ? 'Standaard € 0,15/kWh. De batterij kan hiermee stroom laden voor de warmtepomp; pas de aanname aan op uw contract.'
                              : 'Default €0.15/kWh. The battery can use this rate to charge for the heat pump; adjust it to your contract.'}
                          </p>
                        </div>
                      )}
                    </div>
                    {formData.battery_phase && !isManual && !selectedBatteryProduct && (
                      <p className="mt-4 text-xs font-semibold text-amber-700">{c.selectBatteryHint}</p>
                    )}
                    {hasInvalidPlannedEnergy && (
                      <p className="mt-2 text-xs font-semibold text-amber-700">{c.completePlannedKwhHint}</p>
                    )}
                  </StepShell>
                )
              })()}

              {step === 6 && heatPumpOnly && (
                <StepShell title={hpCopy.priceTitle} subtitle={hpCopy.priceSub} icon={<Euro className="w-full h-full" />}>
                  <div className="mb-5 rounded-2xl bg-[#EEF6F1] p-4">
                    <div className="text-[10px] uppercase tracking-wide font-bold text-[#22a55d] mb-1">{hpCopy.modelLabel}</div>
                    <div className="font-extrabold text-[#131A20]">{selectedHeatPump?.model || hpCopy.selectModel}</div>
                  </div>
                  <NumericInput label={hpCopy.priceLabel} value={formData.heat_pump_price}
                    onChange={(value) => update('heat_pump_price', value)} unit="euro"
                    placeholder={selectedHeatPump?.finalPriceEur?.toLocaleString('nl-NL', { minimumFractionDigits: 2 }) || 'bijv. 12000'} />
                  {heatPumpROI && <HintCard>
                    {lang === 'nl'
                      ? `Geschat ${Math.round(heatPumpROI.annualHeatPumpElectricityKwh).toLocaleString('nl-NL')} kWh extra stroom per jaar, ${heatPumpROI.electricityPerGasM3.toFixed(1).replace('.', ',')} kWh per bespaarde m³ gas. Bij radiatoren kan dat boven 2 kWh/m³ liggen.`
                      : `Estimated ${Math.round(heatPumpROI.annualHeatPumpElectricityKwh).toLocaleString('en-NL')} kWh additional electricity per year, ${heatPumpROI.electricityPerGasM3.toFixed(1)} kWh per m³ gas avoided. With radiators this can exceed 2 kWh/m³.`}
                  </HintCard>}
                  <SafetySources lang={lang} />
                  {error && (
                    <div role="alert" className="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl">
                      {error}
                    </div>
                  )}
                </StepShell>
              )}

              {step === 6 && !heatPumpOnly && (
                <StepShell title={c.step6Title} subtitle={c.step6Sub} icon={<Euro className="w-full h-full" />}>
                  <div className="mb-5 rounded-2xl bg-[#EEF6F1] p-4">
                    <div className="text-[10px] uppercase tracking-wide font-bold text-[#22a55d] mb-1">{c.batteryCatalogLabel}</div>
                    <div className="font-extrabold text-[#131A20]">
                      {selectedBatteryProduct
                        ? `${selectedBatteryProduct.brand} ${lang === 'nl' ? selectedBatteryProduct.model.replace(/(\d+)\.(?=\d)/g, '$1,') : selectedBatteryProduct.model}`
                        : `${new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { maximumFractionDigits: 1 }).format(formData.battery_kWh)} kWh`}
                    </div>
                    {selectedBatteryProduct && (
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedBatteryProduct.phase === '1-phase' ? c.phase1 : c.phase3} · {c.catalogHint}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{c.batteryPriceReferenceHint}</p>
                  </div>
                  <NumericInput
                    label={c.step6Label}
                    value={formData.battery_price}
                    onChange={(v) => update('battery_price', v)}
                    unit="euro"
                    placeholder="bijv. 8500"
                    tooltip={c.step6Tooltip}
                    autoFocus
                  />
                  <div className="bg-[#F9F7F4] border border-gray-100 rounded-2xl p-5 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold text-[#131A20] mb-1">{c.warmtefondsTitle}</p>
                        <p className="text-gray-400 leading-relaxed text-xs">{c.warmtefondsDesc}</p>
                      </div>
                    </div>
                  </div>
                  <SafetySources lang={lang} />
                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl">
                      {error}
                    </div>
                  )}
                </StepShell>
              )}
            </motion.div>
            </AnimatePresence>

          {/* Navigation */}
          <div className="sf-calc-navigation">
            {step > 1 && (
              <button
                onClick={goPrev}
                className="sf-calc-nav-button sf-calc-nav-secondary flex items-center gap-2 border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-[#131A20] px-5 py-3 rounded-full transition-all font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> {c.prev}
              </button>
            )}
            {step < 6 ? (
              <button
                onClick={goNext}
                disabled={!canNext()}
                className={`sf-calc-nav-button sf-calc-nav-primary flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all ml-auto text-sm ${
                  canNext()
                    ? 'bg-[#22a55d] hover:bg-[#1a9050] text-white hover:shadow-lg hover:shadow-green-500/20'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                {c.next} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canNext() || loading}
                className={`sf-calc-nav-button sf-calc-nav-primary flex items-center gap-2 font-bold px-8 py-3 rounded-full transition-all ml-auto text-sm ${
                  canNext() && !loading
                    ? 'bg-[#22a55d] hover:bg-[#1a9050] text-white hover:shadow-lg hover:shadow-green-500/20'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    {c.calculating}
                  </>
                ) : (
                  <>{c.viewReport} <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            )}
            </div>
            <p className="sf-calc-enter-hint text-center text-xs text-gray-400 mt-5">
              {c.enterToContinue}
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CalculatorPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const product = params.get('product') || location.state?.product
  const initialPart = params.get('part')
  const initialSolarProduction = params.get('production') || ''
  const initialPanelCount = params.get('panelCount') || ''
  const supportedProducts = ['solar', 'insulation', 'airco']

  if (supportedProducts.includes(product)) {
    return (
      <ProductSavingsEstimator
        key={`${product}-${initialPart || ''}-${initialSolarProduction}-${initialPanelCount}`}
        initialProduct={product}
        initialPart={initialPart}
        initialSolarProduction={initialSolarProduction}
        initialPanelCount={initialPanelCount}
      />
    )
  }

  return <BatteryHeatPumpCalculator />
}
