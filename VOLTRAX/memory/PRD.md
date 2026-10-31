# VOLTRAX - AlphaESS Thuisbatterij Website

## Problem Statement
Premium high-end website voor VOLTRAX, specialist in AlphaESS thuisbatterijen.
Combinatie van Quatt.io, Tesla Energy, Apple, Stripe, Rivian premium feel.
Voor verkoop van AlphaESS Smile G3 thuisbatterijen (9.3 - 55.8 kWh).

## Tech Stack
- Frontend: React + Tailwind + Framer Motion + Shadcn UI
- Backend: FastAPI + MongoDB
- Hosting: Emergent Platform

## Implemented Features
### Homepage (premium conversion-focused)
- Cinematic hero met AlphaESS battery render
- "Verdubbel uw zelfverbruik" headline
- Probleem → Oplossing storytelling
- Zonder vs Met batterij comparison
- 6 voordelen cards (zelfverbruik, kosten, onafhankelijkheid, EMS, garantie, A tot Z installatie)
- Premium product showcase (donker, cinematic)
- A tot Z installatie sectie (geen verborgen kosten, geen abonnement)
- Conversion CTA section

### Calculator (6 stappen)
1. Zonneproductie
2. Jaarverbruik
3. Teruglevering
4. Energietarieven (inkoop, teruglevering, netoptimalisatie korting)
5. Batterij capaciteit kiezen (alleen capaciteit, geen prijs)
6. Investeringsbedrag invullen + service promise

### Results Page (Energy Impact Report)
- Premium "Energy Impact Report" branding
- Zonder vs Met batterij transformatie (visual bars)
- Netonafhankelijkheid metric (gradient card)
- Jaarlijkse energiewaarde (€/jaar)
- Slimme energieoptimalisatie module (€X-€Y per maand range)
- Waar de winst vandaan komt (3 categorieën)
- CTA voor advies aanvragen

### Backend API
- POST /api/calculate - berekent met diminishing returns formula
- Realistisch zelfverbruik cap op 90% (geen onrealistische 96%)
- Slimme energieoptimalisatie (arbitrage + flex year + 10% range)
- MongoDB storage van berekeningen

## Key Design Choices
- Warm color palette: beige, off-white, charcoal, soft orange (#FF8C42)
- Fonts: Space Grotesk (headings) + Inter (body)
- Framer Motion voor alle animaties
- Glassmorphism effects op hero stat cards
- 10 jaar garantie uitbreidbaar tot 15 jaar
- Realistisch 70-90% zelfverbruik (niet "tot 96%")

## Next Action Items
- Contact formulier toevoegen voor offerte aanvraag
- Persoonlijke advies flow uitwerken
- SEO optimalisatie (meta tags, OG images)
- Reviews/testimonials sectie
