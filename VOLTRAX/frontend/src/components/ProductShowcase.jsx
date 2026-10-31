import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BatteryCharging, Check,
  ChevronLeft, ChevronRight, PlugZap, Sun, Thermometer, Wind,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { HOME_BATTERY_IMAGE } from '../lib/productAssets.js'
import './ProductShowcase.css'

const products = [
  {
    key: 'battery',
    nl: 'Thuisbatterijen',
    en: 'Home batteries',
    deckNl: 'Meer ruimte om zelf opgewekte energie te gebruiken.',
    deckEn: 'More room to use the energy you make yourself.',
    detailsNl: 'Een thuisbatterij kan helpen om zelf opgewekte energie op een ander moment te gebruiken. We denken mee over hoe dat aansluit op jouw woning.',
    detailsEn: 'A home battery can help you use the energy you generate at another moment. We can explore how it might work with your home.',
    image: HOME_BATTERY_IMAGE,
    imageAltNl: 'HYXiPower thuisbatterij in twee formaten',
    imageAltEn: 'HYXiPower home battery in two sizes',
    art: 'battery',
    icon: BatteryCharging,
    path: '/calculator',
  },
  {
    key: 'solar',
    nl: 'Zonnepanelen',
    en: 'Solar panels',
    deckNl: 'Vang het daglicht. Gebruik het op jouw moment.',
    deckEn: 'Catch the daylight. Use it on your own terms.',
    detailsNl: 'Ontdek wat zonnepanelen voor jouw woning kunnen betekenen. We kijken samen naar je huis, je energieverbruik en wat bij jouw situatie past.',
    detailsEn: 'Explore what solar panels could mean for your home. Together, we look at your home, energy use and what fits your situation.',
    image: '/assets/products/longi-solar-panel-cutout.webp',
    imageAltNl: 'LONGi zonnepaneel',
    imageAltEn: 'LONGi solar panel',
    art: 'solar',
    icon: Sun,
    path: '/aanbod',
  },
  {
    key: 'heat',
    nl: 'Warmtepompen',
    en: 'Heat pumps',
    deckNl: 'Een comfortabel huis, met een oplossing op maat.',
    deckEn: 'A comfortable home, with a solution made to fit.',
    detailsNl: 'Elke woning vraagt iets anders. Verken samen met ons welke warmtepompoplossing aansluit op je huis en woonwensen.',
    detailsEn: 'Every home is different. Explore with us which heat pump solution suits your home and the way you live.',
    image: '/assets/products/vaillant-heat-pump-cutout.webp',
    imageAltNl: 'Vaillant warmtepomp',
    imageAltEn: 'Vaillant heat pump',
    art: 'heat',
    icon: Thermometer,
    path: '/calculator',
  },
  {
    key: 'ev',
    nl: 'Laadpalen',
    en: 'EV chargers',
    deckNl: 'Opladen thuis, op een manier die bij je past.',
    deckEn: 'Charging at home, in a way that works for you.',
    detailsNl: 'Van de plek aan huis tot je dagelijkse ritten: samen bekijken we welke laadoplossing aansluit bij jouw situatie.',
    detailsEn: 'From the spot at home to your everyday journeys: together, we can explore a charging solution that suits your needs.',
    image: '/assets/products/zaptec-go-2.webp',
    imageAltNl: 'Zaptec Go 2 laadpaal',
    imageAltEn: 'Zaptec Go 2 home charger',
    art: 'car',
    icon: PlugZap,
    path: '/aanbod',
  },
  {
    key: 'air',
    nl: 'Airco',
    en: 'Air conditioning',
    deckNl: 'Een aangenaam binnenklimaat, door elk seizoen.',
    deckEn: 'A comfortable indoor climate, through every season.',
    detailsNl: 'Op zoek naar meer comfort in huis? We denken mee over de mogelijkheden voor airconditioning en de ruimtes die je wilt koelen.',
    detailsEn: 'Looking for more comfort at home? We can talk through air conditioning options and the rooms you want to cool.',
    image: '/assets/products/lg-air-conditioner-cutout.png',
    imageAltNl: 'LG airco-binnenunit',
    imageAltEn: 'LG air conditioner indoor unit',
    art: 'air',
    icon: Wind,
    path: '/aanbod',
  },
]

function ProductScene({ product, isNl }) {
  const Icon = product.icon

  if (product.image) {
    return (
      <img
        className={`sfp-visual-photo sfp-visual-photo-${product.key}`}
        src={product.image}
        alt={isNl ? product.imageAltNl : product.imageAltEn}
        loading="lazy"
        decoding="async"
      />
    )
  }

  if (product.key === 'battery') {
    return (
      <img
        className="sfp-visual-photo"
        src="/assets/battery-home.webp"
        alt="Thuisbatterij bij een moderne woning"
        loading="lazy"
        decoding="async"
      />
    )
  }

  return (
    <div className={`sfp-scene sfp-scene-${product.art}`} aria-hidden="true">
      {product.art === 'solar' && <div className="sfp-panel-grid">{Array.from({ length: 9 }, (_, i) => <span key={i} />)}</div>}
      {product.art === 'heat' && <div className="sfp-heat-unit" />}
      {product.art === 'car' && <div className="sfp-car-unit"><span className="sfp-car-mark" /></div>}
      {product.art === 'air' && <div className="sfp-air-unit" />}
      <Icon className="sfp-scene-icon" />
    </div>
  )
}

export default function ProductShowcase() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const isNl = lang === 'nl'
  const copy = (nlText, enText) => (isNl ? nlText : enText)
  const [active, setActive] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const triggerRef = useRef(null)
  const product = products[active]
  const current = String(active + 1).padStart(2, '0')
  const total = String(products.length).padStart(2, '0')

  const change = (step) => {
    setActive((index) => (index + step + products.length) % products.length)
  }

  const selectProduct = (index) => setActive(index)

  const openDialog = (event) => {
    triggerRef.current = event.currentTarget
    setDialogOpen(true)
  }

  const closeDialog = () => setDialogOpen(false)

  useEffect(() => {
    if (!dialogOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDialog()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus()
    }
  }, [dialogOpen])

  const handleCarouselKeyDown = (event) => {
    if (dialogOpen) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      change(1)
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      change(-1)
    }
  }

  return (
    <section
      className="sfp"
      id="oplossingen"
      aria-labelledby="sfp-section-title"
      onKeyDown={handleCarouselKeyDown}
    >
      <div className="sfp-main">
        <div className="sfp-section-intro">
          <span className="sfp-overline">{copy('Alles voor jouw energie thuis', 'Everything for energy at home')}</span>
          <h2 id="sfp-section-title">
            {copy('Van dak tot oprit.', 'From rooftop to driveway.')}
            <br />
            <em>{copy('Van idee tot installatie.', 'From first thought to installation.')}</em>
          </h2>
          <p>{copy(
            'Niet één product, maar het complete plaatje. We denken mee, maken het helder en zorgen dat alles samenwerkt.',
            'Not just one product, but the full picture. We think alongside you, make it clear and make sure everything works together.',
          )}</p>
        </div>

        <div className="sfp-solution-labels" role="group" aria-label={copy('Kies een oplossing', 'Choose a solution')}>
          {products.map((item, index) => (
            <button
              className={`sfp-solution-label${index === active ? ' is-active' : ''}`}
              type="button"
              key={item.key}
              aria-pressed={index === active}
              onClick={() => selectProduct(index)}
            >
              {copy(item.nl, item.en)}
            </button>
          ))}
        </div>

        <div className="sfp-layout" role="region" aria-roledescription="carousel" aria-label={copy('Ontdek onze oplossingen', 'Explore our solutions')}>
          <div className="sfp-copy sfp-entry" key={`copy-${product.key}`} aria-live="polite">
            <span className="sfp-count"><b>{current}</b> &nbsp;/&nbsp; {total}</span>
            <h3>
              {copy(product.nl, product.en)}
              <br />
              <em>{copy('voor jouw huis.', 'for your home.')}</em>
            </h3>
            <p className="sfp-description">{copy(product.deckNl, product.deckEn)}</p>

            {product.key === 'battery' && (
              <div className="sfp-brands" aria-label={copy('HYXiPower partner', 'HYXiPower partner')}>
                <span className="sfp-brands-label">{copy('Partner', 'Partner')}</span>
                <img src="/assets/installaties/hyxipower-logo-mark.png" alt="HYXiPower" />
              </div>
            )}
            {product.key === 'heat' && (
              <div className="sfp-brands" aria-label={copy('Warmtepompmerken', 'Heat pump brands')}>
                <span className="sfp-brands-label">{copy('Merken', 'Brands')}</span>
                <strong>Vaillant</strong><i aria-hidden="true" /><strong>Weheat</strong>
              </div>
            )}

            <div className="sfp-cta-row">
              <button className="sfp-cta" type="button" onClick={openDialog}>
                {copy('Ontdek de oplossing', 'Explore this solution')} <ArrowUpRight aria-hidden="true" />
              </button>
              <span className="sfp-caption">{copy('Goed advies begint met luisteren.', 'Good advice starts with listening.')}</span>
            </div>
          </div>

          <div className="sfp-visual-wrap sfp-entry" key={`visual-${product.key}`}>
            <button
              className={`sfp-visual sfp-visual-${product.key}`}
              type="button"
              onClick={openDialog}
              aria-label={copy(`Meer over ${product.nl}`, `More about ${product.en}`)}
            >
              <ProductScene product={product} isNl={isNl} />
              <span className="sfp-image-index">{current} <span>/ {total}</span></span>
              <span className="sfp-visual-trigger"><ArrowUpRight aria-hidden="true" /></span>
            </button>

            <div className="sfp-carousel-controls">
              <div className="sfp-dots" role="group" aria-label={copy('Kies een oplossing', 'Choose a solution')}>
                {products.map((item, index) => (
                  <button
                    className="sfp-dot"
                    key={item.key}
                    type="button"
                    aria-label={`${index + 1}: ${copy(item.nl, item.en)}`}
                    aria-current={index === active}
                    onClick={() => selectProduct(index)}
                  />
                ))}
              </div>
              <div className="sfp-controls-right">
                <span className="sfp-control-label">{copy('Ontdek alle oplossingen', 'Explore all solutions')}</span>
                <button className="sfp-arrow" type="button" onClick={() => change(-1)} aria-label={copy('Vorige oplossing', 'Previous solution')}>
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button className="sfp-arrow" type="button" onClick={() => change(1)} aria-label={copy('Volgende oplossing', 'Next solution')}>
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="sfp-footer">
          <span className="sfp-footer-note"><Check aria-hidden="true" /> {copy('Van eerste vraag tot passende installatie.', 'From first question to the right installation.')}</span>
          <span className="sfp-footer-index">SOLARFAST&nbsp;&nbsp;·&nbsp;&nbsp;{current} / {total}</span>
        </div>
      </div>

      {dialogOpen && createPortal(
        <div className="sfp-dialog-theme">
          <div className="sfp-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog() }}>
          <div
            className="sfp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sfp-dialog-title"
            aria-describedby="sfp-dialog-description"
            ref={dialogRef}
          >
            <button className="sfp-dialog-close" type="button" onClick={closeDialog} ref={closeRef} aria-label={copy('Sluiten', 'Close')}>
              <span aria-hidden="true">×</span>
            </button>
            <div className={`sfp-dialog-image sfp-dialog-image-${product.art}`}>
              <ProductScene product={product} isNl={isNl} />
              <span className="sfp-dialog-kicker">{copy('Een oplossing voor jouw thuis', 'A solution for your home')}</span>
            </div>
            <div className="sfp-dialog-content">
              <span className="sfp-dialog-eyebrow">{copy('SolarFast · oplossingen', 'SolarFast · solutions')}</span>
              <h2 id="sfp-dialog-title">{copy(product.nl, product.en)}</h2>
              <p className="sfp-dialog-copy" id="sfp-dialog-description">
                {copy(product.detailsNl, product.detailsEn)}
              </p>

              {product.key === 'battery' && (
                <>
                  <div className="sfp-feature-list">
                    {[copy('All-in-One systeem', 'All-in-One system'), copy('LFP-cellen', 'LFP cells'), copy('Slim EMS', 'Smart EMS'), copy('Realtime inzicht via app', 'Real-time app monitoring')].map((feature) => (
                      <span key={feature}><Check aria-hidden="true" />{feature}</span>
                    ))}
                  </div>
                  <div className="sfp-partner">
                    <div className="sfp-partner-copy">
                      <span>{copy('Een partner in thuisbatterijen', 'A home battery partner')}</span>
                      <strong>HYXiPower</strong>
                    </div>
                    <img className="sfp-battery-render" src="/assets/products/hyxipower-15-9.webp" alt={copy('HYXiPower thuisbatterij', 'HYXiPower home battery')} loading="lazy" decoding="async" />
                    <img className="sfp-partner-logo" src="/assets/installaties/hyxipower-logo-mark.png" alt="HYXiPower" />
                  </div>
                </>
              )}
              {product.key === 'heat' && (
                <div className="sfp-partner">
                  <div className="sfp-partner-copy">
                    <span>{copy('Merken om te verkennen', 'Brands to explore')}</span>
                    <strong>Vaillant&nbsp; · &nbsp;Weheat</strong>
                  </div>
                </div>
              )}

              <div className="sfp-dialog-actions">
                <button className="sfp-cta" type="button" onClick={() => { closeDialog(); navigate(product.path) }}>
                  {copy('Bekijk mogelijkheden', 'Explore options')} <ArrowUpRight aria-hidden="true" />
                </button>
                <button className="sfp-secondary" type="button" onClick={closeDialog}>
                  {copy('Verder ontdekken', 'Keep exploring')}
                </button>
              </div>
              <p className="sfp-dialog-footnote">
                {product.key === 'battery'
                  ? copy('HYXiPower is een partner van SolarFast.', 'HYXiPower is a SolarFast partner.')
                  : copy('Mogelijkheden zijn afhankelijk van je woning en situatie.', 'Options depend on your home and situation.')}
              </p>
            </div>
          </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}