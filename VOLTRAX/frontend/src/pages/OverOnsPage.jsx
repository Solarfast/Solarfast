import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Award, Users, Zap, ArrowRight,
  Battery, Wrench, MessageCircle, MapPin
} from 'lucide-react'
import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import './SolarFastMarketing.css'

const INSTALL_SRCS = [
  '/assets/installaties/install-05.jpg',
  '/assets/installaties/install-02.jpg',
  '/assets/installaties/install-08.jpg',
  '/assets/installaties/install-01.webp',
  '/assets/installaties/install-09.jpg',
  '/assets/installaties/install-03.jpg',
  '/assets/installaties/install-07.jpg',
  '/assets/installaties/install-10.jpg',
]

const PRODUCT_SRCS = [
  '/assets/installaties/solarfast-garage-render.jpg',
  '/assets/installaties/product-exploded.jpg',
  '/assets/products/hyxipower-15-9.webp',
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div ref={ref} variants={fadeUp} custom={delay}
      initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

const AANPAK_ICONS = {
  MessageCircle: <MessageCircle className="w-6 h-6 text-[#22a55d]" />,
  Wrench: <Wrench className="w-6 h-6 text-[#22a55d]" />,
  Zap: <Zap className="w-6 h-6 text-[#22a55d]" />,
  Shield: <Shield className="w-6 h-6 text-[#22a55d]" />,
}

const WHY_ICONS = [
  <Award className="w-6 h-6 text-amber-500" />,
  <Wrench className="w-6 h-6 text-blue-500" />,
  <Shield className="w-6 h-6 text-green-600" />,
  <Zap className="w-6 h-6 text-[#131A20]/60" />,
  <Users className="w-6 h-6 text-blue-400" />,
  <MessageCircle className="w-6 h-6 text-green-500" />,
]

const WHY_BGS = ['bg-amber-50', 'bg-blue-50', 'bg-green-50', 'bg-[#F9F7F4]', 'bg-blue-50', 'bg-green-50']

export default function OverOnsPage() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const o = t.overOns
  const nl = lang === 'nl'
  const installPhotos = INSTALL_SRCS.map((src, i) => ({ src, alt: o.installAlts[i] }))
  const productPhotos = PRODUCT_SRCS.map((src, i) => ({ src, alt: o.productAlts[i] }))

  return (
    <div className="sf-brand-page sf-legacy-page sf-over-ons-page min-h-screen bg-white text-[#131A20] font-['Plus_Jakarta_Sans']">
      <Nav />

      {/* HERO */}
      <section className="pt-28 pb-0 bg-[#FDF891] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center pb-16">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-[#131A20]/50 text-xs font-semibold px-4 py-2 rounded-full mb-6"
              >
                <Battery className="w-3.5 h-3.5 text-[#22a55d]" /> {o.heroBadge}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl lg:text-[3.5rem] font-extrabold leading-tight mb-5 tracking-tight"
              >
                {o.heroTitle}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[#131A20]/60 text-lg leading-relaxed mb-8 max-w-lg"
              >
                {o.heroDesc}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex items-center gap-0"
              >
                {o.heroFacts.map((f, i) => (
                  <React.Fragment key={i}>
                    <div className="pr-7">
                      <div className="text-[1.6rem] font-extrabold text-[#131A20] leading-none">{f.value}</div>
                      <div className="text-xs text-[#131A20]/45 mt-1 font-medium">{f.label}</div>
                    </div>
                    {i < o.heroFacts.length - 1 && <div className="w-px h-8 bg-[#131A20]/10 mr-7 flex-shrink-0" />}
                  </React.Fragment>
                ))}
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex items-end justify-center py-4"
            >
              <img
                src="/assets/installaties/install-technician.jpg"
                alt={o.technicianAlt}
                className="relative w-full h-[420px] object-cover rounded-3xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* INDEPENDENT INFORMATION SOURCES */}
      <section id="about-sources" className="sf-about-sources border-y border-[#d9e1d9] bg-[#fbfaf6] py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#55705c]">
              {nl ? 'Onafhankelijke informatie' : 'Independent information'}
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#4b5b4f]">
              {nl
                ? 'Bekijk informatie en adviezen van InstallQ en Brandweer Nederland.'
                : 'Explore information and advice from InstallQ and the Dutch Fire Service.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="https://installq.nl/" target="_blank" rel="noreferrer"
              className="flex min-h-24 items-center justify-center rounded-xl border border-[#d9e1d9] bg-white px-5 py-4 transition hover:border-[#829683] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244b39]"
              aria-label={nl ? 'Bekijk informatie van InstallQ' : 'View information from InstallQ'}>
              <img src="/assets/solarfast-brand/installq.png" alt="InstallQ"
                className="h-12 max-w-full object-contain" loading="lazy" decoding="async" />
            </a>
            <a href="https://www.brandweer.nl/onderwerpen/een-veilige-thuisbatterij" target="_blank" rel="noreferrer"
              className="flex min-h-24 items-center justify-center rounded-xl border border-[#193829] bg-[#193829] px-5 py-4 transition hover:bg-[#244b39] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244b39]"
              aria-label={nl ? 'Bekijk veiligheidsadvies van Brandweer Nederland' : 'View safety advice from the Dutch Fire Service'}>
              <img src="/assets/solarfast-brand/brandweer-logo.svg" alt="Brandweer Nederland"
                className="h-10 max-w-full translate-x-1 object-contain" loading="lazy" decoding="async" />
            </a>
          </div>
        </div>
      </section>

      {/* KPI STRIP */}
      {/* ONS VERHAAL */}
      <section className="py-20 bg-[#EEF6F1] border-t border-[#22a55d]/8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-[#22a55d]/15 border border-[#22a55d]/20 text-[#22a55d] text-xs font-semibold px-4 py-2 rounded-full mb-5">
                <Battery className="w-3.5 h-3.5" /> {o.verhaalBadge}
              </div>
              <h2 className="text-4xl font-extrabold mb-6 tracking-tight leading-tight">
                {o.verhaalTitle}
              </h2>
              <div className="space-y-4 text-[#131A20]/65 leading-relaxed">
                <p>{nl
                  ? 'Geen woning en geen energievraag is hetzelfde. Een passend plan begint daarom bij uw woning, verbruik en wensen.'
                  : 'No two homes or energy needs are the same. A suitable plan starts with your home, usage and priorities.'}</p>
                <p>{nl
                  ? 'SolarFast levert uiteenlopende energieproducten en verzorgt installaties. Welke combinatie past, hangt af van uw situatie.'
                  : 'SolarFast supplies a range of energy products and carries out installations. The right combination depends on your situation.'}</p>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <div className="sf-page-card sf-page-card--static rounded-3xl overflow-hidden">
                <img
                  src="/assets/installaties/install-02.jpg"
                  alt={o.installAlts[1]}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  style={{ maxHeight: 420 }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ONZE AANPAK */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#22a55d]/10 text-[#22a55d] text-xs font-semibold px-4 py-2 rounded-full mb-5">
              <Zap className="w-3.5 h-3.5" /> {o.aanpakBadge}
            </div>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">{o.aanpakTitle}</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {o.aanpak.map((step, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className="sf-approach-card p-7 h-full group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#22a55d]/10 flex items-center justify-center group-hover:bg-[#22a55d]/15 transition-colors flex-shrink-0">
                      {AANPAK_ICONS[step.icon]}
                    </div>
                    <span className="text-xs font-bold text-[#131A20]/25 tabular-nums">0{i + 1}</span>
                  </div>
                  <h3 className="font-bold text-base mb-2 text-[#131A20]">{step.title}</h3>
                  <p className="text-sm text-[#131A20]/55 leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* INSTALLATIE FOTO'S */}
      <section className="py-20 bg-[#F9F7F4]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">{o.installTitle}</h2>
            <p className="text-[#131A20]/60 text-lg max-w-xl mx-auto">{o.installDesc}</p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {installPhotos.map((photo, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className="rounded-2xl overflow-hidden aspect-square bg-[#EEF6F1]">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="grid md:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-100 border border-gray-100 items-stretch">
              <div className="aspect-[4/3] md:aspect-auto">
                <img
                  src="/assets/installaties/install-technician.jpg"
                  alt={o.technicianAlt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-[#EEF6F1] text-[#22a55d] text-xs font-semibold px-4 py-2 rounded-full mb-5 w-fit">
                  <Wrench className="w-3.5 h-3.5" /> {o.technicianBadge}
                </div>
                <h3 className="text-2xl font-extrabold mb-3 tracking-tight">{o.technicianTitle}</h3>
                <p className="text-[#131A20]/60 leading-relaxed">{o.technicianDesc}</p>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-14">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-extrabold mb-3 tracking-tight">{o.productTitle}</h3>
              <p className="text-[#131A20]/60 max-w-xl mx-auto">{o.productDesc}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {productPhotos.map((photo, i) => (
                <div key={i} className="rounded-2xl overflow-hidden aspect-square bg-[#EEF6F1]">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* WAAROM SOLARFAST */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">{o.whyTitle}</h2>
            <p className="text-[#131A20]/60 text-lg max-w-xl mx-auto">{o.whySub}</p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {o.whyUsps.map((w, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="sf-reason-card p-7 h-full group">
                  <div className={`w-12 h-12 rounded-2xl ${WHY_BGS[i]} flex items-center justify-center mb-5`}>
                    {WHY_ICONS[i]}
                  </div>
                  <h3 className="font-bold text-base mb-2 text-[#131A20]">{w.title}</h3>
                  <p className="text-sm text-[#131A20]/55 leading-relaxed">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#244b39] relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center px-6 relative">
          <Reveal>
            <h2 className="text-4xl font-extrabold text-white mb-5 tracking-tight leading-tight">
              {o.ctaTitle}
            </h2>
            <p className="text-white/75 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              {o.ctaDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/calculator')}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-green-50 text-[#244b39] font-bold px-8 py-4 rounded-full transition-all hover:shadow-2xl hover:shadow-black/10 text-base"
              >
                {o.ctaCalc} <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="mailto:info@solarfast.nl"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-full transition-all text-base"
              >
                {o.ctaMail}
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-5 mt-8 text-sm text-white/50">
              <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> info@solarfast.nl</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {o.ctaLocation}</span>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="bg-[#F9F7F4] border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/assets/solarfast-brand/logo-black.svg" alt="SolarFast" className="h-7 w-auto" />
          <p className="text-sm text-[#131A20]/40">{o.footerPartner}</p>
          <div className="flex items-center gap-2 text-xs text-[#131A20]/40">
            <Shield className="w-3.5 h-3.5 text-[#22a55d]" />
            {o.footerWarmte}
          </div>
        </div>
      </footer>
    </div>
  )
}
