import "./_group.css";
import { CombinedBeforeAfter } from "./CombinedBeforeAfter";
import { previewData } from "./PreviewData";

export function Current() {
  return (
    <main className="min-h-screen bg-white px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[1000px] rounded-3xl border border-black/[0.08] bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-black/45">
          SolarFast · combinatie
        </div>
        <h1 className="text-xl font-extrabold text-[#131A20] sm:text-2xl">
          Huidige voor- en na-vergelijking
        </h1>
        <CombinedBeforeAfter
          batteryResults={previewData.batteryResults}
          batterySavingsLow={750}
          batterySavingsHigh={980}
          batteryInvestment={7900}
          heatPumpROI={previewData.heatPumpROI}
          heatPumpSavings={950}
          heatPumpInvestment={6500}
          energyScenario={previewData.energyScenario}
          lang="nl"
        />
      </div>
    </main>
  );
}