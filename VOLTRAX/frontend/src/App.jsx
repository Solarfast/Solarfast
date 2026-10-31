import React, { lazy, Suspense, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom'
import './index.css'
import './pages/SitePolish.css'
import { LanguageProvider } from './context/LanguageContext'
import { useLanguage } from './context/LanguageContext'
import { getPageMetadata } from './lib/seo.js'
import { trackEvent } from './lib/analytics.js'
import { loadRoute, prefetchRoute } from './lib/pageLoaders.js'

const HomePage = lazy(() => loadRoute('/'))
const CalculatorPage = lazy(() => loadRoute('/calculator'))
const SalderenCalculatorPage = lazy(() => loadRoute('/salderen-calculator'))
const ResultsPage = lazy(() => loadRoute('/results'))
const HoeWerktHetPage = lazy(() => loadRoute('/hoe-werkt-het'))
const AanbodPage = lazy(() => loadRoute('/aanbod'))
const OverOnsPage = lazy(() => loadRoute('/over-ons'))
const HYXiPowerPage = lazy(() => loadRoute('/hyxipower'))
const WarmtefondsPage = lazy(() => loadRoute('/warmtefonds'))
const WaaromSolarFastPage = lazy(() => loadRoute('/waarom-solarfast'))
const FAQPage = lazy(() => loadRoute('/faq'))
const VideoTemplate = lazy(() => loadRoute('/video'))
const PrivacyPage = lazy(() => loadRoute('/privacy'))
const NotFoundPage = lazy(() => loadRoute('*'))

class RouteLoadBoundary extends React.Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      const nl = this.props.lang === 'nl'
      return (
        <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold text-[#131A20]">
            {nl ? 'Deze pagina kon niet laden' : 'This page could not load'}
          </h1>
          <p className="mt-3 text-base leading-7 text-[#405247]">
            {nl
              ? 'Er ging iets mis bij het laden. Laad de pagina opnieuw om het opnieuw te proberen.'
              : 'Something went wrong while loading. Reload the page to try again.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 min-h-12 rounded-xl bg-[#174b39] px-6 py-3 font-semibold text-white hover:bg-[#103b2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174b39]"
          >
            {nl ? 'Pagina opnieuw laden' : 'Reload page'}
          </button>
        </main>
      )
    }
    return this.props.children
  }
}

function RouteLoadingFallback({ lang }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setSlow(true), 6000)
    return () => window.clearTimeout(timeout)
  }, [])

  if (slow) {
    const nl = lang === 'nl'
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center" role="alert">
        <h1 className="text-2xl font-bold text-[#131A20]">
          {nl ? 'De pagina reageert niet' : 'The page is not responding'}
        </h1>
        <p className="mt-3 text-base leading-7 text-[#405247]">
          {nl
            ? 'De pagina is na 6 seconden nog niet geladen. Probeer opnieuw.'
            : 'The page has not loaded after 6 seconds. Please try again.'}
        </p>
        <button
          className="mt-6 rounded-full bg-[#244c3b] px-6 py-3 font-semibold text-white"
          onClick={() => window.location.reload()}
        >
          {nl ? 'Opnieuw laden' : 'Reload page'}
        </button>
      </main>
    )
  }

  return (
    <div className="sf-route-loading" role="status" aria-live="polite">
      {lang === 'nl' ? 'Pagina laden…' : 'Loading page…'}
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    const root = document.documentElement
    const previousBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    root.style.scrollBehavior = previousBehavior
  }, [pathname])
  return null
}

function updateMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    const [key, ...parts] = selector.slice(6, -1).split('=')
    element.setAttribute(key, parts.join('=').replace(/^["']|["']$/g, ''))
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

function RouteMetadata() {
  const { pathname, search } = useLocation()
  const { lang } = useLanguage()

  useEffect(() => {
    const metadata = getPageMetadata(pathname, search, lang)
    const description = metadata.description
    const siteBase = String(import.meta.env.VITE_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
    const runtimeBase = window.location.hostname.endsWith('.replit.dev')
      ? ''
      : window.location.origin
    const baseUrl = siteBase || runtimeBase
    const canonicalUrl = baseUrl ? `${baseUrl}${pathname}` : ''

    document.documentElement.lang = lang === 'en' ? 'en' : 'nl'
    document.title = metadata.title
    updateMeta('meta[name="description"]', 'content', description)
    updateMeta('meta[property="og:title"]', 'content', metadata.title)
    updateMeta('meta[property="og:description"]', 'content', description)
    updateMeta('meta[property="og:type"]', 'content', 'website')
    updateMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    updateMeta('meta[name="twitter:title"]', 'content', metadata.title)
    updateMeta('meta[name="twitter:description"]', 'content', description)

    const logoUrl = baseUrl ? `${baseUrl}/assets/solarfast-logo.png` : '/assets/solarfast-logo.png'
    updateMeta('meta[property="og:image"]', 'content', logoUrl)
    updateMeta('meta[name="twitter:image"]', 'content', logoUrl)
    if (canonicalUrl) {
      let canonical = document.head.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = canonicalUrl
      updateMeta('meta[property="og:url"]', 'content', canonicalUrl)
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove()
      document.head.querySelector('meta[property="og:url"]')?.remove()
    }

    let robots = document.head.querySelector('meta[name="robots"]')
    if (metadata.noIndex) {
      if (!robots) {
        robots = document.createElement('meta')
        robots.name = 'robots'
        document.head.appendChild(robots)
      }
      robots.content = 'noindex, nofollow'
    } else {
      robots?.remove()
    }
  }, [pathname, search, lang])

  useEffect(() => {
    const recordContactClick = (event) => {
      if (!(event.target instanceof Element)) return
      if (event.target.closest('a[href^="mailto:"]')) {
        trackEvent('contact_email_clicked')
      }
    }
    document.addEventListener('click', recordContactClick)
    return () => document.removeEventListener('click', recordContactClick)
  }, [])

  return null
}

function AppRoutes() {
  const { lang } = useLanguage()
  const { pathname } = useLocation()

  useEffect(() => {
    const warmCommonRoutes = () => {
      for (const route of ['/aanbod', '/calculator', '/salderen-calculator', '/results']) {
        void prefetchRoute(route)
      }
    }

    if (typeof window.requestIdleCallback === 'function') {
      const idleHandle = window.requestIdleCallback(warmCommonRoutes, { timeout: 2500 })
      return () => window.cancelIdleCallback?.(idleHandle)
    }

    const timer = window.setTimeout(warmCommonRoutes, 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    void prefetchRoute(pathname)
  }, [pathname])

  const pageRoutes = (
    <Routes>
      <Route path="/"               element={<HomePage />} />
      <Route path="/hoe-werkt-het"  element={<HoeWerktHetPage />} />
      <Route path="/aanbod"         element={<AanbodPage />} />
      <Route path="/over-ons"       element={<OverOnsPage />} />
      <Route path="/hyxipower"       element={<HYXiPowerPage />} />
      <Route path="/warmtefonds"    element={<WarmtefondsPage />} />
      <Route path="/waarom-solarfast" element={<WaaromSolarFastPage />} />
      <Route path="/faq"            element={<FAQPage />} />
      <Route path="/calculator"     element={<CalculatorPage />} />
      <Route path="/salderen-calculator" element={<SalderenCalculatorPage />} />
      <Route path="/results"        element={<ResultsPage />} />
      <Route path="/video"          element={<VideoTemplate />} />
      <Route path="/privacy"        element={<PrivacyPage />} />
      <Route path="*"               element={<NotFoundPage />} />
    </Routes>
  )

  return (
    <>
      <RouteLoadBoundary lang={lang}>
        <Suspense fallback={<RouteLoadingFallback lang={lang} />}>
          {pageRoutes}
        </Suspense>
      </RouteLoadBoundary>
      {pathname !== '/video' && (
        <div className={`sf-global-legal ${pathname === '/results' ? 'sf-results-legal' : ''}`} role="contentinfo">
          <Link to="/privacy" data-testid="link-global-privacy">
            {lang === 'nl' ? 'Privacy en uw gegevens' : 'Privacy and your data'}
          </Link>
          <span aria-hidden="true">·</span>
          <a href="mailto:info@solarfast.nl">info@solarfast.nl</a>
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <MotionConfig initial={false} reducedMotion="user">
      <LanguageProvider>
        <Router future={{ v7_startTransition: true }}>
          <RouteMetadata />
          <ScrollToTop />
          <AppRoutes />
        </Router>
      </LanguageProvider>
    </MotionConfig>
  )
}

export default App
