import { Zap } from 'lucide-react'
import { CombinedBeforeAfter } from './CombinedBeforeAfter.jsx'
import {
  calculateCombinedROI,
  calculateHeatPumpMarginalElectricityCost,
} from '../../lib/combinedROI.js'
import { normalizeHeatPumpROIResult } from '../../lib/heatPumpROI.js'

const copy = {
  nl: {
    eyebrow: 'Resultaat',
    title: 'Uw financiële resultaat',
    changeTitle: 'Netto voordeel per jaar',
    heatPumpPower: 'Stroom voor de warmtepomp',
    heatPumpEffectiveRate: 'Gemiddelde netto stroomprijs warmtepomp',
    heatPumpMarginalCost: 'Extra stroomkosten warmtepomp in deze combinatie',
    heatPumpPv: 'Zonnestroom direct gebruikt voor warmtepomp (geschat)',
    batteryUseMore: 'Meer stroom uit de batterij gebruikt',
    batteryUseLess: 'Minder stroom uit de batterij gebruikt',
    exportAlone: 'Teruglevering met alleen de batterij',
    exportCombined: 'Teruglevering met batterij + warmtepomp',
    exportLess: 'Minder teruggeleverd',
    exportMore: 'Meer teruggeleverd',
    batteryOnlyCosts: 'Met batterij, zonder warmtepomp',
    combinedCosts: 'Met batterij en warmtepomp',
    annualCosts: 'Jaarlijkse kosten voor stroom en gas',
    perYear: 'per jaar',
    batteryFlowNote: 'De netto stroomprijs is berekend uit het verschil tussen de jaarrekeningen met en zonder warmtepomp. Zonnestroom en batterij tellen mee; de batterij levert aan het hele huis en wordt niet per apparaat gemeten.',
    investment: 'Totale investering',
    payback: 'Terugverdientijd samen',
    unavailable: 'Niet beschikbaar',
    years: 'jaar',
    financialUnavailable: 'Combinatie niet berekend.',
    totalInvestment: 'Batterij + warmtepomp + gekozen producten',
    paybackLabel: 'Terugverdientijd',
    detailsLabel: 'Bekijk energie- en kostendetails',
    monthlyBenefit: 'Gemiddeld per maand',
    roiPerYear: 'ROI per jaar',
    scopeNote: 'Het totaal is opnieuw berekend uit de volledige jaarrekening met en zonder de combinatie. Productbesparingen overlappen en mogen niet bij elkaar worden opgeteld.',
  },
  en: {
    eyebrow: 'Result',
    title: 'Your financial result',
    changeTitle: 'Net benefit per year',
    heatPumpPower: 'Heat-pump electricity',
    heatPumpEffectiveRate: 'Average net heat-pump electricity price',
    heatPumpMarginalCost: 'Extra heat-pump electricity cost in this combination',
    heatPumpPv: 'Solar power used directly by heat pump (estimated)',
    batteryUseMore: 'More electricity used from the battery',
    batteryUseLess: 'Less electricity used from the battery',
    exportAlone: 'Export with battery only',
    exportCombined: 'Export with battery + heat pump',
    exportLess: 'Less exported',
    exportMore: 'More exported',
    batteryOnlyCosts: 'With battery, without heat pump',
    combinedCosts: 'With battery and heat pump',
    annualCosts: 'Annual electricity and gas costs',
    perYear: 'per year',
    batteryFlowNote: 'The net electricity price is calculated from the difference between annual bills with and without the heat pump. Solar and battery are included; the battery serves the whole home, not one appliance separately.',
    investment: 'Combined investment',
    payback: 'Combined payback',
    unavailable: 'Not available',
    years: 'years',
    financialUnavailable: 'Combined estimate unavailable.',
    totalInvestment: 'Battery + heat pump + selected products',
    paybackLabel: 'Payback period',
    detailsLabel: 'View energy and cost details',
    monthlyBenefit: 'Average per month',
    roiPerYear: 'ROI per year',
    scopeNote: 'The total is recalculated from the full household bills with and without the combination. Product savings overlap and must not be added together.',
  },
}

function numberValue(value) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return null
  return Number(value)
}

function euro(value, lang) {
  const amount = numberValue(value)
  if (amount == null) return null
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function range(low, high, lang) {
  const formattedLow = euro(low, lang)
  const formattedHigh = euro(high, lang)
  if (formattedLow == null || formattedHigh == null) return '—'
  return Math.abs(Number(low) - Number(high)) < 0.005
    ? formattedLow
    : `${formattedLow}–${formattedHigh}`
}

function percentRange(low, high, lang) {
  const lowValue = numberValue(low)
  const highValue = numberValue(high)
  if (lowValue == null || highValue == null) return '—'
  const format = (value) => `${number(value, lang)}%`
  return Math.abs(lowValue - highValue) < 0.005
    ? format(lowValue)
    : `${format(lowValue)}–${format(highValue)}`
}

function number(value, lang, digits = 1) {
  const amount = numberValue(value)
  if (amount == null) return '—'
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    maximumFractionDigits: digits,
  }).format(amount)
}

function quantity(value, unit, lang, digits = 0) {
  const formatted = number(value, lang, digits)
  return formatted === '—' ? formatted : `${formatted} ${unit}`
}

function signedQuantity(value, unit, lang) {
  const amount = numberValue(value)
  if (amount == null) return '—'
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${sign}${quantity(Math.abs(amount), unit, lang)}`
}

function EnergyMetric({ label, value, detail }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/20 bg-white/[0.08] p-4 sm:p-5">
      <div className="min-h-12 text-base font-semibold leading-snug text-white">{label}</div>
      <div className="mt-2 break-words text-2xl font-extrabold leading-tight text-white">{value}</div>
      {detail && <div className="mt-2 text-base leading-relaxed text-white">{detail}</div>}
    </div>
  )
}

export function CombinedResults({
  batteryResults,
  batteryWithoutHeatPumpResults,
  batteryInvestmentEur,
  heatPumpROI,
  energyScenario,
  additionalInvestmentEur = 0,
  hasAdditionalInvestment = false,
  additionalProductsModeled = false,
  additionalGasSavingsEur = 0,
  lang = 'nl',
}) {
  const language = lang === 'en' ? 'en' : 'nl'
  const t = copy[language]
  const kwhYear = language === 'nl' ? 'kWh/jaar' : 'kWh/year'
  const normalizedHeatPumpROI = normalizeHeatPumpROIResult(heatPumpROI)
  const totals = calculateCombinedROI({
    batteryResults,
    batteryWithoutHeatPumpResults,
    batteryInvestmentEur,
    heatPumpROI: normalizedHeatPumpROI,
    additionalInvestmentEur,
    hasAdditionalInvestment,
    additionalProductsModeled,
    additionalGasSavingsEur,
  })

  const hasBothQuotes = Boolean(totals) &&
    Number.isFinite(Number(batteryInvestmentEur)) &&
    Number(batteryInvestmentEur) > 0 &&
    Number.isFinite(Number(normalizedHeatPumpROI?.investmentEur)) &&
    Number(normalizedHeatPumpROI.investmentEur) > 0 &&
    (!hasAdditionalInvestment || (Number.isFinite(Number(additionalInvestmentEur)) && Number(additionalInvestmentEur) > 0))
  const hasPayback = hasBothQuotes &&
    totals.paybackLowYears != null &&
    totals.paybackHighYears != null &&
    Number.isFinite(Number(totals.paybackLowYears)) &&
    Number.isFinite(Number(totals.paybackHighYears))
  const combinedCostLow = totals
    ? totals.combinedAnnualCostBeforeEpexEur - totals.epexAnnualHighEur
    : null
  const combinedCostHigh = totals
    ? totals.combinedAnnualCostBeforeEpexEur - totals.epexAnnualLowEur
    : null
  const formattedPayback = hasPayback
    ? `${number(totals.paybackLowYears, language)}–${number(totals.paybackHighYears, language)} ${t.years}`
    : t.unavailable

  const heatPumpElectricity = numberValue(normalizedHeatPumpROI?.annualHeatPumpElectricityKwh)
  const heatPumpMarginalCost = calculateHeatPumpMarginalElectricityCost({
    combinedBatteryResults: batteryResults,
    batteryOnlyResults: batteryWithoutHeatPumpResults,
    heatPumpElectricityKwh: heatPumpElectricity,
  })
  const heatPumpEffectiveRate = heatPumpMarginalCost?.effectivePricePerKwh
  const heatPumpSolarDirectKwh = numberValue(energyScenario?.heatPumpSolarOverlapKwh)
  const batteryHomeDelivery = numberValue(
    batteryResults?.battery_home_delivery_kwh ?? batteryResults?.sc_battery_kwh,
  )
  const batteryHomeDeliveryWithoutHeatPump = numberValue(
    batteryWithoutHeatPumpResults?.battery_home_delivery_kwh ??
      batteryWithoutHeatPumpResults?.sc_battery_kwh,
  )
  const batteryHomeDeliveryDelta = batteryHomeDelivery == null || batteryHomeDeliveryWithoutHeatPump == null
    ? null
    : batteryHomeDelivery - batteryHomeDeliveryWithoutHeatPump
  const exportWithBatteryOnly = numberValue(batteryWithoutHeatPumpResults?.export_kwh_with)
  const exportWithBoth = numberValue(batteryResults?.export_kwh_with)
  const exportDelta = exportWithBatteryOnly == null || exportWithBoth == null
    ? null
    : exportWithBatteryOnly - exportWithBoth
  const batteryOnlyEpexLow = batteryWithoutHeatPumpResults?.dynamic_contract === true
    ? numberValue(batteryWithoutHeatPumpResults?.smart_annual_low)
    : 0
  const batteryOnlyEpexHigh = batteryWithoutHeatPumpResults?.dynamic_contract === true
    ? numberValue(batteryWithoutHeatPumpResults?.smart_annual_high)
    : 0
  const batteryOnlyCostBeforeEpex = numberValue(batteryWithoutHeatPumpResults?.net_annual_cost_with)
  const gasCostWithoutHeatPump = totals?.gasCostBeforeEur
  const batteryOnlyCostLow = batteryOnlyCostBeforeEpex == null || gasCostWithoutHeatPump == null || batteryOnlyEpexHigh == null
    ? null
    : batteryOnlyCostBeforeEpex + gasCostWithoutHeatPump - batteryOnlyEpexHigh
  const batteryOnlyCostHigh = batteryOnlyCostBeforeEpex == null || gasCostWithoutHeatPump == null || batteryOnlyEpexLow == null
    ? null
    : batteryOnlyCostBeforeEpex + gasCostWithoutHeatPump - batteryOnlyEpexLow
  const exportChangeTitle = exportDelta == null
    ? t.exportLess
    : exportDelta >= 0
      ? t.exportLess
      : t.exportMore
  const batteryChangeTitle = batteryHomeDeliveryDelta == null
    ? t.batteryUseMore
    : batteryHomeDeliveryDelta >= 0
      ? t.batteryUseMore
      : t.batteryUseLess

  return (
    <section
      aria-labelledby="combined-results-title"
      data-testid="section-combined-results"
      className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white text-[#131A20] shadow-[0_12px_36px_rgba(19,26,32,0.05)]"
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dfe8dc]">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="text-base font-bold uppercase tracking-[0.1em] text-[#405247]">{t.eyebrow}</div>
            <h1 id="combined-results-title" className="text-2xl font-extrabold tracking-tight text-[#131A20] sm:text-3xl">{t.title}</h1>
          </div>
        </div>

        <CombinedBeforeAfter
          batteryResults={batteryResults}
          heatPumpROI={normalizedHeatPumpROI}
          energyScenario={energyScenario}
          lang={language}
        />

        <section className="mt-5 rounded-3xl bg-[#193829] p-5 text-white sm:p-7" aria-labelledby="combined-total-title">
          <div className="text-base font-bold uppercase tracking-[0.1em] text-white/85">{t.changeTitle}</div>
          <h2 id="combined-total-title" className="mt-1 text-4xl font-extrabold tracking-tight text-white sm:text-5xl" style={{ color: '#FFFFFF' }}>
            {totals ? range(totals.annualLowEur, totals.annualHighEur, language) : t.unavailable}
          </h2>
          <p className="mt-1 text-base font-semibold text-white/90">{t.perYear}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/20 bg-white/[0.08] p-4">
              <div className="text-base text-white/90">{hasAdditionalInvestment ? t.totalInvestment : (language === 'nl' ? 'Batterij + warmtepomp' : 'Battery + heat pump')}</div>
              <div className="mt-1 text-2xl font-extrabold text-white">{euro(totals?.totalInvestmentEur, language) || t.unavailable}</div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/[0.08] p-4">
              <div className="text-base text-white/90">{t.paybackLabel}</div>
              <div className="mt-1 text-2xl font-extrabold text-white">{hasPayback ? formattedPayback : t.unavailable}</div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/[0.08] p-4">
              <div className="text-base text-white/90">{t.monthlyBenefit}</div>
              <div className="mt-1 text-2xl font-extrabold text-white">
                {totals ? range(totals.annualLowEur / 12, totals.annualHighEur / 12, language) : t.unavailable}
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/[0.08] p-4">
              <div className="text-base text-white/90">{t.roiPerYear}</div>
              <div className="mt-1 text-2xl font-extrabold text-white">
                {totals ? percentRange(totals.roiLowPct, totals.roiHighPct, language) : t.unavailable}
              </div>
            </div>
          </div>
          {!totals && <p role="status" className="mt-4 text-base font-semibold text-white">{t.financialUnavailable}</p>}
          <p className="mt-4 text-base leading-relaxed text-white/90">{t.scopeNote}</p>
          {energyScenario?.hasUnprofiledAdditionalLoads && (
            <p className="mt-3 rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3 text-base leading-relaxed text-white/90">
              {language === 'nl'
                ? 'Thuisladen is aan het jaarverbruik toegevoegd. De berekening rekent hiervoor geen vaste zonne- of batterijdekking toe.'
                : 'Home charging is included in annual use. The estimate does not assign a fixed solar or battery share to it.'}
            </p>
          )}
        </section>

        <details className="mt-4 rounded-2xl border border-[#d5dfd3] bg-[#fbfaf6]">
          <summary className="cursor-pointer px-4 py-3 text-base font-bold text-[#193829]">{t.detailsLabel}</summary>
          <div className="border-t border-[#d5dfd3] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <EnergyMetric label={t.heatPumpPower} value={quantity(heatPumpElectricity, kwhYear, language)} />
              <EnergyMetric
                label={t.heatPumpEffectiveRate}
                value={heatPumpEffectiveRate == null
                  ? t.unavailable
                  : `${new Intl.NumberFormat(language === 'nl' ? 'nl-NL' : 'en-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(heatPumpEffectiveRate)}/${language === 'nl' ? 'kWh' : 'kWh'}`}
                detail={heatPumpMarginalCost
                  ? `${t.heatPumpMarginalCost}: ${euro(heatPumpMarginalCost.annualCostEur, language)} ${t.perYear}`
                  : undefined}
              />
              <EnergyMetric label={t.heatPumpPv} value={quantity(heatPumpSolarDirectKwh, kwhYear, language)} />
              <EnergyMetric
                label={batteryChangeTitle}
                value={batteryHomeDeliveryDelta == null ? t.unavailable : signedQuantity(batteryHomeDeliveryDelta, kwhYear, language)}
              />
              <EnergyMetric label={t.exportAlone} value={quantity(exportWithBatteryOnly, kwhYear, language)} />
              <EnergyMetric label={t.exportCombined} value={quantity(exportWithBoth, kwhYear, language)} />
            </div>
            <p className="mt-3 text-base leading-relaxed text-[#405247]">{t.batteryFlowNote}</p>
            <h3 className="mt-5 text-lg font-extrabold text-[#193829]">{t.annualCosts}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#d5dfd3] bg-white p-4">
                <div className="text-base font-semibold text-[#405247]">{t.batteryOnlyCosts}</div>
                <div className="mt-1 text-2xl font-extrabold text-[#193829]">{range(batteryOnlyCostLow, batteryOnlyCostHigh, language)}</div>
                <div className="mt-1 text-base text-[#405247]">{t.perYear}</div>
              </div>
              <div className="rounded-2xl border border-[#cbd9ca] bg-[#dfe8dc] p-4">
                <div className="text-base font-bold text-[#193829]">{t.combinedCosts}</div>
                <div className="mt-1 text-2xl font-extrabold text-[#193829]">{range(combinedCostLow, combinedCostHigh, language)}</div>
                <div className="mt-1 text-base font-semibold text-[#193829]">{t.perYear}</div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </section>
  )
}

export default CombinedResults