---
name: VOLTRAX roof scanner assumptions
description: Automatic Dutch roof-model selection, open-data yield estimates, and installation limits.
---

The dakscanner must automatically select and measure roof planes; do not make manual outline drawing the primary flow. Use 3DBAG/AHN roof geometry with PDOK aerial imagery and PVGIS yield estimates so the feature does not depend on Google Cloud card verification.

**Why:** The user declined Google Cloud card verification and explicitly said the scanner must measure the roof and determine the panel count automatically.

Only include roof faces with north-clockwise azimuths from 90° through 270° (east through south to west). Exclude north-facing, northeast, and northwest planes from panel count and PVGIS.

**Why:** The user explicitly said not to place panels north-facing, while keeping east-west and south-west placements.

**How to apply:** Show each plane's compass direction, make north-up clear on the map, and do not include excluded planes in the panel layout or yield. Do not request Google Solar credentials or revert to contour drawing. Treat PVGIS production as an estimate and disclose loss, self-use, tariff, and environmental conversion assumptions wherever derived savings or impact are shown.

Automatic panel placement is geometric, not an installation plan. Near-flat roof faces are excluded from the main count because row spacing and mounting cannot be inferred. The 3D roof model may omit small obstructions and cannot establish roof capacity, wind loading, edge setbacks, access paths, mounting requirements, or ballast.

**Why:** Imagery and module specifications do not establish structural suitability or project-specific mounting requirements.

**How to apply:** Keep panel mass separate from mounting and ballast, avoid implying exact installation-ready fit, and require project-specific installer calculations for structural and mounting values. When a geometric maximum could overstate a practical count, show a separate count with a clearly labeled planning clearance; never present that clearance as a universal installation standard.

A panel layout using a 0.4 m edge buffer is only a conservative planning estimate; do not make it the headline count. Use the unbuffered geometric fit as the visible potential, and show the 0.4 m result separately. Actual edge clearances depend on the roof and mounting system.

**Why:** A generic 0.4 m setback made the primary count misleadingly low on the user's test roof, while actual mounting rules cannot be inferred from the open roof model.

**How to apply:** Present the unbuffered count as a geometric fit, the buffered count as a conservative planning variant, and neither as a guaranteed installed quantity.

When the selected 3DBAG roof model is a strong outlier against nearby, similarly sized roof models, suppress the panel count, panel layout, and yield until the roof model is reconciled.

**Why:** The user chose to hide the Eufraat 6 count rather than display an unsupported exact-model fit or a neighboring-roof estimate.

**How to apply:** Compare only nearby models with similar total roof area; if multiple peers agree and the selected count/usable area is substantially lower, mark the model inconsistent and do not present derived panel results.

Address lookup must require an address-specific query containing a house number or postcode. PDOK's fuzzy address filter can return arbitrary addresses when the query contains only a town name.

**Why:** A town-only search such as “Diemen” returned unrelated street addresses, which could lead a user to scan the wrong roof.

**How to apply:** Do not request or show suggestions for a town-only query, and invalidate any pending lookup whenever the query changes so stale suggestions cannot be selected.

Public Google Maps Street View URLs can open a panorama in a separate tab, but the Maps page response uses `X-Frame-Options: SAMEORIGIN` and cannot be embedded directly in this app. Do not present a blocked iframe as a working in-page photo.

**Why:** Direct embedding was tested while looking for a no-key street-level view; the browser is prevented from rendering the Google page cross-origin.

**How to apply:** With free imagery, keep the PDOK aerial in-app and offer a separate Google Maps Street View link; explain that in-page Google imagery needs an authorized Maps Platform embed setup and coverage varies.

PDOK raster tiles are EPSG:3857 while 3DBAG roof polygons are Dutch RD New (EPSG:28992). Do not overlay RD points by treating easting/northing as perfectly east/north-aligned Web Mercator meters; transform each point into the tile projection.

**Why:** RD grid convergence introduces a small but visible rotation mismatch against true-north-up aerial tiles, which can make panel rows look skewed on long rooflines.

**How to apply:** Convert roof outlines and panel corners from RD to WGS84/Web Mercator before drawing them over PDOK tiles; keep the address center and map tiles in the same projection.

An exact address-to-building footprint match confirms the location, not the roof-model quality or installation suitability. 3DBAG quality indicators can be low even when the building match is exact.

**Why:** Live checks of different Dutch buildings returned exact footprint matches with both strong and low 3DBAG model-quality indicators.

**How to apply:** Keep low-quality warnings visible for exact matches too. Present setback and unbuffered counts as distinct geometric estimates, never as a probability range or verified installed quantity.
