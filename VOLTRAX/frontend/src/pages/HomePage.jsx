import React, { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDown, ArrowRight, ArrowUpRight, MoveUpRight, Plus,
} from 'lucide-react'
import Nav from '../components/Nav.jsx'
import ProductShowcase from '../components/ProductShowcase.jsx'
import { useLanguage } from '../context/LanguageContext'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const { lang, t } = useLanguage()
  const nl = lang === 'nl'
  const reduceMotion = useReducedMotion()
  const copy = (nlText, enText) => (nl ? nlText : enText)

  useEffect(() => {
    sessionStorage.removeItem('voltrax_form')
    sessionStorage.removeItem('voltrax_results')
    sessionStorage.removeItem('voltrax_input')
  }, [])

  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: reduceMotion ? 0 : 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  })

  return (
    <main className="sf-home">
      <Nav />
      <section className="sf-hero" aria-labelledby="sf-hero-title">
        <img className="sf-hero-image" src="/assets/solarfast-brand/hero-coffee.webp" alt={copy('Een rustig moment thuis, in een lichte keuken met uitzicht op de tuin.', 'A quiet moment at home in a sunlit kitchen overlooking the garden.')} fetchpriority="high" decoding="async" />
        <div className="sf-hero-shade" />
        <div className="sf-hero-inner">
          <motion.div {...reveal(0.1)} className="sf-hero-copy">
            <span className="sf-kicker sf-kicker-light">{copy('Energie voor huis en bedrijf', 'Energy for homes and businesses')}</span>
            <h1 id="sf-hero-title" className="mt-[23px] pl-[0px] pr-[0px] pt-[2px] pb-[2px]">
              {copy('Een comfortabeler huis begint bij een goed plan.', 'A more comfortable home starts with a clear plan.')}
            </h1>
            <p>{copy('Van isolatie en dakrenovatie tot zonnepanelen en thuisbatterijen. SolarFast adviseert, levert en installeert oplossingen voor huis en bedrijf.', 'From insulation and roof renovation to solar panels and home batteries. SolarFast advises, supplies and installs solutions for homes and businesses.')}</p>
            <div className="sf-hero-actions">
              <button className="sf-pill sf-pill-primary" onClick={() => navigate('/aanbod')}>
                {copy('Ontdek ons aanbod', 'Explore our offer')} <ArrowUpRight size={17} />
              </button>
              <button className="sf-pill sf-pill-glass" onClick={() => navigate('/over-ons')}>
                {copy('Zo werken we', 'How we work')} <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
          <motion.div {...reveal(0.34)} className="sf-hero-proof">
            <span className="sf-proof-number">500<span>+</span></span>
            <span>{copy('installaties per maand', 'installations every month')}</span>
            <span className="sf-proof-rule" />
            <span>{copy('Groothandel én installateur', 'Wholesaler and installer')}</span>
          </motion.div>
          <a className="sf-scroll-cue" href="#oplossingen" aria-label={copy('Bekijk oplossingen', 'Explore solutions')}>
            <ArrowDown size={16} />
          </a>
        </div>
        <div className="sf-hero-caption">{copy('Thuis is waar energie tot leven komt.', 'Home is where energy comes to life.')}</div>
      </section>

      <section className="sf-saldering-callout" aria-labelledby="sf-saldering-title">
        <motion.div {...reveal()} className="sf-saldering-callout-inner">
          <div>
            <span className="sf-saldering-date">{copy('Voor huishoudens met zonnepanelen · vanaf 1 januari 2027', 'For solar households · from 1 January 2027')}</span>
            <h2 id="sf-saldering-title">{copy('Heb je zonnepanelen? Bereken wat stoppen met salderen voor je rekening betekent.', 'Have solar panels? See what the end of net metering could mean for your bill.')}</h2>
            <p>{copy('Gebruik je jaarverbruik, opwek en teruglevering voor een persoonlijke indicatie.', 'Use your annual consumption, solar generation and export for a personal estimate.')}</p>
          </div>
          <button type="button" onClick={() => navigate('/salderen-calculator')}>
            {copy('Bereken mijn impact', 'Calculate my impact')} <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </motion.div>
      </section>

      <section className="sf-trust" aria-labelledby="sf-trust-title">
        <div className="sf-trust-inner">
          <motion.div {...reveal()} className="sf-trust-copy">
            <span className="sf-kicker">{copy('Een heldere rol', 'A clear role')}</span>
            <h2 id="sf-trust-title">{copy('Advies, levering en installatie onder één dak.', 'Advice, supply and installation in one place.')}</h2>
            <p>{copy(
              'We combineren een breed assortiment met advies en installatie. Welke aanpak past, hangt af van je woning, bedrijf en vraag.',
              'We bring a broad product range together with advice and installation. The right approach depends on your home, business and needs.',
            )}</p>
            <div className="sf-trust-facts">
              <div className="sf-trust-fact">
                <span className="sf-trust-fact-copy">
                  <small>{copy('Wat we doen', 'What we do')}</small>
                  <strong>{copy('Groothandel & installateur', 'Wholesaler & installer')}</strong>
                </span>
              </div>
              <div className="sf-trust-fact">
                <span className="sf-trust-fact-copy">
                  <small>{copy('Bezoekadres', 'Visit us')}</small>
                  <strong>Amstelveen</strong>
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div id="sf-credentials" {...reveal(0.12)} className="sf-credentials">
            <div className="sf-credentials-heading">
              <span>{copy('Onafhankelijke informatie', 'Independent information')}</span>
              <span className="sf-credentials-count">{copy('2 bronnen', '2 sources')}</span>
            </div>
            <div className="sf-proof-sources">
              <a className="sf-proof-source" href="https://installq.nl/" target="_blank" rel="noreferrer">
                <img src="/assets/solarfast-brand/installq.png" alt="InstallQ" loading="lazy" decoding="async" />
                <span className="sf-proof-source-copy">
                  <strong>InstallQ</strong>
                  <span>{copy(
                    'Controleer of de uitvoerende installateur erkend is voor het juiste vakgebied.',
                    'Check whether the installer carrying out your work is recognised for the relevant trade.',
                  )}</span>
                </span>
                <MoveUpRight size={16} aria-hidden="true" />
              </a>
              <a className="sf-proof-source sf-proof-source--brandweer" href="https://www.brandweer.nl/onderwerpen/een-veilige-thuisbatterij" target="_blank" rel="noreferrer">
                <img src="/assets/solarfast-brand/brandweer-logo.svg" alt="Brandweer Nederland" loading="lazy" decoding="async" />
                <span className="sf-proof-source-copy">
                  <strong>{copy('Brandweer Nederland', 'Dutch Fire Service')}</strong>
                  <span>{copy(
                    'Lees de veiligheidsadviezen voor een thuisbatterij.',
                    'Read the safety advice for a home battery.',
                  )}</span>
                </span>
                <MoveUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <ProductShowcase />

      <section className="sf-insulation" aria-labelledby="sf-insulation-title">
        <div className="sf-insulation-heading">
          <div>
            <span className="sf-kicker">{copy('De basis van comfortabel wonen', 'A foundation for comfortable living')}</span>
            <h2 id="sf-insulation-title">{copy('Isolatie die past bij je woning.', 'Insulation suited to your home.')}</h2>
          </div>
          <p>{copy(
            'Vloer, muur en dak vragen elk om een eigen aanpak. We bekijken welke mogelijkheden passen bij de constructie van je woning.',
            'Floors, walls and roofs each call for a different approach. We look at the options that suit your home’s construction.',
          )}</p>
        </div>
        <div className="sf-insulation-grid">
          {[
            {
              key: 'floor',
              nl: 'Vloerisolatie',
              en: 'Floor insulation',
              descNl: 'Beperk warmteverlies via vloer en kruipruimte.',
              descEn: 'Reduce heat loss through the floor and crawl space.',
              image: '/assets/services/floor-insulation.webp',
              altNl: 'Vloerisolatie aangebracht in een kruipruimte',
              altEn: 'Floor insulation fitted in a crawl space',
              subject: 'Vloerisolatie',
            },
            {
              key: 'wall',
              nl: 'Wandisolatie',
              en: 'Wall insulation',
              descNl: 'Een passende aanpak voor spouw-, binnen- of buitenmuur.',
              descEn: 'Options for cavity, interior or exterior wall insulation.',
              image: '/assets/services/wall-insulation.webp',
              altNl: 'Werk aan wandisolatie bij een woning',
              altEn: 'Wall insulation work on a home',
              subject: 'Wandisolatie',
            },
            {
              key: 'roof',
              nl: 'Dakisolatie',
              en: 'Roof insulation',
              descNl: 'Houd warmte binnen met isolatie die bij het dak past.',
              descEn: 'Keep heat in with insulation suited to your roof.',
              image: '/assets/services/roof-insulation.webp',
              altNl: 'Isolatiemateriaal tussen de dakspanten',
              altEn: 'Insulation fitted between roof rafters',
              subject: 'Dakisolatie',
            },
          ].map((service, index) => (
            <article className="sf-insulation-card" key={service.key}>
              <div className="sf-insulation-image">
                <img src={service.image} alt={copy(service.altNl, service.altEn)} loading="lazy" decoding="async" />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="sf-insulation-card-copy">
                <h3>{copy(service.nl, service.en)}</h3>
                <p>{copy(service.descNl, service.descEn)}</p>
                <a href={`mailto:info@solarfast.nl?subject=${encodeURIComponent(copy(`Advies over ${service.subject}`, `Advice about ${service.en}`))}`}>
                  {copy('Bespreek de mogelijkheden', 'Discuss your options')} <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sf-range" aria-labelledby="sf-range-title">
        <div className="sf-range-inner">
          <div className="sf-range-intro">
            <span className="sf-kicker">{copy('Meer voor huis en bedrijf', 'More for homes and businesses')}</span>
            <h2 id="sf-range-title">{copy('Ook deze oplossingen horen erbij.', 'Other solutions for homes and businesses.')}</h2>
            <p>{copy(
              'Van verwarming en dakwerk tot opslag op zakelijke en industriële locaties. Bekijk de volledige mogelijkheden.',
              'From heating and roof work to storage at commercial and industrial sites. Explore the full range.',
            )}</p>
            <button className="sf-text-link" onClick={() => navigate('/aanbod')}>
              {copy('Bekijk het hele aanbod', 'Explore the full range')} <ArrowRight size={16} />
            </button>
          </div>
          <div className="sf-range-cards">
            {[
              {
                key: 'heating',
                eyebrow: copy('01 · COMFORT', '01 · COMFORT'),
                title: copy('Vloerverwarming', 'Underfloor heating'),
                description: copy('Gelijkmatige warmte, afgestemd op je woning.', 'Even warmth, suited to your home.'),
                image: '/assets/services/underfloor-heating.webp',
                alt: copy('Leidingen voor vloerverwarming in een woning', 'Underfloor heating pipes being installed in a home'),
              },
              {
                key: 'roof',
                eyebrow: copy('02 · DAKWERK', '02 · ROOFING'),
                title: copy('Dakrenovatie', 'Roof renovation'),
                description: copy('Dakwerk als onderdeel van je plannen voor de woning.', 'Roof work as part of your home improvement plans.'),
                image: '/assets/services/roof-renovation.webp',
                alt: copy('Dakdekker vernieuwt de dakpannen van een woning', 'Roofer renewing the tiles on a home'),
              },
              {
                key: 'business',
                eyebrow: copy('03 · ZAKELIJK', '03 · BUSINESS'),
                title: copy('Batterijopslag voor bedrijven', 'Battery storage for businesses'),
                description: copy('Opslagoplossingen voor commerciële en industriële locaties.', 'Storage solutions for commercial and industrial sites.'),
                image: '/assets/services/commercial-battery.webp',
                alt: copy('Zakelijke batterijopslag met een technicus ter controle', 'Commercial battery storage cabinets inspected by a technician'),
              },
            ].map((service) => (
              <button className="sf-range-card" key={service.key} onClick={() => navigate('/aanbod')}>
                <img className="sf-range-card-image" src={service.image} alt={service.alt} loading="lazy" decoding="async" />
                <span className="sf-range-card-top">
                  <small>{service.eyebrow}</small>
                  <MoveUpRight size={17} aria-hidden="true" />
                </span>
                <strong>{service.title}</strong>
                <span>{service.description}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sf-scale">
        <div className="sf-scale-side">
          <span className="sf-kicker">{copy('Groot in aanpak. Persoonlijk in contact.', 'Built to deliver. Personal by nature.')}</span>
          <h2>{copy('Elke maand maken we honderden huizen klaar voor morgen.', 'Every month, we make hundreds of homes ready for tomorrow.')}</h2>
          <p>{copy('Met meer dan 500 installaties per maand brengen we kennis en uitvoering samen. Van het eerste advies tot de laatste controle.', 'With more than 500 installations each month, we bring expertise and execution together. From first advice to final checks.')}</p>
          <button className="sf-pill sf-pill-dark" onClick={() => navigate('/over-ons')}>{copy('Leer SolarFast kennen', 'Get to know SolarFast')} <ArrowUpRight size={17} /></button>
        </div>
        <div className="sf-scale-stat" aria-label={copy('Meer dan 500 installaties per maand', 'More than 500 installations per month')}>
          <div className="sf-stat-big">500<span>+</span></div>
          <div className="sf-stat-label">{copy('installaties', 'installations')}</div>
          <div className="sf-stat-foot">{copy('elke maand opnieuw', 'every single month')}</div>
          <div className="sf-stat-mark"><Plus size={30} strokeWidth={1.2} /></div>
        </div>
      </section>

      <section className="sf-approach">
        <div className="sf-approach-heading">
          <span className="sf-kicker">{copy('Geen losse eindjes', 'No loose ends')}</span>
          <h2>{copy('Eén goed plan. Alles geregeld.', 'One thoughtful plan. Everything taken care of.')}</h2>
        </div>
        <div className="sf-steps">
          {[
            [copy('01 / Kennismaken', '01 / Get to know you'), copy('We luisteren naar je plannen, woning en energieverbruik.', 'We listen to your plans, home and energy use.')],
            [copy('02 / Advies op maat', '02 / Advice that fits'), copy('Je krijgt een helder voorstel, afgestemd op wat jouw huis nodig heeft.', 'You get a clear proposal, tailored to what your home needs.')],
            [copy('03 / Vakkundig installeren', '03 / Expert installation'), copy('Onze mensen regelen de installatie en leggen uit hoe alles werkt.', 'Our team handles installation and shows you how everything works.')],
          ].map(([title, desc], i) => (
            <motion.article {...reveal(i * 0.1)} className="sf-step" key={title}>
              <span className="sf-step-number">{String(i + 1).padStart(2, '0')}</span>
              <div><h3>{title}</h3><p>{desc}</p></div>
              <MoveUpRight className="sf-step-arrow" size={19} />
            </motion.article>
          ))}
        </div>
        <button className="sf-text-link sf-process-link" onClick={() => navigate('/over-ons')}>{copy('Meer over onze aanpak', 'More about our approach')} <ArrowRight size={16} /></button>
      </section>

      <section className="sf-cta">
        <div className="sf-cta-orbit" aria-hidden="true" />
        <motion.div {...reveal()} className="sf-cta-content">
          <span className="sf-kicker">{copy('Een goed begin is zo gemaakt', 'A good start is easy')}</span>
          <h2>{copy('Wat past bij jouw huis?', 'What suits your home?')}</h2>
          <p>{copy('Krijg inzicht in je mogelijkheden. Begin met een vrijblijvende berekening of neem rustig contact met ons op.', 'Get a clearer picture of your options. Start with a no-obligation calculation or simply get in touch.')}</p>
          <div className="sf-hero-actions">
            <button className="sf-pill sf-pill-dark" onClick={() => navigate('/calculator')}>{t.nav.cta} <ArrowUpRight size={17} /></button>
            <button className="sf-pill sf-pill-outline" onClick={() => navigate('/faq')}>{copy('Veelgestelde vragen', 'Frequently asked questions')} <ArrowRight size={16} /></button>
          </div>
        </motion.div>
        <span className="sf-cta-side-note">{copy('SolarFast · energie voor thuis', 'SolarFast · energy for home')}</span>
      </section>

      <footer className="sf-footer">
        <div className="sf-footer-main">
          <div className="sf-footer-brand">
            <img src="/assets/solarfast-brand/logo-white.svg" alt="SolarFast" />
            <p>{copy('Slimmer omgaan met energie. Met een plan dat bij je past.', 'A smarter way to use energy. With a plan that fits you.')}</p>
          </div>
          <div className="sf-footer-links">
            <div><span>{copy('Ontdek', 'Explore')}</span>
              <button onClick={() => navigate('/aanbod')}>{copy('Ons aanbod', 'Our offer')}</button>
              <button onClick={() => navigate('/calculator')}>{copy('Bereken je besparing', 'Calculate your savings')}</button>
              <button onClick={() => navigate('/hoe-werkt-het')}>{copy('Thuisbatterij uitgelegd', 'How home batteries work')}</button>
            </div>
            <div><span>{copy('SolarFast', 'SolarFast')}</span>
              <button onClick={() => navigate('/over-ons')}>{copy('Over ons', 'About us')}</button>
              <button onClick={() => navigate('/waarom-solarfast')}>{copy('Waarom SolarFast', 'Why SolarFast')}</button>
              <button onClick={() => navigate('/faq')}>FAQ</button>
            </div>
            <div><span>{copy('Meer informatie', 'More information')}</span>
              <button onClick={() => navigate('/hyxipower')}>HYXiPower</button>
              <button onClick={() => navigate('/warmtefonds')}>Warmtefonds</button>
            </div>
          </div>
        </div>
        <div className="sf-footer-bottom"><span>© {new Date().getFullYear()} SolarFast</span><a href="mailto:info@solarfast.nl">info@solarfast.nl</a><span>{copy('Energie voor een fijn thuis.', 'Energy for a home that feels good.')}</span></div>
      </footer>
    </main>
  )
}