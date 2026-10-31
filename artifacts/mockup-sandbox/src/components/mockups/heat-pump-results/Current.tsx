import './_group.css'
// @ts-ignore The production component is intentionally kept as its original JSX source.
import HeatPumpResults from './HeatPumpResults.jsx'
// @ts-ignore The faithful source dependencies and static fixture remain plain JavaScript.
import { previewResult } from './PreviewData.js'

export function Current() {
  return (
    <main className="heat-pump-results-preview min-h-screen bg-[#F7F8F2] p-5 font-['Plus_Jakarta_Sans'] text-[#18382B] sm:p-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 rounded-xl border border-[#131A20]/[0.08] bg-white px-4 py-3 text-xs leading-relaxed text-[#131A20]/60">
          Voorbeeldgegevens ter illustratie; dit is geen klantresultaat of persoonlijk advies.
        </p>
        <HeatPumpResults result={previewResult} lang="nl" />
      </div>
    </main>
  )
}

export default Current