import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Building2, Check, ClipboardCheck, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import './SolarFastMarketing.css'

const ease = [0.22, 1, 0.36, 1]

export default function WaaromSolarFastPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const nl = lang === 'nl'
  const reduceMotion = useReducedMotion()
  const copy = (dutch, english) => (nl ? dutch : english)
  const steps = nl
    ? [
        ['01', 'Breng uw vraag in kaart', 'Bespreek uw woning, verbruik en plannen. Zo ontstaat een beeld van de oplossingen die relevant kunnen zijn.'],
        ['02', 'Bekijk producten en configuratie', 'SolarFast is groothandel én installateur. Beschikbare producten en installatiewerk worden afgestemd op uw project.'],
        ['03', 'Lees het voorstel zorgvuldig', 'Het voorstel beschrijft de gekozen configuratie, de werkzaamheden en de prijs voor uw situatie.'],
      ]
    : [
        ['01', 'Set out what you need', 'Discuss your home, usage and plans. This helps identify which solutions may be relevant.'],
        ['02', 'Review products and configuration', 'SolarFast is both wholesaler and installer. Available products and installation work are assessed for your project.'],
        ['03', 'Review the proposal', 'The proposal describes the selected configuration, the installation work and the price for your situation.'],
      ]

  return (
    <main className="sf-brand-page min-h-[100dvh]">
      <Nav />
      <section className="relative overflow-hidden bg-[#e9eee5] px-6 pb-14 pt-36 sm:pb-20 sm:pt-44">
        <div className="container-max grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#244b39]/15 bg-[#fbfaf6] px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] text-[#526a56]">
              <Building2 size={15} aria-hidden="true" />
              {copy('Groothandel én installateur', 'Wholesaler and installer')}
            </span>
            <h1 className="max-w-3xl text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              {copy('Groot in aanbod. Helder in aanpak.', 'A broad range. A clear approach.')}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#68766c] sm:text-lg">
              {copy(
                'SolarFast levert energieproducten en verzorgt installaties. Van zonnepanelen en thuisbatterijen tot oplossingen voor verwarming, laden en isolatie.',
                'SolarFast supplies energy products and carries out installations. From solar panels and home batteries to heating, charging and insulation solutions.',
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/aanbod')}
                className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#244b39] px-6 text-sm font-semibold text-[#fbfaf6] transition-transform hover:-translate-y-0.5"
              >
                {copy('Bekijk het aanbod', 'Explore the range')}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/calculator')}
                className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[#244b39]/20 bg-[#fbfaf6]/70 px-6 text-sm font-semibold text-[#244b39] transition-colors hover:bg-[#fbfaf6]"
              >
                {copy('Naar de calculator', 'Open the calculator')}
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
          <motion.figure
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.12, ease }}
            className="relative overflow-hidden rounded-2xl bg-[#cbd9ca]"
          >
            <img
              src="/assets/installaties/install-technician.jpg"
              alt={copy('Een installateur werkt aan een energieopslagsysteem', 'An installer working on an energy storage system')}
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="absolute bottom-4 left-4 rounded-full bg-[#fbfaf6]/90 px-4 py-2 text-xs font-semibold text-[#526257]">
              {copy('Installatie door SolarFast', 'Installation by SolarFast')}
            </figcaption>
          </motion.figure>
        </div>
      </section>

      <section className="container-max grid gap-8 py-16 sm:py-24 md:grid-cols-[.8fr_1.2fr] md:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">
            {copy('Wat u vooraf kunt controleren', 'What to verify before installation')}
          </span>
          <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
            {copy('Wees precies over wie het werk uitvoert.', 'Know who will carry out the work.')}
          </h2>
          <p className="mt-5 text-sm leading-7 text-[#68766c]">
            {copy(
              'InstallQ-erkenning is gekoppeld aan een specifieke installateur en een vakgebied. Controleer daarom in het register of de uitvoerder voor het relevante vakgebied erkend is.',
              'InstallQ recognition is linked to a specific installer and trade. Check the register to see whether the person carrying out your work is recognised for the relevant trade.',
            )}
          </p>
          <a
            href="https://installq.nl/"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#244b39] underline decoration-[#718875]/60 underline-offset-4 hover:decoration-[#244b39]"
          >
            {copy('Controleer het InstallQ-register', 'Check the InstallQ register')}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
        <div className="sf-page-card sf-page-card--static rounded-2xl p-6 sm:p-9">
          <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#dfe8dc] text-[#244b39]">
            <ClipboardCheck size={19} aria-hidden="true" />
          </div>
          <h3 className="text-2xl">{copy('Controleer de juiste gegevens', 'Check the relevant details')}</h3>
          <p className="mt-3 text-sm leading-7 text-[#68766c]">
            {copy(
              'Zoek op de naam van de installateur die uw project uitvoert en selecteer het vakgebied dat aansluit op de werkzaamheden. Een erkenning van een andere partij of voor een ander vakgebied zegt niet automatisch iets over uw installatie.',
              'Search for the installer who will carry out your project and select the trade relevant to the work. Recognition held by another company or for a different trade does not automatically apply to your installation.',
            )}
          </p>
        </div>
      </section>

      <section className="bg-[#eeeee5] px-6 py-16 sm:py-24">
        <div className="container-max grid gap-8 lg:grid-cols-[.65fr_1.35fr] lg:gap-16">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">
              {copy('Een werkbare volgorde', 'A practical sequence')}
            </span>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
              {copy('Van eerste vraag naar helder voorstel.', 'From first question to a clear proposal.')}
            </h2>
          </div>
          <div className="divide-y divide-[#244b39]/15 border-y border-[#244b39]/15">
            {steps.map(([number, title, text]) => (
              <article key={number} className="grid gap-4 py-6 sm:grid-cols-[55px_1fr] sm:gap-6 sm:py-8">
                <span className="font-mono text-sm text-[#718875]">{number}</span>
                <div>
                  <h3 className="text-xl sm:text-2xl">{title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#68766c]">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-max py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <figure className="relative overflow-hidden rounded-2xl bg-[#e9eee5]">
            <img
              src="/assets/installaties/product-exploded.jpg"
              alt={copy('Onderdelen van een energiesysteem in productpresentatie', 'Energy system components in a product display')}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </figure>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">
              {copy('Uw plannen, uw keuze', 'Your plans, your choice')}
            </span>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
              {copy('Een oplossing begint met uw situatie.', 'Start with your situation.')}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#68766c]">
              {copy(
                'Een batterij of andere energieoplossing is niet voor iedere woning hetzelfde. Gebruik de calculator voor een indicatie of neem contact op om de mogelijkheden te bespreken.',
                'A battery or other energy solution is not the same fit for every home. Use the calculator for an estimate or get in touch to discuss options.',
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate('/calculator')} className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#244b39] px-6 text-sm font-semibold text-[#fbfaf6] transition-transform hover:-translate-y-0.5">
                {copy('Maak een indicatieve berekening', 'Get an estimate')}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <a href="mailto:info@solarfast.nl" className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[#244b39]/20 px-6 text-sm font-semibold text-[#244b39] hover:bg-[#eeeee5]">
                {copy('Stel een vraag', 'Get in touch')}
                <Wrench size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#193829] px-6 py-6 text-xs text-[#e0e8df]/65">
        <div className="container-max flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} SolarFast</span>
          <a href="mailto:info@solarfast.nl" className="hover:text-white">info@solarfast.nl</a>
          <span>{copy('Groothandel én installateur', 'Wholesaler and installer')}</span>
        </div>
      </footer>
    </main>
  )
}