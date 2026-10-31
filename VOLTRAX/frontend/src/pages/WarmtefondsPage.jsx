import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Check, ExternalLink, FileText, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import './SolarFastMarketing.css'

const ease = [0.22, 1, 0.36, 1]

export default function WarmtefondsPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const nl = lang === 'nl'
  const reduceMotion = useReducedMotion()
  const copy = (dutch, english) => (nl ? dutch : english)
  const checks = nl
    ? [
        ['Maatregel', 'Controleer of uw voorgenomen maatregel op dit moment binnen de regeling valt.'],
        ['Uw situatie', 'Bekijk de voorwaarden die voor uw persoonlijke en financiële situatie gelden.'],
        ['Actuele voorwaarden', 'Controleer rente, leenbedrag en aanvraagstappen rechtstreeks bij het fonds.'],
      ]
    : [
        ['Measure', 'Check whether your planned measure currently falls within the scheme.'],
        ['Your situation', 'Review the conditions that apply to your personal and financial circumstances.'],
        ['Current terms', 'Check interest, loan amount and application steps directly with the fund.'],
      ]
  const steps = nl
    ? [
        ['01', 'Bekijk de regeling', 'Gebruik de informatie van het Nationaal Warmtefonds om te controleren welke voorwaarden nu gelden.'],
        ['02', 'Bespreek uw project', 'Heeft u vragen over de gekozen oplossing of de installatie? Neem contact met ons op om uw project te bespreken.'],
        ['03', 'Vraag zelf de lening aan', 'Volg de aanvraagstappen en beoordeling van het fonds. Een financieringsbesluit wordt door het Warmtefonds genomen.'],
      ]
    : [
        ['01', 'Review the scheme', 'Use information from the National Warmtefonds to check which terms currently apply.'],
        ['02', 'Discuss your project', 'Questions about the selected solution or installation? Contact us to discuss your project.'],
        ['03', 'Apply directly', 'Follow the application steps and assessment of the fund. The Warmtefonds makes financing decisions.'],
      ]

  return (
    <main className="sf-brand-page min-h-[100dvh]">
      <Nav />
      <section className="relative overflow-hidden bg-[#e9eee5] px-6 pb-20 pt-36 sm:pb-28 sm:pt-44">
        <div className="container-max relative z-10 grid items-end gap-10 lg:grid-cols-[1.15fr_.85fr]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#244b39]/15 bg-[#fbfaf6] px-4 py-2 text-xs font-semibold uppercase tracking-[.13em] text-[#526a56]">
              <FileText size={14} aria-hidden="true" />
              {copy('Informatie over financiering', 'Financing information')}
            </span>
            <h1 className="max-w-4xl text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              {copy('Eerst de voorwaarden. Dan een plan.', 'Know the terms. Then make a plan.')}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#68766c] sm:text-lg">
              {copy(
                'Denkt u aan een energiebesparende maatregel? Bekijk de actuele voorwaarden van het Nationaal Warmtefonds voordat u financiering meeneemt in uw keuze.',
                'Considering an energy-saving measure? Review the current National Warmtefonds terms before factoring financing into your decision.',
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://www.warmtefonds.nl/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#244b39] px-6 text-sm font-semibold text-[#fbfaf6] transition-transform hover:-translate-y-0.5"
              >
                {copy('Bekijk Warmtefonds.nl', 'Visit Warmtefonds.nl')}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <a
                href="mailto:info@solarfast.nl?subject=Vraag%20over%20mijn%20project"
                className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[#244b39]/20 bg-[#fbfaf6]/65 px-6 text-sm font-semibold text-[#244b39] transition-colors hover:bg-[#fbfaf6]"
              >
                {copy('Bespreek uw project', 'Discuss your project')}
                <MessageCircle size={16} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.12, ease }}
            className="sf-page-card sf-page-card-dark relative overflow-hidden rounded-2xl p-7 text-[#fbfaf6] sm:p-9"
          >
            <span className="text-xs font-semibold uppercase tracking-[.15em] text-[#cbd9ca]">
              {copy('Goed om vooraf te controleren', 'Before you proceed')}
            </span>
            <div className="mt-7 divide-y divide-white/15">
              {checks.map(([title, description]) => (
                <div key={title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[#cbd9ca]">
                    <Check size={15} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-[#fbfaf6]">{title}</h2>
                    <p className="mt-1 text-base leading-6 text-[#e0e8df]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div aria-hidden="true" className="absolute -bottom-20 -right-16 h-52 w-52 rounded-full border border-white/10" />
          </motion.aside>
        </div>
      </section>

      <section className="container-max py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
          <div className="max-w-sm">
            <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">
              {copy('Een helder verloop', 'A clear next step')}
            </span>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
              {copy('Financiering vraagt om actuele informatie.', 'Financing needs current information.')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#68766c]">
              {copy(
                'Bedragen, rente en geschiktheid kunnen wijzigen. Gebruik daarom de informatie van het fonds als bron voor uw beslissing.',
                'Amounts, interest and eligibility can change. Use the fund’s information as the source for your decision.',
              )}
            </p>
          </div>
          <div className="divide-y divide-[#244b39]/15 border-y border-[#244b39]/15">
            {steps.map(([number, title, description]) => (
              <article key={number} className="grid gap-4 py-6 sm:grid-cols-[60px_1fr] sm:gap-6 sm:py-8">
                <span className="font-mono text-sm text-[#718875]">{number}</span>
                <div>
                  <h3 className="text-xl sm:text-2xl">{title}</h3>
                  <p className="mt-2 max-w-2xl text-base leading-7 text-[#68766c]">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eeeee5] px-6 py-14 sm:py-20">
        <div className="container-max flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">
              {copy('Niet zeker waar te beginnen?', 'Not sure where to start?')}
            </span>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">
              {copy('Bespreek eerst de oplossing en uw situatie.', 'Start by discussing the solution and your situation.')}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/aanbod')}
              className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#244b39] px-6 text-sm font-semibold text-[#fbfaf6] transition-transform hover:-translate-y-0.5"
            >
              {copy('Bekijk het aanbod', 'Explore solutions')} <ArrowRight size={16} aria-hidden="true" />
            </button>
            <a href="mailto:info@solarfast.nl" className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[#244b39]/20 px-6 text-sm font-semibold text-[#244b39] hover:bg-[#fbfaf6]/60">
              {copy('Neem contact op', 'Contact SolarFast')} <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
      <footer className="bg-[#193829] px-6 py-6 text-xs text-[#e0e8df]/65">
        <div className="container-max flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} SolarFast</span>
          <a href="mailto:info@solarfast.nl" className="hover:text-white">info@solarfast.nl</a>
          <span>{copy('Controleer voorwaarden rechtstreeks bij het fonds.', 'Verify terms directly with the fund.')}</span>
        </div>
      </footer>
    </main>
  )
}