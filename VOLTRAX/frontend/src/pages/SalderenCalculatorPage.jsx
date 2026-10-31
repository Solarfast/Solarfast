import React, { useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import { calculateSalderingImpact } from '../lib/salderenCalculator.js'
import './SalderenCalculatorPage.css'

const INITIAL_VALUES = {
  annualConsumptionKwh: '3000',
  annualProductionKwh: '4400',
  annualExportKwh: '3400',
  purchasePriceEurPerKwh: '0,25',
  feedInCompensationEurPerKwh: '0,07',
  annualFeedInCostsEur: '0',
}

const parseInput = (value) => {
  const trimmed = String(value ?? '').trim()
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed)) return null
  const parsed = Number(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export default function SalderenCalculatorPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const nl = lang !== 'en'
  const [values, setValues] = useState(INITIAL_VALUES)
  const copy = (dutch, english) => (nl ? dutch : english)

  const fields = [
    {
      key: 'annualConsumptionKwh',
      label: copy('Totaal stroomverbruik per jaar', 'Total annual electricity use'),
      unit: 'kWh/jaar',
      help: copy('Te vinden op uw jaarafrekening.', 'You can find this on your annual energy statement.'),
      requiredPositive: true,
    },
    {
      key: 'annualProductionKwh',
      label: copy('Opgewekte zonnestroom per jaar', 'Solar electricity generated per year'),
      unit: 'kWh/jaar',
      requiredPositive: true,
    },
    {
      key: 'annualExportKwh',
      label: copy('Teruglevering aan het net per jaar', 'Electricity exported to the grid per year'),
      unit: 'kWh/jaar',
      help: copy('Staat op uw jaarafrekening of in de app van uw slimme meter.', 'Find this on your annual statement or in your smart-meter app.'),
    },
    {
      key: 'purchasePriceEurPerKwh',
      label: copy('Inkoopprijs per kWh, inclusief belasting en btw', 'Purchase price per kWh, including taxes and VAT'),
      unit: '€/kWh',
    },
    {
      key: 'feedInCompensationEurPerKwh',
      label: copy('Terugleververgoeding per kWh', 'Feed-in compensation per kWh'),
      unit: '€/kWh',
    },
    {
      key: 'annualFeedInCostsEur',
      label: copy('Terugleverkosten per jaar', 'Annual feed-in charges'),
      unit: '€/jaar',
      help: copy('Vul 0 in als uw leverancier deze kosten niet rekent.', 'Enter 0 if your supplier does not charge these fees.'),
      optional: true,
    },
  ]

  const calculation = useMemo(() => {
    const parsed = {}
    const errors = {}
    for (const field of fields) {
      const value = field.optional && String(values[field.key] ?? '').trim() === ''
        ? 0
        : parseInput(values[field.key])
      if (value === null) {
        errors[field.key] = copy('Vul een geldig getal in, met een punt of komma als decimaalteken.', 'Enter a valid number, using a dot or comma for decimals.')
      } else if (value < 0 || (field.requiredPositive && value === 0)) {
        errors[field.key] = copy(
          field.requiredPositive ? 'Vul een waarde groter dan 0 in.' : 'Vul 0 of een hoger bedrag in.',
          field.requiredPositive ? 'Enter a value greater than 0.' : 'Enter 0 or a higher amount.',
        )
      } else {
        parsed[field.key] = value
      }
    }

    if (Object.keys(errors).length) return { errors, result: null }
    try {
      return { errors, result: calculateSalderingImpact(parsed) }
    } catch (error) {
      if (error.message === 'export-cannot-exceed-production') {
        errors.annualExportKwh = copy('Teruglevering kan niet hoger zijn dan uw totale zonneproductie.', 'Export cannot exceed your total solar production.')
      } else if (error.message === 'solar-self-use-cannot-exceed-consumption') {
        errors.annualConsumptionKwh = copy('Uw opgewekte stroom min de teruglevering is hoger dan uw totale verbruik. Controleer de jaarwaarden.', 'Your generation minus export exceeds your total electricity use. Check the annual figures.')
      } else {
        errors.annualConsumptionKwh = copy('Controleer de ingevulde waarden.', 'Check the values entered.')
      }
      return { errors, result: null }
    }
  }, [values, nl])

  const money = (amount) => new Intl.NumberFormat(nl ? 'nl-NL' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)

  return (
    <div className="saldering-page">
      <Nav />
      <main className="saldering-main">
        <button type="button" className="saldering-back" onClick={() => navigate('/')}>
          <ArrowLeft size={16} aria-hidden="true" />
          {copy('Terug naar home', 'Back to home')}
        </button>

        <header className="saldering-hero">
          <span className="saldering-eyebrow"><Sun size={15} aria-hidden="true" /> {copy('Voor huishoudens met zonnepanelen · vanaf 1 januari 2027', 'For solar households · from 1 January 2027')}</span>
          <h1>{copy('Wat betekent het einde van salderen voor uw zonnepanelen?', 'What will the end of net metering mean for your solar panels?')}</h1>
          <p>{copy(
            'Vul de jaarcijfers van uw woning met zonnepanelen en uw energietarieven in. U ziet direct de geschatte impact op uw energierekening.',
            'Enter the annual figures for your solar-powered home and your energy rates to see the estimated impact on your bill.',
          )}</p>
        </header>

        <div className="saldering-layout">
          <section className="saldering-card saldering-form-card" aria-labelledby="saldering-input-title">
            <div className="saldering-card-heading">
              <span>01</span>
              <div>
                <h2 id="saldering-input-title">{copy('Uw jaarcijfers', 'Your annual figures')}</h2>
                <p>{copy('Pas een invoer aan voor een nieuwe schatting.', 'Change any value to update the estimate.')}</p>
              </div>
            </div>
            <div className="saldering-fields">
              {fields.map((field) => {
                const id = `saldering-${field.key}`
                const errorId = `${id}-error`
                const helpId = `${id}-help`
                return (
                  <div className="saldering-field" key={field.key}>
                <label htmlFor={id}>
                  {field.label}{field.optional ? ` (${copy('optioneel', 'optional')})` : ''}
                </label>
                    <div className="saldering-input-wrap">
                      <input
                        id={id}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={values[field.key]}
                        onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                        aria-invalid={Boolean(calculation.errors[field.key])}
                        aria-describedby={[field.help ? helpId : null, calculation.errors[field.key] ? errorId : null].filter(Boolean).join(' ') || undefined}
                      />
                      <span>{field.unit}</span>
                    </div>
                    {field.help && <p id={helpId} className="saldering-help">{field.help}</p>}
                    {calculation.errors[field.key] && <p id={errorId} className="saldering-error" role="alert">{calculation.errors[field.key]}</p>}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="saldering-result-card" aria-labelledby="saldering-result-title" aria-live="polite" aria-atomic="true">
            <span className="saldering-result-eyebrow">{copy('Uw indicatie', 'Your estimate')}</span>
            <h2 id="saldering-result-title">{copy('Verwacht verschil per jaar', 'Estimated difference per year')}</h2>
            {calculation.result ? (
              <>
                <p className="saldering-extra">{money(calculation.result.extraPerYearEur)}<span>{copy(' extra per jaar', ' extra per year')}</span></p>
                <div className="saldering-periods">
                  <div><span>{copy('Per maand', 'Per month')}</span><strong>{money(calculation.result.extraPerMonthEur)}</strong></div>
                  <div><span>{copy('Per dag', 'Per day')}</span><strong>{money(calculation.result.extraPerDayEur)}</strong></div>
                </div>
                {calculation.result.extraPerYearEur <= 0 && (
                  <p className="saldering-little-change">{copy('Voor uw situatie verandert er naar verwachting weinig.', 'Your situation is expected to change very little.')}</p>
                )}
                <div className="saldering-costs">
                  <div>
                    <span>{copy('Tot 1 januari 2027 · met salderen', 'Until 1 January 2027 · with net metering')}</span>
                    <strong>{money(calculation.result.costsWithSalderingEur)}{copy(' / jaar', ' / year')}</strong>
                  </div>
                  <div>
                    <span>{copy('Vanaf 1 januari 2027 · zonder salderen', 'From 1 January 2027 · without net metering')}</span>
                    <strong>{money(calculation.result.costsWithoutSalderingEur)}{copy(' / jaar', ' / year')}</strong>
                  </div>
                </div>
                <p className="saldering-variable-note">{copy(
                  'Alleen variabele kosten voor stroom. Vaste kosten en netbeheerkosten zijn niet meegerekend.',
                  'Variable electricity costs only. Fixed charges and grid-operator costs are not included.',
                )}</p>
              </>
            ) : (
              <p className="saldering-invalid-state">
                {copy('Pas de gemarkeerde invoer aan om de berekening te zien.', 'Correct the highlighted inputs to see the calculation.')}
              </p>
            )}
          </section>
        </div>

        <section className="saldering-explanation">
          <h2>{copy('Wat verandert er?', 'What changes?')}</h2>
          <p>{copy(
            'Tot 1 januari 2027 kunt u teruggeleverde stroom verrekenen met stroom die u afneemt. Vanaf die datum kan dat niet meer en ontvangt u voor teruggeleverde stroom een vergoeding van uw energieleverancier. Die vergoeding kan lager zijn dan de prijs die u betaalt voor stroom.',
            'Until 1 January 2027, exported electricity can be offset against electricity you take from the grid. From that date, it can no longer be offset and your supplier pays compensation for exported electricity. That compensation may be lower than the price you pay for electricity.',
          )}</p>
          <details className="saldering-details">
            <summary>
              {copy('Zo rekenen wij', 'How we calculate')}
              <ChevronDown className="saldering-details-icon" size={18} aria-hidden="true" />
            </summary>
            <div className="saldering-formulas">
              <p><code>{copy('Inkoop = verbruik − (opwek − teruglevering)', 'Grid import = use − (generation − export)')}</code></p>
              <p><code>{copy('Gesaldeerd = min(inkoop, teruglevering)', 'Net-metered = min(grid import, export)')}</code></p>
              <p><code>{copy('Kosten met salderen = (inkoop − gesaldeerd) × inkoopprijs − (teruglevering − gesaldeerd) × vergoeding + terugleverkosten', 'Cost with net metering = (grid import − net-metered) × purchase price − (export − net-metered) × compensation + feed-in charges')}</code></p>
              <p><code>{copy('Kosten zonder salderen = inkoop × inkoopprijs − teruglevering × vergoeding + terugleverkosten', 'Cost without net metering = grid import × purchase price − export × compensation + feed-in charges')}</code></p>
              <p><code>{copy('Extra per jaar = kosten zonder salderen − kosten met salderen', 'Extra per year = cost without net metering − cost with net metering')}</code></p>
              <p>{copy(
                'Dit is een indicatie. Uw werkelijke bedrag hangt af van uw contract en tarieven.',
                'This is an estimate. Your actual amount depends on your contract and tariffs.',
              )}</p>
            </div>
          </details>
        </section>

      </main>
    </div>
  )
}
