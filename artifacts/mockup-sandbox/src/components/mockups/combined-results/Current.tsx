import './_group.css'
import { CombinedResults } from './CombinedResults.jsx'
import { previewData } from './PreviewData.js'

export function Current() {
  return (
    <main className="min-h-screen bg-[#f7f6ef] p-5 font-['Plus_Jakarta_Sans'] text-[#131A20] sm:p-8">
      <div className="mx-auto max-w-5xl">
        <CombinedResults
          batteryResults={previewData.batteryResults}
          batteryInvestmentEur={previewData.batteryInvestmentEur}
          heatPumpROI={previewData.heatPumpROI}
          lang="nl"
        />
      </div>
    </main>
  )
}