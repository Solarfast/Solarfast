import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUpRight, MoveUpRight, Plus, BadgeCheck,
  Building2, MapPin, ChevronDown, Menu, X, Sun, BatteryCharging, Thermometer,
  PlugZap, Wind, Check, ChevronLeft, ChevronRight,
} from "lucide-react";
import "./_group.css";

type Language = "nl" | "en";
const products = [
  { key: "battery", nl: "Thuisbatterijen", en: "Home batteries", deckNl: "Meer ruimte om zelf opgewekte energie te gebruiken.", deckEn: "More room to use the energy you make yourself.", image: "/__mockup/images/hyxipower-home.png", altNl: "HYXiPower thuisbatterij in twee formaten", altEn: "HYXiPower home battery in two sizes", Icon: BatteryCharging },
  { key: "solar", nl: "Zonnepanelen", en: "Solar panels", deckNl: "Vang het daglicht. Gebruik het op jouw moment.", deckEn: "Catch the daylight. Use it on your own terms.", image: "/__mockup/images/longi-solar-panel.jpg", altNl: "LONGi zonnepaneel", altEn: "LONGi solar panel", Icon: Sun },
  { key: "heat", nl: "Warmtepompen", en: "Heat pumps", deckNl: "Een comfortabel huis, met een oplossing op maat.", deckEn: "A comfortable home, with a solution made to fit.", image: "/__mockup/images/vaillant-heat-pump.webp", altNl: "Vaillant warmtepomp", altEn: "Vaillant heat pump", Icon: Thermometer },
  { key: "ev", nl: "Laadpalen", en: "EV chargers", deckNl: "Opladen thuis, op een manier die bij je past.", deckEn: "Charging at home, in a way that works for you.", image: "/__mockup/images/zaptec-go-2.webp", altNl: "Zaptec Go 2 laadpaal", altEn: "Zaptec Go 2 home charger", Icon: PlugZap },
  { key: "air", nl: "Airco", en: "Air conditioning", deckNl: "Een aangenaam binnenklimaat, door elk seizoen.", deckEn: "A comfortable indoor climate, through every season.", image: "/__mockup/images/lg-air-conditioner.webp", altNl: "LG airco-binnenunit", altEn: "LG air conditioner indoor unit", Icon: Wind },
];

function ProductShowcase({ lang, copy }: { lang: Language; copy: (nl: string, en: string) => string }) {
  const [active, setActive] = useState(0);
  const product = products[active];
  const [dialogOpen, setDialogOpen] = useState(false);
  const current = String(active + 1).padStart(2, "0");
  const total = String(products.length).padStart(2, "0");
  const change = (step: number) => setActive((index) => (index + step + products.length) % products.length);
  return <section className="sfp" id="oplossingen" aria-labelledby="sfp-section-title">
    <div className="sfp-main">
      <div className="sfp-section-intro">
        <span className="sfp-overline">{copy("Alles voor jouw energie thuis", "Everything for energy at home")}</span>
        <h2 id="sfp-section-title">{copy("Van dak tot oprit.", "From rooftop to driveway.")}<br /><em>{copy("Van idee tot installatie.", "From first thought to installation.")}</em></h2>
        <p>{copy("Niet één product, maar het complete plaatje. We denken mee, maken het helder en zorgen dat alles samenwerkt.", "Not just one product, but the full picture. We think alongside you, make it clear and make sure everything works together.")}</p>
      </div>
      <div className="sfp-solution-labels" role="group" aria-label={copy("Kies een oplossing", "Choose a solution")}>
        {products.map((item, index) => <button key={item.key} className={`sfp-solution-label${index === active ? " is-active" : ""}`} type="button" aria-pressed={index === active} onClick={() => setActive(index)}>{copy(item.nl, item.en)}</button>)}
      </div>
      <div className="sfp-layout">
        <div className="sfp-copy">
          <span className="sfp-count"><b>{current}</b> &nbsp;/&nbsp; {total}</span>
          <h3>{copy(product.nl, product.en)}<br /><em>{copy("voor jouw huis.", "for your home.")}</em></h3>
          <p className="sfp-description">{copy(product.deckNl, product.deckEn)}</p>
          {product.key === "battery" && <div className="sfp-brands"><span className="sfp-brands-label">{copy("Partner", "Partner")}</span><img src="/__mockup/images/hyxipower-logo-mark.png" alt="HYXiPower" /></div>}
          {product.key === "heat" && <div className="sfp-brands"><span className="sfp-brands-label">{copy("Merken", "Brands")}</span><strong>Vaillant</strong><i /> <strong>Weheat</strong></div>}
          <div className="sfp-cta-row"><button className="sfp-cta" type="button" onClick={() => setDialogOpen(true)}>{copy("Ontdek de oplossing", "Explore this solution")} <ArrowUpRight /></button><span className="sfp-caption">{copy("Goed advies begint met luisteren.", "Good advice starts with listening.")}</span></div>
        </div>
        <div className="sfp-visual-wrap">
          <button className={`sfp-visual sfp-visual-${product.key}`} type="button" onClick={() => setDialogOpen(true)} aria-label={copy(`Meer over ${product.nl}`, `More about ${product.en}`)}>
            <img className={`sfp-visual-photo sfp-visual-photo-${product.key}`} src={product.image} alt={copy(product.altNl, product.altEn)} />
            <span className="sfp-photo-shade" />
            <span className="sfp-image-note">{copy("Energie die bij je leven past", "Energy that fits your life")}</span>
            <span className="sfp-image-index">{current} <span>/ {total}</span></span>
            <span className="sfp-visual-trigger"><ArrowUpRight /></span>
          </button>
          <div className="sfp-carousel-controls"><div className="sfp-dots">{products.map((item, index) => <button key={item.key} className="sfp-dot" aria-label={`${index + 1}: ${copy(item.nl, item.en)}`} aria-current={index === active} onClick={() => setActive(index)} />)}</div><div className="sfp-controls-right"><span className="sfp-control-label">{copy("Ontdek alle oplossingen", "Explore all solutions")}</span><button className="sfp-arrow" aria-label={copy("Vorige oplossing", "Previous solution")} onClick={() => change(-1)}><ChevronLeft /></button><button className="sfp-arrow" aria-label={copy("Volgende oplossing", "Next solution")} onClick={() => change(1)}><ChevronRight /></button></div></div>
        </div>
      </div>
      <div className="sfp-footer"><span className="sfp-footer-note"><Check /> {copy("Van eerste vraag tot passende installatie.", "From first question to the right installation.")}</span><span className="sfp-footer-index">SOLARFAST&nbsp;&nbsp;—&nbsp;&nbsp;{current} / {total}</span></div>
    </div>
    {dialogOpen && <div className="sfp-dialog-theme"><div className="sfp-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}><div className="sfp-dialog" role="dialog" aria-modal="true">
      <button className="sfp-dialog-close" aria-label={copy("Sluiten", "Close")} onClick={() => setDialogOpen(false)}>×</button>
      <div className="sfp-dialog-image"><img src={product.key === "battery" ? "/__mockup/images/hyxipower-battery-3d.png" : product.image} alt={copy(product.altNl, product.altEn)} /></div>
      <div className="sfp-dialog-content"><span className="sfp-dialog-eyebrow">{copy("SolarFast · oplossingen", "SolarFast · solutions")}</span><h2>{copy(product.nl, product.en)}</h2><p className="sfp-dialog-copy">{copy(product.key === "battery" ? "Een thuisbatterij kan helpen om zelf opgewekte energie op een ander moment te gebruiken. We denken mee over hoe dat aansluit op jouw woning." : product.deckNl, product.key === "battery" ? "A home battery can help you use the energy you generate at another moment. We can explore how it might work with your home." : product.deckEn)}</p><div className="sfp-dialog-actions"><button className="sfp-cta" onClick={() => setDialogOpen(false)}>{copy("Bekijk mogelijkheden", "Explore options")} <ArrowUpRight /></button><button className="sfp-secondary" onClick={() => setDialogOpen(false)}>{copy("Verder ontdekken", "Keep exploring")}</button></div><p className="sfp-dialog-footnote">{copy("Mogelijkheden zijn afhankelijk van je woning en situatie.", "Options depend on your home and situation.")}</p></div>
    </div></div></div>}
  </section>;
}

export function Current() {
  const [lang, setLang] = useState<Language>("nl");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const nl = lang === "nl";
  const copy = (nlText: string, enText: string) => nl ? nlText : enText;
  const reduceMotion = useReducedMotion();
  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: reduceMotion ? 0 : 0.65, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  });
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = () => { setMenuOpen(false); setMoreOpen(false); };
  const navLinks = [
    ["/aanbod", copy("Aanbod", "Solutions")],
    ["/over-ons", copy("Over ons", "About us")],
  ];
  const moreLinks = [
    ["/waarom-solarfast", copy("Waarom SolarFast", "Why SolarFast")],
    ["/hoe-werkt-het", copy("Thuisbatterij uitgelegd", "How home batteries work")],
    ["/hyxipower", "HYXiPower"], ["/warmtefonds", "Warmtefonds"], ["/faq", "FAQ"],
  ];
  return <main className="sf-home">
    <header className={`sf-nav-wrap ${scrolled ? "is-scrolled" : ""}`}>
      <nav className="sf-nav" aria-label={copy("Hoofdnavigatie", "Main navigation")}>
        <button className="sf-logo-button" onClick={go} aria-label="SolarFast home"><img src="/__mockup/images/logo-black.svg" alt="SolarFast" /></button>
        <div className="sf-nav-links">{navLinks.map(([to, label]) => <button key={to} className="sf-nav-link" onClick={go}>{label}</button>)}<div className="sf-more-wrap"><button className={`sf-nav-link sf-more-trigger ${moreOpen ? "is-active" : ""}`} aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}>{copy("Meer", "More")} <ChevronDown size={14} className={moreOpen ? "sf-chevron-open" : ""} /></button>{moreOpen && <div className="sf-more-menu">{moreLinks.map(([to, label]) => <button key={to} onClick={go}>{label}<ArrowUpRight size={14} /></button>)}</div>}</div></div>
        <div className="sf-nav-actions"><div className="sf-language-toggle" role="group" aria-label={copy("Taal kiezen", "Choose language")}>{(["nl", "en"] as Language[]).map((code) => <button key={code} className={lang === code ? "is-selected" : ""} aria-pressed={lang === code} onClick={() => setLang(code)}>{code.toUpperCase()}</button>)}</div><button className="sf-nav-cta" onClick={go}>{copy("Bereken besparing", "Calculate savings")}<ArrowUpRight size={16} /></button><button className="sf-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
      </nav>
      {menuOpen && <div className="sf-mobile-menu"><div className="sf-mobile-primary">{[...navLinks, ...moreLinks].map(([to, label]) => <button key={to} onClick={go}>{label}<ArrowUpRight size={17} /></button>)}</div><div className="sf-mobile-bottom"><div className="sf-language-toggle sf-language-compact">{(["nl", "en"] as Language[]).map((code) => <button key={code} className={lang === code ? "is-selected" : ""} onClick={() => setLang(code)}>{code.toUpperCase()}</button>)}</div><button className="sf-nav-cta" onClick={go}>{copy("Bereken besparing", "Calculate savings")}<ArrowUpRight size={16} /></button></div></div>}
    </header>
    <section className="sf-hero" aria-labelledby="sf-hero-title"><img className="sf-hero-image" src="/__mockup/images/hero-coffee.png" alt={copy("Een rustig moment thuis, in een lichte keuken met uitzicht op de tuin.", "A quiet moment at home in a sunlit kitchen overlooking the garden.")} /><div className="sf-hero-shade" /><div className="sf-hero-inner"><motion.div {...reveal(0.1)} className="sf-hero-copy"><span className="sf-kicker sf-kicker-light">{copy("Energie voor hoe je leeft", "Energy for the way you live")}</span><h1 id="sf-hero-title">{copy("Goed wonen begint met slimme energie.", "Better living begins with smarter energy.")}</h1><p>{copy("Van zonnepanelen tot warmtepompen. Als groothandel én installateur leveren we wat past bij jouw huis — en jouw leven.", "From solar panels to heat pumps. As a wholesaler and installer, we supply what suits your home — and your life.")}</p><div className="sf-hero-actions"><button className="sf-pill sf-pill-yellow" onClick={go}>{copy("Ontdek ons aanbod", "Explore our offer")} <ArrowUpRight size={17} /></button><button className="sf-pill sf-pill-glass" onClick={go}>{copy("Zo werken we", "How we work")} <ArrowRight size={16} /></button></div></motion.div><motion.div {...reveal(0.34)} className="sf-hero-proof"><span className="sf-proof-number">500<span>+</span></span><span>{copy("installaties per maand", "installations every month")}</span><span className="sf-proof-rule" /><span>{copy("Eén partner. Een slimmer huis.", "One partner. A smarter home.")}</span></motion.div><a className="sf-scroll-cue" href="#oplossingen" aria-label={copy("Bekijk oplossingen", "Explore solutions")}><ArrowDown size={16} /></a></div><div className="sf-hero-caption">{copy("Thuis is waar energie tot leven komt.", "Home is where energy comes to life.")}</div></section>
    <section className="sf-trust" aria-labelledby="sf-trust-title"><div className="sf-trust-inner"><motion.div {...reveal()} className="sf-trust-copy"><span className="sf-kicker">{copy("Zorgvuldig geregeld", "Considered at every step")}</span><h2 id="sf-trust-title">{copy("Vakkundig werk. Helder geregeld.", "Expert work. Clearly delivered.")}</h2><p>{copy("Als groothandel én installateur brengen we producten, advies en uitvoering samen. Met aandacht voor kwaliteit, veiligheid en de details die ertoe doen.", "As a wholesaler and installer, we bring products, advice and installation together—with care for quality, safety and the details that matter.")}</p><div className="sf-trust-facts"><div className="sf-trust-fact"><span className="sf-trust-icon"><Building2 size={17} /></span><span className="sf-trust-fact-copy"><small>{copy("Wat we doen", "What we do")}</small><strong>{copy("Groothandel & installateur", "Wholesaler & installer")}</strong></span></div><div className="sf-trust-fact"><span className="sf-trust-icon"><MapPin size={17} /></span><span className="sf-trust-fact-copy"><small>{copy("Bezoekadres", "Visit us")}</small><strong>Amstelveen</strong></span></div></div></motion.div><motion.div {...reveal(0.12)} className="sf-credentials"><div className="sf-credentials-heading"><span>{copy("Veiligheid & vakbekwaamheid", "Safety & expertise")}</span><span className="sf-credentials-count">03</span></div><a className="sf-installq-check" href="https://installq.nl/" target="_blank" rel="noreferrer"><img src="/__mockup/images/installq.png" alt="InstallQ — Aantoonbaar beter" /><span>{copy("Controleer de erkenning van de uitvoerende installateur in het InstallQ-register.", "Check the installer carrying out your work in the InstallQ register.")}</span><MoveUpRight size={16} /></a><ul className="sf-credential-list">{["VCA", "NEN 1010", "NEN 1043"].map((credential, i) => <li className="sf-credential-row" key={credential}><span className="sf-credential-index">{String(i + 1).padStart(2, "0")}</span><strong>{credential}</strong><BadgeCheck size={18} /></li>)}</ul></motion.div></div></section>
    <ProductShowcase lang={lang} copy={copy} />
    <section className="sf-range" aria-labelledby="sf-range-title"><div className="sf-range-inner"><div className="sf-range-intro"><span className="sf-kicker">{copy("Ook voor woning en bedrijf", "For homes and businesses")}</span><h2 id="sf-range-title">{copy("Van isolatie tot energieopslag.", "From insulation to energy storage.")}</h2><p>{copy("Ontdek ook onze oplossingen voor een comfortabeler huis en slimmer energiegebruik op zakelijke locaties.", "Explore solutions for more comfortable homes and smarter energy use at business locations.")}</p><button className="sf-text-link" onClick={go}>{copy("Bekijk het hele aanbod", "Explore the full range")} <ArrowRight size={16} /></button></div><div className="sf-range-cards">{[[copy("01 · WONING", "01 · HOME"), copy("Vloer-, wand- en dakisolatie", "Floor, wall and roof insulation"), copy("Een comfortabeler huis begint bij de basis.", "A more comfortable home starts with the building envelope.")], [copy("02 · COMFORT", "02 · COMFORT"), copy("Vloerverwarming & dakrenovatie", "Underfloor heating & roof renovation"), copy("Praktische verbeteringen, afgestemd op je woning.", "Practical upgrades tailored to your home.")], [copy("03 · ZAKELIJK", "03 · BUSINESS"), copy("Commerciële batterijopslag", "Commercial battery storage"), copy("Energieopslag voor zakelijke en industriële locaties.", "Energy storage for commercial and industrial sites.")]].map(([eyebrow, title, description]) => <button className="sf-range-card" key={title} onClick={go}><span className="sf-range-card-top"><small>{eyebrow}</small><MoveUpRight size={17} /></span><strong>{title}</strong><span>{description}</span></button>)}</div></div></section>
    <section className="sf-scale"><div className="sf-scale-side"><span className="sf-kicker">{copy("Groot in aanpak. Persoonlijk in contact.", "Built to deliver. Personal by nature.")}</span><h2>{copy("Elke maand maken we honderden huizen klaar voor morgen.", "Every month, we make hundreds of homes ready for tomorrow.")}</h2><p>{copy("Met meer dan 500 installaties per maand brengen we kennis en uitvoering samen. Van het eerste advies tot de laatste controle.", "With more than 500 installations each month, we bring expertise and execution together. From first advice to final checks.")}</p><button className="sf-pill sf-pill-dark" onClick={go}>{copy("Leer SolarFast kennen", "Get to know SolarFast")} <ArrowUpRight size={17} /></button></div><div className="sf-scale-stat" aria-label={copy("Meer dan 500 installaties per maand", "More than 500 installations per month")}><div className="sf-stat-big">500<span>+</span></div><div className="sf-stat-label">{copy("installaties", "installations")}</div><div className="sf-stat-foot">{copy("elke maand opnieuw", "every single month")}</div><div className="sf-stat-mark"><Plus size={30} /></div></div></section>
    <section className="sf-approach"><div className="sf-approach-heading"><span className="sf-kicker">{copy("Geen losse eindjes", "No loose ends")}</span><h2>{copy("Eén goed plan. Alles geregeld.", "One thoughtful plan. Everything taken care of.")}</h2></div><div><div className="sf-steps">{[[copy("01 / Kennismaken", "01 / Get to know you"), copy("We luisteren naar je plannen, woning en energieverbruik.", "We listen to your plans, home and energy use.")], [copy("02 / Advies op maat", "02 / Advice that fits"), copy("Je krijgt een helder voorstel, afgestemd op wat jouw huis nodig heeft.", "You get a clear proposal, tailored to what your home needs.")], [copy("03 / Vakkundig installeren", "03 / Expert installation"), copy("Onze mensen regelen de installatie en leggen uit hoe alles werkt.", "Our team handles installation and shows you how everything works.")]].map(([title, desc], i) => <motion.article {...reveal(i * 0.1)} className="sf-step" key={title}><span className="sf-step-number">{String(i + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{desc}</p></div><MoveUpRight className="sf-step-arrow" size={19} /></motion.article>)}</div><button className="sf-text-link sf-process-link" onClick={go}>{copy("Meer over onze aanpak", "More about our approach")} <ArrowRight size={16} /></button></div></section>
    <section className="sf-cta"><div className="sf-cta-orbit" /><motion.div {...reveal()} className="sf-cta-content"><span className="sf-kicker">{copy("Een goed begin is zo gemaakt", "A good start is easy")}</span><h2>{copy("Wat past bij jouw huis?", "What suits your home?")}</h2><p>{copy("Krijg inzicht in je mogelijkheden. Begin met een vrijblijvende berekening of neem rustig contact met ons op.", "Get a clearer picture of your options. Start with a no-obligation calculation or simply get in touch.")}</p><div className="sf-hero-actions"><button className="sf-pill sf-pill-dark" onClick={go}>{copy("Bereken besparing", "Calculate savings")} <ArrowUpRight size={17} /></button><button className="sf-pill sf-pill-outline" onClick={go}>{copy("Veelgestelde vragen", "Frequently asked questions")} <ArrowRight size={16} /></button></div></motion.div><span className="sf-cta-side-note">{copy("SolarFast · energie voor thuis", "SolarFast · energy for home")}</span></section>
    <footer className="sf-footer"><div className="sf-footer-main"><div className="sf-footer-brand"><img src="/__mockup/images/logo-black.svg" alt="SolarFast" /><p>{copy("Slimmer omgaan met energie. Met een plan dat bij je past.", "A smarter way to use energy. With a plan that fits you.")}</p></div><div className="sf-footer-links"><div><span>{copy("Ontdek", "Explore")}</span><button onClick={go}>{copy("Ons aanbod", "Our offer")}</button><button onClick={go}>{copy("Bereken je besparing", "Calculate your savings")}</button><button onClick={go}>{copy("Thuisbatterij uitgelegd", "How home batteries work")}</button></div><div><span>SolarFast</span><button onClick={go}>{copy("Over ons", "About us")}</button><button onClick={go}>{copy("Waarom SolarFast", "Why SolarFast")}</button><button onClick={go}>FAQ</button></div><div><span>{copy("Meer informatie", "More information")}</span><button onClick={go}>HYXiPower</button><button onClick={go}>Warmtefonds</button></div></div></div><div className="sf-footer-bottom"><span>© {new Date().getFullYear()} SolarFast</span><a href="mailto:info@solarfast.nl">info@solarfast.nl</a><span>{copy("Energie voor een fijn thuis.", "Energy for a home that feels good.")}</span></div></footer>
  </main>;
}