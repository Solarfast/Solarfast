---
name: VOLTRAX product-savings boundaries
description: Accuracy rules for product-specific savings estimates and combined-measure ROI
---

# Rule

Calculate a measure's savings only when the required product, home, usage, tariff, and investment inputs are supplied by the user or supported by a source. Do not fill gaps with invented defaults. Deduct subsidies only after confirmation. Keep single-measure estimates separate; when combining measures, compare the whole-home baseline with the whole-home result rather than summing standalone savings. Make tariff assumptions and excluded costs visible, and calculate CO₂ only with an approved emissions factor.

**Why:** The user's savings specification prioritizes traceable inputs, honest uncertainty, and protection against exaggerated or double-counted ROI.

**How to apply:** Before adding a product module or scenario, verify its physical inputs and financial data. If key information is absent, request it or show that the estimate is unavailable; do not infer prices, performance, subsidy, or savings.

# Airco sizing and operating-cost rule

Use an area-based W/m² guide only for the cooled area; do not derive heating capacity from it. Treat annual airco inputs as delivered thermal kWh, then estimate electricity with the model's SCOP/SEER. Compare heating only with the entered gas or direct-electric baseline. A cooling-only estimate must not require heating inputs and must show its electricity as an added cost.

**Why:** Cooling and heating loads are different, and heating output depends on the specific unit and outdoor conditions; mixing them creates misleading capacity and savings results.

**How to apply:** Keep cooling-class sizing separate from heating-model checks. If model data or a valid baseline is missing, disclose the limit instead of inventing a capacity or avoided cost.

# Airco annual-use estimates and default scenario

The optional financial/ROI calculation must use entered annual thermal demand and the selected product's verified SEER/SCOP. The user also requested an always-visible average annual-use scenario: label it as an estimate, separate it from verified product data, and use SEER 6.5 and SCOP 4.0. Cooling electricity is estimated from room cooling load at 200 equivalent full-load hours/year; heating demand uses 35/50/70 kWh-thermal/m²/year for good/average-or-unknown/poor insulation. Never present these defaults as model specifications or measured usage. Unknown insulation uses 100 W/m² for cooling sizing and must not produce a definitive model recommendation. Multi-split candidates based on supplied nominal capacities require explicit manufacturer-combination verification.

**Why:** The user explicitly asked for an average SEER/SCOP and annual heating/cooling electricity estimate without extra inputs, while still requiring clear distinction from exact product performance.

**How to apply:** Show the generic area-based scenario with its assumptions beside annual kWh, and keep ROI based on entered thermal demand and tariffs. If product sheets or supported-system data are absent, label the selected model provisional and call out the needed technical check.

# Battery flow, feed-in fees, and long-term ROI

Keep solar-to-battery charging separate from grid charging for EPEX. Battery throughput is discharged energy from both uses; it is not all energy delivered to the household. Show charge, conversion loss, household solar discharge, and market discharge as distinct quantities. Close the energy balance without creating or counting kWh twice.

For solar self-consumption and self-sufficiency, count direct PV use plus discharge from PV-charged battery energy only. Never count low-tariff grid-charged battery energy as own solar. Cap self-consumption at annual PV generation and self-sufficiency at 100%.

**Why:** The user explicitly clarified that cheap electricity stored from the grid is not solar generation or solar independence.

**How to apply:** Keep PV-charged and grid-charged battery discharge separate in API values, percentages, labels, combined calculations, and reports.

## Solar daytime estimate and battery package ROI

When hourly meter data is unavailable, estimate direct PV use from annual household consumption using the selected daytime-presence profile: 60% often home, 45% variable, 30% usually away. Cap direct use at PV production, and label the profile as an estimate rather than measured dispatch. For a solar-plus-battery payback, compare the whole-home baseline bill with the whole-home combined bill and count EPEX once; do not add standalone product paybacks.

**Why:** The user requested an understandable solar-only export estimate and a consistent combined battery-plus-solar result without allocating the same kWh or savings twice.

**How to apply:** Keep profile assumptions visible in the UI and use the same profile for solar-only and planned-solar scenarios. If no valid baseline or either investment amount is available, do not show package payback.

The main calculator must require an explicit product choice; do not preselect the home battery. Offer a clear solar-only path that does not submit or calculate a battery.

**Why:** The user explicitly corrected the flow because the battery appeared enabled by default when they wanted an option without one.

**How to apply:** New and legacy sessions must start with no confirmed product selection. A deliberate battery-capacity selection may confirm battery intent; otherwise ask users to choose solar only, battery, heat pump, or a supported combination.

When a heat pump or air conditioner is combined with a battery, split the appliance's estimated annual electricity into direct solar overlap, battery discharge, and residual grid demand. For a heat pump, allocate cheap-grid-charged battery output against demand left after the seasonal solar-overlap estimate; for an air conditioner, allocate it against the added annual household demand. Charge this portion at the user-confirmed editable default of €0.15/kWh, including conversion losses in charged input, and reduce EPEX trade value by the same discharged kWh. Cap home allocation by requested appliance demand, residual household grid demand, and the conservative EPEX cycle budget. These are annual estimates, not metered appliance attribution or hourly dispatch.

**Why:** The user clarified that heat-pump demand must visibly split into solar-overlap, cheap-charge battery delivery, and remaining grid electricity; the same modeled battery kWh cannot earn EPEX value and supply an appliance.

**How to apply:** Show each heat-pump energy source separately and report the remaining grid demand after solar and battery. Keep EPEX-traded kWh separate from home delivery, include cheap-charge costs in the bill, and share the cycle limit across solar shifting, appliance use, and trade. State that €0.15/kWh is editable and assumed, not an observed hourly tariff.

For battery ROI, reduce per-kWh feed-in costs only in proportion to the kWh of export physically avoided. A fixed annual fee does not fall when exports fall unless the supplier's contract explicitly says so and that tariff rule is entered. Use the backend's modeled remaining and saved fee values in the UI and PDF. Do not include a post-2027 saldering forecast in euros until the applicable law and supplier tariff are modeled from sourced inputs.

The standalone 2027 saldering comparison is for customers who already have solar panels: use that page's disclosed formula and the customer's entered purchase rate, export compensation, and annual feed-in fees to estimate bill impact only. Do not present this as investment ROI or connect it to battery, heat-pump, or existing savings results.

**Why:** The user requested a separate post-2027 calculator while explicitly protecting all existing calculations from changes.

**How to apply:** Keep the `/salderen-calculator` results isolated and label them as a variable-cost estimate based on entered tariff assumptions for an existing solar installation. Do not reuse the result in other product ROI calculations.

Ten-year net results may multiply modeled annual benefit by ten and subtract investment only when clearly labeled as a constant-savings projection. State that degradation, service, replacement, and tariff changes are excluded unless explicitly modeled.

**Why:** The user chose physically avoided export as the basis for dynamic-contract fee savings and also asked for the highest credible ROI. A blanket 90% reduction was not derived from the battery energy flow and could overstate returns.

**How to apply:** Keep per-kWh variable charges proportional to measured/modelled export reduction and fixed annual charges unchanged unless contract terms support a reduction. Use unrounded energy internally and round only for display; keep annual savings, fee changes, EPEX estimates, and long-term projections separable in API output, UI, and PDF.

**Terminology:** Label remaining solar export as electricity still sent to the grid after battery use. Label EPEX value as estimated dynamic battery charging/trading, separate from solar export; never call it an imbalance-market payment. **Why:** EPEX day-ahead price optimization and TenneT imbalance-market services are different mechanisms, and conflating them makes customers think stored solar is still being exported or that the battery earns balancing revenue. **How to apply:** Keep the remaining-grid-export kWh and EPEX value in separate rows in result screens and PDFs, with a short note that EPEX is a modeled estimate.

# Battery report consistency

In the customer report, use one annual net-savings total from the selected battery scenario for the headline, monthly/daily equivalents, payback, and ten-year projection. Show current contract and modeled battery contract separately. If the dynamic-vs-fixed battery difference is shown, identify it as a comparison already included in the dynamic headline, not an extra amount to add. Keep the battery's energy and financial components distinct, avoid double counting, and display “Not calculated” when required inputs are absent.

**Why:** The user requires the report to use matching contract scenarios and one traceable annual figure so customers do not overestimate savings by adding the switch comparison twice.

**How to apply:** Take every displayed amount from the same calculation output; derive payback from investment divided by that same annual net benefit, and derive the ten-year projection from annual net benefits over ten years minus total investment. Do not round intermediate values.

# User's average energy benchmarks

Use €1.55 per m³ as the user's preferred average gas-price default. For a simple customer-facing rule of thumb, 1,000 m³ gas is approximately 2,000 kWh of heat-pump electricity; model each product from its SCOP, boiler efficiency, and gas energy content instead of forcing that ratio for every model.

**Why:** The user explicitly corrected the default gas price and supplied the approximate gas-to-heat-pump-electricity comparison.

**How to apply:** Use the 2:1 figure as a plain-language average only. Preserve model-specific SCOP calculations in ROI outputs.
