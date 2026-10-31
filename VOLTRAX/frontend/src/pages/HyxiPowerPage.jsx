import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Battery, CircleHelp, HousePlug } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import './SolarFastMarketing.css'

const capacities = [
  { value: 10.6, nl: '10,6 kWh', en: '10.6 kWh' },
  { value: 15.9, nl: '15,9 kWh', en: '15.9 kWh' },
  { value: 21.2, nl: '21,2 kWh', en: '21.2 kWh' },
  { value: 26.5, nl: '26,5 kWh', en: '26.5 kWh' },
]
const ease = [0.22, 1, 0.36, 1]

export default function HYXiPowerPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const nl = lang === 'nl'
  const reduceMotion = useReducedMotion()
  const copy = (dutch, english) => (nl ? dutch : english)
  const chooseCapacity = (kWh) => {
    const saved = sessionStorage.getItem('voltrax_form')
    let form = {}
    try { form = saved ? JSON.parse(saved) : {} } catch { form = {} }
    sessionStorage.setItem('voltrax_form', JSON.stringify({ ...form, battery_kWh: kWh }))
    navigate('/calculator')
  }

  return (
    <main className="sf-brand-page min-h-[100dvh]">
      <Nav />
      <section className="relative isolate overflow-hidden bg-[#e9eee5] px-6 pb-10 pt-36 sm:pt-44">
        <div className="container-max grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.58, ease }}
            className="relative z-10 pb-10 lg:pb-20"
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#244b39]/15 bg-[#fbfaf6] px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] text-[#526a56]">
              <Battery size={15} aria-hidden="true" />
              {copy('Een SolarFast-partner', 'A SolarFast partner')}
            </span>
            <h1 className="max-w-3xl text-5xl leading-[1.01] sm:text-6xl lg:text-7xl">
              HYXiPower All-in-One.
              <span className="mt-2 block text-[#718875]">{copy('Vier capaciteiten. Eén helder gesprek.', 'Four capacities. One clear conversation.')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#68766c] sm:text-lg">
              {copy(
                'SolarFast werkt samen met HYXiPower en levert en installeert de All-in-One thuisbatterij. We bespreken de configuratie aan de hand van uw woning, aansluiting en energiegebruik.',
                'SolarFast partners with HYXiPower and supplies and installs the All-in-One home battery. We discuss configuration in relation to your home, connection and energy use.',
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/calculator')}
                className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#244b39] px-6 text-sm font-semibold text-[#fbfaf6] transition-transform hover:-translate-y-0.5"
              >
                {copy('Start een berekening', 'Start a calculation')}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <a href="mailto:info@solarfast.nl?subject=Vraag%20over%20HYXiPower" className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[#244b39]/20 bg-[#fbfaf6]/70 px-6 text-sm font-semibold text-[#244b39] transition-colors hover:bg-[#fbfaf6]">
                {copy('Stel een vraag', 'Ask a question')}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.12, ease }}
            className="relative flex min-h-[350px] items-end justify-center sm:min-h-[470px]"
          >
            <div aria-hidden="true" className="absolute bottom-12 h-[82%] w-[82%] rounded-full bg-[#cbd9ca]" />
            <img
              src="/assets/products/hyxipower-15-9.webp"
              alt={copy('HYXiPower All-in-One thuisbatterij', 'HYXiPower All-in-One home battery')}
              className="relative z-10 max-h-[480px] w-auto max-w-full object-contain drop-shadow-[0_28px_36px_rgba(35,52,43,0.18)]"
              decoding="async"
            />
            <span className="absolute bottom-5 right-0 z-20 rounded-full bg-[#fbfaf6] px-4 py-2 text-xs font-semibold text-[#526257] shadow-sm">
              {copy('SolarFast × HYXiPower', 'SolarFast × HYXiPower')}
            </span>
          </motion.div>
        </div>
      </section>

      <section id="capaciteiten" className="container-max py-16 sm:py-24">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_.7fr]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">
              {copy('Beschikbare varianten', 'Available variants')}
            </span>
            <h2 className="mt-4 max-w-2xl text-4xl leading-[1.08] sm:text-5xl">
              {copy('Kies een capaciteit om mee te rekenen.', 'Choose a capacity to calculate with.')}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#68766c]">
            {copy(
              'De vier All-in-One capaciteiten zijn 10,6, 15,9, 21,2 en 26,5 kWh. De configuratie en geschiktheid moeten worden beoordeeld voor uw situatie.',
              'The four All-in-One capacities are 10.6, 15.9, 21.2 and 26.5 kWh. Configuration and suitability need to be assessed for your situation.',
            )}
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {capacities.map((capacity, index) => (
            <motion.button
              key={capacity.value}
              type="button"
              onClick={() => chooseCapacity(capacity.value)}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : index * 0.06, ease }}
              className="sf-page-card group flex min-h-48 flex-col items-start justify-between p-6 text-left"
            >
              <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">
                {copy('Capaciteit', 'Capacity')}
              </span>
              <span className="text-4xl font-semibold tracking-[-.06em] text-[#23342b]">{nl ? capacity.nl : capacity.en}</span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#244b39]">
                {copy('Gebruik in calculator', 'Use in calculator')}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="bg-[#eeeee5] px-6 py-16 sm:py-24">
        <div className="container-max grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">
              {copy('Vooraf goed afstemmen', 'What to check in advance')}
            </span>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
              {copy('De juiste vraag is groter dan alleen kWh.', 'Capacity is only one part of the decision.')}
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: <HousePlug size={18} aria-hidden="true" />,
                title: copy('Aansluiting en bestaande installatie', 'Electrical connection and existing setup'),
                text: copy('Laat de bestaande aansluiting en aanwezige apparatuur meenemen in de beoordeling.', 'Have your existing electrical connection and equipment considered in the assessment.'),
              },
              {
                icon: <CircleHelp size={18} aria-hidden="true" />,
                title: copy('Functionaliteit per configuratie', 'Features depend on configuration'),
                text: copy('Vraag welke functies, onderdelen en voorwaarden bij de gekozen uitvoering horen.', 'Ask which features, components and terms apply to the selected configuration.'),
              },
              {
                icon: <Battery size={18} aria-hidden="true" />,
                title: copy('Prijs en werkzaamheden', 'Price and installation scope'),
                text: copy('Een voorstel maakt duidelijk welke prijs en werkzaamheden voor uw situatie gelden.', 'A proposal sets out the price and installation work for your situation.'),
              },
            ].map((item) => (
              <article key={item.title} className="sf-page-card grid gap-4 p-5 sm:grid-cols-[48px_1fr] sm:p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#dfe8dc] text-[#244b39]">{item.icon}</span>
                <div>
                  <h3 className="text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#68766c]">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-max grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-[#e9eee5]">
          <img
            src="/assets/installaties/install-technician.jpg"
            alt={copy('Installatiewerk aan een energieopslagsysteem', 'Technician working on an energy storage system')}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#718875]">
            {copy('Samen een keuze maken', 'Make an informed choice')}
          </span>
          <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
            {copy('Een productpartner, met advies van SolarFast.', 'A product partner, with advice from SolarFast.')}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#68766c]">
            {copy(
              'SolarFast is groothandel én installateur. We kunnen de productkeuze, levering en installatie met u bespreken; de uitvoering wordt afgestemd op uw woning en aansluiting.',
              'SolarFast is both wholesaler and installer. We can discuss the product choice, supply and installation with you; the setup is assessed for your home and electrical connection.',
            )}
          </p>
          <a href="mailto:info@solarfast.nl?subject=HYXiPower%20advies" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#244b39] px-6 text-sm font-semibold text-[#fbfaf6] transition-transform hover:-translate-y-0.5">
            {copy('Bespreek uw situatie', 'Discuss your situation')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <footer className="bg-[#193829] px-6 py-6 text-xs text-[#e0e8df]/65">
        <div className="container-max flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} SolarFast</span>
          <a href="mailto:info@solarfast.nl" className="hover:text-white">info@solarfast.nl</a>
          <span>{copy('Partner van HYXiPower', 'HYXiPower partner')}</span>
        </div>
      </footer>
    </main>
  )
}