import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Sun } from "lucide-react";
import "./ProductShowcase.css";

type Language = "NL" | "EN";
type Product = {
  key: string;
  nl: string;
  en: string;
  deckNl: string;
  deckEn: string;
  detailsNl: string;
  detailsEn: string;
  art: string;
  photo?: string;
  brand?: string;
};

const products: Product[] = [
  {
    key: "battery", nl: "Thuisbatterijen", en: "Home batteries",
    deckNl: "Meer ruimte om zelf opgewekte energie te gebruiken.",
    deckEn: "More room to use the energy you make yourself.",
    detailsNl: "Een thuisbatterij kan helpen om zelf opgewekte energie op een ander moment te gebruiken. We denken mee over hoe dat aansluit op jouw woning.",
    detailsEn: "A home battery can help you use the energy you generate at another moment. We can explore how it might work with your home.",
    art: "battery", photo: "/__mockup/images/battery-home.webp", brand: "HYXiPower",
  },
  {
    key: "solar", nl: "Zonnepanelen", en: "Solar panels",
    deckNl: "Vang het daglicht. Gebruik het op jouw moment.",
    deckEn: "Catch the daylight. Use it on your own terms.",
    detailsNl: "Ontdek wat zonnepanelen voor jouw woning kunnen betekenen. We kijken samen naar je huis, je energieverbruik en wat bij jouw situatie past.",
    detailsEn: "Explore what solar panels could mean for your home. Together, we look at your home, energy use and what fits your situation.",
    art: "solar",
  },
  {
    key: "heat", nl: "Warmtepompen", en: "Heat pumps",
    deckNl: "Een comfortabel huis, met een oplossing op maat.",
    deckEn: "A comfortable home, with a solution made to fit.",
    detailsNl: "Elke woning vraagt iets anders. Verken samen met ons welke warmtepompoplossing aansluit op je huis en woonwensen.",
    detailsEn: "Every home is different. Explore with us which heat pump solution suits your home and the way you live.",
    art: "heat", brand: "Vaillant · Weheat",
  },
  {
    key: "ev", nl: "Laadoplossingen", en: "EV charging",
    deckNl: "Opladen thuis, op een manier die bij je past.",
    deckEn: "Charging at home, in a way that works for you.",
    detailsNl: "Van de plek aan huis tot je dagelijkse ritten: samen bekijken we welke laadoplossing aansluit bij jouw situatie.",
    detailsEn: "From the spot at home to your everyday journeys: together, we can explore a charging solution that suits your needs.",
    art: "car",
  },
  {
    key: "air", nl: "Airconditioning", en: "Air conditioning",
    deckNl: "Een aangenaam binnenklimaat, door elk seizoen.",
    deckEn: "A comfortable indoor climate, through every season.",
    detailsNl: "Op zoek naar meer comfort in huis? We denken mee over de mogelijkheden voor airconditioning en de ruimtes die je wilt koelen.",
    detailsEn: "Looking for more comfort at home? We can talk through air conditioning options and the rooms you want to cool.",
    art: "air",
  },
];

function VisualScene({ art }: { art: string }) {
  if (art === "battery") {
    return <img className="sfp-visual-photo" src="/__mockup/images/battery-home.webp" alt="Thuisbatterij bij een moderne woning" />;
  }
  return (
    <div className={`sfp-scene sfp-scene-${art}`} aria-hidden="true">
      {art === "solar" && <div className="sfp-panel-grid">{Array.from({ length: 9 }, (_, i) => <span key={i} />)}</div>}
      {art === "heat" && <div className="sfp-heat-unit" />}
      {art === "car" && <div className="sfp-car-unit"><span className="sfp-car-mark" /></div>}
      {art === "air" && <div className="sfp-air-unit" />}
    </div>
  );
}

export function ProductShowcase() {
  const [language, setLanguage] = useState<Language>("NL");
  const [active, setActive] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [interest, setInterest] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const product = products[active];
  const copy = (nl: string, en: string) => language === "NL" ? nl : en;
  const total = String(products.length).padStart(2, "0");
  const current = String(active + 1).padStart(2, "0");
  const change = (step: number) => {
    setActive((index) => (index + step + products.length) % products.length);
    setInterest(false);
  };
  const openDialog = (target?: HTMLElement) => {
    triggerRef.current = target ?? document.activeElement as HTMLElement;
    setInterest(false);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!dialogOpen) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dialogOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogOpen) return;
      if (event.key === "ArrowRight") change(1);
      if (event.key === "ArrowLeft") change(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen]);

  return (
    <div className="sfp">
      <header className="sfp-header">
        <a className="sfp-wordmark" href="#oplossingen" aria-label="SolarFast home">
          <span className="sfp-sunmark"><Sun aria-hidden="true" /></span>
          <strong>solarfast</strong>
        </a>
        <nav className="sfp-header-nav" aria-label={copy("Hoofdnavigatie", "Main navigation")}>
          <a href="#oplossingen">{copy("Oplossingen", "Solutions")}</a>
          <a href="#advies">{copy("Persoonlijk advies", "Personal advice")}</a>
          <button className="sfp-lang" type="button" onClick={() => setLanguage(language === "NL" ? "EN" : "NL")} aria-label={language === "NL" ? "Switch language to English" : "Taal wijzigen naar Nederlands"}>
            <b>{language}</b><span> / {language === "NL" ? "EN" : "NL"}</span>
          </button>
        </nav>
      </header>

      <main className="sfp-main" id="oplossingen">
        <div className="sfp-overline">{copy("Energie voor thuis", "Energy for home")}</div>
        <section className="sfp-layout" aria-roledescription="carousel" aria-label={copy("Ontdek onze oplossingen", "Explore our solutions")}>
          <div className="sfp-copy sfp-entry" key={`copy-${product.key}`}>
            <span className="sfp-count"><b>{current}</b> &nbsp;/&nbsp; {total}</span>
            <h1>{language === "NL" ? <>{product.nl}<br /><em>voor jouw huis.</em></> : <>{product.en}<br /><em>for your home.</em></>}</h1>
            <p className="sfp-description">{language === "NL" ? product.deckNl : product.deckEn}</p>
            {product.brand && <div className="sfp-brands" aria-label={product.key === "battery" ? "Partner brand" : "Available brands"}>
              <span className="sfp-brands-label">{product.key === "battery" ? copy("Partner", "Partner") : copy("Merken", "Brands")}</span>
              {product.key === "battery" ? <strong>HYXiPower</strong> : <strong>Vaillant</strong>}
              {product.key !== "battery" && <><i /><strong>Weheat</strong></>}
            </div>}
            <div className="sfp-cta-row">
              <button className="sfp-cta" type="button" onClick={(event) => openDialog(event.currentTarget)}>
                {copy("Ontdek de oplossing", "Explore this solution")} <ArrowUpRight aria-hidden="true" />
              </button>
              <span className="sfp-caption">{copy("Goed advies begint met luisteren.", "Good advice starts with listening.")}</span>
            </div>
          </div>

          <div className="sfp-visual-wrap sfp-entry" key={`visual-${product.key}`}>
            <button className="sfp-visual" type="button" onClick={(event) => openDialog(event.currentTarget)} aria-label={copy(`Meer over ${product.nl}`, `More about ${product.en}`)}>
              <VisualScene art={product.art} />
              {product.art === "battery" && <span className="sfp-photo-shade" />}
              {product.art === "battery" ? (
                <span className="sfp-scene-caption">{copy("Een thuisbatterij, in context", "A home battery, in context")}</span>
              ) : (
                <span className="sfp-image-note">{copy("Energie die bij je leven past", "Energy that fits your life")}</span>
              )}
              <span className="sfp-image-index">{current} <span>/ {total}</span></span>
              <span className="sfp-visual-trigger"><ArrowUpRight aria-hidden="true" /></span>
            </button>
            <div className="sfp-carousel-controls">
              <div className="sfp-dots" role="group" aria-label={copy("Kies een oplossing", "Choose a solution")}>
                {products.map((item, index) => (
                  <button
                    className="sfp-dot"
                    key={item.key}
                    type="button"
                    aria-label={`${index + 1}: ${copy(item.nl, item.en)}`}
                    aria-current={index === active}
                    onClick={() => { setActive(index); setInterest(false); }}
                  />
                ))}
              </div>
              <div className="sfp-controls-right">
                <span className="sfp-control-label">{copy("Ontdek alle oplossingen", "Explore all solutions")}</span>
                <button className="sfp-arrow" type="button" onClick={() => change(-1)} aria-label={copy("Vorige oplossing", "Previous solution")}><ChevronLeft aria-hidden="true" /></button>
                <button className="sfp-arrow" type="button" onClick={() => change(1)} aria-label={copy("Volgende oplossing", "Next solution")}><ChevronRight aria-hidden="true" /></button>
              </div>
            </div>
          </div>
        </section>
        <footer className="sfp-footer" id="advies">
          <span className="sfp-footer-note"><Check aria-hidden="true" /> {copy("Van eerste vraag tot passende installatie.", "From first question to the right installation.")}</span>
          <span className="sfp-footer-index">SOLARFAST&nbsp;&nbsp;—&nbsp;&nbsp;{current} / {total}</span>
        </footer>
      </main>

      {dialogOpen && (
        <div className="sfp-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <div className="sfp-dialog" role="dialog" aria-modal="true" aria-labelledby="sfp-dialog-title" aria-describedby="sfp-dialog-description" ref={dialogRef}>
            <button className="sfp-dialog-close" type="button" onClick={closeDialog} ref={closeRef} aria-label={copy("Sluiten", "Close")}><span aria-hidden="true">×</span></button>
            <div className={`sfp-dialog-image sfp-dialog-image-${product.art}`}>
              {product.key === "battery"
                ? <img src="/__mockup/images/battery-home.webp" alt={copy("Thuisbatterij naast de woning", "Home battery beside a home")} />
                : <VisualScene art={product.art} />}
              <span className="sfp-dialog-kicker">{copy("Een oplossing voor jouw thuis", "A solution for your home")}</span>
            </div>
            <div className="sfp-dialog-content">
              <span className="sfp-dialog-eyebrow">{copy("SolarFast · oplossingen", "SolarFast · solutions")}</span>
              <h2 id="sfp-dialog-title">{copy(product.nl, product.en)}</h2>
              <p className="sfp-dialog-copy" id="sfp-dialog-description">{language === "NL" ? product.detailsNl : product.detailsEn}</p>
              {product.key === "battery" && <div className="sfp-partner">
                <div className="sfp-partner-copy"><span>{copy("Een partner in thuisbatterijen", "A home battery partner")}</span><strong>HYXiPower</strong></div>
                <img className="sfp-battery-render" src="/__mockup/images/hyxipower-battery-3d.png" alt={copy("HYXiPower thuisbatterij", "HYXiPower home battery")} />
                <img className="sfp-partner-logo" src="/__mockup/images/hyxipower-logo-mark.png" alt="HYXiPower" />
              </div>}
              {product.key === "heat" && <div className="sfp-partner">
                <div className="sfp-partner-copy"><span>{copy("Merken om te verkennen", "Brands to explore")}</span><strong>Vaillant &nbsp;·&nbsp; Weheat</strong></div>
              </div>}
              <div className="sfp-dialog-actions">
                <button className="sfp-cta" type="button" onClick={() => setInterest((value) => !value)}>
                  {interest ? copy("Verberg informatie", "Hide information") : copy("Hoe werkt persoonlijk advies?", "How does personal advice work?")}
                  {interest ? <ArrowLeft aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
                </button>
                <button className="sfp-secondary" type="button" onClick={closeDialog}>{copy("Verder ontdekken", "Keep exploring")}</button>
              </div>
              {interest && <p className="sfp-dialog-footnote" role="status">{copy("We beginnen bij jouw woning, wensen en vragen. Samen verkennen we wat een passende volgende stap kan zijn.", "We start with your home, your wishes and your questions. Together, we explore what a fitting next step could be.")}</p>}
              <p className="sfp-dialog-footnote">{product.key === "battery" ? copy("HYXiPower is een partner van SolarFast.", "HYXiPower is a SolarFast partner.") : copy("Mogelijkheden zijn afhankelijk van je woning en situatie.", "Options depend on your home and situation.")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}