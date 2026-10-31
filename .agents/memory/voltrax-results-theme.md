---
name: Calculator result theme
description: The visual baseline for SolarFast calculation result screens
---

All calculator result screens should follow the battery result screen as their visual baseline: a consistent page canvas, charcoal summary panel, warm yellow key metrics, matching header and white detail cards. Product-specific inputs, metrics and explanatory content remain specific to the calculation.

Use one font family across the SolarFast site, at least 16 px for body copy, larger clear headings, and strong text contrast. In combined-product results, give each selected product its own impact card, then show the whole-house total after those cards. For a battery + heat-pump result, compare battery alone versus battery + heat pump; show heat-pump electricity use, battery-energy change for the home, export change, and yearly energy costs. Avoid technical breakdowns or appliance-specific battery metering.

Each product card must say in plain language what that product does for the home, alongside the measured or estimated annual impact. Avoid repeating the same model, capacity, installation price, or technical spec in both the card and its expanded details.

In battery before/after comparisons, keep the same metric labels and order on both sides, using shared rows so each before value aligns exactly with its after value. The battery product card and comparison must use the same annual solar-to-home delivery value; do not confuse it with kWh shifted away from export or EPEX throughput. **Why:** the user explicitly expects a clean side-by-side comparison and called out a product card showing zero while the battery was selected. **How to apply:** derive both displays from the same calculated battery-to-home flow, and only show zero when the energy flow truly calculates to zero.

For battery before/after results, show two side-by-side scenarios: current contract and contract with battery. Include yearly solar generation, solar self-use, direct solar use, export or solar shifted into the home, self-sufficiency, grid purchases, EPEX value, and feed-in charges. Keep the comparison visible, use actual calculated values, and do not hardcode sample savings. **Why:** the user explicitly wants customers to see the practical before/after and annual return without searching through an extra disclosure. **How to apply:** use the same clear comparison for standalone battery results and combined scenarios; label assumed EPEX value as estimated and distinguish removed current-contract fees from new fees that have not been entered.

Avoid a separate percentage-point delta when before and after percentages are already visible. **Why:** the user says this wording adds clutter. **How to apply:** show the two percentages without a redundant delta annotation.

Use genuine product photos matched to the recommended brand and model. Never substitute a similar-looking model; if its exact image is unavailable, make that clear rather than implying a match.

Confirmed product-image identity from the user: the copper-brown Weheat unit is Sparrow; the dark charcoal Weheat unit is Flint. Use the user's transparent HYXiPower 15.9 kWh photo as the consistent standalone HYXiPower product image, without a dark blend mode or black backdrop.

**Why:** the user requires readable, consistent typography, a clear per-product explanation, and trustworthy product imagery before the combined household result. The customer should see only the most important battery changes first, without being overwhelmed by technical detail.

**How to apply:** compare the same household scenario with and without the heat pump while keeping the battery. Keep each product's contribution separate from the combined household totals, use short labels, and never present whole-home battery energy as measured heat-pump consumption. Keep secondary battery costs and market detail optional.
