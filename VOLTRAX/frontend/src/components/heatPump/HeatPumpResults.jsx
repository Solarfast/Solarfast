import React from 'react'
import { ArrowDownRight, ChevronDown, Flame, House, Info, SlidersHorizontal, Tag, Zap } from 'lucide-react'
import { normalizeHeatPumpROIResult } from '../../lib/heatPumpROI.js'
import {
  ANNUAL_GAS_RANGES,
  getRangeById,
  getRangeMidpoint,
  HEATED_AREA_RANGES,
  INSULATION_PARTS,
} from '../../lib/heatPumpAdvice.js'
import { formatEuro, formatNumber, getCopy } from './heatPumpCopy'
import './HeatPumpResults.css'

function AnnualRow({ label, value, emphasis = false }) {
  return (
    <div className={`hp-premium-row${emphasis ? ' hp-premium-row--emphasis' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DetailRows({ rows }) {
  return (
    <div className="hp-premium-detail-rows">
      {rows.map(([label, value]) => value != null && (
        <AnnualRow key={label} label={label} value={String(value)} />
      ))}
    </div>
  )
}

export function HeatPumpResults({ result: inputResult, lang = 'nl', combined = false, hideAnnualSummary = false }) {
  const result = normalizeHeatPumpROIResult(inputResult)
  const t = getCopy(lang)
  const english = lang === 'en'
  const home = result?.home || {}
  const advice = result?.advice || {}
  const model = result?.model || {}
  const isWeHeat = String(model.brand || '').toLowerCase().includes('weheat')

  if (!result) {
    return <section className="hp-premium hp-premium--empty">{t.notAvailable}</section>
  }

  const modelName = [model.brand, model.model].filter(Boolean).join(' ') || t.configFallback
  const modelPower = model.kw != null ? `${formatNumber(model.kw, lang, 1)} kW` : ''
  const configuration = model.config === 'hybrid' ? t.hybridConfig
    : model.config === 'all-electric' ? t.allElectricConfig : model.config || ''
  const annualSavings = Number(result.annualSavingsEur)
  const savingsAvailable = Number.isFinite(annualSavings)
  const monthlySavings = savingsAvailable ? annualSavings / 12 : null
  const standingCost = Number(result.gasStandingCostBeforeEur) || 0
  const standingSavings = Number(result.gasStandingSavingsEur) || 0
  const standingCostAfter = Math.max(0, standingCost - standingSavings)
  const gasRemoved = result.gasConnectionRemoved === true
  const currentLabel = home.energyLabel
    ? (t.energyLabels?.[home.energyLabel] || home.energyLabel)
    : (english ? 'Not provided' : 'Niet opgegeven')
  const homeTypeLabels = english
    ? { apartment: 'Apartment', terraced: 'Terraced house', 'end-terrace': 'End-terrace', 'semi-detached': 'Semi-detached', detached: 'Detached' }
    : { apartment: 'Appartement', terraced: 'Tussenwoning', 'end-terrace': 'Hoekwoning', 'semi-detached': 'Twee-onder-een-kap', detached: 'Vrijstaand' }
  const buildPeriodLabels = english
    ? { 'pre-1975': 'Before 1975', '1975-1990': '1975–1990', '1990-2005': '1990–2005', '2005-2020': '2005–2020', 'post-2020': 'After 2020' }
    : { 'pre-1975': 'Voor 1975', '1975-1990': '1975–1990', '1990-2005': '1990–2005', '2005-2020': '2005–2020', 'post-2020': 'Na 2020' }
  const insulationLabels = english
    ? { good: 'Good', average: 'Average', poor: 'Poor' }
    : { good: 'Goed', average: 'Gemiddeld', poor: 'Matig' }
  const insulationPartLabels = english
    ? { roof: 'Roof', walls: 'Walls', floor: 'Floor', glazing: 'HR++ / triple glazing' }
    : { roof: 'Dak', walls: 'Gevel', floor: 'Vloer/bodem', glazing: 'HR++ / triple glas' }
  const emitterLabels = english
    ? { radiators: 'Radiators', floor: 'Underfloor heating', mixed: 'Radiators + underfloor heating', 'air-conditioning': 'Air conditioning (heating)' }
    : { radiators: 'Radiatoren', floor: 'Vloerverwarming', mixed: 'Radiatoren + vloerverwarming', 'air-conditioning': 'Airconditioning (verwarmen)' }
  const contractLabels = english
    ? { fixed: 'Fixed', variable: 'Variable', dynamic: 'Dynamic' }
    : { fixed: 'Vast', variable: 'Variabel', dynamic: 'Dynamisch' }
  const areaRange = getRangeById(home.areaRange, HEATED_AREA_RANGES)
  const gasRange = home.gasUseM3 == null
    ? getRangeById(home.gasUseRange, ANNUAL_GAS_RANGES)
    : null
  const areaValue = areaRange
    ? (english
      ? `${formatNumber(areaRange.min, lang)}–${formatNumber(areaRange.max, lang)} m² (model uses about ${formatNumber(getRangeMidpoint(areaRange), lang)} m²)`
      : `${formatNumber(areaRange.min, lang)}–${formatNumber(areaRange.max, lang)} m² (berekend met circa ${formatNumber(getRangeMidpoint(areaRange), lang)} m²)`)
    : home.areaM2 != null ? `${formatNumber(home.areaM2, lang)} m²` : null
  const gasValue = home.gasUseM3 != null
    ? `${formatNumber(home.gasUseM3, lang, 1)} ${t.m3Year}`
    : gasRange
      ? (english
        ? `${formatNumber(gasRange.min, lang)}–${formatNumber(gasRange.max, lang)} m³/year (model uses about ${formatNumber(getRangeMidpoint(gasRange), lang)} m³/year)`
        : `${formatNumber(gasRange.min, lang)}–${formatNumber(gasRange.max, lang)} m³/jaar (berekend met circa ${formatNumber(getRangeMidpoint(gasRange), lang)} m³/jaar)`)
      : null
  const statedElectricPrice = Number(home.statedElectricPricePerKwh)
  const hasStatedElectricPrice = Number.isFinite(statedElectricPrice) && statedElectricPrice > 0
  const electricPrice = Number(result.electricPricePerKwh)
  const electricityPerGasM3 = Number(result.electricityPerGasM3) ||
    (Number(result.annualGasAvoidedM3) > 0 ? Number(result.annualHeatPumpElectricityKwh) / Number(result.annualGasAvoidedM3) : 0)
  const valueRows = [
    [t.homeType, home.type ? homeTypeLabels[home.type] || home.type : null],
    [t.buildPeriod, home.buildPeriod ? buildPeriodLabels[home.buildPeriod] || home.buildPeriod : null],
    [t.area, areaValue],
    [t.annualGasUse, gasValue],
    [t.spaceHeatingShare, advice.estimatedSpaceGasM3 != null ? `${formatNumber(advice.estimatedSpaceGasM3, lang, 1)} ${t.m3Year}` : null],
    [t.insulation, home.insulation ? insulationLabels[home.insulation] || home.insulation : null],
    [t.energyLabel, home.energyLabel ? currentLabel : null],
    ...INSULATION_PARTS.map((part) => [
      t.insulationFeatures?.[part] || part,
      home.insulationDetails?.[part] ? (t.insulationAnswers?.[home.insulationDetails[part]] || home.insulationDetails[part]) : null,
    ]),
    [english ? 'Insulated parts' : 'Geïsoleerde onderdelen', home.insulationParts?.length ? home.insulationParts.map((part) => insulationPartLabels[part] || part).join(', ') : null],
    [t.emitters, home.emitters ? emitterLabels[home.emitters] || home.emitters : null],
    [t.boilerAge, home.boilerAgeYears != null ? `${formatNumber(home.boilerAgeYears, lang)} ${t.years}` : null],
    [t.requiredCapacity, advice.requiredKw != null ? `${formatNumber(advice.requiredKw, lang, 1)} kW` : null],
    [t.recommendedConfiguration, advice.recommendedConfig ? (advice.recommendedConfig === 'hybrid' ? t.hybridConfig : advice.recommendedConfig === 'all-electric' ? t.allElectricConfig : advice.recommendedConfig) : null],
    [t.contractType, home.contractType ? contractLabels[home.contractType] || home.contractType : null],
    [t.statedElectricity, hasStatedElectricPrice ? `${formatNumber(statedElectricPrice, lang, 2)} €/kWh` : null],
    [t.effectiveElectricity, Number.isFinite(electricPrice) ? `${formatNumber(electricPrice, lang, 2)} €/kWh` : null],
  ]
  const priceBreakdown = [
    [english ? 'Catalog price (incl. VAT)' : 'Catalogusprijs incl. btw', model.catalogPriceEur],
    [english ? 'Subsidy' : 'Subsidie', model.subsidyEur],
    [english ? 'Product price after subsidy' : 'Productprijs na subsidie', model.finalPriceEur],
    [english ? 'Investment used in this calculation' : 'Investering in deze berekening', result.investmentEur],
  ]
  const priceValuesAvailable = priceBreakdown.some(([, value]) => value != null && Number.isFinite(Number(value)))
  const extraCopy = english
    ? { title: 'Other planned products', solar: 'Planned solar generation', ev: 'Planned home EV charging use', annual: 'Expected annual amount', entered: 'Separately entered cost', notEntered: 'Not entered', note: 'Solar and EV plans are shown for context; they do not affect this heat-pump estimate.' }
    : { title: 'Andere geplande producten', solar: 'Geplande zonne-opwek', ev: 'Gepland thuisladen van een elektrische auto', annual: 'Verwachte hoeveelheid per jaar', entered: 'Apart opgegeven kosten', notEntered: 'Niet opgegeven', note: 'Zonnepanelen en EV staan alleen ter informatie en beïnvloeden deze warmtepompschatting niet.' }

  return (
    <main className="hp-premium">
      <div className="hp-premium-shell">
        {!hideAnnualSummary && (
          <section className="hp-premium-savings hp-reveal hp-reveal--3" aria-label={english ? 'Savings summary' : 'Besparingsoverzicht'}>
            <div className="hp-premium-savings-copy">
              <span className="hp-premium-kicker">{combined ? (english ? 'Heat-pump contribution' : 'Bijdrage warmtepomp') : t.estimate}</span>
              <p>{combined
                ? (english ? 'Estimated annual savings from this heat pump' : 'Geschatte jaarlijkse besparing door deze warmtepomp')
                : t.annualSavings}</p>
              <div className="hp-premium-savings-number">
                <strong>{savingsAvailable ? formatEuro(annualSavings, lang) : t.notAvailable}</strong><span>{t.perYear}</span>
              </div>
              {combined && <small>{english
                ? 'This is the heat-pump contribution to the combined result, not the combined total.'
                : 'Dit is de warmtepompbijdrage aan het combinatieresultaat, niet het gecombineerde totaal.'}</small>}
            </div>
            {!combined && (
              <div className="hp-premium-monthly">
                <ArrowDownRight size={19} aria-hidden="true" />
                <span>{english ? 'Approximate average per month' : 'Gemiddeld circa per maand'}</span>
                <strong>{monthlySavings != null ? formatEuro(monthlySavings, lang) : t.notAvailable}</strong>
                <small>{english ? 'Approximate: annual estimate ÷ 12' : 'Benadering: jaarschatting ÷ 12'}</small>
              </div>
            )}
            {!combined && Number(result.investmentEur) > 0 && (
              <div className="hp-premium-payback">
                <span>{t.payback}</span>
                <strong>{Number(result.paybackYears) > 0 ? `${formatNumber(result.paybackYears, lang, 1)} ${t.years}` : t.notAvailable}</strong>
                <small>{english ? 'Estimate only' : 'Indicatieve schatting'}</small>
              </div>
            )}
          </section>
        )}

        <section className="hp-premium-comparison hp-reveal hp-reveal--4">
          <div className="hp-premium-section-heading">
            <div><p className="hp-premium-eyebrow">{english ? 'Annual comparison' : 'Vergelijking per jaar'}</p><h2>{english ? 'Before & after' : 'Voor en na'}</h2></div>
            <span className="hp-premium-unit">{english ? 'Heating + gas costs' : 'Verwarming + gaskosten'} <i>·</i> / {english ? 'year' : 'jaar'}</span>
          </div>
          <div className="hp-premium-compare-grid">
            <article className="hp-premium-state hp-premium-state--before">
              <div className="hp-premium-state-top"><div className="hp-premium-state-icon"><Flame size={17} aria-hidden="true" /></div><div>
                <span className="hp-premium-state-caption">{english ? 'CURRENT SITUATION' : 'HUIDIGE SITUATIE'}</span><h3>{english ? 'Before' : 'Voor'}</h3>
              </div></div>
              <p className="hp-premium-state-description">{english ? 'Boiler heating' : 'Verwarmen met cv-ketel'}</p>
              <div className="hp-premium-state-rows">
                <AnnualRow label={t.gasUse} value={`${formatNumber(result.annualGasBeforeM3, lang, 1)} ${t.m3Year}`} />
                <AnnualRow label={t.heatPumpElectricity} value={`0 ${t.kwhYear}`} />
                <AnnualRow label={t.gasStandingCost} value={formatEuro(standingCost, lang)} />
              </div>
              <div className="hp-premium-total"><span>{t.totalAnnualCost}</span><strong>{formatEuro(result.beforeAnnualCostEur, lang)}</strong></div>
            </article>
            <article className="hp-premium-state hp-premium-state--after">
              <div className="hp-premium-state-top"><div className="hp-premium-state-icon"><Zap size={17} aria-hidden="true" /></div><div>
                <span className="hp-premium-state-caption">{english ? 'SELECTED HEAT PUMP' : 'GEKOZEN WARMTEPOMP'}</span><h3>{english ? 'After' : 'Na'}</h3>
              </div></div>
              <p className="hp-premium-model-name">{modelName}{modelPower ? <span> · {modelPower}</span> : null}</p>
              <p className="hp-premium-state-description">{configuration}</p>
              <div className="hp-premium-state-rows">
                <AnnualRow label={t.gasUse} value={`${formatNumber(result.annualGasRemainingM3, lang, 1)} ${t.m3Year}`} />
                <AnnualRow label={t.heatPumpElectricity} value={`+${formatNumber(result.annualHeatPumpElectricityKwh, lang)} ${t.kwhYear}`} emphasis />
                <AnnualRow label={t.gasStandingCost} value={formatEuro(standingCostAfter, lang)} />
                {gasRemoved && standingSavings > 0 && <AnnualRow label={t.gasStandingSavings} value={`−${formatEuro(standingSavings, lang)}`} />}
              </div>
              <div className="hp-premium-total"><span>{t.totalAnnualCost}</span><strong>{formatEuro(result.afterAnnualCostEur, lang)}</strong></div>
            </article>
          </div>
          <p className="hp-premium-fixed-note"><Info size={15} aria-hidden="true" />
            {gasRemoved
              ? (english
                ? 'Fixed gas-connection charges are treated as saved only because removal of the gas connection is confirmed in this calculation.'
                : 'Vaste gaskosten tellen alleen als bespaard mee omdat verwijdering van de gasaansluiting in deze berekening is bevestigd.')
              : (english
                ? 'Fixed gas-connection charges are not counted as saved in this estimate. They remain unless the connection is actually removed.'
                : 'Vaste gaskosten zijn in deze schatting niet als besparing gerekend. Ze blijven bestaan zolang de aansluiting niet wordt verwijderd.')}
          </p>
          {!combined && !hideAnnualSummary && (
            <div className="hp-premium-comparison-saving">
              <span>{t.annualSavingsLabel}</span><strong>{savingsAvailable ? formatEuro(annualSavings, lang) : t.notAvailable}</strong>
              <small>{english ? 'estimated net difference' : 'geschat netto verschil'}</small>
            </div>
          )}
        </section>

        {priceValuesAvailable && (
          <section className="hp-premium-price hp-reveal hp-reveal--5">
            <div className="hp-premium-price-heading"><div className="hp-premium-small-icon"><Tag size={17} aria-hidden="true" /></div><div>
              <p className="hp-premium-eyebrow">{english ? 'Price overview' : 'Prijsopbouw'}</p><h2>{english ? 'Selected product' : 'Gekozen product'}</h2>
            </div></div>
            <div className="hp-premium-price-layout">
              <div className="hp-premium-price-model"><span>{english ? 'Selected model' : 'Gekozen model'}</span><strong>{modelName}</strong>
                {modelPower && <small>{modelPower}{configuration ? ` · ${configuration}` : ''}</small>}
              </div>
              <div className="hp-premium-price-rows">
                {priceBreakdown.map(([label, value], index) => value != null && Number.isFinite(Number(value)) && (
                  <AnnualRow key={label} label={label}
                    value={index === 1 && Number(value) > 0 ? `−${formatEuro(value, lang)}` : formatEuro(value, lang)}
                    emphasis={index === 2} />
                ))}
              </div>
            </div>
            <p className="hp-premium-price-note">{english
              ? 'The product price and the investment entered in the calculation are shown separately; they may differ.'
              : 'De productprijs en de investering die in de berekening is gebruikt, staan apart vermeld en kunnen van elkaar verschillen.'}</p>
            {model.priceSource && <p className="hp-premium-price-note">{model.priceSource}</p>}
          </section>
        )}

        <section className="hp-premium-outlook hp-reveal hp-reveal--6">
          <article className="hp-premium-outlook-card">
            <div className="hp-premium-outlook-icon"><House size={18} aria-hidden="true" /></div>
            <div className="hp-premium-outlook-copy">
              <p className="hp-premium-eyebrow">{english ? 'A home’s future appeal' : 'De aantrekkelijkheid van uw woning'}</p>
              <h2>{english ? 'More efficient, more considered.' : 'Een energiezuiniger huis, met meer perspectief.'}</h2>
              <p>{english
                ? 'A more energy-efficient home may be more attractive to buyers. The effect depends on the specific home and market; no house-specific euro increase is calculated here.'
                : 'Een energiezuiniger huis kan aantrekkelijker zijn voor kopers. Het effect hangt af van de woning en de markt; er is hier geen huis-specifieke waardestijging in euro’s berekend.'}</p>
              <span className="hp-premium-source">{english ? 'General context: Rijksoverheid · Milieu Centraal' : 'Ter algemene context: Rijksoverheid · Milieu Centraal'}</span>
              <a className="hp-premium-source-link" href="https://doi.org/10.1016/j.jeem.2010.11.006" target="_blank" rel="noreferrer">
                Brounen &amp; Kok (2011), “On the economics of energy labels in the housing market” · Journal of Environmental Economics and Management
              </a>
            </div>
          </article>
          <article className="hp-premium-outlook-card hp-premium-label-card">
            <div className="hp-premium-outlook-icon"><Tag size={18} aria-hidden="true" /></div>
            <div className="hp-premium-outlook-copy">
              <p className="hp-premium-eyebrow">{english ? 'Energy label' : 'Energielabel'}</p>
              <div className="hp-premium-label-current"><span>{english ? 'Current input' : 'Huidige invoer'}</span><strong>{currentLabel}</strong></div>
              <p>{english
                ? 'A heat pump may contribute to a better energy label, but no future letter is predicted here. An official label requires an assessment by an energy-label assessor.'
                : 'Een warmtepomp kan bijdragen aan een beter energielabel, maar we voorspellen hier geen nieuw label. Voor een officieel label is een beoordeling door een energielabeladviseur nodig.'}</p>
              <span className="hp-premium-source">{english ? 'General context: RVO.nl · Milieu Centraal' : 'Ter algemene context: RVO.nl · Milieu Centraal'}</span>
              <a className="hp-premium-source-link" href="https://www.energielabel.nl/woningen/" target="_blank" rel="noreferrer">
                {english ? 'Official energy-label information · Energielabel.nl' : 'Officiële informatie over energielabels · Energielabel.nl'}
              </a>
            </div>
          </article>
        </section>

        <details className="hp-premium-details hp-reveal hp-reveal--7">
          <summary>
            <span className="hp-premium-details-icon"><SlidersHorizontal size={17} aria-hidden="true" /></span>
            <span><strong>{t.technicalDetails}</strong><small>{english ? 'Calculation inputs, performance and assumptions' : 'Invoer, prestaties en rekenaannames'}</small></span>
            <ChevronDown className="hp-premium-chevron" size={18} aria-hidden="true" />
          </summary>
          <div className="hp-premium-details-body">
            <section className="hp-premium-detail-block">
              <h3>{t.performance}</h3>
              <DetailRows rows={[
                [t.configuration, configuration || null],
                [t.modelDetails, result.annualHeatDemandKwh != null ? `${formatNumber(result.annualHeatDemandKwh, lang)} ${t.kwhYear}` : null],
                [isWeHeat ? t.illustrativeScop : t.scoper, result.scopUsed != null ? formatNumber(result.scopUsed, lang, 2) : null],
                [t.gasElectricRatio, `${formatNumber(electricityPerGasM3, lang, 2)} kWh/m³`],
                ...(!isWeHeat ? [[t.labelScop, result.scop35 != null && result.scop55 != null ? `${formatNumber(result.scop35, lang, 2)} / ${formatNumber(result.scop55, lang, 2)}` : null]] : []),
                [t.flowTemp, result.flowTemperature != null ? `${formatNumber(result.flowTemperature, lang, 0)} ${t.tempUnit}` : null],
                [t.boilerEfficiency, result.boilerEfficiencyPct != null ? `${formatNumber(result.boilerEfficiencyPct, lang, 0)}%` : null],
                [t.gasEnergy, result.gasEnergyKwhPerM3 != null ? `${formatNumber(result.gasEnergyKwhPerM3, lang, 2)} kWh/m³` : null],
                [english ? 'Gas price used' : 'Gebruikte gasprijs', result.gasPricePerM3 != null ? `${formatEuro(result.gasPricePerM3, lang, 2)} / m³` : null],
                [english ? 'Electricity price used' : 'Gebruikte stroomprijs', result.electricPricePerKwh != null ? `${formatEuro(result.electricPricePerKwh, lang, 2)} / kWh` : null],
                ...(!combined ? [[t.roi, Number.isFinite(Number(result.roiPct)) ? `${formatNumber(result.roiPct, lang, 1)}%` : t.notAvailable]] : []),
                ...(!combined ? [[t.tenYearNet, result.tenYearNetEur != null ? formatEuro(result.tenYearNetEur, lang) : t.notAvailable]] : []),
              ]} />
              <p className="hp-premium-detail-note">{isWeHeat ? t.weheatScopCaveat : t.scopCaveat}</p>
              {model.scopSource && <p className="hp-premium-detail-note">{model.scopSource}</p>}
              {configuration === t.hybridConfig && <>
                <a className="hp-premium-source-link" href="https://www.rvo.nl/nieuws/warmtepompen-verlagen-energieverbruik" target="_blank" rel="noreferrer">{t.hybridSource}</a>
                <p className="hp-premium-detail-note">{t.hybridCoverageNote}</p>
              </>}
              {!isWeHeat && String(model.brand || '').toLowerCase().includes('vaillant') && (
                <a className="hp-premium-source-link" href="https://www.vaillant.nl/producten/arothermpro" target="_blank" rel="noreferrer">{t.scopSource}</a>
              )}
            </section>

            {(valueRows.some(([, value]) => value != null) || Object.keys(advice).length > 0) && (
              <section className="hp-premium-detail-block">
                <h3>{t.homeInputs}</h3><DetailRows rows={valueRows} />
                <p className="hp-premium-detail-note">{t.gasDemandBasis}</p>
                <p className="hp-premium-detail-note">{t.sizingDisclaimer}</p>
                {advice.heatingMethodNeedsReview && <p className="hp-premium-detail-warning">{t.airConditioningReview}</p>}
                {combined && home.contractType === 'dynamic' && <p className="hp-premium-detail-note">{t.dynamicTariffNote}</p>}
              </section>
            )}

            {(result.extras?.solar?.selected || result.extras?.ev?.selected) && (
              <section className="hp-premium-detail-block">
                <h3>{extraCopy.title}</h3>
                {result.extras?.solar?.selected && (
                  <div className="hp-premium-extra-row"><strong>{extraCopy.solar}</strong><span>{formatNumber(result.extras.solar.annualKwh, lang)} {t.kwhYear}</span>
                    <small>{extraCopy.entered}: {result.extras.solar.price == null ? extraCopy.notEntered : formatEuro(result.extras.solar.price, lang)}</small></div>
                )}
                {result.extras?.ev?.selected && (
                  <div className="hp-premium-extra-row"><strong>{extraCopy.ev}</strong><span>{formatNumber(result.extras.ev.annualKwh, lang)} {t.kwhYear}</span>
                    <small>{extraCopy.entered}: {result.extras.ev.price == null ? extraCopy.notEntered : formatEuro(result.extras.ev.price, lang)}</small></div>
                )}
                <p className="hp-premium-detail-note">{extraCopy.note}</p>
              </section>
            )}

            <section className="hp-premium-detail-block hp-premium-assumptions">
              <h3>{t.assumptions}</h3><p>{t.caveat}</p>
              {combined && home.contractType === 'dynamic' && <p>{t.dynamicTariffNote}</p>}
              <div className="hp-premium-source-line">
                <strong>{english ? 'Sources for general context' : 'Bronnen ter algemene context'}:</strong>
                <span>Rijksoverheid · Milieu Centraal</span>
                <a href="https://www.rvo.nl/nieuws/warmtepompen-verlagen-energieverbruik" target="_blank" rel="noreferrer">RVO Installatiemonitor 3.0 · {english ? 'heat-pump performance context' : 'context over prestaties van warmtepompen'}</a>
                <a href="https://www.energielabel.nl/woningen/" target="_blank" rel="noreferrer">{english ? 'Official Dutch energy-label information' : 'Officiële informatie over het Nederlandse energielabel'}</a>
                <a href="https://doi.org/10.1016/j.jeem.2010.11.006" target="_blank" rel="noreferrer">Brounen &amp; Kok (2011), “On the economics of energy labels in the housing market” · Journal of Environmental Economics and Management</a>
              </div>
            </section>
          </div>
        </details>
        <footer className="hp-premium-footer hp-reveal hp-reveal--8">
          <span>SolarFast <i>·</i> {english ? 'Estimate, not a guarantee' : 'Schatting, geen garantie'}</span>
          <span>{english ? 'Actual costs depend on usage, tariffs and installation.' : 'Werkelijke kosten hangen af van verbruik, tarieven en installatie.'}</span>
        </footer>
      </div>
    </main>
  )
}

export default HeatPumpResults