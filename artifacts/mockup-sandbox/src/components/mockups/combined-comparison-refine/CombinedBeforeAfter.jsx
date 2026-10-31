import { Battery, Flame } from 'lucide-react'

const copy = {
  nl: {
    battery: 'Thuisbatterij',
    heatPump: 'Warmtepomp',
    withoutBattery: 'Zonder batterij',
    withBattery: 'Met batterij',
    withoutHeatPump: 'Zonder warmtepomp',
    withHeatPump: 'Met warmtepomp',
    solarOutput: 'Zonne-opwek',
    selfConsumption: 'Zelfverbruik van zonne-opwek',
    directSelfUse: 'Direct zelfverbruik',
    selfSufficiency: 'Zelfvoorziening uit eigen zonnestroom',
    returnedToGrid: 'Teruglevering aan net',
    storedInsteadOfExport: 'Zelf gebruikt i.p.v. teruggeleverd',
    batteryFlow: 'Batterijdoorvoer per jaar',
    batteryFlowDetail: 'Zonne-opslag naar huis + dynamische markthandel',
    gridImport: 'Netstroom ingekocht',
    marketValue: 'EPEX-marktwaarde',
    feedInCosts: 'Terugleverkosten',
    gasUse: 'Gasverbruik',
    heatPumpElectricity: 'Extra stroom warmtepomp',
    solarOverlap: 'Geschat tegelijk gebruikt met zonne-opwek',
    remainingHeatPumpPower: 'Overige stroomvraag warmtepomp',
    heatingCosts: 'Jaarlijkse verwarmingskosten',
    annualSaving: 'Besparing',
    investment: 'Investering',
    year: 'jr',
    month: 'mnd',
    perYear: 'per jaar',
    less: 'minder',
    percentagePoints: 'procentpunt',
    batteryNote: 'Batterijvergelijking op basis van de geplande stroomvraag.',
  },
  en: {
    battery: 'Home battery',
    heatPump: 'Heat pump',
    withoutBattery: 'Without battery',
    withBattery: 'With battery',
    withoutHeatPump: 'Without heat pump',
    withHeatPump: 'With heat pump',
    solarOutput: 'Solar generation',
    selfConsumption: 'Solar generation self-used',
    directSelfUse: 'Direct self-consumption',
    selfSufficiency: 'Electricity covered by own solar',
    returnedToGrid: 'Electricity exported',
    storedInsteadOfExport: 'Used instead of exported',
    batteryFlow: 'Battery throughput per year',
    batteryFlowDetail: 'Stored solar delivered to the home + dynamic market trading',
    gridImport: 'Grid electricity bought',
    marketValue: 'EPEX market value',
    feedInCosts: 'Feed-in costs',
    gasUse: 'Gas use',
    heatPumpElectricity: 'Added heat-pump electricity',
    solarOverlap: 'Estimated use while solar is generating',
    remainingHeatPumpPower: 'Remaining heat-pump electricity demand',
    heatingCosts: 'Annual heating costs',
    annualSaving: 'Savings',
    investment: 'Investment',
    year: 'yr',
    month: 'mo',
    perYear: 'per year',
    less: 'less',
    percentagePoints: 'percentage points',
    batteryNote: 'Battery comparison uses the planned electricity demand.',
  },
}

function numberValue(value) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return null
  return Number(value)
}

function euro(value, lang) {
  const amount = numberValue(value)
  if (amount == null) return '—'
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function euroRange(low, high, lang) {
  const lowAmount = euro(low, lang)
  const highAmount = euro(high, lang)
  if (lowAmount === '—' || highAmount === '—') return '—'
  return Math.abs(Number(low) - Number(high)) < 0.005
    ? lowAmount
    : `${lowAmount}–${highAmount}`
}

function formattedNumber(value, lang, digits = 0) {
  const amount = numberValue(value)
  if (amount == null) return '—'
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    maximumFractionDigits: digits,
  }).format(amount)
}

function quantity(value, unit, lang, digits = 0) {
  const amount = formattedNumber(value, lang, digits)
  return amount === '—' ? amount : `${amount} ${unit}`
}

function percentage(value, lang, digits = 0) {
  const amount = formattedNumber(value, lang, digits)
  return amount === '—' ? amount : `${amount}%`
}

function ScenarioCard({ title, rows, after = false }) {
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${after ? 'border-[#e6df66]/70 bg-[#fffde0]/45' : 'border-black/[0.07] bg-[#f8f8f5]'}`}>
      <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#131A20]/55">{title}</h3>
      <div className="mt-2 divide-y divide-black/[0.06]">
        {rows.map((row) => (
          <div key={row.label} className="py-2 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-[#131A20]/60">{row.label}</span>
              <span className="text-right text-sm font-extrabold text-[#131A20]">{row.value}</span>
            </div>
            {row.detail && <div className="mt-0.5 text-right text-[11px] font-semibold text-[#131A20]/50">{row.detail}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductComparison({ icon: Icon, title, before, after, savings, investment, note, lang, t }) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fdf891] text-[#131A20]">
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <h2 className="font-extrabold text-[#131A20]">{title}</h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#131A20]/45">{t.annualSaving}</div>
          <div className="text-base font-extrabold tracking-tight text-[#131A20] sm:text-lg">
            {savings}<span className="ml-1 text-xs font-semibold text-[#131A20]/45">/ {t.year}</span>
          </div>
          <div className="text-[11px] font-semibold text-[#131A20]/50">{t.investment}: {euro(investment, lang)}</div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <ScenarioCard title={before.title} rows={before.rows} />
        <ScenarioCard title={after.title} rows={after.rows} after />
      </div>
      {note && <p className="mt-2 text-[11px] leading-relaxed text-[#131A20]/50">{note}</p>}
    </section>
  )
}

export function CombinedBeforeAfter({
  batteryResults,
  batterySavingsLow,
  batterySavingsHigh,
  batteryInvestment,
  heatPumpROI,
  heatPumpSavings,
  heatPumpInvestment,
  energyScenario,
  lang = 'nl',
}) {
  const language = lang === 'en' ? 'en' : 'nl'
  const t = copy[language]
  const kwhYear = language === 'nl' ? 'kWh/jaar' : 'kWh/year'
  const gasYear = language === 'nl' ? 'm³/jaar' : 'm³/year'
  const beforeExport = batteryResults?.export_kwh_zonder ?? batteryResults?.t_input
  const afterExport = numberValue(batteryResults?.export_kwh_with)
  const storedKwh = numberValue(beforeExport) != null && afterExport != null
    ? Math.max(0, Number(beforeExport) - afterExport)
    : null
  const importSaved = numberValue(batteryResults?.grid_import_besparing_kwh)
  const selfUseBefore = numberValue(batteryResults?.sc_pct_zonder)
  const selfUseAfter = numberValue(batteryResults?.sc_pct_met)
  const selfSufficiencyBefore = batteryResults?.self_sufficiency_before_pct
  const selfSufficiencyAfter = batteryResults?.self_sufficiency_after_pct
  const marketMonthlyLow = batteryResults?.smart_monthly_low ??
    (numberValue(batteryResults?.smart_annual_low) != null ? Number(batteryResults.smart_annual_low) / 12 : null)
  const marketMonthlyHigh = batteryResults?.smart_monthly_high ??
    (numberValue(batteryResults?.smart_annual_high) != null ? Number(batteryResults.smart_annual_high) / 12 : null)
  const feedInBefore = numberValue(batteryResults?.terugleverkosten_jaar)
  const feedInSaved = numberValue(batteryResults?.saved_terugleverkosten)
  const feedInAfter = feedInBefore == null
    ? null
    : Math.max(0, feedInBefore - (feedInSaved ?? 0))
  const batteryFlowDetail = [
    `${quantity(batteryResults?.sc_battery_kwh, kwhYear, language)} ${language === 'nl' ? 'zonne-opslag' : 'solar storage'}`,
    `${quantity(batteryResults?.epex_throughput_kwh, kwhYear, language)} EPEX`,
  ].join(' · ')
  const heatPumpKwh = numberValue(heatPumpROI?.annualHeatPumpElectricityKwh)
  const heatPumpSolarKwh = numberValue(energyScenario?.heatPumpSolarOverlapKwh)
  const heatPumpRemainingKwh = heatPumpKwh == null || heatPumpSolarKwh == null
    ? null
    : Math.max(0, heatPumpKwh - heatPumpSolarKwh)
  const noBatteryMarket = euroRange(0, 0, language)

  return (
    <div className="mt-5 space-y-6" aria-label={language === 'nl' ? 'Vier voor- en na-kaarten' : 'Four before and after cards'}>
      <ProductComparison
        icon={Battery}
        title={t.battery}
        before={{
          title: t.withoutBattery,
          rows: [
            { label: t.solarOutput, value: quantity(batteryResults?.pv_input, kwhYear, language) },
            { label: t.selfConsumption, value: percentage(batteryResults?.sc_pct_zonder, language) },
            { label: t.directSelfUse, value: quantity(batteryResults?.sc_direct_kwh, kwhYear, language) },
            { label: t.selfSufficiency, value: percentage(selfSufficiencyBefore, language) },
            { label: t.returnedToGrid, value: quantity(beforeExport, kwhYear, language) },
            { label: t.batteryFlow, value: quantity(0, kwhYear, language) },
            { label: t.gridImport, value: quantity(batteryResults?.grid_import_without, kwhYear, language) },
            { label: t.marketValue, value: `${noBatteryMarket}/${t.month}` },
            { label: t.feedInCosts, value: euro(feedInBefore, language) },
          ],
        }}
        after={{
          title: t.withBattery,
          rows: [
            { label: t.solarOutput, value: quantity(batteryResults?.pv_input, kwhYear, language) },
            {
              label: t.selfConsumption,
              value: `${percentage(selfUseBefore, language)} → ${percentage(selfUseAfter, language)}`,
              detail: selfUseBefore == null || selfUseAfter == null
                ? null
                : `↑ ${formattedNumber(selfUseAfter - selfUseBefore, language, 1)} ${t.percentagePoints}`,
            },
            { label: t.directSelfUse, value: quantity(batteryResults?.sc_direct_kwh, kwhYear, language) },
            {
              label: t.selfSufficiency,
              value: `${percentage(selfSufficiencyBefore, language)} → ${percentage(selfSufficiencyAfter, language)}`,
            },
            { label: t.storedInsteadOfExport, value: quantity(storedKwh, kwhYear, language) },
            {
              label: t.batteryFlow,
              value: quantity(batteryResults?.battery_throughput_kwh, kwhYear, language),
              detail: batteryFlowDetail,
            },
            {
              label: t.gridImport,
              value: quantity(batteryResults?.grid_import_with, kwhYear, language),
              detail: importSaved != null && importSaved > 0
                ? `${quantity(importSaved, kwhYear, language)} ${t.less}`
                : null,
            },
            { label: t.marketValue, value: `${euroRange(marketMonthlyLow, marketMonthlyHigh, language)}/${t.month}` },
            {
              label: t.feedInCosts,
              value: euro(feedInAfter, language),
              detail: feedInSaved != null && feedInSaved > 0 ? `${euro(feedInSaved, language)} ${t.less}` : null,
            },
          ],
        }}
        savings={euroRange(batterySavingsLow, batterySavingsHigh, language)}
        investment={batteryInvestment}
        note={t.batteryNote}
        lang={language}
        t={t}
      />

      <ProductComparison
        icon={Flame}
        title={t.heatPump}
        before={{
          title: t.withoutHeatPump,
          rows: [
            { label: t.gasUse, value: quantity(heatPumpROI?.annualGasBeforeM3, gasYear, language, 1) },
            { label: t.heatPumpElectricity, value: quantity(0, kwhYear, language) },
            { label: t.heatingCosts, value: euro(heatPumpROI?.beforeAnnualCostEur, language) },
          ],
        }}
        after={{
          title: t.withHeatPump,
          rows: [
            { label: t.gasUse, value: quantity(heatPumpROI?.annualGasRemainingM3, gasYear, language, 1) },
            { label: t.heatPumpElectricity, value: heatPumpKwh == null ? '—' : `+${quantity(heatPumpKwh, kwhYear, language, 1)}` },
            { label: t.solarOverlap, value: quantity(heatPumpSolarKwh, kwhYear, language) },
            { label: t.remainingHeatPumpPower, value: quantity(heatPumpRemainingKwh, kwhYear, language) },
            { label: t.heatingCosts, value: euro(heatPumpROI?.afterAnnualCostEur, language) },
          ],
        }}
        savings={euro(heatPumpSavings, language)}
        investment={heatPumpInvestment}
        lang={language}
        t={t}
      />
    </div>
  )
}