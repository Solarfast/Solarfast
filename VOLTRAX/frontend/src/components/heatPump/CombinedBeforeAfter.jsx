import { Fragment } from 'react'
import { ArrowRight, Battery, Flame } from 'lucide-react'
import { splitHeatPumpElectricity } from '../../lib/energyScenario'
import './HeatPumpResults.css'

const copy = {
  nl: {
    sectionTitle: 'Wat verandert er in uw woning?',
    sectionIntro: 'Bekijk per gekozen product wat er verandert. De hoeveelheden zijn jaarlijkse uitkomsten van de berekening; werkelijk gebruik en kosten kunnen afwijken.',
    battery: 'Thuisbatterij',
    batteryIntro: 'De batterij kan meer van uw zonnestroom bewaren voor later gebruik in huis. Vergelijk hoeveel stroom u zelf gebruikt, teruglevert, uit de batterij haalt en van het net afneemt.',
    heatPump: 'Warmtepomp',
    heatPumpIntro: 'De warmtepomp vervangt een deel van de gasverwarming door stroom. De berekening verdeelt die stroom over zonne-opwek, goedkope batterijstroom en resterende netstroom.',
    withoutBattery: 'Zonder batterij',
    withBattery: 'Met batterij',
    withoutHeatPump: 'Zonder warmtepomp',
    withHeatPump: 'Met warmtepomp',
    selfConsumption: 'Zonnestroom gebruikt in huis',
    selfSufficiency: 'Aandeel verbruik gedekt door zonnestroom',
    directSelfUse: 'Zonnestroom direct gebruikt',
    returnedToGrid: 'Stroom teruggeleverd aan het net',
    batteryFlow: 'Stroom uit batterij gebruikt in huis',
    batteryTotal: 'Totaal ontladen uit batterij',
    batteryTrading: 'Waarvan ontladen voor EPEX-handel',
    gridImport: 'Netstroom voor gebruik thuis',
    epexGridCharge: 'Netstroom geladen voor EPEX',
    marketValue: 'Geschatte waarde batterijhandel (EPEX)',
    feedInCosts: 'Terugleverkosten',
    gasUse: 'Gasverbruik voor verwarming',
    heatPumpElectricity: 'Stroomverbruik warmtepomp',
    solarOverlap: 'Warmtepompstroom tijdens zonne-opwek (geschat)',
    batteryToHeatPump: 'Warmtepompstroom uit batterij (goedkoop geladen)',
    remainingHeatPumpPower: 'Resterende stroomvraag warmtepomp',
    heatingCosts: 'Jaarlijkse verwarmingskosten',
    annualSaving: 'Geschatte besparing',
    investment: 'Investering',
    year: 'jr',
    month: 'mnd',
    perYear: 'per jaar',
    less: 'minder',
    percentagePoints: 'procentpunt',
  },
  en: {
    sectionTitle: 'What changes in your home?',
    sectionIntro: 'See the effect of each selected product. Quantities are annual calculation results; actual use and costs may differ.',
    battery: 'Home battery',
    batteryIntro: 'The battery can store more of your solar power for later use at home. Compare how much electricity you use yourself, send to the grid, draw from the battery, and buy from the grid.',
    heatPump: 'Heat pump',
    heatPumpIntro: 'The heat pump replaces some gas heating with electricity. Its demand is split between solar generation, low-price battery power, and remaining grid power.',
    withoutBattery: 'Without battery',
    withBattery: 'With battery',
    withoutHeatPump: 'Without heat pump',
    withHeatPump: 'With heat pump',
    selfConsumption: 'Solar power used at home',
    selfSufficiency: 'Home use covered by own solar',
    directSelfUse: 'Solar power used directly',
    returnedToGrid: 'Electricity sent back to the grid',
    batteryFlow: 'Battery power used at home',
    batteryTotal: 'Total battery discharge',
    batteryTrading: 'Of which discharged for EPEX trading',
    gridImport: 'Grid power for home use',
    epexGridCharge: 'Grid power charged for EPEX',
    marketValue: 'Estimated battery trading value (EPEX)',
    feedInCosts: 'Feed-in costs',
    gasUse: 'Heating gas use',
    heatPumpElectricity: 'Heat-pump electricity use',
    solarOverlap: 'Heat-pump power during solar generation (estimated)',
    batteryToHeatPump: 'Heat-pump power from battery (low-price charge)',
    remainingHeatPumpPower: 'Remaining heat-pump electricity demand',
    heatingCosts: 'Annual heating costs',
    annualSaving: 'Estimated savings',
    investment: 'Investment',
    year: 'yr',
    month: 'mo',
    perYear: 'per year',
    less: 'less',
    percentagePoints: 'percentage points',
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

function MetricContent({ row }) {
  return (
    <div className="sf-combined-metric">
      <div className="sf-combined-metric-copy">
        <div className="sf-combined-metric-label">{row.label}</div>
        {row.detail && <div className="sf-combined-metric-detail">{row.detail}</div>}
      </div>
      <div className="sf-combined-metric-value">{row.value}</div>
    </div>
  )
}

function ScenarioPanel({ title, rows, after = false }) {
  return (
    <div className={`sf-combined-scenario${after ? ' sf-combined-scenario--after' : ''}`}>
      <h3 className="sf-combined-scenario-title">{title}</h3>
      <div>
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="sf-combined-scenario-row">
            <MetricContent row={row} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductComparison({
  icon: Icon, title, description, before, after, savings, investment, note, lang, t, showEconomics = true,
}) {
  const pairedRows = Array.from(
    { length: Math.max(before.rows.length, after.rows.length) },
    (_, index) => ({
      before: before.rows[index] || { label: '', value: '—' },
      after: after.rows[index] || { label: '', value: '—' },
    }),
  )

  return (
    <section className="sf-combined-product">
      <div className="sf-combined-product-heading">
        <span className="sf-combined-product-icon">
          <Icon aria-hidden="true" />
        </span>
        <h3>{title}</h3>
      </div>
      <p className="sf-combined-product-description">{description}</p>

      {showEconomics && (
        <div className="sf-combined-economics">
          <div>
            <div className="sf-combined-economics-label">{t.annualSaving}</div>
            <div className="sf-combined-economics-value">
              {savings}<span>/ {t.year}</span>
            </div>
          </div>
          <div>
            <div className="sf-combined-economics-label">{t.investment}</div>
            <div className="sf-combined-economics-value">{euro(investment, lang)}</div>
          </div>
        </div>
      )}

      <div className="sf-combined-mobile-scenarios">
        <ScenarioPanel title={before.title} rows={before.rows} />
        <div className="sf-combined-mobile-arrow" aria-hidden="true"><ArrowRight /></div>
        <ScenarioPanel title={after.title} rows={after.rows} after />
      </div>

      <div className="sf-combined-comparison-scroll">
        <div className="sf-combined-desktop-comparison">
          <div className="sf-combined-comparison-head sf-combined-before-head">
            <span className="sf-combined-comparison-kicker">{lang === 'nl' ? 'Huidige situatie' : 'Current scenario'}</span>
            <h4>{before.title}</h4>
          </div>
          <div className="sf-combined-comparison-arrow" aria-hidden="true">
            <span><ArrowRight /></span>
          </div>
          <div className="sf-combined-comparison-head sf-combined-after-head">
            <span className="sf-combined-comparison-kicker">{lang === 'nl' ? 'Met gekozen product' : 'With selected product'}</span>
            <h4>{after.title}</h4>
          </div>

          {pairedRows.map(({ before: beforeRow, after: afterRow }, index) => {
            const isLast = index === pairedRows.length - 1
            return (
              <Fragment key={`${beforeRow.label}-${afterRow.label}-${index}`}>
                <div className={`sf-combined-comparison-cell sf-combined-before-cell${isLast ? ' sf-combined-cell-last' : ''}`}>
                  <MetricContent row={beforeRow} />
                </div>
                <div className="sf-combined-comparison-divider" aria-hidden="true" />
                <div className={`sf-combined-comparison-cell sf-combined-after-cell${isLast ? ' sf-combined-cell-last' : ''}`}>
                  <MetricContent row={afterRow} />
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>
      {note && <p className="sf-combined-product-note">{note}</p>}
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
  const selfUseBefore = numberValue(batteryResults?.sc_pct_zonder)
  const selfUseAfter = numberValue(batteryResults?.sc_pct_met)
  const solarUsedBefore = numberValue(batteryResults?.sc_direct_kwh)
  const solarUsedAfter = numberValue(batteryResults?.sc_total_kwh) ??
    ((solarUsedBefore ?? 0) + (numberValue(batteryResults?.sc_battery_kwh) ?? 0))
  const annualHouseUse = numberValue(batteryResults?.v_input ?? batteryResults?.jaarverbruik)
  const selfSufficiencyBefore = annualHouseUse > 0 ? Math.min(100, (solarUsedBefore ?? 0) / annualHouseUse * 100) : null
  const selfSufficiencyAfter = annualHouseUse > 0 ? Math.min(100, solarUsedAfter / annualHouseUse * 100) : null
  const batteryTotalDischarge = numberValue(batteryResults?.battery_actual_discharge_kwh ?? batteryResults?.battery_throughput_kwh)
  const batteryEpexDischarge = numberValue(batteryResults?.battery_trading_discharge_kwh ?? batteryResults?.epex_throughput_kwh)
  const batteryHomeDelivery = numberValue(batteryResults?.battery_home_delivery_kwh ?? batteryResults?.sc_battery_kwh)
  const heatPumpKwh = numberValue(heatPumpROI?.annualHeatPumpElectricityKwh)
  const heatPumpSolarKwh = numberValue(energyScenario?.heatPumpSolarOverlapKwh)
  const heatPumpEnergySplit = splitHeatPumpElectricity({
    annualKwh: heatPumpKwh,
    solarOverlapKwh: heatPumpSolarKwh,
    batterySupplyKwh: batteryResults?.epex_home_delivery_kwh,
  })
  const cheapChargePrice = numberValue(batteryResults?.battery_cheap_charge_price_eur_per_kwh)
  const heatPumpBatteryDetail = cheapChargePrice == null
    ? undefined
    : `${language === 'nl' ? 'Gemiddelde laadprijs' : 'Average charging rate'}: ${euro(cheapChargePrice, language)}/kWh`

  return (
    <div className="sf-combined-impact" aria-label={t.sectionTitle}>
      <header className="sf-combined-impact-intro">
        <div className="sf-combined-impact-eyebrow">{language === 'nl' ? 'Uw producten, per jaar' : 'Your products, per year'}</div>
        <h2>{t.sectionTitle}</h2>
        <p>{t.sectionIntro}</p>
      </header>

      <ProductComparison
        icon={Battery}
        title={t.battery}
        description={t.batteryIntro}
        before={{
          title: t.withoutBattery,
          rows: [
            { label: t.selfConsumption, value: quantity(solarUsedBefore, kwhYear, language), detail: `${percentage(selfUseBefore, language)} ${language === 'nl' ? 'van de opwek' : 'of generation'}` },
            { label: t.selfSufficiency, value: percentage(selfSufficiencyBefore, language) },
            { label: t.returnedToGrid, value: quantity(beforeExport, kwhYear, language) },
            { label: t.batteryTotal, value: quantity(0, kwhYear, language) },
            { label: t.batteryFlow, value: quantity(0, kwhYear, language) },
            { label: t.batteryTrading, value: quantity(0, kwhYear, language) },
            { label: t.epexGridCharge, value: quantity(0, kwhYear, language) },
            { label: t.gridImport, value: quantity(batteryResults?.grid_import_without, kwhYear, language) },
          ],
        }}
        after={{
          title: t.withBattery,
          rows: [
            { label: t.selfConsumption, value: quantity(solarUsedAfter, kwhYear, language), detail: `${percentage(selfUseAfter, language)} ${language === 'nl' ? 'van de opwek' : 'of generation'}` },
            { label: t.selfSufficiency, value: percentage(selfSufficiencyAfter, language) },
            { label: t.returnedToGrid, value: quantity(afterExport, kwhYear, language) },
            { label: t.batteryTotal, value: quantity(batteryTotalDischarge, kwhYear, language) },
            { label: t.batteryFlow, value: quantity(batteryHomeDelivery, kwhYear, language) },
            { label: t.batteryTrading, value: quantity(batteryEpexDischarge, kwhYear, language) },
            { label: t.epexGridCharge, value: quantity(batteryResults?.epex_grid_charge_kwh, kwhYear, language) },
            { label: t.gridImport, value: quantity(batteryResults?.grid_import_with, kwhYear, language) },
          ],
        }}
        savings={euroRange(batterySavingsLow, batterySavingsHigh, language)}
        investment={batteryInvestment}
        showEconomics={false}
        lang={language}
        t={t}
      />

      <ProductComparison
        icon={Flame}
        title={t.heatPump}
        description={t.heatPumpIntro}
        before={{
          title: t.withoutHeatPump,
          rows: [
            { label: t.gasUse, value: quantity(heatPumpROI?.annualGasBeforeM3, gasYear, language, 1) },
            { label: t.heatPumpElectricity, value: quantity(0, kwhYear, language) },
            { label: t.solarOverlap, value: quantity(0, kwhYear, language) },
            { label: t.batteryToHeatPump, value: quantity(0, kwhYear, language) },
            { label: t.remainingHeatPumpPower, value: quantity(0, kwhYear, language) },
            { label: t.heatingCosts, value: euro(heatPumpROI?.beforeAnnualCostEur, language) },
          ],
        }}
        after={{
          title: t.withHeatPump,
          rows: [
            { label: t.gasUse, value: quantity(heatPumpROI?.annualGasRemainingM3, gasYear, language, 1) },
            { label: t.heatPumpElectricity, value: heatPumpKwh == null ? '—' : `+${quantity(heatPumpKwh, kwhYear, language, 1)}` },
            { label: t.solarOverlap, value: quantity(heatPumpEnergySplit.solarKwh, kwhYear, language) },
            { label: t.batteryToHeatPump, value: quantity(heatPumpEnergySplit.batteryKwh, kwhYear, language), detail: heatPumpBatteryDetail },
            { label: t.remainingHeatPumpPower, value: quantity(heatPumpEnergySplit.gridKwh, kwhYear, language) },
            { label: t.heatingCosts, value: euro(heatPumpROI?.afterAnnualCostEur, language) },
          ],
        }}
        savings={euro(heatPumpSavings, language)}
        investment={heatPumpInvestment}
        showEconomics={false}
        lang={language}
        t={t}
      />
    </div>
  )
}
