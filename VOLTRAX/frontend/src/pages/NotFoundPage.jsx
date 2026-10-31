import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import { Link } from 'react-router-dom'
import './SolarFastMarketing.css'

export default function NotFoundPage() {
  const { lang } = useLanguage()
  const isDutch = lang !== 'en'

  return (
    <div className="sf-brand-page sf-not-found-page min-h-[100dvh] bg-[#f7f6f0] text-[#203a2e]">
      <Nav />
      <main className="mx-auto flex min-h-[65vh] max-w-4xl flex-col items-start justify-center px-6 py-20 sm:px-10">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#718174]">404</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
          {isDutch ? 'Deze pagina is niet gevonden.' : 'This page could not be found.'}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-[#59665c]">
          {isDutch
            ? 'De link is mogelijk verouderd of het adres is verkeerd gespeld.'
            : 'The link may be out of date or the address may be misspelled.'}
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#244b39] px-6 text-sm font-semibold text-white transition hover:bg-[#193a2b]"
          data-testid="link-not-found-home"
        >
          {isDutch ? 'Terug naar SolarFast' : 'Back to SolarFast'}
        </Link>
      </main>
    </div>
  )
}
