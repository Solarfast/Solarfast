import { useState } from 'react'
import { warmthfondsMonthlyPayment as warmtefondsMonthlyPayment, WARMTEFONDS_RATES } from '../lib/warmtefondsFinance.js'

const euro = (value, lang) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
}).format(value)

export function WarmtefondsFinancing({ items = [], lang = 'nl' }) {
  const [years, setYears] = useState(15)
  const [incomeBand, setIncomeBand] = useState('')
  const incompleteItems = items.filter(item => !(Number(item.amount) > 0))
  if (incompleteItems.length) {
    return (
      <section className="mt-5 rounded-2xl border border-[#B7CDBE] bg-[#F3F8F4] p-5 text-[#193829] sm:p-6">
        <h3 className="text-lg font-bold">{lang === 'nl' ? 'Warmtefonds · maandbedrag' : 'Warmtefonds · monthly payment'}</h3>
        <p className="mt-2 text-sm text-[#405247]">
          {lang === 'nl'
            ? `Vul eerst de investering in voor: ${incompleteItems.map(item => item.label).join(', ')}.`
            : `Enter the investment first for: ${incompleteItems.map(item => item.label).join(', ')}.`}
        </p>
      </section>
    )
  }
  const validItems = items.filter(item => Number.isFinite(Number(item.amount)) && Number(item.amount) > 0)
  if (!validItems.length) return null

  const batteryAmount = validItems
    .filter(item => item.type === 'battery')
    .reduce((sum, item) => sum + Math.min(Number(item.amount), 8500), 0)
  const otherAmount = validItems
    .filter(item => item.type !== 'battery')
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const uncappedAmount = batteryAmount + otherAmount
  const amount = Math.min(29000, uncappedAmount)
  const batteryOverLimit = validItems.some(item => item.type === 'battery' && Number(item.amount) > 8500)
  const loanOverLimit = uncappedAmount > 29000
  if (amount < 1000) return null
  const interestRate = WARMTEFONDS_RATES[years]
  const english = lang !== 'nl'
  const appliedRate = incomeBand === 'below' ? 0 : interestRate
  const monthlyPayment = incomeBand
    ? warmtefondsMonthlyPayment(amount, years, appliedRate)
    : null
  const totalRepayment = monthlyPayment == null ? null : monthlyPayment * years * 12

  return (
    <section className="mt-5 rounded-2xl border border-[#B7CDBE] bg-[#F3F8F4] p-5 text-[#193829] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#47715A]">
            {english ? 'Warmtefonds loan estimate' : 'Warmtefonds · maandbedrag'}
          </p>
          <h3 className="mt-1 text-xl font-bold">
            {english ? 'Estimated loan' : 'Geschat leenbedrag'}: {euro(amount, lang)}
          </h3>
          <p className="mt-1 text-sm text-[#405247]">
            {english
              ? `Based on selected battery, heat pump and solar panel costs. ${validItems.map(item => item.label).join(', ')}.`
              : `Op basis van de ingevulde kosten voor batterij, warmtepomp en zonnepanelen: ${validItems.map(item => item.label).join(', ')}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm font-semibold">
            {english ? 'Household income' : 'Gezamenlijk inkomen'}
            <select value={incomeBand} onChange={event => setIncomeBand(event.target.value)}
              className="mt-1 block min-h-11 rounded-lg border border-[#8AA996] bg-white px-3 text-base text-[#193829]">
              <option value="">{english ? 'Choose' : 'Kies'}</option>
              <option value="below">{english ? 'Below €60,000' : 'Onder €60.000'}</option>
              <option value="above">{english ? '€60,000 or more' : '€60.000 of meer'}</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            {english ? 'Term' : 'Looptijd'}
            <select value={years} onChange={event => setYears(Number(event.target.value))}
              className="mt-1 block min-h-11 rounded-lg border border-[#8AA996] bg-white px-3 text-base text-[#193829]">
              {[7, 10, 15].map(term => <option key={term} value={term}>{term} {english ? 'years' : 'jaar'}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-5 rounded-xl bg-white p-4">
        {incomeBand ? (
          <>
            <p className="text-sm font-semibold text-[#405247]">
              {incomeBand === 'below'
                ? (english ? 'Monthly payment at 0% interest*' : 'Maandbedrag bij 0% rente*')
                : (english
                  ? `Monthly payment at ${ (interestRate * 100).toLocaleString('en-NL', { minimumFractionDigits: 2 }) }% interest`
                  : `Maandbedrag bij ${ (interestRate * 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 }) }% rente`)}
            </p>
            <p className="mt-1 text-2xl font-bold">
              {euro(monthlyPayment, lang)}
              <span className="text-base font-medium">/{english ? 'mo' : 'mnd'}</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#52665A]">
              {english
                ? `${years * 12} monthly payments · total repayment ${euro(totalRepayment, lang)}.`
                : `${years * 12} maandtermijnen · totaal terug te betalen ${euro(totalRepayment, lang)}.`}
            </p>
          </>
        ) : (
          <p className="text-base font-semibold text-[#405247]">
            {english ? 'Choose an income range to see the monthly payment.' : 'Kies een inkomensgroep om het maandbedrag te zien.'}
          </p>
        )}
        </div>
      {(batteryOverLimit || loanOverLimit) && (
        <p className="mt-3 rounded-lg bg-[#fff4e5] p-3 text-sm font-semibold text-[#70430c]">
          {english
            ? `The estimate is capped${batteryOverLimit ? ' at €8,500 for the battery' : ''}${batteryOverLimit && loanOverLimit ? ' and' : ''}${loanOverLimit ? ' at €29,000 total' : ''}.`
            : `De schatting is begrensd${batteryOverLimit ? ' op €8.500 voor de batterij' : ''}${batteryOverLimit && loanOverLimit ? ' en' : ''}${loanOverLimit ? ' op €29.000 totaal' : ''}.`}
        </p>
      )}
      <p className="mt-4 text-sm leading-relaxed text-[#405247]">
        {english
          ? '*0% may be available if household gross income is below €60,000. Approval and term depend on Warmtefonds assessment. Battery financing is capped at €8,500; solar financing at €750 per panel. The estimate uses entered prices and does not confirm eligibility.'
          : `*0% rente is mogelijk bij een gezamenlijk bruto verzamelinkomen onder €60.000. Het Warmtefonds beoordeelt uw aanvraag. Voor een thuisbatterij geldt maximaal €8.500; voor zonnepanelen maximaal €750 per paneel. Bij een thuisbatterij of warmtepomp kan de looptijd maximaal 15 jaar zijn. Deze schatting bevestigt geen goedkeuring. De 20-jaarslooptijd is niet opgenomen: die geldt alleen onder aanvullende voorwaarden.`}
      </p>
      <p className="mt-2 text-xs text-[#52665A]">
        {english ? 'Official rate table updated: 12 October 2026.' : 'Officiële rentetabel bijgewerkt op 12 oktober 2026.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold underline">
        <a href="https://www.warmtefonds.nl/particulieren/actuele-rentetarieven" target="_blank" rel="noreferrer">
          {english ? 'Current rates and terms' : 'Actuele rente en voorwaarden'}
        </a>
        <a href="https://www.warmtefonds.nl/particulieren/energiebesparende-maatregelen" target="_blank" rel="noreferrer">
          {english ? 'Eligible measures' : 'Welke maatregelen komen in aanmerking?'}
        </a>
        <a href="https://www.warmtefonds.nl/wijziging-voorwaarden-energiebespaarlening-voor-zonnepanelen-en-thuisbatterij" target="_blank" rel="noreferrer">
          {english ? 'Solar and battery limits' : 'Limieten voor zonnepanelen en batterij'}
        </a>
      </div>
    </section>
  )
}
