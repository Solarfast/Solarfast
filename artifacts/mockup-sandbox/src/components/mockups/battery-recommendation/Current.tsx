import "./_group.css";
import { Battery } from "lucide-react";
import { products, recommendations } from "./PreviewData";

const copy = {
  batteryCatalogLabel: "Batterij kiezen",
  batteryPhaseQuestion: "Welke aansluiting heeft u?",
  phase1: "1-fase",
  phase3: "3-fase",
  batteryPhaseHint: "Kies de aansluiting die in uw meterkast zit.",
  batteryRecommendation: "Batterijopties voor uw doel",
  batteryCategoryBalancedFit: "Passende opslag",
  batteryCategoryBestReturn: "Beste rendement",
  batteryCategoryIndependence: "Meer onafhankelijkheid",
  batteryCategoryMaxStorage: "Maximale opslag",
  batteryIncrementalROI: "extra ROI",
  batteryIncrementalPayback: "terugverdientijd extra investering",
  batteryROI: "ROI",
  batteryPayback: "terugverdientijd",
  batterySelfSufficiency: "zelfvoorziening na installatie",
  batteryUtilization: "benutting",
  batteryTenYearNet: "netto over 10 jaar",
  batteryMaxStorageNote: "Capaciteitsalternatief, niet automatisch de beste financiële keuze.",
  batteryRecommendationHint: "De andere opties laten rendement, onafhankelijkheid en maximale opslag apart zien.",
  batteryCapacityFitNote: "Het advies gebruikt verwachte opwek, teruglevering en stroomvraag na plannen.",
  noPositiveBatteryRecommendation: "Geen catalogusbatterij heeft in deze schatting een positieve ROI.",
  batteryRecommendationLoading: "Batterijen vergelijken op rendement…",
  batteryRecommendationUnavailable: "De vergelijking is niet beschikbaar.",
  catalogManual: "Anders",
  catalogHint: "Kies een merk om de beschikbare modellen te bekijken.",
  productSelected: "Gekozen",
};

function formatNumber(value) {
  return new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(value || 0);
}

function formatMoney(value) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
}

function formatRate(value) {
  return new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}

export function Current() {
  const phaseProducts = products.filter((product) => product.phase === "3-phase");
  const productById = new Map(phaseProducts.map((product) => [product.id, product]));
  const recommendationById = new Map(recommendations.map((item) => [item.product_id, item]));
  const recommendedBattery = recommendations.find((item) => item.recommended);
  const recommendationChoices = [
    { key: "capacity-fit", label: copy.batteryCategoryBalancedFit, item: recommendations.find((item) => item.balanced_fit) },
    { key: "best-return", label: copy.batteryCategoryBestReturn, item: recommendedBattery },
    { key: "independence", label: copy.batteryCategoryIndependence, item: recommendations.find((item) => item.more_independent) },
    { key: "maximum-storage", label: copy.batteryCategoryMaxStorage, item: recommendations.find((item) => item.maximum_storage) },
  ].map((choice) => ({ ...choice, product: choice.item ? productById.get(choice.item.product_id) : null }))
    .filter((choice) => choice.item && choice.product);
  const visibleProducts = phaseProducts.filter((product) => product.brand === "HYXiPower");

  return (
    <main className="min-h-screen bg-[#f8f8f6] px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-[960px] rounded-3xl border border-black/[0.08] bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fffde0]">
            <Battery className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/45">Stap 5</div>
            <h1 className="text-xl font-extrabold sm:text-2xl">Thuisbatterij kiezen</h1>
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-3 text-sm font-semibold">{copy.batteryCatalogLabel}</div>
          <div className="mb-5">
            <div className="mb-1 text-sm font-semibold">{copy.batteryPhaseQuestion}</div>
            <p className="mb-3 text-xs text-black/50">{copy.batteryPhaseHint}</p>
            <div className="grid grid-cols-2 gap-2">
              {[copy.phase1, copy.phase3].map((phase, index) => (
                <div key={phase} className={`flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-sm font-bold ${index === 1 ? "border-[#22a55d] bg-[#EEF6F1]" : "border-gray-200"}`}>
                  {phase}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-[#22a55d]/20 bg-[#EEF6F1] px-4 py-4">
            <div className="mb-3 text-sm font-extrabold">{copy.batteryRecommendation}</div>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
              {recommendationChoices.map(({ key, label, item, product }) => (
                <button
                  key={key}
                  type="button"
                  className={`flex h-full min-h-[12rem] flex-col rounded-2xl border p-4 text-left sm:p-5 ${
                    key === "capacity-fit"
                      ? "border-[#d5ce32] bg-[#fffde0]"
                      : key === "best-return"
                        ? "border-[#22a55d]/45 bg-white"
                        : "border-[#131A20]/10 bg-white/70"
                  }`}
                >
                  <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    key === "capacity-fit"
                      ? "bg-[#131A20] text-[#fdf891]"
                      : key === "best-return"
                        ? "bg-[#22a55d] text-white"
                        : "bg-[#131A20]/[0.06] text-[#131A20]/75"
                  }`}>
                    {label}
                  </span>
                  <span className="mt-3 block text-sm font-extrabold leading-snug">{product.brand} {product.model}</span>
                  <span className="mt-2 block min-h-[3rem] text-xs leading-relaxed text-black/65">
                    {item.comparison_product_id ? copy.batteryIncrementalROI : copy.batteryROI} {item.incremental_roi_pct == null ? "—" : `${formatRate(item.incremental_roi_pct)}%`}
                    {" · "}{item.comparison_product_id ? copy.batteryIncrementalPayback : copy.batteryPayback} {item.incremental_payback_years == null ? "—" : `${formatNumber(item.incremental_payback_years)} jr`}
                  </span>
                  <span className="mt-2 block text-xs font-semibold text-black/65">
                    {key === "capacity-fit" || key === "independence"
                      ? `${copy.batterySelfSufficiency}: ${formatNumber(item.self_sufficiency_after_pct)}%`
                      : key === "maximum-storage"
                        ? `${formatNumber(product.kWh)} kWh · ${formatMoney(product.price)}`
                        : `${copy.batteryUtilization}: ${formatNumber(item.utilization_pct)}%`}
                  </span>
                  <span className="mt-auto block border-t border-black/[0.06] pt-3 text-xs font-semibold text-black/65">
                    {copy.batteryTenYearNet}: {formatMoney(item.ten_year_net_value_eur)}
                  </span>
                  {key === "maximum-storage" && <span className="mt-2 text-[10px] leading-relaxed text-black/50">{copy.batteryMaxStorageNote}</span>}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-black/60">{copy.batteryRecommendationHint}</p>
            <p className="mt-2 text-xs leading-relaxed text-black/55">{copy.batteryCapacityFitNote}</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Merken">
            {["HYXiPower", "AlphaESS", "Dyness", "KSTAR", "Anders"].map((brand) => (
              <span key={brand} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${brand === "HYXiPower" ? "border-[#22a55d] bg-[#EEF6F1]" : "border-gray-200 text-gray-500"}`}>
                {brand}
              </span>
            ))}
          </div>
          <p className="mb-3 mt-1 text-xs text-black/50">{copy.catalogHint}</p>
          <div className="space-y-2.5">
            {visibleProducts.map((product) => {
              const metrics = recommendationById.get(product.id);
              return (
                <div key={product.id} className="w-full rounded-2xl border-2 border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold">{product.brand} {product.model}</span>
                        {metrics?.recommended && <span className="rounded-full bg-[#22a55d] px-2 py-0.5 text-[10px] font-bold uppercase text-white">{copy.batteryCategoryBestReturn}</span>}
                        {metrics?.balanced_fit && <span className="rounded-full bg-[#131A20] px-2 py-0.5 text-[10px] font-bold uppercase text-[#fdf891]">{copy.batteryCategoryBalancedFit}</span>}
                      </div>
                      <p className="mt-1 text-xs text-black/45">{formatNumber(product.kWh)} kWh · 3-fase</p>
                      {metrics && <p className="mt-1 text-[11px] font-medium text-black/60">{copy.batteryROI}: {formatRate(metrics.incremental_roi_pct)}% · {copy.batteryUtilization}: {formatNumber(metrics.utilization_pct)}%</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-extrabold">{formatMoney(product.price)}</div>
                      {product.id === "hyxi-15-9-all-in-3p" && <div className="mt-0.5 text-[10px] font-bold text-[#22a55d]">{copy.productSelected}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}