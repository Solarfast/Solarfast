import React from 'react'
import { formatEuro, formatNumber, getCopy } from './heatPumpCopy'

export function HeatPumpSummary({ result, lang }) {
  const t = getCopy(lang)
  if (!result) return null
  const model = [result.model?.brand, result.model?.model].filter(Boolean).join(' ') || t.summaryLabel
  const paybackValid = result.paybackYears != null && result.roiPct != null &&
    Number.isFinite(Number(result.paybackYears)) && Number.isFinite(Number(result.roiPct))
  return (
    <section className="rounded-2xl border border-[#22a55d]/20 bg-[#EEF6F1] p-4 sm:p-5 font-['Plus_Jakarta_Sans'] text-[#131A20]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#16804a]">{t.summaryLabel} · {t.estimate}</div>
          <h3 className="mt-1 truncate text-base font-extrabold">{model}</h3>
          <p className="mt-1 text-xs text-[#131A20]/55">
            {formatNumber(result.annualHeatPumpElectricityKwh, lang)} {t.kwhYear}
            {result.model?.kw != null && ` · ${formatNumber(result.model.kw, lang, 1)} kW`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:min-w-[280px]">
          <div>
            <div className="text-[11px] font-semibold text-[#131A20]/50">{t.annualSavings}</div>
            <div className="mt-0.5 text-base font-extrabold text-[#16804a]">{formatEuro(result.annualSavingsEur, lang)}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#131A20]/50">{t.payback}</div>
            <div className="mt-0.5 text-base font-extrabold">{paybackValid ? `${formatNumber(result.paybackYears, lang, 1)} ${t.years}` : t.notAvailable}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeatPumpSummary