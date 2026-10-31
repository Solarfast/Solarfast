import React from 'react'
import { HEAT_PUMP_PRODUCTS } from '../../lib/heatPumpProducts'
import {
  getHomeInsulationLevel,
  getHomeInsulationParts,
  getRangeById,
  getRangeForValue,
  getRangeMidpoint,
  HEATED_AREA_RANGES,
  INSULATION_ANSWERS,
  INSULATION_PARTS,
} from '../../lib/heatPumpAdvice.js'

function Choices({ label, options, value, onChange }) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-2 text-sm font-semibold text-[#131A20]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, text]) => (
          <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}
            className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors ${
              value === id ? 'border-[#111] bg-[#FDF891] text-[#111]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
            }`}>{text}</button>
        ))}
      </div>
    </fieldset>
  )
}

function Field({ label, value, onChange, unit, placeholder, optional = false }) {
  return <label className="mb-5 block text-sm font-semibold text-[#131A20]">
    {label}{optional && <span className="ml-2 font-normal text-gray-400">({optional})</span>}
    <span className="relative mt-2 block">
      <input type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-[#F9F7F4] px-5 py-3.5 pr-24 text-lg font-bold text-[#131A20] focus:border-[#111] focus:outline-none focus:ring-2 focus:ring-yellow-100" />
      {unit && <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-normal text-gray-400">{unit}</span>}
    </span>
  </label>
}

function SelectField({ label, value, options, onChange, placeholder }) {
  return (
    <label className="mb-5 block text-sm font-semibold text-[#131A20]">
      {label}
      <select value={value || ''} onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-gray-200 bg-[#F9F7F4] px-5 py-3.5 text-sm font-semibold text-[#131A20] focus:border-[#111] focus:outline-none focus:ring-2 focus:ring-yellow-100">
        <option value="">{placeholder}</option>
        {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
      </select>
    </label>
  )
}

export default function HeatPumpQuestionnaire({
  part, formData, update, updateMany, advice, copy, lang, isCombination,
}) {
  const config = formData.heat_preference || advice?.recommendedConfig || ''
  const models = HEAT_PUMP_PRODUCTS.filter((product) => product.config === config)
  const format = (value) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    maximumFractionDigits: 1,
  }).format(value)
  const formatCurrency = (value) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
  const selectedProductId = formData.heat_pump_product_id
    || (!isCombination ? advice?.suggestedModel?.id : '')
  const selectedProduct = HEAT_PUMP_PRODUCTS.find((product) => product.id === selectedProductId)
  const chooseConfig = (value) => {
    updateMany({
      heat_preference: value,
      heat_pump_product_id: '',
      heat_pump_price: '',
      planned_heat_pump_price: '',
    })
  }
  const selectedAreaRange = getRangeById(formData.heat_area_range, HEATED_AREA_RANGES)
    || getRangeForValue(formData.heat_area_m2, HEATED_AREA_RANGES)
  const insulationLevel = advice?.insulationLevel || getHomeInsulationLevel(formData)
  const getInsulationAnswer = (partId) => formData[`heat_insulation_${partId}`]
    || (formData.heat_insulation_parts?.includes(partId) ? 'yes' : '')
  const hasDetailedInsulationAnswers = INSULATION_PARTS.some((id) =>
    INSULATION_ANSWERS.includes(getInsulationAnswer(id)),
  ) || Boolean(formData.heat_energy_label)
  const formatRangeOptions = (ranges, unit) => ranges.map(({ id, min, max }) => [
    id,
    `${format(min)}–${format(max)} ${unit}`,
  ])
  const selectAreaRange = (id) => {
    const range = getRangeById(id, HEATED_AREA_RANGES)
    updateMany({
      heat_area_range: id,
      heat_area_m2: range ? String(getRangeMidpoint(range)) : '',
    })
  }
  const setInsulationAnswer = (partId, answer) => {
    const answerPatch = Object.fromEntries(INSULATION_PARTS.map((id) => [
      `heat_insulation_${id}`,
      id === partId ? answer : getInsulationAnswer(id),
    ]))
    const nextForm = { ...formData, ...answerPatch }
    updateMany({
      ...answerPatch,
      heat_insulation: getHomeInsulationLevel(nextForm),
      heat_insulation_parts: getHomeInsulationParts(nextForm),
    })
  }
  const insulationStatus = {
    good: lang === 'nl' ? 'Goed' : 'Good',
    average: lang === 'nl' ? 'Gemiddeld' : 'Average',
    poor: lang === 'nl' ? 'Matig' : 'Poor',
  }
  const areaHint = selectedAreaRange
    ? (formData.heat_area_range
      ? copy.areaRangeHint(format(getRangeMidpoint(selectedAreaRange)))
      : copy.savedRangeValue(format(formData.heat_area_m2), 'm²'))
    : ''
  if (part === 'home') return <>
    <Choices label={copy.homeType} options={copy.homeTypes} value={formData.heat_home_type} onChange={(v) => update('heat_home_type', v)} />
    <SelectField label={copy.buildPeriod} options={copy.buildPeriods} value={formData.heat_build_period}
      onChange={(v) => update('heat_build_period', v)} placeholder={copy.selectOption} />
    <SelectField label={copy.heatedArea} options={formatRangeOptions(HEATED_AREA_RANGES, 'm²')}
      value={selectedAreaRange?.id} onChange={selectAreaRange} placeholder={copy.selectOption} />
    {areaHint && <p className="-mt-3 mb-5 text-xs text-gray-500">{areaHint}</p>}
    <SelectField label={copy.energyLabel} options={copy.energyLabels} value={formData.heat_energy_label}
      onChange={(v) => {
        const answerPatch = Object.fromEntries(INSULATION_PARTS.map((id) => [
          `heat_insulation_${id}`, getInsulationAnswer(id),
        ]))
        const nextForm = { ...formData, ...answerPatch, heat_energy_label: v }
        updateMany({
          ...answerPatch,
          heat_energy_label: v,
          heat_insulation: getHomeInsulationLevel(nextForm),
          heat_insulation_parts: getHomeInsulationParts(nextForm),
        })
      }} placeholder={copy.selectOption} />
  </>

  if (part === 'heating') return <>
    <Field label={copy.gasUsage} value={formData.heat_gas_usage}
      onChange={(value) => updateMany({ heat_gas_usage: value, heat_gas_range: '' })}
      unit={copy.gasUnit} placeholder={copy.gasUsagePlaceholder} />
    <p className="-mt-3 mb-5 text-xs text-gray-500">{copy.gasUsageHint}</p>
    <fieldset className="mb-5">
      <legend className="mb-2 text-sm font-semibold text-[#131A20]">{copy.insulationPartsTitle}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {INSULATION_PARTS.map((id) => (
          <SelectField key={id} label={copy.insulationFields[id]}
            options={copy.insulationAnswers} value={getInsulationAnswer(id)}
            onChange={(answer) => setInsulationAnswer(id, answer)} placeholder={copy.selectOption} />
        ))}
      </div>
      <p className="mt-3 rounded-xl bg-[#fffde0] p-4 text-xs leading-relaxed text-[#555]">
        <strong className="text-[#131A20]">
          {copy.insulation}: {insulationStatus[insulationLevel] || (lang === 'nl' ? 'Nog niet ingevuld' : 'Not selected')}
        </strong>
        <span className="mt-1 block">{copy.insulationHint}</span>
        {!hasDetailedInsulationAnswers && formData.heat_insulation && formData.heat_insulation !== 'good' && (
          <span className="mt-2 block">{copy.insulationLegacy(formData.heat_insulation)}</span>
        )}
      </p>
    </fieldset>
    <SelectField label={copy.emitters} options={copy.emitterTypes} value={formData.heat_emitters}
      onChange={(v) => update('heat_emitters', v)} placeholder={copy.selectOption} />
    {formData.heat_emitters === 'air-conditioning' && (
      <p className="-mt-3 mb-5 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">{copy.airConditioningHint}</p>
    )}
    <Field label={copy.boilerAge} optional={copy.optional} value={formData.heat_boiler_age}
      onChange={(v) => update('heat_boiler_age', v)} unit={copy.years} placeholder="12" />
  </>

  if (part === 'tariffs') return <>
    <Choices label={copy.contractType} options={copy.contractTypes}
      value={formData.heat_contract_type} onChange={(v) => updateMany(isCombination
        ? { heat_contract_type: v, dynamic_contract: v === 'dynamic' }
        : { heat_contract_type: v })} />
    <Field label={copy.electricityPrice} value={formData.heat_electric_price}
      onChange={(v) => update('heat_electric_price', v)} unit="€/kWh" placeholder="0,27" />
    <Field label={copy.gasPrice} value={formData.heat_gas_price}
      onChange={(v) => update('heat_gas_price', v)} unit="€/m³" placeholder="1,55" />
    {isCombination && formData.heat_contract_type === 'dynamic' && (
      <p className="rounded-xl bg-[#fffde0] p-4 text-xs leading-relaxed text-[#444]">
        {copy.dynamicMarketHint}
      </p>
    )}
  </>

  if (part === 'model') return <>
    {advice ? <>
      <div className="mb-6 rounded-2xl bg-[#fffde0] p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-[#666]">{copy.adviceTitle}</div>
        <div className="mt-2 text-xl font-bold">{advice.recommendedConfig === 'hybrid' ? copy.hybrid : copy.allElectric}</div>
        <p className="mt-2 text-sm leading-relaxed text-[#555]">
          {copy.adviceReason(advice.requiredKw, format(advice.estimatedSpaceGasM3), advice.insulationLevel)}
        </p>
        {advice.heatingMethodNeedsReview && <p className="mt-2 text-sm font-semibold text-amber-800">{copy.airConditioningHint}</p>}
        {advice.sizingNeedsReview && <p className="mt-2 text-sm font-semibold text-amber-800">{copy.sizingWarning}</p>}
      </div>
      <Choices label={copy.preference} options={[['hybrid', copy.hybrid], ['all-electric', copy.allElectric]]}
        value={config} onChange={chooseConfig} />
      {config !== advice.recommendedConfig && <p className="mb-4 text-xs text-amber-800">{copy.differentPreference}</p>}
      {isCombination && advice.suggestedModel && (
        <div className="mb-4 rounded-2xl border border-[#d5ce32] bg-[#fffde0] p-4" role="status">
          <div className="text-xs font-bold uppercase tracking-wide text-[#666]">
            {lang === 'nl' ? 'Warmtepompmodel als uitgangspunt' : 'Suggested heat-pump model'}
          </div>
          <div className="mt-1 font-extrabold text-[#131A20]">
            {advice.suggestedModel.brand} {advice.suggestedModel.model}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#555]">
            {lang === 'nl'
              ? 'Kies dit model of een alternatief. Daarna berekenen we het batterijadvies op basis van beide producten.'
              : 'Choose this model or an alternative. Then we will calculate the battery recommendation using both products.'}
          </p>
        </div>
      )}
      <label htmlFor="heat-pump-model" className="mb-2 block text-sm font-semibold">{copy.modelLabel}</label>
      <select id="heat-pump-model" value={formData.heat_pump_product_id || (isCombination ? '' : advice.suggestedModel?.id || '')}
        onChange={(event) => updateMany({
          heat_pump_product_id: event.target.value,
          heat_pump_price: '',
          planned_heat_pump_price: '',
        })}
        className="w-full rounded-2xl border border-gray-200 bg-[#F9F7F4] px-5 py-3.5 text-sm font-semibold">
        <option value="">{copy.selectModel}</option>
        {models.map((model) => <option key={model.id} value={model.id}>
          {model.brand} {model.model} · {formatCurrency(model.finalPriceEur)}
          {advice.suggestedModel?.id === model.id ? ` · ${lang === 'nl' ? 'standaardadvies' : 'suggested default'}` : ''}
        </option>)}
      </select>
      {isCombination && !formData.heat_pump_product_id && (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          {lang === 'nl'
            ? 'Selecteer een warmtepompmodel om het combinatieadvies te berekenen.'
            : 'Select a heat-pump model to calculate the combined recommendation.'}
        </p>
      )}
      {selectedProduct && (
        <p className="mt-3 text-sm font-semibold text-[#131A20]">
          {lang === 'nl' ? 'Eindprijs incl. btw na subsidie' : 'Final price incl. VAT after subsidy'}:{' '}
          {formatCurrency(selectedProduct.finalPriceEur)}
          {selectedProduct.catalogPriceEur != null && selectedProduct.subsidyEur != null && (
            <span className="mt-1 block text-xs font-medium text-gray-500">
              {lang === 'nl' ? 'Catalogusprijs' : 'List price'} {formatCurrency(selectedProduct.catalogPriceEur)}
              {' · '}{lang === 'nl' ? 'subsidie' : 'subsidy'} {formatCurrency(selectedProduct.subsidyEur)}
              {' · '}{lang === 'nl' ? 'netto na subsidie' : 'net after subsidy'} {formatCurrency(selectedProduct.finalPriceEur)}
            </span>
          )}
          <span className="mt-1 block text-xs font-normal text-gray-500">
            {lang === 'nl'
              ? 'Prijzen opgegeven incl. btw; installatieomvang is niet onafhankelijk geverifieerd.'
              : 'Prices supplied incl. VAT; installation scope not independently verified.'}
          </span>
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-gray-500">{copy.sizingDisclaimer}</p>
      {selectedProduct?.config === 'all-electric' && (
        <div className="mt-6 rounded-2xl border border-[#e6df66]/70 bg-[#fffde0]/60 p-5">
          <Field
            label={copy.gasStandingCost}
            value={formData.heat_gas_standing_cost}
            onChange={(value) => update('heat_gas_standing_cost', value)}
            unit="€/jaar"
            placeholder="425"
          />
          <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold leading-relaxed text-[#131A20]">
            <input
              type="checkbox"
              checked={formData.heat_gas_connection_removed === true}
              onChange={(event) => update('heat_gas_connection_removed', event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#131A20]"
            />
            <span>{copy.gasConnectionRemoval}</span>
          </label>
          <p className="mt-3 text-xs leading-relaxed text-[#131A20]/60">{copy.gasStandingCostNote}</p>
        </div>
      )}
    </> : <p role="alert" className="text-sm text-amber-800">{copy.completeHome}</p>}
  </>

  return null
}