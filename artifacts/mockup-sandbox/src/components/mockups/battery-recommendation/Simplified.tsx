import { useState } from "react";
import { ArrowRight, Battery, Check, ChevronDown, ShieldCheck, Sun } from "lucide-react";
import { products } from "./PreviewData";
import "./_group.css";

const brands = ["HYXiPower", "AlphaESS", "Dyness", "KSTAR"];

const copy = {
  recommendation: "Ons advies",
  reason: "Gekozen op basis van uw stroomverbruik en plannen.",
  backupReason: "Noodstroom is mogelijk. De installateur controleert de aansluiting en configuratie.",
  backupSelectionRequired: "Kies de HYXiPower All-in-One voor noodstroom, of schakel noodstroom uit om verder te gaan.",
  backupAlternativeNote: "Voor noodstroom zijn een bevestigde 3-faseaansluiting en een HYXiPower All-in-One nodig.",
  productRequired: "Kies een batterij om verder te gaan.",
  select: "Kies deze batterij",
  selected: "Batterij gekozen",
  continue: "Verder",
  ready: "De batterijkeuze is bevestigd.",
  backupQuestion: "Wilt u noodstroom bij een stroomstoring?",
  backupDetail: "Dan nemen we een HYXiPower All-in-One mee in het advies.",
  backupNote: "De installateur controleert de aansluiting, configuratie en welke apparaten op noodstroom kunnen werken.",
  phaseQuestion: "Uw aansluiting",
  phaseHint: "Twijfelt u? Controleer dit in de meterkast of vraag uw installateur.",
  onePhase: "1-fase",
  threePhase: "3-fase",
  phaseWarning: "Voor deze noodstroomoptie is een 3-fase aansluiting nodig. U heeft 1-fase gekozen.",
  confirmPhase: "Ik heb een 3-fase aansluiting",
  adviceLead: "HYXiPower is ons productadvies. Andere merken kunt u hieronder vergelijken.",
  calculationTitle: "Hoe bepalen we de passende batterij?",
  calculationCopy: "We kijken naar uw zonnestroom, teruglevering, stroomverbruik en plannen. Het blijft een schatting; de installateur controleert de uiteindelijke keuze.",
  financialTitle: "Financiële vergelijking",
  financialCopy: "De maatkeuze en het financiële advies blijven apart. Uw terugverdientijd en verwachte opbrengst ziet u in de financiële berekening.",
  alternatives: "Andere batterijen vergelijken",
  catalogPrice: "Catalogusprijs",
  storage: "opslag",
};

function money(value) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function modelName(product) {
  return product.model
    .replace(/All-in(?!-One)/g, "All-in-One")
    .replace(/(\d+)\.(?=\d)/g, "$1,");
}

export function Simplified() {
  const [phase, setPhase] = useState("3-phase");
  const [wantsBackup, setWantsBackup] = useState(true);
  const [activeBrand, setActiveBrand] = useState("HYXiPower");
  const [selectedId, setSelectedId] = useState("hyxi-15-9-all-in-3p");
  const [continued, setContinued] = useState(false);

  const available = products.filter((product) => product.phase === phase);
  const primary = wantsBackup
    ? (phase === "3-phase" ? products.find((product) => product.id === "hyxi-15-9-all-in-3p") : null)
    : products.find((product) => product.id === (phase === "1-phase" ? "hyxi-15-9-1p" : "hyxi-15-9-3p"));
  const alternatives = available.filter((product) => product.brand === activeBrand);
  const chosenProduct = available.find((product) => product.id === selectedId);
  const backupProductIsValid = phase === "3-phase"
    && chosenProduct?.brand === "HYXiPower"
    && chosenProduct?.backupCapable === true;
  const backupSelectionNeedsConfirmation = wantsBackup && phase === "3-phase" && !backupProductIsValid;
  const canContinue = Boolean(chosenProduct) && (!wantsBackup || backupProductIsValid);

  return (
    <main className="min-h-screen bg-[#f7f6ef] px-5 py-7 sm:px-8">
      <section className="mx-auto max-w-[980px] rounded-[28px] border border-[#131a20]/10 bg-white p-5 shadow-[0_18px_55px_rgba(19,26,32,0.08)] sm:p-8">
        <header className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fbf47b]">
            <Battery className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#131a20]/45">Stap 5 van 6</div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#131a20] sm:text-[30px]">Thuisbatterij kiezen</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#131a20]/65">{copy.adviceLead}</p>
          </div>
        </header>

        <div className="mt-7 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-4">
            <fieldset>
              <legend className="text-sm font-extrabold text-[#131a20]">{copy.phaseQuestion}</legend>
              <p className="mb-3 mt-1 text-xs leading-5 text-[#131a20]/55">{copy.phaseHint}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "1-phase", label: copy.onePhase },
                  { value: "3-phase", label: copy.threePhase },
                ].map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="preview-phase"
                      checked={phase === option.value}
                      onChange={() => {
                        setPhase(option.value);
                        setActiveBrand("HYXiPower");
                        setSelectedId("");
                        setContinued(false);
                      }}
                    />
                    <span className="flex min-h-12 items-center justify-center rounded-xl border border-[#131a20]/15 bg-white px-4 py-3 text-sm font-bold text-[#131a20]/70 transition hover:border-[#131a20]/40 peer-checked:border-[#131a20] peer-checked:bg-[#131a20] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#131a20]">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className={`block cursor-pointer rounded-2xl border p-4 transition ${wantsBackup ? "border-[#d7ce31] bg-[#fffde1]" : "border-[#131a20]/12 bg-[#fbfaf5] hover:border-[#131a20]/30"}`}>
              <span className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={wantsBackup}
                  onChange={(event) => {
                    setWantsBackup(event.target.checked);
                    setContinued(false);
                  }}
                  className="mt-1 h-4 w-4 accent-[#131a20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#131a20]"
                />
                <span>
                  <span className="block text-sm font-extrabold text-[#131a20]">{copy.backupQuestion}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#131a20]/65">{copy.backupDetail}</span>
                </span>
              </span>
            </label>

            {wantsBackup && <p className="flex gap-2 px-1 text-xs leading-5 text-[#131a20]/55">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{copy.backupNote}</span>
            </p>}
          </div>

          <div>
            {wantsBackup && phase === "1-phase" ? (
              <div className="rounded-2xl border border-[#d7ce31] bg-[#fffde1] p-5 sm:p-6" role="status">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbf47b]">
                    <ShieldCheck className="h-5 w-5 text-[#131a20]" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-[#131a20]">{copy.phaseWarning}</div>
                    <p className="mt-2 text-xs leading-5 text-[#131a20]/65">{copy.phaseHint}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase("3-phase");
                        setActiveBrand("HYXiPower");
                        setSelectedId("");
                        setContinued(false);
                      }}
                      className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#131a20] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#29343c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#131a20]"
                    >
                      {copy.confirmPhase}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ) : primary ? (
              <div className="rounded-2xl border-2 border-[#131a20] bg-[#fffde1] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#131a20]/60">
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  {copy.recommendation}
                </div>
                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold leading-tight text-[#131a20] sm:text-2xl">
                      HYXiPower {wantsBackup ? "All-in-One" : "thuisbatterij"}
                    </h2>
                    <p className="mt-1 text-base font-bold text-[#131a20]/70">{formatProductStorage(primary.kWh)} opslag</p>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-[#131a20]/70">{copy.reason}</p>
                    {wantsBackup && <p className="mt-2 text-xs font-semibold leading-5 text-[#131a20]/65">{copy.backupReason}</p>}
                  </div>
                  <div className="rounded-xl bg-white/75 px-4 py-3 text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#131a20]/45">{copy.catalogPrice}</div>
                    <div className="mt-1 text-lg font-extrabold text-[#131a20]">{money(primary.price)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(primary.id);
                    setContinued(false);
                  }}
                  className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#131a20] sm:w-auto ${
                    selectedId === primary.id
                      ? "bg-[#131a20] text-white"
                      : "bg-[#fbf47b] text-[#131a20] hover:bg-[#f5ed5b]"
                  }`}
                >
                  {selectedId === primary.id ? <><Check className="h-4 w-4" aria-hidden="true" />{copy.selected}</> : <>{copy.select}<ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#131a20]/15 bg-[#fbfaf5] p-5 text-sm text-[#131a20]/70">
                Kies eerst uw aansluiting om een HYXiPower-advies te zien.
              </div>
            )}

            {backupSelectionNeedsConfirmation && (
              <p className="mt-3 rounded-xl bg-[#f2f0e8] px-4 py-3 text-xs leading-5 text-[#131a20]/65" role="alert">
                {copy.backupSelectionRequired}
              </p>
            )}
            {!wantsBackup && !chosenProduct && (
              <p className="mt-3 rounded-xl bg-[#f2f0e8] px-4 py-3 text-xs leading-5 text-[#131a20]/65" role="alert">
                {copy.productRequired}
              </p>
            )}

            <details className="group mt-3 rounded-xl border border-[#131a20]/10 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[#131a20] [&::-webkit-details-marker]:hidden">
                <span>{copy.calculationTitle}</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="space-y-2 border-t border-[#131a20]/10 px-4 py-3 text-xs leading-5 text-[#131a20]/65">
                <p>{copy.calculationCopy}</p>
                <p><strong className="text-[#131a20]">{copy.financialTitle}.</strong> {copy.financialCopy}</p>
              </div>
            </details>
          </div>
        </div>

        <section className="mt-8 border-t border-[#131a20]/10 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#131a20]">{copy.alternatives}</h2>
              <p className="mt-1 text-xs text-[#131a20]/55">Bekijk andere merken; het advies hierboven blijft HYXiPower.</p>
            </div>
            {chosenProduct && <span className="text-xs font-semibold text-[#131a20]/55">Gekozen: {modelName(chosenProduct)}</span>}
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={copy.alternatives}>
            {brands.filter((brand) => products.some((product) => product.brand === brand && product.phase === phase)).map((brand) => (
              <button
                key={brand}
                type="button"
                role="tab"
                aria-selected={activeBrand === brand}
                onClick={() => setActiveBrand(brand)}
                className={`min-h-10 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#131a20] ${
                  activeBrand === brand ? "border-[#131a20] bg-[#131a20] text-white" : "border-[#131a20]/15 bg-white text-[#131a20]/65 hover:border-[#131a20]/45"
                }`}
              >
                {brand}
                {brand === "HYXiPower" && <span className="ml-2 text-[#f5ed5b]">· advies</span>}
              </button>
            ))}
          </div>
          {wantsBackup && <p className="mb-3 text-xs leading-5 text-[#131a20]/55">{copy.backupAlternativeNote}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {alternatives.map((product) => (
              <button
                key={product.id}
                type="button"
                aria-pressed={selectedId === product.id}
                onClick={() => {
                  setSelectedId(product.id);
                  setContinued(false);
                }}
                className={`flex min-h-[88px] items-center justify-between gap-3 rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#131a20] ${
                  selectedId === product.id ? "border-[#131a20] bg-[#fffde1]" : "border-[#131a20]/12 bg-white hover:border-[#131a20]/35"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold text-[#131a20]">{product.brand} {modelName(product)}</span>
                  <span className="mt-1 block text-xs text-[#131a20]/55">{formatProductStorage(product.kWh)} {copy.storage}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-extrabold text-[#131a20]">{money(product.price)}</span>
                  {selectedId === product.id && <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-[#131a20]/60">Gekozen</span>}
                </span>
              </button>
            ))}
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-[#131a20]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-h-5 text-sm font-semibold text-[#131a20]/70" aria-live="polite">
            {continued ? copy.ready : ""}
          </p>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setContinued(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#131a20] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#29343c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#131a20] disabled:cursor-not-allowed disabled:bg-[#131a20]/20 disabled:text-[#131a20]/45"
          >
            {copy.continue}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </footer>
      </section>
    </main>
  );
}

function formatProductStorage(value) {
  return new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(value) + " kWh";
}