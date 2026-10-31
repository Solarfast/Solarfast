import './_group.css'
import { Battery, Flame, TrendingUp } from 'lucide-react'
import { calculateCombinedROI } from './combinedROI.js'
import { previewData } from './PreviewData.js'

const copy = {
  nl: {
    eyebrow: 'Uw persoonlijke energieschatting',
    title: 'Batterij + warmtepomp',
    estimate: 'Jaarlijkse besparing',
    totalNote: 'De gezamenlijke uitkomst is opgebouwd uit twee aparte berekeningen.',
    breakdown: 'Bijdrage per product',
    breakdownNote: 'De besparingen en investeringen blijven per product zichtbaar.',
    battery: 'Thuisbatterij',
    batteryNote: 'Besparing op basis van de batterijberekening',
    heatPump: 'Warmtepomp',
    heatNote: 'Vermeden gaskosten min extra stroomkosten',
    investment: 'Totale investering',
    payback: 'Terugverdientijd samen',
    roi: 'Jaarlijks rendement',
    notQuoted: 'Niet opgegeven',
    unavailable: 'Niet beschikbaar',
    perYear: 'per jaar',
    years: 'jaar',
    basedOn: 'De batterijbesparing gebruikt de opgegeven toekomstige energiebalans. Extra zonnepanelen en elektrisch laden tellen niet als aparte besparing of investering mee in dit rendement.',
    quoteHint: 'Vul beide investeringsbedragen in om de gezamenlijke investering en terugverdientijd te zien.',
    noPayback: 'Bij deze aannames is in niet beide scenario’s een positieve jaarbesparing berekend; daarom tonen we geen terugverdientijd.',
    negative: 'Een negatief bedrag betekent dat de geschatte energiekosten hoger uitvallen.',
  },
  en: {
    eyebrow: 'Your personal energy estimate',
    title: 'Battery + heat pump',
    estimate: 'Estimated annual savings',
    totalNote: 'The combined result brings together two separate calculations.',
    breakdown: 'Contribution by product',
    breakdownNote: 'Savings and investment stay visible for each product.',
    battery: 'Home battery',
    batteryNote: 'Savings based on the battery calculation',
    heatPump: 'Heat pump',
    heatNote: 'Avoided gas costs minus additional electricity costs',
    investment: 'Combined investment',
    payback: 'Combined payback',
    roi: 'Annual return',
    notQuoted: 'Not provided',
    unavailable: 'Not available',
    perYear: 'per year',
    years: 'years',
    basedOn: 'Battery savings use the entered future energy balance. Additional solar panels and EV charging are not counted as separate savings or investment in this return.',
    quoteHint: 'Enter both investment amounts to see the combined investment and payback.',
    noPayback: 'Under these assumptions, annual savings are not positive in both scenarios, so payback is not shown.',
    negative: 'A negative amount means estimated energy costs are higher.',
  },
}

function euro(value, lang) {
  if (value == null || !Number.isFinite(Number(value))) return null
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function range(low, high, lang) {
  const formattedLow = euro(low, lang)
  const formattedHigh = euro(high, lang)
  if (formattedLow == null || formattedHigh == null) return '—'
  return Math.abs(Number(low) - Number(high)) < 0.005
    ? formattedLow
    : `${formattedLow} – ${formattedHigh}`
}

function number(value, lang, digits = 1) {
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    maximumFractionDigits: digits,
  }).format(value)
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-black/[0.07] bg-white p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#131A20]/55">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-1 text-base font-extrabold tracking-tight text-[#131A20] sm:text-lg">{value}</div>
    </div>
  )
}

function Contribution({ icon: Icon, title, note, low, high, investment, lang, t, negative }) {
  return (
    <article className="rounded-2xl border border-black/[0.08] bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fdf891] text-[#131A20]">
          <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-extrabold text-[#131A20]">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-[#131A20]/55">{note}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-2 border-t border-black/[0.07] pt-4">
        <span className="text-xs font-semibold text-[#131A20]/50">{t.perYear}</span>
        <span className={`text-lg font-extrabold tracking-tight sm:text-xl ${negative ? 'text-[#a44d3d]' : 'text-[#131A20]'}`}>
          {range(low, high, lang)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="text-[#131A20]/55">{lang === 'nl' ? 'Investering' : 'Investment'}</span>
        <span className="text-right font-bold text-[#131A20]">{euro(investment, lang) || t.notQuoted}</span>
      </div>
    </article>
  )
}

export function Clearer() {
  const lang = 'nl'
  const t = copy[lang]
  const totals = calculateCombinedROI({
    batteryResults: previewData.batteryResults,
    batteryInvestmentEur: previewData.batteryInvestmentEur,
    heatPumpROI: previewData.heatPumpROI,
  })

  if (!totals) return null

  const hasBothQuotes = Number(previewData.batteryInvestmentEur) > 0 &&
    Number(previewData.heatPumpROI.investmentEur) > 0
  const hasPayback = hasBothQuotes &&
    totals.paybackLowYears != null &&
    totals.paybackHighYears != null &&
    Number.isFinite(Number(totals.paybackLowYears)) &&
    Number.isFinite(Number(totals.paybackHighYears))
  const hasNegative = totals.annualLowEur < 0 || totals.annualHighEur < 0
  const formatPayback = hasPayback
    ? `${number(totals.paybackLowYears, lang)}–${number(totals.paybackHighYears, lang)} ${t.years}`
    : t.unavailable
  const formatROI = hasBothQuotes && totals.roiLowPct != null && totals.roiHighPct != null
    ? `${number(totals.roiLowPct, lang)}%–${number(totals.roiHighPct, lang)}%`
    : t.unavailable

  return (
    <main className="min-h-screen bg-[#f7f6ef] px-4 py-6 font-['Plus_Jakarta_Sans'] text-[#131A20] sm:px-8 sm:py-10">
      <section
        aria-labelledby="clearer-results-title"
        data-testid="section-combined-results"
        className="mx-auto max-w-5xl rounded-[28px] border border-black/[0.08] bg-white p-5 shadow-[0_16px_48px_rgba(19,26,32,0.06)] sm:p-8 lg:p-10"
      >
        <header className="flex flex-col gap-4 border-b border-black/[0.08] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#131A20]/55">
              <span className="h-2 w-2 rounded-full bg-[#d2ad00]" />
              {t.eyebrow}
            </div>
            <h1 id="clearer-results-title" className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
              {t.title}
            </h1>
          </div>
          <span className="inline-flex w-fit rounded-full border border-[#131A20]/[0.08] bg-[#fffde0] px-3 py-1.5 text-xs font-bold text-[#131A20]/75">
            {lang === 'nl' ? 'Indicatie' : 'Estimate'}
          </span>
        </header>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
          <div className="rounded-2xl bg-[#fffbd3] px-5 py-6 sm:px-7 sm:py-7">
            <div className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#131A20]/55">{t.estimate}</div>
            <div
              data-testid="text-combined-annual-savings"
              className={`mt-2 text-4xl font-extrabold leading-none tracking-[-0.055em] sm:text-5xl ${hasNegative ? 'text-[#a44d3d]' : 'text-[#131A20]'}`}
            >
              {range(totals.annualLowEur, totals.annualHighEur, lang)}
            </div>
            <div className="mt-2 text-sm font-semibold text-[#131A20]/65">{t.perYear}</div>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-[#131A20]/60">{t.totalNote}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <Metric
              icon={Battery}
              label={t.investment}
              value={hasBothQuotes ? euro(totals.totalInvestmentEur, lang) : t.unavailable}
            />
            <Metric icon={TrendingUp} label={t.payback} value={formatPayback} />
            <Metric icon={TrendingUp} label={t.roi} value={formatROI} />
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-sm font-extrabold tracking-tight">{t.breakdown}</h2>
          <p className="text-xs text-[#131A20]/50">{t.breakdownNote}</p>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Contribution
            icon={Battery}
            title={t.battery}
            note={t.batteryNote}
            low={totals.batteryAnnualLowEur}
            high={totals.batteryAnnualHighEur}
            investment={totals.batteryInvestmentEur}
            lang={lang}
            t={t}
            negative={totals.batteryAnnualLowEur < 0 || totals.batteryAnnualHighEur < 0}
          />
          <Contribution
            icon={Flame}
            title={t.heatPump}
            note={t.heatNote}
            low={totals.heatAnnualEur}
            high={totals.heatAnnualEur}
            investment={totals.heatInvestmentEur}
            lang={lang}
            t={t}
            negative={totals.heatAnnualEur < 0}
          />
        </div>

        {!hasBothQuotes && <p className="mt-4 text-xs leading-relaxed text-[#131A20]/60">{t.quoteHint}</p>}
        {hasBothQuotes && !hasPayback && <p className="mt-4 text-xs leading-relaxed text-[#a44d3d]">{t.noPayback}</p>}
        {hasNegative && <p className="mt-3 text-xs font-semibold leading-relaxed text-[#a44d3d]">{t.negative}</p>}
        <p className="mt-4 border-t border-black/[0.08] pt-4 text-[11px] leading-relaxed text-[#131A20]/50">{t.basedOn}</p>
      </section>
    </main>
  )
}