---
name: VOLTRAX site access
description: The user’s current access policy for the SolarFast website and calculator APIs.
---

The user requested that all activation-code and administrator-code gates be removed. Keep all website pages and calculator APIs accessible without codes. Do not reintroduce code activation or code-based admin access.

**Why:** the user changed the access requirement and asked to remove access codes completely.

**How to apply:** Keep route access and calculator endpoints ungated; remove code login UI and endpoints if encountered. Treat historical database records separately from active access behavior.
