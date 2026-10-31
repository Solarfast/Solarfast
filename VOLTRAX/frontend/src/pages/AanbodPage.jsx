import React, { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Battery, CheckCircle2, ArrowRight, Shield, Zap, Sun, Snowflake,
  Settings, Home, Car, Thermometer, ChevronRight
} from 'lucide-react'
import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import { HOME_BATTERY_IMAGE } from '../lib/productAssets.js'
import './SolarFastMarketing.css'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.72, ease: [0.22, 1, 0.36, 1] },
  }),
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const reduceMotion = useReducedMotion()
  return (
    <motion.div ref={ref} variants={fadeUp} custom={delay}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion || inView ? 'visible' : 'hidden'}
      className={className}>
      {children}
    </motion.div>
  )
}

export default function AanbodPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const nl = lang === 'nl'
  const goToCalculator = (kWh) => {
    const saved = sessionStorage.getItem('voltrax_form')
    let form = {}
    try { form = saved ? JSON.parse(saved) : {} } catch { form = {} }
    sessionStorage.setItem('voltrax_form', JSON.stringify({
      ...form,
      battery_kWh: kWh,
      product_mode: 'battery',
      product_mode_confirmed: true,
    }))
    navigate('/calculator')
  }

  const CAPACITY_OPTIONS = [
    {
      kWh: 10.6,
      label: '10,6 kWh',
      tier: nl ? 'Capaciteit' : 'Capacity',
      forWhom: nl ? 'Bekijk of deze capaciteit past bij uw verbruik en aansluiting.' : 'See whether this capacity suits your usage and connection.',
    },
    {
      kWh: 15.9,
      label: '15,9 kWh',
      tier: nl ? 'Capaciteit' : 'Capacity',
      forWhom: nl ? 'Bekijk of deze capaciteit past bij uw verbruik en aansluiting.' : 'See whether this capacity suits your usage and connection.',
    },
    {
      kWh: 21.2,
      label: '21,2 kWh',
      tier: nl ? 'Capaciteit' : 'Capacity',
      forWhom: nl ? 'Bekijk of deze capaciteit past bij uw verbruik en aansluiting.' : 'See whether this capacity suits your usage and connection.',
    },
    {
      kWh: 26.5,
      label: '26,5 kWh',
      tier: nl ? 'Capaciteit' : 'Capacity',
      forWhom: nl ? 'Bekijk of deze capaciteit past bij uw verbruik en aansluiting.' : 'See whether this capacity suits your usage and connection.',
    },
  ]

  const INCLUDED = [
    {
      icon: <Battery className="w-5 h-5 text-green-600" />, bg: 'bg-green-50',
      title: 'HYXiPower All-in-One',
      desc: nl ? 'Beschikbare capaciteiten: 10,6, 15,9, 21,2 en 26,5 kWh.' : 'Available capacities: 10.6, 15.9, 21.2 and 26.5 kWh.',
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50',
      title: nl ? 'Aansluiting' : 'Electrical connection',
      desc: nl ? 'De bestaande aansluiting en configuratie zijn onderdeel van het advies.' : 'Your existing connection and configuration are part of the assessment.',
    },
    {
      icon: <Settings className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50',
      title: nl ? 'Installatie' : 'Installation',
      desc: nl ? 'De werkzaamheden en eventuele aanvullende onderdelen worden vooraf in uw voorstel vastgelegd.' : 'The work and any additional components are set out in your proposal in advance.',
    },
  ]

  const backupFeatures = nl ? [
    'Back-upmogelijkheden zijn afhankelijk van productconfiguratie en installatie.',
  ] : [
    'Backup options depend on product configuration and installation.',
  ]

  const backupRows = nl ? [
    { label: 'Back-up bij stroomuitval', active: false, note: 'Afhankelijk van configuratie' },
  ] : [
    { label: 'Backup during power outage', active: false, note: 'Configuration dependent' },
  ]

  const warmtefondsFeatures = nl ? [
    'Bekijk de actuele voorwaarden rechtstreeks bij het Nationaal Warmtefonds.',
    'Controleer of uw maatregel en situatie binnen de regeling vallen.',
    'Voorwaarden kunnen wijzigen; baseer een besluit op actuele informatie.',
  ] : [
    'Check the current terms directly with the National Warmtefonds.',
    'Confirm whether your measure and situation fall within the scheme.',
    'Terms can change; use current information when making a decision.',
  ]

  const loanRows = nl ? [
    { label: 'Actuele rente', value: 'Controleer bij het fonds', color: 'text-[#131A20]' },
    { label: 'Leenbedrag', value: 'Controleer bij het fonds', color: 'text-[#131A20]' },
  ] : [
    { label: 'Current interest', value: 'Check with the fund', color: 'text-[#131A20]' },
    { label: 'Loan amount', value: 'Check with the fund', color: 'text-[#131A20]' },
  ]

  return (
    <div className="sf-brand-page sf-legacy-page min-h-screen bg-[#F9F7F4] text-[#131A20] font-['Plus_Jakarta_Sans']">
      <Nav />

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 bg-[#FDF891]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#131A20] border border-[#131A20] text-[#FDF891] text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Battery className="w-3.5 h-3.5" />
            {nl ? 'SolarFast assortiment' : 'SolarFast product range'}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-3 text-[#131A20] text-balance max-w-4xl mx-auto">
            {nl ? 'Oplossingen voor huis en bedrijf.' : 'Energy solutions for homes and businesses.'}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.15 }}
            className="text-2xl sm:text-3xl font-extrabold text-[#131A20] mb-5">
            {nl ? 'Van isolatie tot energieopslag.' : 'From insulation to energy storage.'}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#131A20]/80 text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
            {nl
              ? 'Bekijk oplossingen voor opwek, opslag, verwarming, isolatie en laden. SolarFast combineert advies, levering en installatie.'
              : 'Explore options for generation, storage, heating, insulation and charging. SolarFast brings advice, supply and installation together.'}
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="inline-flex items-center gap-2 bg-white border border-[#131A20]/15 text-[#131A20] text-xs font-semibold px-4 py-2 rounded-full mb-10">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {nl ? 'Advies, levering en installatie' : 'Advice, supply and installation'}
          </motion.div>

        </div>
      </section>

      <section id="services" className="py-16 bg-white scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            {nl ? 'Welke oplossing past bij uw woning of bedrijf?' : 'Which solution fits your home or business?'}
          </h2>
          <p className="text-[#131A20]/60 max-w-2xl mb-9">
            {nl ? 'Van vloer-, wand- en dakisolatie tot zonnepanelen, laadpalen en zakelijke batterijopslag. We adviseren over levering en installatie.' : 'From floor, wall and roof insulation to solar panels, EV chargers and commercial battery storage. Ask us about supply and installation.'}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: nl ? 'Zonnepanelen' : 'Solar panels',
                icon: <Sun />,
                image: '/assets/products/longi-solar-panel.webp',
                imageAlt: nl ? 'LONGi zonnepaneel' : 'LONGi solar panel',
                desc: nl ? 'Wek stroom op op uw eigen dak.' : 'Generate power on your own roof.',
                action: '/calculator?product=solar',
                actionText: nl ? 'Bereken indicatie' : 'Estimate savings',
              },
              {
                title: nl ? 'Thuisbatterijen' : 'Home batteries',
                icon: <Battery />,
                image: HOME_BATTERY_IMAGE,
                imageBackground: '#F8F8F3',
                imageAlt: nl ? 'HYXiPower thuisbatterij' : 'HYXiPower home battery',
                desc: nl ? 'Bewaar stroom voor een ander moment.' : 'Store power for later.',
                action: '#batterijen',
                actionText: nl ? 'Bekijk batterijen' : 'Explore batteries',
              },
              {
                title: nl ? 'Warmtepompen' : 'Heat pumps',
                icon: <Thermometer />,
                image: '/assets/products/vaillant-heat-pump.webp',
                imageAlt: nl ? 'Vaillant warmtepomp' : 'Vaillant heat pump',
                imageScale: 1.2,
                desc: nl ? 'Verwarm uw woning met minder gas.' : 'Heat your home with less gas.',
                action: '/calculator',
                actionText: nl ? 'Bereken besparing' : 'Estimate savings',
              },
              {
                title: nl ? 'Laadpalen' : 'EV chargers',
                icon: <Car />,
                image: '/assets/products/zaptec-go-2.webp',
                imageAlt: nl ? 'Zaptec Go 2 laadpaal' : 'Zaptec Go 2 home charger',
                desc: nl ? 'Laad uw auto thuis op.' : 'Charge your car at home.',
                action: 'mailto:info@solarfast.nl',
                actionText: nl ? 'Vraag advies aan' : 'Ask for advice',
              },
              {
                title: nl ? 'Airco' : 'Air conditioning',
                icon: <Snowflake />,
                image: '/assets/products/lg-air-conditioner.webp',
                imageAlt: nl ? 'LG airco-binnenunit' : 'LG air conditioner indoor unit',
                imageScale: 1.35,
                desc: nl ? 'Koeling en comfort in huis.' : 'Cooling and comfort at home.',
                action: '/calculator?product=airco',
                actionText: nl ? 'Bereken indicatie' : 'Estimate savings',
              },
              {
                title: nl ? 'Vloerisolatie' : 'Floor insulation',
                icon: <Home />,
                image: '/assets/services/floor-insulation.webp',
                imageFit: 'cover',
                imageAlt: nl ? 'Vloerisolatie in de kruipruimte' : 'Floor insulation being fitted in a crawl space',
                desc: nl ? 'Beperk warmteverlies via vloer en kruipruimte.' : 'Reduce heat loss through the floor and crawl space.',
                action: '/calculator?product=insulation&part=floor',
                actionText: nl ? 'Bereken indicatie' : 'Estimate savings',
              },
              {
                title: nl ? 'Wandisolatie' : 'Wall insulation',
                icon: <Home />,
                image: '/assets/services/wall-insulation.webp',
                imageFit: 'cover',
                imageAlt: nl ? 'Wandisolatie aan een bakstenen woninggevel' : 'Wall insulation being installed on a brick home',
                desc: nl ? 'Een passende aanpak voor spouw-, binnen- of buitenmuur.' : 'Options for cavity, interior or exterior wall insulation.',
                action: '/calculator?product=insulation&part=wall',
                actionText: nl ? 'Bereken indicatie' : 'Estimate savings',
              },
              {
                title: nl ? 'Dakisolatie' : 'Roof insulation',
                icon: <Home />,
                image: '/assets/services/roof-insulation.webp',
                imageFit: 'cover',
                imageAlt: nl ? 'Dakisolatie aanbrengen tussen de dakspanten' : 'Roof insulation being fitted between rafters',
                desc: nl ? 'Houd warmte binnen met isolatie die bij het dak past.' : 'Keep heat in with insulation suited to your roof.',
                action: '/calculator?product=insulation&part=roof',
                actionText: nl ? 'Bereken indicatie' : 'Estimate savings',
              },
              {
                title: nl ? 'Vloerverwarming' : 'Underfloor heating',
                icon: <Thermometer />,
                image: '/assets/services/underfloor-heating.webp',
                imageFit: 'cover',
                imageAlt: nl ? 'Leidingen voor vloerverwarming in een woning' : 'Underfloor heating pipes being installed in a home',
                desc: nl ? 'Gelijkmatige warmte, afgestemd op uw woning.' : 'Even warmth, tailored to your home.',
                action: 'mailto:info@solarfast.nl?subject=Advies%20over%20vloerverwarming',
                actionText: nl ? 'Vraag advies aan' : 'Ask for advice',
              },
              {
                title: nl ? 'Dakrenovatie' : 'Roof renovation',
                icon: <Home />,
                image: '/assets/services/roof-renovation.webp',
                imageFit: 'cover',
                imageAlt: nl ? 'Dakdekker vernieuwt de dakpannen van een woning' : 'Roofer renewing the tiles on a home',
                desc: nl ? 'Een vernieuwd dak als basis voor uw energieplannen.' : 'A renewed roof as a foundation for your energy plans.',
                action: 'mailto:info@solarfast.nl?subject=Advies%20over%20dakrenovatie',
                actionText: nl ? 'Vraag advies aan' : 'Ask for advice',
              },
              {
                title: nl ? 'Zakelijke batterijopslag (C&I)' : 'Commercial battery storage (C&I)',
                icon: <Battery />,
                image: '/assets/services/commercial-battery.webp',
                imageFit: 'cover',
                imageAlt: nl ? 'Zakelijke batterijopslag met een technicus ter controle' : 'Commercial battery storage cabinets inspected by a technician',
                desc: nl ? 'Opslagoplossingen voor commerciële en industriële locaties.' : 'Storage solutions for commercial and industrial sites.',
                action: 'mailto:info@solarfast.nl?subject=Zakelijke%20batterijopslag',
                actionText: nl ? 'Bespreek uw project' : 'Discuss your project',
              },
            ].map((item) => (
              <article key={item.title} className="sf-offer-card overflow-hidden flex flex-col min-h-80">
                <div
                  className="h-44 sm:h-48 flex items-center justify-center overflow-hidden border-b border-black/5"
                  style={{ backgroundColor: item.imageBackground || '#fff' }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full ${item.imageFit === 'cover' ? 'object-cover' : 'object-contain p-3'}`}
                      style={item.imageScale ? { transform: `scale(${item.imageScale})` } : undefined}
                    />
                  ) : (
                    <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#237a4b] shadow-sm">
                      {React.cloneElement(item.icon, { className: 'h-8 w-8' })}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  {item.image && <div className="w-10 h-10 rounded-full bg-[#FDF891] flex items-center justify-center mb-4">{item.icon}</div>}
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-[#131A20]/65 mb-5 flex-1">{item.desc}</p>
                  <a
                    href={item.action}
                    onClick={item.action.startsWith('/calculator')
                      ? (event) => {
                          event.preventDefault()
                          const product = new URLSearchParams(item.action.split('?')[1] || '').get('product')
                          navigate(item.action, product ? { state: { product } } : undefined)
                        }
                      : undefined}
                    className="inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4 hover:no-underline w-fit"
                  >
                    {item.actionText} <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPACITEITS-SELECTOR ── */}
      <section id="batterijen" className="py-16 bg-white scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl font-extrabold mb-2">
              {nl ? 'Thuisbatterijen: kies uw capaciteit' : 'Home batteries: choose your capacity'}
            </h2>
            <p className="text-[#131A20]/50 text-sm max-w-lg mx-auto">
              {nl
                ? 'De HYXiPower All-in-One-reeks is beschikbaar in vier capaciteiten. De uiteindelijke uitvoering hangt af van uw situatie.'
                : 'The HYXiPower All-in-One range is available in four capacities. The final configuration depends on your situation.'}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CAPACITY_OPTIONS.map((opt, i) => (
              <Reveal key={opt.kWh} delay={i * 0.1}>
                <div className="sf-page-card relative flex h-full flex-col p-6 text-[#23342b]">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#718875]">
                    {opt.tier}
                  </div>
                  <div className="text-4xl font-extrabold mb-4">{opt.label}</div>

                  <div className="mb-4 h-px bg-[#244b39]/10" />

                  <p className="mb-5 flex-1 text-sm leading-relaxed text-[#68766c]">
                    {opt.forWhom}
                  </p>

                  <button
                    onClick={() => goToCalculator(opt.kWh)}
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#244b39] py-3 text-sm font-semibold text-[#fbfaf6] transition-colors hover:bg-[#193829]"
                  >
                    {nl ? 'Bereken mijn besparing' : 'Calculate my savings'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={4}>
            <p className="text-center text-xs text-[#131A20]/50 mt-6 leading-relaxed">
              {nl
                ? 'De prijs en installatiewerkzaamheden worden bevestigd in een voorstel op basis van uw situatie.'
                : 'Pricing and installation scope are confirmed in a proposal based on your situation.'}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── ADVIES OVER CONFIGURATIE ── */}
      <section className="py-16 bg-[#F9F7F4]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-4">
              {nl ? 'Een voorstel dat helder afbakent' : 'A proposal with a clear scope'}
            </h2>
            <p className="text-[#131A20]/60 text-lg max-w-xl mx-auto">
              {nl
                ? 'Bespreek de capaciteit, aansluiting en werkzaamheden voordat u een keuze maakt.'
                : 'Discuss capacity, connection and installation work before making a decision.'}
            </p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {INCLUDED.map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="sf-page-card flex gap-4 items-start p-6">
                  <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 text-[#131A20]">{item.title}</h3>
                    <p className="text-sm text-[#131A20]/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BACK-UP CONFIGURATIE ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="sf-page-card sf-page-card--static rounded-3xl p-8 md:p-10">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-5">
                    <Shield className="w-3.5 h-3.5" />
                    {nl ? 'Controleer de configuratie' : 'Check the configuration'}
                  </div>
                  <h2 className="text-3xl font-extrabold leading-tight mb-4">
                    {nl ? 'Back-up bij stroomuitval' : 'Backup power during an outage'}
                  </h2>
                  <p className="text-[#131A20]/60 leading-relaxed mb-5">
                    {nl
                      ? 'Back-upmogelijkheden hangen af van de gekozen productconfiguratie en installatie. Vraag vooraf welke onderdelen, groepen en werkzaamheden nodig zijn voor uw situatie.'
                      : 'Backup options depend on the selected product configuration and installation. Ask in advance which components, circuits and work would be needed for your situation.'}
                  </p>
                  <ul className="space-y-2.5">
                    {backupFeatures.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#131A20]/80">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl p-7 shadow-sm">
                  <div className="font-bold text-[#131A20] mb-4">
                    {nl ? 'Stem vooraf af' : 'Confirm in advance'}
                  </div>
                  <div className="space-y-3">
                    {backupRows.map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-[#131A20]/70">{r.label}</span>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#eeeee5] text-[#526257]">
                          {r.note}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── WARMTEFONDS ── */}
      <section className="py-16 bg-[#F9F7F4]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-5">
                <Shield className="w-3.5 h-3.5" />
                {nl ? 'Actuele voorwaarden controleren' : 'Check current terms'}
              </div>
              <h2 className="text-4xl font-extrabold leading-tight mb-5">
                {nl ? 'Informatie over het Warmtefonds' : 'Information about the Warmtefonds'}
              </h2>
              <p className="text-[#131A20]/60 leading-relaxed mb-6">
                {nl
                  ? 'Regelingen, rente en voorwaarden kunnen wijzigen. Controleer de actuele informatie rechtstreeks bij het Nationaal Warmtefonds. Neem contact met ons op als u de mogelijke financiering bij uw project wilt bespreken.'
                  : 'Schemes, interest and terms may change. Check current information directly with the National Warmtefonds. Contact us if you would like to discuss possible financing for your project.'}
              </p>
              <div className="space-y-3">
                {warmtefondsFeatures.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-[#131A20]/80">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={1}>
                <div className="sf-page-card rounded-3xl p-8">
                <div className="text-center mb-6">
                  <div className="text-3xl font-extrabold text-[#131A20] mb-1">{nl ? 'Actuele informatie' : 'Current information'}</div>
                  <div className="text-[#131A20]/50 text-sm">
                    {nl ? 'voorwaarden kunnen veranderen' : 'terms can change'}
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {loanRows.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-[#131A20]/60">{r.label}</span>
                      <span className={`text-sm font-bold ${r.color}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/warmtefonds')}
                  className="w-full bg-[#22a55d] hover:bg-[#1a9050] text-white font-semibold py-3.5 rounded-full text-sm transition-all hover:shadow-lg hover:shadow-green-500/20">
                  {nl ? 'Lees over het Warmtefonds' : 'Learn about the Warmtefonds'}
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[#EEF6F1]">
        <div className="max-w-3xl mx-auto text-center px-6">
          <Reveal>
            <h2 className="text-4xl font-extrabold text-[#131A20] mb-5">
              {nl ? 'Welk systeem past bij uw situatie?' : 'Which system suits your situation?'}
            </h2>
            <p className="text-[#131A20]/60 text-lg mb-8 leading-relaxed">
              {nl
                ? 'Gebruik de calculator voor een indicatie op basis van uw verbruik en zonneopbrengst.'
                : 'Use the calculator for an estimate based on your consumption and solar generation.'}
            </p>
            <button onClick={() => goToCalculator(15.9)}
              className="inline-flex items-center gap-3 bg-[#22a55d] hover:bg-[#1a9050] text-white font-bold px-8 py-4 rounded-full transition-all hover:shadow-2xl hover:shadow-green-500/25 text-lg">
              {nl ? 'Start de berekening' : 'Start the calculation'} <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-4 text-xs text-[#131A20]/45">
              {nl ? 'Uitkomst is een indicatie, geen prestatiegarantie.' : 'An estimate, not a performance guarantee.'}
            </p>
          </Reveal>
        </div>
      </section>

      <footer className="bg-[#F9F7F4] border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/assets/solarfast-brand/logo-black.svg" alt="SolarFast" className="h-7 w-auto" />
          <p className="text-sm text-[#131A20]/40">{nl ? 'HYXiPower-partner' : 'HYXiPower partner'}</p>
          <div className="flex items-center gap-2 text-xs text-[#131A20]/40">
            <Shield className="w-3.5 h-3.5 text-[#22a55d]" />
            {nl ? 'Informatie Warmtefonds' : 'Warmtefonds information'}
          </div>
        </div>
      </footer>
    </div>
  )
}
