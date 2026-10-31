import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, ArrowUpRight, Menu, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { prefetchRoute } from '../lib/pageLoaders.js'
import './Nav.css'

export default function Nav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scrollFrame = useRef(0)
  const scrolledRef = useRef(false)
  const reduceMotion = useReducedMotion()
  const { lang, setLang, t } = useLanguage()
  const nl = lang === 'nl'
  const copy = (dutch, english) => (nl ? dutch : english)

  useEffect(() => {
    const updateScrolledState = () => {
      scrollFrame.current = 0
      const next = window.scrollY > 24
      if (next !== scrolledRef.current) {
        scrolledRef.current = next
        setScrolled(next)
      }
    }
    const onScroll = () => {
      if (!scrollFrame.current) {
        scrollFrame.current = window.requestAnimationFrame(updateScrolledState)
      }
    }
    updateScrolledState()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollFrame.current) window.cancelAnimationFrame(scrollFrame.current)
    }
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setMoreOpen(false)
  }, [location.pathname])

  const links = [
    { to: '/aanbod', label: copy('Aanbod', 'Solutions') },
    { to: '/over-ons', label: copy('Over ons', 'About us') },
  ]
  const moreLinks = [
    { to: '/waarom-solarfast', label: copy('Waarom SolarFast', 'Why SolarFast') },
    { to: '/hoe-werkt-het', label: copy('Thuisbatterij uitgelegd', 'How home batteries work') },
    { to: '/hyxipower', label: 'HYXiPower' },
    { to: '/warmtefonds', label: 'Warmtefonds' },
    { to: '/faq', label: 'FAQ' },
  ]
  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  const go = (to) => navigate(to)

  function LanguageToggle({ compact = false }) {
    return (
      <div className={`sf-language-toggle ${compact ? 'sf-language-compact' : ''}`} role="group" aria-label={copy('Taal kiezen', 'Choose language')}>
        {['nl', 'en'].map((code) => (
          <button key={code} type="button" onClick={() => setLang(code)} aria-pressed={lang === code}
            className={lang === code ? 'is-selected' : ''} data-testid={`button-language-${code}`}>
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  return (
    <motion.header className={`sf-nav-wrap ${scrolled ? 'is-scrolled' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <nav className="sf-nav" aria-label={copy('Hoofdnavigatie', 'Main navigation')}>
        <button className="sf-logo-button" onClick={() => go('/')} aria-label="SolarFast home" data-testid="button-home">
          <img src="/assets/solarfast-brand/logo-black.svg" alt="SolarFast" />
        </button>
        <div className="sf-nav-links">
          {links.map(({ to, label }) => (
            <button key={to} onPointerEnter={() => prefetchRoute(to)} onFocus={() => prefetchRoute(to)}
              onClick={() => go(to)} aria-current={isActive(to) ? 'page' : undefined}
              className={`sf-nav-link ${isActive(to) ? 'is-active' : ''}`} data-testid={`nav-${to.slice(1)}`}>{label}</button>
          ))}
          <div className="sf-more-wrap">
            <button type="button" className={`sf-nav-link sf-more-trigger ${moreOpen ? 'is-active' : ''}`}
              aria-expanded={moreOpen} aria-haspopup="true" onClick={() => setMoreOpen((open) => !open)} data-testid="button-nav-more">
              {copy('Meer', 'More')} <ChevronDown size={14} className={moreOpen ? 'sf-chevron-open' : ''} />
            </button>
            <AnimatePresence>
              {moreOpen && <motion.div className="sf-more-menu" initial={reduceMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: 7 }} transition={{ duration: reduceMotion ? 0 : 0.16 }}>
                {moreLinks.map(({ to, label }) => <button key={to}
                  onPointerEnter={() => prefetchRoute(to)} onFocus={() => prefetchRoute(to)}
                  onClick={() => go(to)} aria-current={isActive(to) ? 'page' : undefined}>{label}<ArrowUpRight size={14} /></button>)}
              </motion.div>}
            </AnimatePresence>
          </div>
        </div>
        <div className="sf-nav-actions">
          <LanguageToggle />
          <button className="sf-nav-cta" onPointerEnter={() => prefetchRoute('/calculator')}
            onFocus={() => prefetchRoute('/calculator')} onClick={() => go('/calculator')} data-testid="button-nav-calculator">{t.nav.cta}<ArrowUpRight size={16} /></button>
          <button className="sf-menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? copy('Menu sluiten', 'Close menu') : copy('Menu openen', 'Open menu')} aria-expanded={menuOpen}
            aria-controls="sf-mobile-menu" data-testid="button-mobile-menu">
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {menuOpen && <motion.div id="sf-mobile-menu" className="sf-mobile-menu" initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
          <div className="sf-mobile-primary">
            {[...links, ...moreLinks].map(({ to, label }) => <button key={to}
              onPointerEnter={() => prefetchRoute(to)} onFocus={() => prefetchRoute(to)}
              onClick={() => go(to)} aria-current={isActive(to) ? 'page' : undefined} className={isActive(to) ? 'is-active' : ''}>{label}<ArrowUpRight size={17} /></button>)}
          </div>
          <div className="sf-mobile-bottom">
            <LanguageToggle compact />
            <button className="sf-nav-cta" onPointerEnter={() => prefetchRoute('/calculator')}
              onFocus={() => prefetchRoute('/calculator')} onClick={() => go('/calculator')}>{t.nav.cta}<ArrowUpRight size={16} /></button>
          </div>
        </motion.div>}
      </AnimatePresence>
    </motion.header>
  )
}