import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Battery, ChevronRight, CircleHelp, Sun, Waves } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import './SolarFastMarketing.css'

const ease = [0.22, 1, 0.36, 1]

export default function HoeWerktHetPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const nl = lang === 'nl'
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const copy = (dutch, english) => (nl ? dutch : english)
  const phases = nl
    ? [
        { tag: 'Wanneer er energie beschikbaar is', title: 'Stroom opwekken en direct gebruiken', description: 'Zonnepanelen leveren elektriciteit wanneer er zonlicht is. Wat er met die stroom gebeurt, hangt af van uw verbruik en de configuratie van uw installatie.', image: '/assets/battery-home.webp', alt: 'Thuisbatterij in een woning' },
        { tag: 'Wanneer er meer wordt opgewekt', title: 'Overschot opslaan voor later', description: 'Een thuisbatterij kan elektriciteit bewaren die op dat moment niet direct wordt gebruikt. De hoeveelheid die kan worden opgeslagen, hangt af van het systeem en de omstandigheden.', image: '/assets/battery-tech.webp', alt: 'Detail van een thuisbatterij' },
        { tag: 'Wanneer u stroom nodig heeft', title: 'Opgeslagen energie weer gebruiken', description: 'Later kan de opgeslagen energie beschikbaar zijn voor gebruik in huis. De werking en instellingen verschillen per product en installatie.', image: '/assets/battery-night.webp', alt: 'Thuisbatterij in de avond' },
      ]
    : [
        { tag: 'When energy is available', title: 'Generate and use electricity directly', description: 'Solar panels generate electricity when there is sunlight. What happens to it depends on your usage and system configuration.', image: '/assets/battery-home.webp', alt: 'Home battery in a house' },
        { tag: 'When generation exceeds use', title: 'Store surplus for later', description: 'A home battery can store electricity that is not being used right away. How much can be stored depends on the system and conditions.', image: '/assets/battery-tech.webp', alt: 'Close-up of a home battery' },
        { tag: 'When you need electricity', title: 'Use stored energy again', description: 'Stored energy can later be available for use in the home. Operation and settings differ by product and installation.', image: '/assets/battery-night.webp', alt: 'Home battery in the evening' },
      ]
  const considerations = nl
    ? [
        ['Verbruik en opwek', 'Uw verbruiksprofiel en de hoeveelheid opgewekte zonnestroom bepalen mede hoe een batterij in uw situatie wordt gebruikt.'],
        ['Aansluiting en configuratie', 'De elektrische aansluiting, bestaande apparatuur en gekozen product spelen een rol. Laat de situatie vooraf beoordelen.'],
        ['Voorstel en aannames', 'Een voorstel beschrijft de gekozen configuratie. Een calculatoruitkomst is een indicatie op basis van ingevoerde informatie, geen prestatiegarantie.'],
      ]
    : [
        ['Usage and generation', 'Your usage pattern and the amount of solar electricity generated help determine how a battery may be used in your situation.'],
        ['Connection and configuration', 'The electrical connection, existing equipment and chosen product all play a part. Have your setup assessed first.'],
        ['Proposal and assumptions', 'A proposal describes the selected configuration. A calculator result is an estimate based on entered information, not a performance guarantee.'],
      ]

  return (
    <main className="sf-brand-page min-h-[100dvh]">
      <Nav />
      <section className="relative overflow-hidden bg-[#e9eee5] px-6 pb-16 pt-36 sm:pb-24 sm:pt-44">
        <div className="container-max relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_.82fr] lg:gap-16">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#244b39]/15 bg-[#fbfaf6] px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] text-[#526a56]">
              <Battery size={15} aria-hidden="true" />
              {copy('In gewone taal', 'Without the jargon')}
            </span>
            <h1 className="max-w-3xl text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              {copy('Een thuisbatterij, stap voor stap.', 'A home battery, step by step.')}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#68766c] sm:text-lg">
              {copy(
                'Een thuisbatterij kan elektriciteit opslaan om op een later moment te gebruiken. Zo werkt het in grote lijnen — de details hangen altijd af van product en installatie.',
                'A home battery can store electricity for later use. Here is the general idea; the details always depend on product and installation.',
              )}
            </p>
            <button onClick={() => navigate('/calculator')} className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#244b39] px-6 text-sm font-semibold text-[#fbfaf6] transition-transform hover:-translate-y-0.5">
              {copy('Bekijk uw mogelijkheden', 'Explore your options')} <ArrowRight size={16} aria-hidden="true" />
            </button>
          </motion.div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.12, ease }}
            className="relative"
          >
            <img src="/assets/battery-home.webp" alt={copy('Thuisbatterij geplaatst in een woning', 'Home battery installed in a house')} className="aspect-[4/3] w-full rounded-2xl object-cover" />
            <div className="absolute -bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-xl border border-[#244b39]/10 bg-[#fbfaf6] px-5 py-4 shadow-[0_16px_35px_rgba(35,52,43,.08)]">
              <span className="text-sm font-semibold text-[#526257]">{copy('Opwekken', 'Generate')}</span>
              <ArrowRight size={15} className="text-[#718875]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#526257]">{copy('Opslaan', 'Store')}</span>
              <ArrowRight size={15} className="text-[#718875]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#526257]">{copy('Gebruiken', 'Use')}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container-max py-20 sm:py-28">
        <div className="mb-9 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">{copy('De energiestroom', 'The flow of energy')}</span>
          <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">{copy('Van zon naar opslag. Van opslag naar gebruik.', 'From sunlight to storage. From storage to use.')}</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div className="flex flex-col gap-2" role="tablist" aria-label={copy('Stappen in de energiestroom', 'Energy flow steps')}>
            {phases.map((phase, index) => (
              <button
                key={phase.title}
                type="button"
                role="tab"
                id={`energy-step-${index}`}
                aria-selected={active === index}
                aria-controls="energy-step-panel"
                onClick={() => setActive(index)}
                className={`flex items-center justify-between gap-4 rounded-xl px-5 py-5 text-left transition-colors ${
                  active === index ? 'bg-[#244b39] text-[#fbfaf6]' : 'bg-[#eeeee5] text-[#526257] hover:bg-[#dfe8dc]'
                }`}
              >
                <span className="flex items-center gap-4">
                  <span className={`font-mono text-xs ${active === index ? 'text-[#cbd9ca]' : 'text-[#718875]'}`}>0{index + 1}</span>
                  <span className="text-sm font-semibold">{phase.title}</span>
                </span>
                <ChevronRight size={17} className={active === index ? 'text-[#cbd9ca]' : 'text-[#718875]'} aria-hidden="true" />
              </button>
            ))}
          </div>
          <motion.article
            key={active}
            id="energy-step-panel"
            role="tabpanel"
            aria-labelledby={`energy-step-${active}`}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease }}
            className="sf-page-card sf-page-card--static grid overflow-hidden md:grid-cols-[.9fr_1.1fr]"
          >
            <img src={phases[active].image} alt={phases[active].alt} loading="lazy" className="aspect-[4/3] h-full w-full object-cover md:aspect-auto" />
            <div className="flex flex-col justify-center p-6 sm:p-9">
              <span className="text-xs font-semibold uppercase tracking-[.12em] text-[#718875]">{phases[active].tag}</span>
              <h3 className="mt-4 text-3xl leading-tight">{phases[active].title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#68766c]">{phases[active].description}</p>
            </div>
          </motion.article>
        </div>
      </section>

      <section className="bg-[#193829] px-6 py-16 text-[#fbfaf6] sm:py-24">
        <div className="container-max grid gap-9 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#cbd9ca]">{copy('Elke situatie is anders', 'Every setup is different')}</span>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">{copy('Wat bepaalt de werking?', 'What affects how it works?')}</h2>
            <p className="mt-5 text-sm leading-7 text-[#e0e8df]/70">
              {copy(
                'Een systeem vraagt om meer dan alleen een capaciteitskeuze. Neem uw bestaande apparatuur en wensen mee in het gesprek.',
                'Choosing a system involves more than capacity alone. Bring your existing equipment and requirements into the conversation.',
              )}
            </p>
          </div>
          <div className="divide-y divide-white/15 border-y border-white/15">
            {considerations.map(([title, text], index) => (
              <article key={title} className="sf-page-card-dark grid gap-4 rounded-xl p-5 sm:grid-cols-[48px_1fr] sm:gap-6 sm:p-6">
                <span className="font-mono text-xs text-[#cbd9ca]">0{index + 1}</span>
                <div>
                  <h3 className="text-xl">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#e0e8df]/70">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-max grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div className="relative overflow-hidden rounded-2xl">
          <img src="/assets/battery-tech.webp" alt={copy('Detail van een thuisbatterij', 'Detail of a home battery')} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          <div className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-[#fbfaf6]/90 text-[#244b39]"><Waves size={20} aria-hidden="true" /></div>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">{copy('De volgende stap', 'Your next step')}</span>
          <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">{copy('Reken met uw eigen gegevens.', 'Start with your own figures.')}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#68766c]">
            {copy(
              'De calculator gebruikt uw invoer om een indicatie te geven. Bekijk de aannames en bespreek de configuratie voordat u een besluit neemt.',
              'The calculator uses your input to provide an estimate. Review the assumptions and discuss the configuration before making a decision.',
            )}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => navigate('/calculator')} className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#244b39] px-6 text-sm font-semibold text-[#fbfaf6] transition-transform hover:-translate-y-0.5">
              {copy('Open calculator', 'Open calculator')} <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button onClick={() => navigate('/faq')} className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[#244b39]/20 px-6 text-sm font-semibold text-[#244b39] hover:bg-[#eeeee5]">
              {copy('Veelgestelde vragen', 'Frequently asked questions')} <CircleHelp size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[#eeeee5] px-6 py-6 text-xs text-[#68766c]">
        <div className="container-max flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} SolarFast</span>
          <a href="mailto:info@solarfast.nl" className="font-semibold text-[#244b39]">info@solarfast.nl</a>
          <span className="inline-flex items-center gap-2"><Sun size={13} aria-hidden="true" /> {copy('Energie helder uitgelegd', 'Energy, clearly explained')}</span>
        </div>
      </footer>
    </main>
  )
}