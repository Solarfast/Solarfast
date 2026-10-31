import { ArrowRight, ArrowUpRight, BatteryCharging, PlugZap, Sun, Thermometer, Wind } from "lucide-react";
import "./_group.css";

const products = [
  { icon: Sun, nl: "Zonnepanelen", en: "Solar panels" },
  { icon: BatteryCharging, nl: "Thuisbatterijen", en: "Home batteries" },
  { icon: Thermometer, nl: "Warmtepompen", en: "Heat pumps" },
  { icon: PlugZap, nl: "Laadpalen", en: "EV chargers" },
  { icon: Wind, nl: "Airco", en: "Air conditioning" },
];

export function Current() {
  const copy = (nlText: string, enText: string) => nlText;

  return (
    <main className="sf-home">
      <section className="sf-intro" id="oplossingen">
        <div className="sf-intro-top">
          <span className="sf-kicker">{copy("Alles voor jouw energie thuis", "Everything for energy at home")}</span>
          <p>{copy(
            "Niet één product, maar het complete plaatje. We denken mee, maken het helder en zorgen dat alles samenwerkt.",
            "Not just one product, but the full picture. We think alongside you, make it clear and make sure everything works together.",
          )}</p>
        </div>
        <h2>{copy("Van dak tot oprit.", "From rooftop to driveway.")}<br />
          <em>{copy("Van idee tot installatie.", "From first thought to installation.")}</em>
        </h2>
        <div className="sf-product-list">
          {products.map(({ icon: Icon, nl, en }, index) => (
            <button className="sf-product-row" key={nl} type="button" aria-label={`${copy(nl, en)} — ${copy("bekijk mogelijkheden", "explore options")}`}>
              <span className="sf-product-index">0{index + 1}</span>
              <span className="sf-product-icon"><Icon strokeWidth={1.5} /></span>
              <span className="sf-product-name">{copy(nl, en)}</span>
              <span className="sf-product-note">{copy("Bekijk mogelijkheden", "Explore options")}</span>
              <span className="sf-product-arrow"><ArrowUpRight size={19} /></span>
            </button>
          ))}
        </div>
        <div className="sf-list-foot">
          <span>{copy("Persoonlijk advies voor jouw woning en situatie.", "Personal advice for your home and situation.")}</span>
          <button className="sf-text-link" type="button">{copy("Alle oplossingen", "All solutions")} <ArrowRight size={16} /></button>
        </div>
      </section>
    </main>
  );
}