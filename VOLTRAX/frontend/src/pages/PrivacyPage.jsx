import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import './SolarFastMarketing.css'

export default function PrivacyPage() {
  const { lang } = useLanguage()
  const isDutch = lang !== 'en'

  return (
    <div className="sf-brand-page sf-privacy-page min-h-[100dvh] bg-[#f7f6f0] text-[#203a2e]">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-14 sm:px-10 sm:py-20">
        <header className="mb-10 border-b border-[#244b39]/15 pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#718174]">
            SolarFast
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
            {isDutch ? 'Privacy en uw gegevens' : 'Privacy and your data'}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#59665c]">
            {isDutch
              ? 'Deze pagina beschrijft hoe de huidige website gegevens gebruikt voor berekeningen.'
              : 'This page explains how the current website uses data for estimates.'}
          </p>
        </header>

        <div className="sf-page-card sf-page-card--static space-y-8 text-sm leading-7 text-[#38473d] sm:text-base">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#203a2e]">
              {isDutch ? 'Berekeningen en taalinstelling' : 'Calculations and language setting'}
            </h2>
            <p>
              {isDutch
                ? 'De calculators verwerken de waarden die u invult in uw browser en sturen noodzakelijke gegevens naar de berekeningsserver. Resultaten van de hoofdcalculator worden tijdelijk in uw browsersessie bewaard om de rapportpagina te openen. Er is op dit moment geen account- of aanvraagformulier.'
                : 'The calculators process the values you enter in your browser and send required inputs to the calculation server. Main calculator results are temporarily stored in your browser session to open the report page. There is currently no account or quote-request form.'}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#203a2e]">
              {isDutch ? 'Website-analyse' : 'Website analytics'}
            </h2>
            <p>
              {isDutch
                ? 'De websitecode stuurt geen adres, naam, e-mailadres, telefoonnummer of vrije tekst naar analytics. Bij publicatie kan SolarFast analytics inschakelen via de Publishing-instellingen van Replit. Als die functie is ingeschakeld, kunnen paginaweergaven en algemene interactie-events worden gemeten.'
                : 'The website code does not send addresses, names, email addresses, phone numbers or free-text content to analytics. When publishing, SolarFast can enable analytics in Replit Publishing settings. If enabled, page views and general interaction events may be measured.'}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#203a2e]">
              {isDutch ? 'Toegang tot de rekentool' : 'Access to the calculator'}
            </h2>
            <p>
              {isDutch
                ? 'De website gebruikt geen activatiecodes of beheerderscodes meer. Eerder opgeslagen licentiegegevens en toegangslogs kunnen nog in de database staan, maar worden niet meer gebruikt om toegang te verlenen.'
                : 'The website no longer uses activation codes or administrator codes. Previously stored license records and access logs may remain in the database, but are no longer used to grant access.'}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#203a2e]">
              {isDutch ? 'Vragen over privacy' : 'Privacy questions'}
            </h2>
            <p>
              {isDutch
                ? 'Neem voor vragen over privacy of een verzoek over uw gegevens contact op met SolarFast via'
                : 'For privacy questions or requests concerning your data, contact SolarFast at'}{' '}
              <a className="font-semibold text-[#244b39] underline underline-offset-4" href="mailto:info@solarfast.nl">
                info@solarfast.nl
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
