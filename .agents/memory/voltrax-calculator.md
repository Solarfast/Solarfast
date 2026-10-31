---
name: VOLTRAX EMS calculator model
description: Durable design decisions for the battery ROI/savings model (energy balance + value breakdown)
---

## Two layers, two failure modes
The calculator has (1) a physical energy balance and (2) a financial value breakdown.
Both must be internally consistent or the generated PDF/report looks "sloppy" to the user.
Past breakage came from treating them carelessly:
- Deriving direct self-consumption as `opwek − teruglevering` overestimates it for low/impossible
  export inputs → grid import collapses to 0 → battery looks useless (Step 1 = €0) and an
  export-floor hack pushed export *up* with a battery. **Never derive self-consumption from a
  user export field alone.**
- The PDF "Stap 3" once displayed the grand *total* instead of its own component, so steps
  visibly didn't add up. **Every breakdown step (web AND PDF) must be a real additive component.**

## Energy balance (STAP 1 / STAP 2) — the durable rules
- **Direct self-consumption is bounded by PV and total demand.** Positive measured annual export
  leads (`sc_direct = clamp(PV−export, 0, min(PV,V))`); when export is absent/zero, estimate overlap
  as `min(PV, 0.45×V)`. That daylight-load fallback lands near the NL norm for oversized PV and
  correctly reaches 100% of PV for a small system / large consumer.
  - Do not use a flat percentage of consumption or production for the fallback: either distorts
    self-consumption across PV-to-demand ratios. The positive measured-export input remains leading.
- **The balance must always close**: `opwek = sc_direct + export`, `verbruik = sc_direct + inkoop`,
  so `export − inkoop = opwek − verbruik`. Compute `inkoop = V − sc_direct`, `export = PV − sc_direct`.
- **Battery flow**: the user reports 350–380 equivalent charge cycles/year for the operating
  strategy. Never apply a universal residual-import percentage or treat annual grid import as the
  ceiling for all battery discharge. Keep potential total discharge, actual home delivery, market
  discharge, charge input, and losses as separate quantities; solar-to-home delivery still cannot
  exceed available PV surplus or the home's residual demand.
  - The user explicitly wants every battery scenario to include EPEX modeling. The current frontend
    confirms this assumption in its request; the API itself defaults to excluding EPEX unless its
    support flag is true. Share solar and EPEX cycles under the 380-cycle/year upper assumption.
    The existing €0.24–€0.26/kWh × 75% formula remains a model assumption; show it separately and add
    it only once, never as measured revenue or a guaranteed imbalance-market payout.
  - Use Onbalansmarkt.com as contextual evidence, not as a universal annual yield: its visible
    results vary by battery/inverter and reporting period, so do not annualize one device/day/month
    into another product's guaranteed return.
  - The 95% usable-capacity fraction and generic monthly profiles are assumptions, not verified
    HYXiPower specifications or measured customer data; expose/replace them when verified values
    are available.
  **Why:** the user says their operating strategy uses 350–380 cycles/year and wants EPEX included
  for all battery scenarios; Onbalansmarkt.com is an inspiration source, but its results are
  system- and period-specific. The prior 200-cycle base and annual-import cap understated throughput.
  **How to apply:** report the battery's cycle-based potential separately from the flow the
  household can actually use; never boost home delivery to match the potential.
- **Self-consumption percentage is derived from energy flows, with no capacity-based ceiling.**
  `sc_pct_met = sc_total / PV`; do not force results into a battery-size-derived 92–96% range.
  **Why:** that arbitrary ceiling produced near-95% figures unrelated to the household's actual
  modeled energy flows. **How to apply:** preserve physical flow bounds, distinguish this share of
  annual solar generation from self-sufficiency, and do not present annual-only timing as measured.
- `t_input` returned to the frontend is the modeled `export_kwh_zonder`. A positive entered export
  drives direct use (`PV − export`) bounded only by physical PV and total household demand; with no
  export input, use the 45% daytime-overlap estimate. Keep tiny nonzero values precise in display.
  **Why:** the 85% cap was an unsupported assumption that changed the customer's entered export.
  **How to apply:** show annual household demand beside self-sufficiency so the numerator and
  denominator are clear; keep solar-to-home battery flow separate from EPEX trading.
  - **Physical floor (the ONE case input still shifts):** export can never be below `max(0, PV−V)`
    (you can't self-consume more than total consumption). So e.g. 5400/3600 forces export ≥ 1800;
    a typed 1300 is clamped UP to 1800. Explain this to the user — it's physics, not a bug. Side
    effect: very low teruglevering → grid import ≈ 0 → battery self-consumption benefit collapses
    (this is the honest consequence of honoring the input; do NOT re-add the 0.45 cap to hide it).
  - **How to apply:** `ResultsPage.BeforeAfter` — the teruglevering row must pair, on ONE grid row,
    left `baTeruglevering` "Teruglevering aan net" (`r.t_input` kWh, = user input) ↔ right `baBatStorage`
    **"Zelf gebruikt i.p.v. teruggeleverd"** (`storedKwh = export_kwh_zonder − export_kwh_with` kWh, ↑).
    The user explicitly wants this exact before→after pairing and a kWh-only value (no €/jr) on this row.
    Keep self-used framing, not "Resterende netinjectie/teruggeleverd". The `baSelfDirect` "Direct
    zelfverbruik" row is mirrored unchanged on both sides. `baNetInjectie*` keys are now unused.

## STAP 2 market value — annual throughput, dynamic battery scenario
- For dynamic tariffs, model 300–360 additional EPEX cycles/year, separate from solar-shift cycles.
  Throughput is battery kWh × assumed cycles × 0.95; reduce the monetary value by 25%:
  throughput × €0.24–€0.26/kWh × 0.75. Do not reduce the modeled kWh or cycle count.
  A 10.6 kWh battery now shows about €544–€707/year (roughly €163 range).
- The calculator API preserves the selected contract as the current state, but always models the
  battery scenario on a dynamic tariff when a battery is selected. For a fixed current contract,
  `switch_to_dynamic_*` reports the annual/monthly difference versus the same battery on fixed tariff.
  This difference is already included in the dynamic headline total and must not be added again.
- When current contract is fixed and the battery case switches to dynamic, calculate the "before"
  bill with the current fixed-contract feed-in charge and the "after" bill without that old charge.
  State that new dynamic-provider fees default to €0 and the entered export compensation is still
  being used; do not imply those are live provider rates. Calculate savings from before-bill minus
  after-bill, then add modeled EPEX once. Keep the incremental switch difference separate.
  **Why:** Carrying a fixed contract's feed-in charge into the dynamic "after" case falsely makes it
  look as if the customer still pays it; silently assuming real provider terms would also overclaim.
  **How to apply:** Keep current-contract costs in the baseline, remove them from the dynamic case,
  and disclose the missing new-provider fee/market-rate inputs wherever the comparison is shown.
- Fixed-tariff comparison scenarios have €0 EPEX value. EPEX does not replace or get mixed into
  solar-shift savings; total annual savings add the separate solar and EPEX components once.
- EPEX throughput is not reduced by solar shifting or residual household grid imports: it represents
  the separate grid-arbitrage flow. Total modeled battery throughput includes solar discharge plus
  the midpoint EPEX flow; utilization is relative to the matching modeled annual-throughput budget,
  not a physical battery limit, efficiency, or runtime metric.
  **Why:** the denominator comes from modeled cycle assumptions, so a percentage without that context
  can mislead customers about real battery performance.
  **How to apply:** prefer showing annual throughput in kWh/year; if showing utilization, name the
  modeled budget it is relative to.
- **Self-consumption and self-sufficiency are different:** self-consumption is solar used at home
  divided by PV production; self-sufficiency is solar used at home divided by total electricity demand.
  Keep both metrics explicit in result screens and PDFs; self-sufficiency cannot exceed 100%.
- Candidate ranking uses incremental annual ROI versus the nearest smaller, lower-price option, then
  incremental payback, utilization, and the existing 10-year net-value comparison. The 10-year
  comparison horizon is not a manufacturer lifetime or warranty claim; no product-specific duration
  is currently available.
- Recommendations distinguish best financial return, improved self-sufficiency, and maximum catalog
  capacity. The financial return remains the default; maximum capacity is an explicitly non-financial
  alternative and its electrical suitability must be checked.
- **Why:** after seeing about €7/month, the owner specified 300–360 EPEX cycles/year; the former shared
  200-cycle limit and residual-home-import cap suppressed the separate dynamic-market flow.
- **Why:** the owner specified that the EPEX monetary value itself must be 25% lower than its original
  estimate. This replaces the earlier 22% reduction rather than compounding it; throughput remains unchanged.
- **How to apply:** apply the 0.75 factor once to EPEX euros in the shared calculation. Monthly values,
  totals, payback, combined ROI, and PDFs must consume those reduced API values; never apply a second
  frontend discount. Do not multiply annual EPEX throughput or value by 12; retain the dynamic-contract
  battery-scenario rule, disclose the 300–360-cycle assumption, compare switching against the same
  battery on fixed tariff, and explain the 10-year horizon without presenting it as battery lifespan.

## Financial breakdown — the durable invariant
Breakdown shows 4 steps on web (ResultsPage Block 2) AND PDF (page 2 list), but only the first
two are the BASELINE; steps 3 & 4 are informative-only:
1. `net_energy_saving_eur` (NOT `grid_import_besparing_eur` — that's gross, doesn't net export loss)
2. `ems_physics_low/high` (EPEX arbitrage)
3. `escalation_eur_low/high` (price escalation) — **INFORMATIVE, not summed**
4. `sald_protection_eur` (net-metering phase-out protection) — **INFORMATIVE, not summed**
- **Baseline rule (owner ruling, juni 2026 — overrode the old "all 4 sum to total" invariant):**
  `total_annual_{low,high} = round(bill_savings_annual) + ems_display_{low,high}` = STAP 1 + STAP 2
  ONLY. Escalation (stap 3) and saldering (stap 4) are still returned as `escalation_eur_*` /
  `sald_protection_eur` but **must NOT be added** into `total_annual`, `payback`, or net-after-10-years.
  - **Why:** owner wants a defensible baseline driven purely by current-market physics; price-rise
    and net-metering phase-out are projections, so they're shown ("Informatieve prognose — niet in
    basislijn") but never inflate the headline total / ROI.
  - **How to apply:** payback & winst10 derive from `total_annual`, so they auto-follow — don't add
    stap3/4 anywhere downstream. PDF (`PDFReport.jsx`) + web (`ResultsPage` DetailRow `info` prop,
    bilingual key `infoNotBaseline`) render stap3/4 neutral, no `+` prefix.
- EPEX savings are bounded by actual modeled throughput and apply only to dynamic tariffs.
- `net_sc_saving = battery_used×pE − lost_tv + saved_tk` (two-term, no double count).
- **teruglevertarief=0 must be respected**: frontend payload uses `parseNum(...) ?? 0.07` (NOT `|| 0.07`)
  so an explicit 0 isn't treated as falsy and overwritten by the 0.07 default.

## Validation boundary
Payback examples and random-run summaries from before throughput-bounded EPEX were introduced are
historical, not current return expectations. Re-run the financial tests after changing either the
physical energy balance or the savings assumptions; do not quote the old payback ranges.

## Terugleverkosten
Show the entered supplier fee for either contract type. Per-kWh fees decrease only in proportion to
the physically avoided export; fixed annual fees do not decrease just because a battery is added.

**Why:** the user chose a physical-export calculation rather than a blanket percentage discount;
claiming a fee saving without reduced exported kWh overstates ROI.

**How to apply:** compute the per-kWh fee after installation from the modelled remaining export and
leave annual flat fees unchanged. Keep current-contract fees visible in €/year, and do not use
contract type alone to infer whether the supplier charges a fee.

## Other constants worth keeping
`BATT_EFF=0.95`, annual throughput budget `200 cycles`, `ESCALATION_RATE 0.05` (factor 1.3207, 10yr),
`SALD_AVG_FACTOR 0.75`; no `SC_MAX` cap. EPEX margin and uncertainty assumptions are separate from
the solar self-consumption flow and must not imply value when throughput is zero.

## Battery capacity advice is not technical sizing
The capacity comparison uses annual PV, consumption and export totals plus the assumed dynamic EPEX
value. It has no hourly household profile or inverter charge/discharge limit. Larger capacities can
therefore rank better financially under the EPEX-cycle assumption even when modeled solar
self-sufficiency has already flattened. Show the annual inputs used and disclose the EPEX assumption;
do not present the result as a definitive technical size without interval data and an installer check.

**Why:** annual energy totals cannot show how much surplus and demand overlap on a given day, while
the modeled market cycles scale with battery capacity and can influence the financial ranking.

**How to apply:** keep ROI ranking distinct from self-consumption improvement; make the inputs,
dynamic-tariff assumption, and sizing limitation visible wherever a battery size is recommended.
