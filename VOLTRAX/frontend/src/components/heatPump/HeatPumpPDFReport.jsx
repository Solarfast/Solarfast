import React from 'react'
import { normalizeHeatPumpROIResult } from '../../lib/heatPumpROI.js'
import {
  ANNUAL_GAS_RANGES,
  getRangeById,
  getRangeMidpoint,
  HEATED_AREA_RANGES,
  INSULATION_PARTS,
} from '../../lib/heatPumpAdvice.js'
import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatEuro, formatNumber, getCopy } from './heatPumpCopy'
import { createPdfLayoutLogger } from '../../lib/pdfLayoutDebug'

const GREEN = '#55775D'
const INK = '#23342B'
const MUTED = '#5E7063'
const BORDER = '#DCE3D9'

const styles = StyleSheet.create({
  page: { backgroundColor: '#FBFAF6', color: INK, paddingTop: 70, paddingBottom: 42, paddingHorizontal: 38, fontFamily: 'Helvetica' },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: GREEN },
  header: { position: 'absolute', top: 17, left: 38, right: 38, height: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: INK, letterSpacing: 0.2 },
  brandAccent: { color: GREEN },
  headerNote: { fontSize: 7.5, color: MUTED, marginTop: 4 },
  date: { fontSize: 8, color: MUTED, textAlign: 'right' },
  title: { fontSize: 19, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 8.5, color: MUTED, marginBottom: 16 },
  hero: { backgroundColor: '#E9EEE5', borderRadius: 9, padding: 15, marginBottom: 13, borderWidth: 1, borderColor: '#C8D5C7' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#DCE7D9', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 9 },
  badgeText: { color: '#355A40', fontSize: 7, fontFamily: 'Helvetica-Bold' },
  eyebrow: { fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 4 },
  heroAmount: { color: '#355A40', fontSize: 29, fontFamily: 'Helvetica-Bold' },
  heroSub: { color: MUTED, fontSize: 7.5, marginTop: 3 },
  metrics: { flexDirection: 'row', gap: 7, marginTop: 13 },
  metric: { flex: 1, backgroundColor: '#FBFAF6', borderRadius: 6, padding: 8 },
  metricLabel: { fontSize: 6.5, color: MUTED, marginBottom: 4 },
  metricValue: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  section: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 7, marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  intro: { color: MUTED, fontSize: 7.5, lineHeight: 1.35, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingVertical: 5 },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 7.5, color: MUTED, flex: 1, minWidth: 0 },
  rowValue: { maxWidth: '44%', fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'right', flexShrink: 1, minWidth: 0, lineHeight: 1.25 },
  rowStrong: { maxWidth: '44%', color: '#355A40', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right', flexShrink: 1, minWidth: 0, lineHeight: 1.25 },
  compareHeader: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingBottom: 4, marginTop: 5 },
  compareRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingVertical: 5 },
  compareLabel: { flex: 1, minWidth: 0, fontSize: 7.5, color: MUTED },
  compareValue: { width: 82, minWidth: 0, flexShrink: 1, fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'right', lineHeight: 1.25 },
  compareTitle: { width: 82, minWidth: 0, flexShrink: 1, fontSize: 7, color: MUTED, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  note: { backgroundColor: '#F9F7F4', borderRadius: 7, padding: 10, marginBottom: 9 },
  noteTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  noteText: { fontSize: 7, color: MUTED, lineHeight: 1.4, marginBottom: 4 },
  source: { fontSize: 7, color: '#355A40', textDecoration: 'underline', marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 38, right: 38, height: 32, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 6 },
  footerText: { fontSize: 6.5, color: MUTED },
})

function ReportRow({ label, value, strong = false, last = false }) {
  return (
    <View style={[styles.row, last && styles.rowLast]} wrap={false}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={strong ? styles.rowStrong : styles.rowValue}>{value}</Text>
    </View>
  )
}

function ComparisonRow({ label, before, after, strong = false }) {
  return (
    <View style={styles.compareRow} wrap={false}>
      <Text style={styles.compareLabel}>{label}</Text>
      <Text style={strong ? [styles.compareValue, styles.rowStrong] : styles.compareValue}>{before}</Text>
      <Text style={strong ? [styles.compareValue, styles.rowStrong] : styles.compareValue}>{after}</Text>
    </View>
  )
}

export function HeatPumpPDFReport({ result: inputResult, lang, debugLayout }) {
  const result = normalizeHeatPumpROIResult(inputResult)
  const t = getCopy(lang)
  const home = result?.home || {}
  const advice = result?.advice || {}
  const extraCopy = lang === 'en'
    ? { extras: 'Other planned products', solar: 'Planned solar generation', ev: 'Planned home EV charging use', annual: 'Annual amount', enteredCost: 'Separately entered cost', notEntered: 'Not entered', isolation: 'Solar and EV plans are shown for context; they do not affect this heat-pump estimate.' }
    : { extras: 'Andere geplande producten', solar: 'Geplande zonne-opwek', ev: 'Gepland thuisladen van een elektrische auto', annual: 'Hoeveelheid per jaar', enteredCost: 'Apart opgegeven kosten', notEntered: 'Niet opgegeven', isolation: 'Zonnepanelen en EV staan alleen ter informatie en beïnvloeden deze warmtepompschatting niet.' }
  const model = result?.model || {}
  const isWeHeat = String(model.brand || '').toLowerCase().includes('weheat')
  const paybackValid = result?.paybackYears != null && result?.roiPct != null &&
    Number.isFinite(Number(result.paybackYears)) && Number.isFinite(Number(result.roiPct))
  const electricityPerGasM3 = Number(result?.electricityPerGasM3) ||
    (result?.annualGasAvoidedM3 > 0 ? result.annualHeatPumpElectricityKwh / result.annualGasAvoidedM3 : 0)
  const date = new Date().toLocaleDateString(lang === 'en' ? 'en-NL' : 'nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  const system = [model.brand, model.model].filter(Boolean).join(' ') || t.configFallback
  const configurationLabel = (config) => config === 'hybrid' ? t.hybridConfig
    : config === 'all-electric' ? t.allElectricConfig : config
  const homeValue = (value, values) => values[value] || value
  const homeTypeLabels = lang === 'en'
    ? { apartment: 'Apartment', terraced: 'Terraced house', 'end-terrace': 'End-terrace', 'semi-detached': 'Semi-detached', detached: 'Detached' }
    : { apartment: 'Appartement', terraced: 'Tussenwoning', 'end-terrace': 'Hoekwoning', 'semi-detached': 'Twee-onder-een-kap', detached: 'Vrijstaand' }
  const buildPeriodLabels = lang === 'en'
    ? { 'pre-1975': 'Before 1975', '1975-1990': '1975–1990', '1990-2005': '1990–2005', '2005-2020': '2005–2020', 'post-2020': 'After 2020' }
    : { 'pre-1975': 'Voor 1975', '1975-1990': '1975–1990', '1990-2005': '1990–2005', '2005-2020': '2005–2020', 'post-2020': 'Na 2020' }
  const insulationLabels = lang === 'en'
    ? { good: 'Good', average: 'Average', poor: 'Poor' }
    : { good: 'Goed', average: 'Gemiddeld', poor: 'Matig' }
  const insulationPartLabels = lang === 'en'
    ? { roof: 'Roof', walls: 'Walls', floor: 'Floor', glazing: 'HR++ / triple glazing' }
    : { roof: 'Dak', walls: 'Spouwmuur/gevel', floor: 'Vloer/bodem', glazing: 'HR++ / triple glas' }
  const emitterLabels = lang === 'en'
    ? { radiators: 'Radiators', floor: 'Underfloor heating', mixed: 'Radiators + underfloor heating', 'air-conditioning': 'Air conditioning (heating)' }
    : { radiators: 'Radiatoren', floor: 'Vloerverwarming', mixed: 'Radiatoren + vloerverwarming', 'air-conditioning': 'Airconditioning (verwarmen)' }
  const areaRange = getRangeById(home.areaRange, HEATED_AREA_RANGES)
  const gasRange = home.gasUseM3 == null
    ? getRangeById(home.gasUseRange, ANNUAL_GAS_RANGES)
    : null
  const areaValue = areaRange
    ? t.areaRangeValue(
      `${formatNumber(areaRange.min, lang)}–${formatNumber(areaRange.max, lang)}`,
      formatNumber(getRangeMidpoint(areaRange), lang),
    )
    : `${formatNumber(home.areaM2, lang)} m²`
  const gasValue = home.gasUseM3 != null
    ? `${formatNumber(home.gasUseM3, lang, 1)} ${t.m3Year}`
    : gasRange
      ? t.gasRangeValue(
      `${formatNumber(gasRange.min, lang)}–${formatNumber(gasRange.max, lang)}`,
      formatNumber(getRangeMidpoint(gasRange), lang),
    )
      : null
  const contractLabels = lang === 'en'
    ? { fixed: 'Fixed', variable: 'Variable', dynamic: 'Dynamic' }
    : { fixed: 'Vast', variable: 'Variabel', dynamic: 'Dynamisch' }
  const statedElectricPrice = Number(home.statedElectricPricePerKwh)
  const hasStatedElectricPrice = Number.isFinite(statedElectricPrice) && statedElectricPrice > 0
  const priceBreakdown = [
    [lang === 'en' ? 'Catalog price incl. VAT' : 'Catalogusprijs incl. btw', model.catalogPriceEur],
    [lang === 'en' ? 'Subsidy' : 'Subsidie', model.subsidyEur],
    [lang === 'en' ? 'Product price after subsidy' : 'Productprijs na subsidie', model.finalPriceEur],
    [lang === 'en' ? 'Investment used in this calculation' : 'Investering in deze berekening', result?.investmentEur],
  ].filter(([, value]) => value != null && Number.isFinite(Number(value)))
  const subsidyNote = typeof model.subsidyNote === 'string' && model.subsidyNote.trim()
    ? model.subsidyNote
    : t.priceSub

  if (!result) {
    return <Document onRender={createPdfLayoutLogger('SolarFast heat-pump report', debugLayout)}><Page size="A4" style={styles.page}><Text>{t.notAvailable}</Text></Page></Document>
  }

  return (
    <Document title={t.report} author="SolarFast" onRender={createPdfLayoutLogger('SolarFast heat-pump report', debugLayout)}>
      <Page size="A4" style={styles.page} wrap>
        <View id="heat-pump-report-accent" style={styles.accent} fixed />
        <View id="heat-pump-report-header" style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>Solar<Text style={styles.brandAccent}>Fast</Text></Text>
            <Text style={styles.headerNote}>{t.openPdf}</Text>
          </View>
          <Text style={styles.date}>{t.generated} {date}</Text>
        </View>

        <Text style={styles.title}>{t.report}</Text>
        <Text style={styles.subtitle}>{system}{model.kw != null ? ` · ${formatNumber(model.kw, lang, 1)} kW` : ''}</Text>

        <View id="heat-pump-hero-kpi" style={styles.hero} wrap={false}>
          <View style={styles.badge}><Text style={styles.badgeText}>{t.estimate}</Text></View>
          <Text style={styles.eyebrow}>{t.annualSavings}</Text>
          <Text style={styles.heroAmount}>{formatEuro(result.annualSavingsEur, lang)}</Text>
          <Text style={styles.heroSub}>{t.perYear}</Text>
          <View style={styles.metrics}>
            <View style={styles.metric}><Text style={styles.metricLabel}>{t.payback}</Text><Text style={styles.metricValue}>{paybackValid ? `${formatNumber(result.paybackYears, lang, 1)} ${t.years}` : t.notAvailable}</Text></View>
            <View style={styles.metric}><Text style={styles.metricLabel}>{t.investment}</Text><Text style={styles.metricValue}>{formatEuro(result.investmentEur, lang)}</Text></View>
            <View style={styles.metric}><Text style={styles.metricLabel}>{t.tenYearNet}</Text><Text style={styles.metricValue}>{formatEuro(result.tenYearNetEur, lang)}</Text></View>
          </View>
          {!paybackValid && <Text style={[styles.noteText, { marginTop: 8, marginBottom: 0 }]}>{t.noPaybackNote}</Text>}
        </View>

        <View id="heat-pump-energy-balance" style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{t.energyBalance}</Text>
          <View style={styles.compareHeader}>
            <Text style={styles.compareLabel} />
            <Text style={styles.compareTitle}>{t.before}</Text>
            <Text style={styles.compareTitle}>{t.after}</Text>
          </View>
          <ComparisonRow label={t.gasUse} before={`${formatNumber(result.annualGasBeforeM3, lang, 1)} ${t.m3Year}`} after={`${formatNumber(result.annualGasRemainingM3, lang, 1)} ${t.m3Year}`} />
          <ComparisonRow label={t.heatPumpElectricity} before={`0 ${t.kwhYear}`} after={`${formatNumber(result.annualHeatPumpElectricityKwh, lang)} ${t.kwhYear}`} />
          <ComparisonRow
            label={t.gasStandingCost}
            before={formatEuro(result.gasStandingCostBeforeEur, lang)}
            after={formatEuro(Number(result.gasStandingCostBeforeEur) - Number(result.gasStandingSavingsEur), lang)}
          />
          <ComparisonRow label={t.gasStandingSavings} before="—" after={formatEuro(result.gasStandingSavingsEur, lang)} />
          <ComparisonRow label={t.totalAnnualCost} before={formatEuro(result.beforeAnnualCostEur, lang)} after={formatEuro(result.afterAnnualCostEur, lang)} strong />
          <ReportRow label={t.annualSavingsLabel} value={`${formatEuro(result.annualSavingsEur, lang)} / ${t.perYear}`} strong last />
          <Text style={[styles.intro, { marginTop: 5, marginBottom: 0 }]}>{t.fixedGasNote}</Text>
        </View>

        <View id="heat-pump-performance" style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{t.performance}</Text>
          {model.config && <ReportRow label={t.configuration} value={configurationLabel(model.config)} />}
          <ReportRow label={t.modelDetails} value={`${formatNumber(result.annualHeatDemandKwh, lang)} ${t.kwhYear}`} />
          <ReportRow label={t.roi} value={paybackValid ? `${formatNumber(result.roiPct, lang, 1)}%` : t.notAvailable} />
          <ReportRow label={isWeHeat ? t.illustrativeScop : t.scoper} value={formatNumber(result.scopUsed, lang, 2)} />
          <ReportRow label={t.gasElectricRatio} value={`${formatNumber(electricityPerGasM3, lang, 2)} kWh/m³`} />
          {!isWeHeat && <ReportRow label={t.labelScop} value={`${formatNumber(result.scop35, lang, 2)} / ${formatNumber(result.scop55, lang, 2)}`} />}
          <ReportRow label={t.flowTemp} value={`${formatNumber(result.flowTemperature, lang, 0)} ${t.tempUnit}`} />
          <ReportRow label={t.boilerEfficiency} value={`${formatNumber(result.boilerEfficiencyPct, lang, 0)}%`} />
          <ReportRow label={t.gasEnergy} value={`${formatNumber(result.gasEnergyKwhPerM3, lang, 2)} kWh/m³`} last />
        </View>

        {(Object.keys(home).length > 0 || Object.keys(advice).length > 0) && (
          <View id="heat-pump-home-inputs" style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{t.homeInputs}</Text>
            {home.type && <ReportRow label={t.homeType} value={homeValue(home.type, homeTypeLabels)} />}
            {home.buildPeriod && <ReportRow label={t.buildPeriod} value={homeValue(home.buildPeriod, buildPeriodLabels)} />}
            {home.areaM2 != null && <ReportRow label={t.area} value={areaValue} />}
            {home.gasUseM3 != null && <ReportRow label={t.annualGasUse} value={gasValue} />}
            {advice.estimatedSpaceGasM3 != null && <ReportRow label={t.spaceHeatingShare} value={`${formatNumber(advice.estimatedSpaceGasM3, lang, 1)} ${t.m3Year}`} />}
            {home.insulation && <ReportRow label={t.insulation} value={homeValue(home.insulation, insulationLabels)} />}
            {home.energyLabel && (
              <ReportRow label={t.energyLabel} value={t.energyLabels[home.energyLabel] || home.energyLabel} />
            )}
            {INSULATION_PARTS.map((part) => {
              const answer = home.insulationDetails?.[part]
              return answer ? (
                <ReportRow key={part} label={t.insulationFeatures[part]}
                  value={t.insulationAnswers[answer] || answer} />
              ) : null
            })}
            {home.insulationParts?.length > 0 && (
              <ReportRow
                label={lang === 'en' ? 'Insulated parts' : 'Geïsoleerde onderdelen'}
                value={home.insulationParts.map((part) => insulationPartLabels[part] || part).join(', ')}
              />
            )}
            {home.emitters && <ReportRow label={t.emitters} value={homeValue(home.emitters, emitterLabels)} />}
            {home.boilerAgeYears != null && <ReportRow label={t.boilerAge} value={`${formatNumber(home.boilerAgeYears, lang)} ${t.years}`} />}
            {advice.requiredKw != null && <ReportRow label={t.requiredCapacity} value={`${formatNumber(advice.requiredKw, lang, 1)} kW`} />}
            {advice.recommendedConfig && <ReportRow label={t.recommendedConfiguration} value={configurationLabel(advice.recommendedConfig)} />}
            {home.contractType && <ReportRow label={t.contractType} value={homeValue(home.contractType, contractLabels)} />}
            {hasStatedElectricPrice && <ReportRow label={t.statedElectricity} value={`${formatNumber(statedElectricPrice, lang, 2)} €/kWh`} />}
            <ReportRow label={t.effectiveElectricity} value={`${formatNumber(result.electricPricePerKwh, lang, 2)} €/kWh`} last />
            <Text style={[styles.intro, { marginTop: 5, marginBottom: 0 }]}>{t.gasDemandBasis}</Text>
            {advice.heatingMethodNeedsReview && (
              <Text style={[styles.intro, { marginTop: 4, marginBottom: 0 }]}>{t.airConditioningReview}</Text>
            )}
          </View>
        )}

        <View id="heat-pump-prices" style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{t.prices}</Text>
          <ReportRow label={t.gasPrice} value={`${formatEuro(result.gasPricePerM3, lang, 2)} /m³`} />
          <ReportRow label={t.effectiveElectricity} value={`${formatEuro(result.electricPricePerKwh, lang, 2)} /kWh`} last />
          {priceBreakdown.map(([label, value], index) => (
            <ReportRow key={`price-${index}`} label={label} value={formatEuro(value, lang)} />
          ))}
          <Text style={[styles.intro, { marginTop: 5, marginBottom: 0 }]}>{subsidyNote}</Text>
        </View>

        {(result.extras?.solar?.selected || result.extras?.ev?.selected) && (
          <View id="heat-pump-planned-extras" style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{extraCopy.extras}</Text>
            {result.extras?.solar?.selected && (
              <>
                <ReportRow label={`${extraCopy.solar} · ${extraCopy.annual}`} value={`${formatNumber(result.extras.solar.annualKwh, lang)} ${t.kwhYear}`} />
                <ReportRow label={`${extraCopy.solar} · ${extraCopy.enteredCost}`} value={result.extras.solar.price == null ? extraCopy.notEntered : formatEuro(result.extras.solar.price, lang)} last={!result.extras?.ev?.selected} />
              </>
            )}
            {result.extras?.ev?.selected && (
              <>
                <ReportRow label={`${extraCopy.ev} · ${extraCopy.annual}`} value={`${formatNumber(result.extras.ev.annualKwh, lang)} ${t.kwhYear}`} />
                <ReportRow label={`${extraCopy.ev} · ${extraCopy.enteredCost}`} value={result.extras.ev.price == null ? extraCopy.notEntered : formatEuro(result.extras.ev.price, lang)} last />
              </>
            )}
            <Text style={[styles.intro, { marginTop: 5, marginBottom: 0 }]}>{extraCopy.isolation}</Text>
          </View>
        )}

        <View id="heat-pump-assumptions" style={styles.note} wrap={false}>
          <Text style={styles.noteTitle}>{t.assumptions}</Text>
          <Text style={styles.noteText}>{t.caveat}</Text>
          <Text style={styles.noteText}>{isWeHeat ? t.weheatScopCaveat : t.scopCaveat}</Text>
          {model.config === 'hybrid' && <Link src="https://www.rvo.nl/nieuws/warmtepompen-verlagen-energieverbruik" style={styles.source}>{t.hybridSource}</Link>}
          {!isWeHeat && String(model.brand || '').toLowerCase().includes('vaillant') && <Link src="https://www.vaillant.nl/producten/arothermpro" style={styles.source}>{t.scopSource}</Link>}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{t.estimate} · SolarFast</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export default HeatPumpPDFReport