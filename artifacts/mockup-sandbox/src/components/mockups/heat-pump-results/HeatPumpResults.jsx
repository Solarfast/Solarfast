import React from 'react'
import { normalizeHeatPumpROIResult } from './heatPumpROI.js'
import {
  ANNUAL_GAS_RANGES,
  getRangeById,
  getRangeMidpoint,
  HEATED_AREA_RANGES,
  INSULATION_PARTS,
} from './heatPumpAdvice.js'
import { formatEuro, formatNumber, getCopy } from './heatPumpCopy'

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-[#131A20]/[0.07] bg-white/80 p-4">
      <div className="text-xs font-semibold text-[#131A20]/55">{label}</div>
      <div className="mt-1 text-lg font-extrabold tracking-tight text-[#131A20]">{value}</div>
      {detail && <div className="mt-1 text-xs text-[#131A20]/45">{detail}</div>}
    </div>
  )
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#131A20]/[0.07] py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-[#131A20]/60">{label}</span>
      <span className={`text-sm ${strong ? 'font-extrabold text-[#16804a]' : 'font-bold text-[#131A20]'}`}>{value}</span>
    </div>
  )
}

export function HeatPumpResults({ result: inputResult, lang, combined = false, hideAnnualSummary = false }) {
  const result = normalizeHeatPumpROIResult(inputResult)
  const t = getCopy(lang)
  const home = result?.home || {}
  const advice = result?.advice || {}
  const extraCopy = lang === 'en'
    ? { extras: 'Other planned products', solar: 'Planned solar generation', ev: 'Planned home EV charging use', annual: 'Expected annual amount', enteredCost: 'Separately entered cost', notEntered: 'Not entered', isolation: 'Solar and EV plans are shown for context; they do not affect this heat-pump estimate.' }
    : { extras: 'Andere geplande producten', solar: 'Geplande zonne-opwek', ev: 'Gepland thuisladen van een elektrische auto', annual: 'Verwachte hoeveelheid per jaar', enteredCost: 'Apart opgegeven kosten', notEntered: 'Niet opgegeven', isolation: 'Zonnepanelen en EV staan alleen ter informatie en beïnvloeden deze warmtepompschatting niet.' }
  const model = result?.model || {}
  const isWeHeat = String(model.brand || '').toLowerCase().includes('weheat')
  if (!result) {
    return <section className="rounded-2xl border border-[#22a55d]/20 bg-[#EEF6F1] p-6 text-sm text-[#131A20]/60">{t.notAvailable}</section>
  }

  const paybackAvailable = result.paybackYears !== null && result.paybackYears !== undefined &&
    Number.isFinite(Number(result.paybackYears)) && Number(result.paybackYears) >= 0 &&
    result.roiPct !== null && result.roiPct !== undefined && Number.isFinite(Number(result.roiPct))
  const electricityPerGasM3 = Number(result.electricityPerGasM3) ||
    (result.annualGasAvoidedM3 > 0 ? result.annualHeatPumpElectricityKwh / result.annualGasAvoidedM3 : 0)
  const label = [model.brand, model.model].filter(Boolean).join(' ') || t.configFallback
  const formattedModel = model.kw != null ? `${formatNumber(model.kw, lang, 1)} kW` : ''
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
  const contractLabels = lang === 'en'
    ? { fixed: 'Fixed', variable: 'Variable', dynamic: 'Dynamic' }
    : { fixed: 'Vast', variable: 'Variabel', dynamic: 'Dynamisch' }
  const configuration = model.config ? configurationLabel(model.config) : ''
  const recommendedConfiguration = advice.recommendedConfig ? configurationLabel(advice.recommendedConfig) : ''
  const statedElectricPrice = Number(home.statedElectricPricePerKwh)
  const hasStatedElectricPrice = Number.isFinite(statedElectricPrice) && statedElectricPrice > 0
  const effectiveElectricPrice = Number(result.electricPricePerKwh)
  const dynamicCombination = combined && home.contractType === 'dynamic'
  const areaRange = getRangeById(home.areaRange, HEATED_AREA_RANGES)
  const gasRange = getRangeById(home.gasUseRange, ANNUAL_GAS_RANGES)
  const areaValue = areaRange
    ? t.areaRangeValue(
      `${formatNumber(areaRange.min, lang)}–${formatNumber(areaRange.max, lang)}`,
      formatNumber(getRangeMidpoint(areaRange), lang),
    )
    : `${formatNumber(home.areaM2, lang)} m²`
  const gasValue = gasRange
    ? t.gasRangeValue(
      `${formatNumber(gasRange.min, lang)}–${formatNumber(gasRange.max, lang)}`,
      formatNumber(getRangeMidpoint(gasRange), lang),
    )
    : `${formatNumber(home.gasUseM3, lang, 1)} ${t.m3Year}`

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 font-['Plus_Jakarta_Sans'] text-[#131A20]">
      {!hideAnnualSummary && (
        <div className="relative overflow-hidden rounded-2xl border border-[#22a55d]/20 bg-[#EEF6F1]">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#22a55d]/[0.08]" />
          <div className="relative p-5 sm:p-8">
            <div className="mb-4 inline-flex rounded-full bg-[#22a55d]/15 px-3 py-1 text-xs font-bold text-[#16804a]">{t.estimate}</div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#131A20]/55">{t.annualSavings}</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-4xl font-extrabold leading-none tracking-tight text-[#16804a] sm:text-5xl">{formatEuro(result.annualSavingsEur, lang)}</span>
              <span className="text-sm font-medium text-[#131A20]/55">{t.perYear}</span>
            </div>
            {!combined && <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Metric label={t.payback} value={paybackAvailable ? `${formatNumber(result.paybackYears, lang, 1)} ${t.years}` : t.notAvailable} />
              <Metric label={t.investment} value={formatEuro(result.investmentEur, lang)} />
              <Metric label={t.tenYearNet} value={formatEuro(result.tenYearNetEur, lang)} />
            </div>}
            {!combined && !paybackAvailable && <p className="mt-3 text-xs leading-relaxed text-[#131A20]/60">{t.noPaybackNote}</p>}
            {combined && <p className="mt-3 text-xs leading-relaxed text-[#131A20]/60">{lang === 'en' ? 'This is the heat-pump contribution to the combined savings and payback shown above.' : 'Dit is de warmtepompbijdrage aan de gezamenlijke besparing en terugverdientijd hierboven.'}</p>}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-extrabold">{t.system}</h2>
        <p className="mt-1 text-sm text-[#131A20]/55">{label}{formattedModel ? ` · ${formattedModel}` : ''}</p>
        <div className="mt-3">
          {configuration && <Row label={t.configuration} value={configuration} />}
          <Row label={t.modelDetails} value={`${formatNumber(result.annualHeatDemandKwh, lang)} ${t.kwhYear}`} />
          {!combined && <Row label={t.roi} value={paybackAvailable ? `${formatNumber(result.roiPct, lang, 1)}%` : t.notAvailable} />}
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-extrabold">{t.energyBalance}</h2>
          <div className="text-sm font-extrabold text-[#16804a]">
            {t.annualSavingsLabel}: {formatEuro(result.annualSavingsEur, lang)} / {t.perYear}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-black/[0.07] bg-[#f8f8f5] px-4">
            <h3 className="pt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#131A20]/55">{t.before}</h3>
            <div className="pb-1">
              <Row label={t.gasUse} value={`${formatNumber(result.annualGasBeforeM3, lang, 1)} ${t.m3Year}`} />
              <Row label={t.heatPumpElectricity} value={`0 ${t.kwhYear}`} />
              <Row label={t.gasStandingCost} value={formatEuro(result.gasStandingCostBeforeEur, lang)} />
              <Row label={t.totalAnnualCost} value={formatEuro(result.beforeAnnualCostEur, lang)} strong />
            </div>
          </div>

          <div className="rounded-xl border border-[#e6df66]/70 bg-[#fffde0]/45 px-4">
            <h3 className="pt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#131A20]/55">{t.after}</h3>
            <div className="pb-1">
              <Row label={t.gasUse} value={`${formatNumber(result.annualGasRemainingM3, lang, 1)} ${t.m3Year}`} />
              <Row label={t.heatPumpElectricity} value={`+${formatNumber(result.annualHeatPumpElectricityKwh, lang)} ${t.kwhYear}`} strong />
              <Row
                label={t.gasStandingCost}
                value={formatEuro(Number(result.gasStandingCostBeforeEur) - Number(result.gasStandingSavingsEur), lang)}
              />
              <Row label={t.gasStandingSavings} value={formatEuro(result.gasStandingSavingsEur, lang)} />
              <Row label={t.totalAnnualCost} value={formatEuro(result.afterAnnualCostEur, lang)} strong />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#131A20]/60">{t.fixedGasNote}</p>
      </div>

      <details className="rounded-2xl border border-black/[0.08] bg-white">
        <summary className="cursor-pointer px-5 py-4 text-sm font-extrabold">{t.technicalDetails}</summary>
        <div className="space-y-4 border-t border-black/[0.08] p-4 sm:p-5">
          <div className="rounded-xl border border-black/[0.08] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">{t.performance}</h2>
            <div className="mt-3">
              <Row label={isWeHeat ? t.illustrativeScop : t.scoper} value={formatNumber(result.scopUsed, lang, 2)} />
              <Row label={t.gasElectricRatio} value={`${formatNumber(electricityPerGasM3, lang, 2)} kWh/m³`} />
              {!isWeHeat && <Row label={t.labelScop} value={`${formatNumber(result.scop35, lang, 2)} / ${formatNumber(result.scop55, lang, 2)}`} />}
              <Row label={t.flowTemp} value={`${formatNumber(result.flowTemperature, lang, 0)} ${t.tempUnit}`} />
              <Row label={t.boilerEfficiency} value={`${formatNumber(result.boilerEfficiencyPct, lang, 0)}%`} />
            </div>
          </div>

          {(Object.keys(home).length > 0 || Object.keys(advice).length > 0) && (
            <div className="rounded-xl border border-black/[0.08] bg-white p-5 sm:p-6">
              <h2 className="text-lg font-extrabold">{t.homeInputs}</h2>
              <div className="mt-3">
                {home.type && <Row label={t.homeType} value={homeValue(home.type, homeTypeLabels)} />}
                {home.buildPeriod && <Row label={t.buildPeriod} value={homeValue(home.buildPeriod, buildPeriodLabels)} />}
                {home.areaM2 != null && <Row label={t.area} value={areaValue} />}
                {home.gasUseM3 != null && <Row label={t.annualGasUse} value={gasValue} />}
                {advice.estimatedSpaceGasM3 != null && (
                  <Row label={t.spaceHeatingShare} value={`${formatNumber(advice.estimatedSpaceGasM3, lang, 1)} ${t.m3Year}`} />
                )}
                {home.insulation && <Row label={t.insulation} value={homeValue(home.insulation, insulationLabels)} />}
                {home.energyLabel && (
                  <Row label={t.energyLabel} value={t.energyLabels[home.energyLabel] || home.energyLabel} />
                )}
                {INSULATION_PARTS.map((part) => {
                  const answer = home.insulationDetails?.[part]
                  return answer ? (
                    <Row key={part} label={t.insulationFeatures[part]}
                      value={t.insulationAnswers[answer] || answer} />
                  ) : null
                })}
                {home.insulationParts?.length > 0 && (
                  <Row
                    label={lang === 'en' ? 'Insulated parts' : 'Geïsoleerde onderdelen'}
                    value={home.insulationParts.map((part) => insulationPartLabels[part] || part).join(', ')}
                  />
                )}
                {home.emitters && <Row label={t.emitters} value={homeValue(home.emitters, emitterLabels)} />}
                {home.boilerAgeYears != null && <Row label={t.boilerAge} value={`${formatNumber(home.boilerAgeYears, lang)} ${t.years}`} />}
                {advice.requiredKw != null && <Row label={t.requiredCapacity} value={`${formatNumber(advice.requiredKw, lang, 1)} kW`} />}
                {recommendedConfiguration && <Row label={t.recommendedConfiguration} value={recommendedConfiguration} />}
                {home.contractType && <Row label={t.contractType} value={homeValue(home.contractType, contractLabels)} />}
                {hasStatedElectricPrice && <Row label={t.statedElectricity} value={`${formatNumber(statedElectricPrice, lang, 2)} €/kWh`} />}
                <Row label={t.effectiveElectricity} value={`${formatNumber(effectiveElectricPrice, lang, 2)} €/kWh`} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#131A20]/60">{t.gasDemandBasis}</p>
              {advice.heatingMethodNeedsReview && (
                <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-800">{t.airConditioningReview}</p>
              )}
              {dynamicCombination && <p className="mt-2 text-xs leading-relaxed text-[#131A20]/60">{t.dynamicTariffNote}</p>}
            </div>
          )}

          {(result.extras?.solar?.selected || result.extras?.ev?.selected) && (
            <div className="rounded-xl border border-[#22a55d]/15 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-extrabold">{extraCopy.extras}</h2>
              <div className="mt-2 divide-y divide-[#131A20]/[0.07]">
                {result.extras?.solar?.selected && (
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#131A20]">{extraCopy.solar}</div>
                      <div className="mt-0.5 text-xs text-[#131A20]/55">{extraCopy.annual}</div>
                    </div>
                    <div className="text-sm font-bold text-[#131A20]">
                      {formatNumber(result.extras.solar.annualKwh, lang)} {t.kwhYear}
                      <span className="ml-2 font-medium text-[#131A20]/60">{extraCopy.enteredCost}: {result.extras.solar.price == null ? extraCopy.notEntered : formatEuro(result.extras.solar.price, lang)}</span>
                    </div>
                  </div>
                )}
                {result.extras?.ev?.selected && (
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#131A20]">{extraCopy.ev}</div>
                      <div className="mt-0.5 text-xs text-[#131A20]/55">{extraCopy.annual}</div>
                    </div>
                    <div className="text-sm font-bold text-[#131A20]">
                      {formatNumber(result.extras.ev.annualKwh, lang)} {t.kwhYear}
                      <span className="ml-2 font-medium text-[#131A20]/60">{extraCopy.enteredCost}: {result.extras.ev.price == null ? extraCopy.notEntered : formatEuro(result.extras.ev.price, lang)}</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#131A20]/60">{extraCopy.isolation}</p>
            </div>
          )}

          <div className="rounded-xl border border-[#22a55d]/15 bg-[#F9F7F4] p-5 sm:p-6">
            <h2 className="text-sm font-extrabold">{t.assumptions}</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#131A20]/60">{t.caveat}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#131A20]/60">{isWeHeat ? t.weheatScopCaveat : t.scopCaveat}</p>
            {model.config === 'hybrid' && (
              <a href="https://www.rvo.nl/nieuws/warmtepompen-verlagen-energieverbruik" target="_blank" rel="noreferrer" className="mt-2 block text-xs leading-relaxed text-[#16804a] underline underline-offset-4">{t.hybridSource}</a>
            )}
            {!isWeHeat && String(model.brand || '').toLowerCase().includes('vaillant') && (
              <a href="https://www.vaillant.nl/producten/arothermpro" target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-[#16804a] underline decoration-[#22a55d]/40 underline-offset-4 hover:text-[#11683c]">
                {t.scopSource}
              </a>
            )}
          </div>
        </div>
      </details>
    </section>
  )
}

export default HeatPumpResults