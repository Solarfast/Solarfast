import { motion, useReducedMotion } from 'framer-motion'
import { Battery, Clock3, Flame, Zap } from 'lucide-react'
import { calculateCombinedROI } from './combinedROI.js'

const copy = {
  nl: {
    eyebrow: 'Uw combinatie in één overzicht',
    title: 'Totale jaarlijkse besparing',
    perYear: 'per jaar, op basis van beide berekeningen',
    battery: 'Thuisbatterij',
    heatPump: 'Warmtepomp',
    batteryNote: 'Geschatte jaarlijkse besparing volgens de batterijberekening',
    heatNote: 'Vermeden gaskosten min extra stroomkosten',
    investment: 'Investering',
    notQuoted: 'Niet opgegeven',
    combinedInvestment: 'Totale investering',
    payback: 'Terugverdientijd combinatie',
    roi: 'Jaarlijks rendement',
    years: 'jaar',
    basedOn: 'Batterijbesparing is berekend met de opgegeven, toekomstige energiebalans. Er is geen aparte besparing of investering voor extra zonnepanelen of elektrisch laden in dit rendement opgenomen.',
    negative: 'Een negatief bedrag betekent dat de geschatte energiekosten hoger uitvallen.',
    quoteHint: 'Vul ook de installatieprijs van de warmtepomp in om de gezamenlijke investering en terugverdientijd te zien.',
    noPayback: 'Bij deze aannames levert de combinatie niet in beide scenario’s een positieve jaarbesparing op; een betrouwbare terugverdientijd is niet te tonen.',
  },
  en: {
    eyebrow: 'Your combined estimate',
    title: 'Total annual savings',
    perYear: 'per year, based on both estimates',
    battery: 'Home battery',
    heatPump: 'Heat pump',
    batteryNote: 'Estimated annual savings from the battery calculation',
    heatNote: 'Avoided gas cost minus additional electricity cost',
    investment: 'Investment',
    notQuoted: 'Not provided',
    combinedInvestment: 'Combined investment',
    payback: 'Combined payback',
    roi: 'Annual ROI',
    years: 'years',
    basedOn: 'Battery savings use the entered future energy balance. No separate savings or investment from additional solar panels or EV charging are included in this return.',
    negative: 'A negative amount means estimated energy costs are higher.',
    quoteHint: 'Enter the heat pump’s installed price to see the combined investment and payback.',
    noPayback: 'Under these assumptions, the combination does not have positive annual savings in both scenarios, so reliable payback cannot be shown.',
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
  return Math.abs(low - high) < 0.005 ? formattedLow : `${formattedLow} – ${formattedHigh}`
}

function EnergyFlow({ reducedMotion }) {
  const stream = reducedMotion
    ? {}
    : {
        animate: { x: [0, 28, 0], opacity: [0.32, 0.8, 0.32] },
        transition: { duration: 5.2, repeat: Infinity, ease: 'easeInOut' },
      }
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] overflow-hidden sm:block">
      <div className="absolute right-[-7rem] top-[-8rem] h-72 w-72 rounded-full border border-[#16804a]/10" />
      <div className="absolute right-[-3rem] top-[-4rem] h-56 w-56 rounded-full border border-[#16804a]/10" />
      <div className="absolute right-8 top-1/2 h-px w-4/5 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#16804a]/20 to-transparent" />
      <motion.div
        {...stream}
        className="absolute right-[24%] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#16804a]/55"
      />
      <motion.div
        {...(reducedMotion
          ? {}
          : {
              animate: { x: [0, -24, 0], opacity: [0.2, 0.58, 0.2] },
              transition: { duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 },
            })}
        className="absolute right-[45%] top-[38%] h-1.5 w-1.5 rounded-full bg-[#d49b48]/65"
      />
    </div>
  )
}

function SummaryRow({ icon: Icon, title, description, savingsLow, savingsHigh, investment, lang, t }) {
  return (
    <div className="relative grid gap-3 border-t border-[#173c2b]/10 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#16804a]">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-[#173c2b]">{title}</div>
          <p className="mt-0.5 text-xs leading-relaxed text-[#173c2b]/60">{description}</p>
        </div>
      </div>
      <div className="pl-12 sm:pl-0 sm:text-right">
        <div className={`text-base font-extrabold tracking-tight ${Number(savingsLow) < 0 || Number(savingsHigh) < 0 ? 'text-[#a44d3d]' : 'text-[#16804a]'}`}>
          {range(savingsLow, savingsHigh, lang)}
          <span className="ml-1 text-xs font-semibold text-[#173c2b]/45">/ {lang === 'nl' ? 'jr' : 'yr'}</span>
        </div>
        <div className="mt-1 text-xs text-[#173c2b]/55">
          {t.investment}: <span className="font-bold text-[#173c2b]/80">{euro(investment, lang) || t.notQuoted}</span>
        </div>
      </div>
    </div>
  )
}

export function CombinedResults({ batteryResults, batteryInvestmentEur, heatPumpROI, lang = 'nl' }) {
  const t = copy[lang === 'en' ? 'en' : 'nl']
  const reducedMotion = useReducedMotion()
  const totals = calculateCombinedROI({ batteryResults, batteryInvestmentEur, heatPumpROI })
  if (!totals) return null
  const hasBothQuotes = Number.isFinite(Number(batteryInvestmentEur)) &&
    Number(batteryInvestmentEur) > 0 &&
    Number.isFinite(Number(heatPumpROI?.investmentEur)) &&
    Number(heatPumpROI.investmentEur) > 0
  const hasPayback = hasBothQuotes &&
    totals.paybackLowYears != null && totals.paybackHighYears != null &&
    Number.isFinite(Number(totals.paybackLowYears)) &&
    Number.isFinite(Number(totals.paybackHighYears))
  const hasNegative = Number(totals.annualLowEur) < 0 || Number(totals.annualHighEur) < 0

  return (
    <section
      aria-labelledby="combined-results-title"
      data-testid="section-combined-results"
      className="relative isolate overflow-hidden rounded-2xl border border-[#16804a]/20 bg-[#eaf4ec] text-[#173c2b]"
    >
      <EnergyFlow reducedMotion={reducedMotion} />
      <div className="relative p-5 sm:p-7 lg:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold text-[#16804a]">
          <Zap className="h-3.5 w-3.5" />
          {t.eyebrow}
        </div>
        <div className="mt-5 max-w-2xl">
          <h1 id="combined-results-title" className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#173c2b]/65">
            {t.title}
          </h1>
          <div
            data-testid="text-combined-annual-savings"
            className={`mt-2 text-[2.7rem] font-extrabold leading-none tracking-[-0.055em] sm:text-5xl ${hasNegative ? 'text-[#a44d3d]' : 'text-[#16804a]'}`}
          >
            {range(totals.annualLowEur, totals.annualHighEur, lang)}
          </div>
          <p className="mt-2 text-sm font-medium text-[#173c2b]/65">{t.perYear}</p>
        </div>

        <div className={`mt-5 grid max-w-3xl gap-3 ${hasBothQuotes ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {hasBothQuotes && (
            <>
              <div className="rounded-xl border border-white/80 bg-white/75 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#173c2b]/60">
                  <Battery className="h-3.5 w-3.5" /> {t.combinedInvestment}
                </div>
                <div className="mt-1 text-lg font-extrabold text-[#173c2b]">{euro(totals.totalInvestmentEur, lang)}</div>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/75 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#173c2b]/60">
                  <Clock3 className="h-3.5 w-3.5" /> {t.payback}
                </div>
                <div className="mt-1 text-lg font-extrabold text-[#173c2b]">
                  {hasPayback
                    ? `${new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { maximumFractionDigits: 1 }).format(totals.paybackLowYears)}–${new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { maximumFractionDigits: 1 }).format(totals.paybackHighYears)} ${t.years}`
                    : '—'}
                </div>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/75 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#173c2b]/60">
                  <Zap className="h-3.5 w-3.5" /> {t.roi}
                </div>
                <div className={`mt-1 text-lg font-extrabold ${Number(totals.roiLowPct) < 0 || Number(totals.roiHighPct) < 0 ? 'text-[#a44d3d]' : 'text-[#173c2b]'}`}>
                  {Number.isFinite(Number(totals.roiLowPct)) && totals.roiLowPct != null &&
                  Number.isFinite(Number(totals.roiHighPct)) && totals.roiHighPct != null
                    ? `${new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { maximumFractionDigits: 1 }).format(totals.roiLowPct)}%–${new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { maximumFractionDigits: 1 }).format(totals.roiHighPct)}%`
                    : '—'}
                </div>
              </div>
            </>
          )}
        </div>
        {!hasBothQuotes && <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[#173c2b]/70">{t.quoteHint}</p>}
        {hasBothQuotes && !hasPayback && <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[#a44d3d]">{t.noPayback}</p>}

        <div className="mt-5 max-w-3xl rounded-xl border border-[#173c2b]/10 bg-white/55 px-4 sm:px-5">
          <SummaryRow
            icon={Battery}
            title={t.battery}
            description={t.batteryNote}
            savingsLow={totals.batteryAnnualLowEur}
            savingsHigh={totals.batteryAnnualHighEur}
            investment={totals.batteryInvestmentEur}
            lang={lang}
            t={t}
          />
          <SummaryRow
            icon={Flame}
            title={t.heatPump}
            description={t.heatNote}
            savingsLow={totals.heatAnnualEur}
            savingsHigh={totals.heatAnnualEur}
            investment={totals.heatInvestmentEur}
            lang={lang}
            t={t}
          />
        </div>
        <p className="mt-4 max-w-3xl text-[11px] leading-relaxed text-[#173c2b]/55">{t.basedOn}</p>
        {hasNegative && <p className="mt-1 max-w-3xl text-[11px] font-semibold leading-relaxed text-[#a44d3d]">{t.negative}</p>}
      </div>
    </section>
  )
}

export default CombinedResults