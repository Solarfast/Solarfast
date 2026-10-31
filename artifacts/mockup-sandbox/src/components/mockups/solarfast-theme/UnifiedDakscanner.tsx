// @ts-nocheck
import React, { useEffect, useId, useRef, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, Check, Compass, MapPin, Search,
  ShieldCheck, Sun, TriangleAlert, X,
} from 'lucide-react'
import Nav from './_shared/Nav'
import DakscannerMap from './_shared/DakscannerMap'
import './_group.css'
import './UnifiedNav.css'
import './UnifiedDakscanner.css'

const LONGI_PANEL = Object.freeze({
  modelCode: 'LR7-54HVH-485M',
  powerWatts: 485,
  lengthMm: 1800,
  widthMm: 1134,
  thicknessMm: 30,
  weightKg: 21.6,
  installationGapMm: 20,
  footprintAreaM2: ((1800 + 20) * (1134 + 20)) / 1_000_000,
  sourceUrl: 'https://eu.longi.com/longi-solar-panels-datasheets/lr7-54hvh-480-505',
})

function parseCoordinates(wkt) {
  const match = typeof wkt === 'string' && wkt.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i)
  if (!match) return null
  const longitude = Number(match[1])
  const latitude = Number(match[2])
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null
}

function parseRdCoordinates(wkt) {
  const match = typeof wkt === 'string' && wkt.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i)
  if (!match) return null
  const easting = Number(match[1])
  const northing = Number(match[2])
  return Number.isFinite(easting) && Number.isFinite(northing) ? { easting, northing } : null
}

function number(value, digits = 0, lang = 'nl') {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return '—'
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(Number(value))
}

function euro(value, lang = 'nl') {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—'
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function scanErrorText(code, copy) {
  const messages = {
    building_not_found: copy('Geen automatisch dakmodel gevonden voor dit adres. Probeer een ander adres in Nederland.', 'No automatic roof model was found for this address. Try another address in the Netherlands.'),
    roof_model_missing: copy('Voor dit gebouw is geen bruikbaar dakmodel beschikbaar.', 'No usable roof model is available for this building.'),
    roof_data_unavailable: copy('De open dakdata zijn tijdelijk niet bereikbaar. Probeer het straks opnieuw.', 'The open roof data are temporarily unavailable. Try again shortly.'),
    production_data_unavailable: copy('Het dak is gescand, maar de jaaropbrengst kon nu niet bij PVGIS worden opgehaald.', 'The roof was scanned, but the annual yield could not be retrieved from PVGIS right now.'),
    scan_failed: copy('De automatische scan is niet gelukt. Controleer uw verbinding en probeer opnieuw.', 'The automatic scan failed. Check your connection and try again.'),
    address_coordinates_missing: copy('Voor dit adres ontbreken kaartcoördinaten. Kies een adres uit de lijst.', 'This address has no map coordinates. Choose an address from the list.'),
  }
  return messages[code] || messages.scan_failed
}

function compassDirection(azimuth, lang) {
  if (azimuth === null || azimuth === undefined || !Number.isFinite(Number(azimuth))) return '—'
  const dutch = ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW']
  const english = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round((Number(azimuth) % 360) / 22.5) % 16
  return (lang === 'nl' ? dutch : english)[index]
}

export default function UnifiedDakscanner() {
  const [lang, setLang] = useState('nl')
  const nl = lang === 'nl'
  const copy = (dutch, english) => nl ? dutch : english
  const searchId = useId()
  const resultsId = useId()
  const timer = useRef(null)
  const mapSectionRef = useRef(null)
  const sequence = useRef(0)
  const scanSequence = useRef(0)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scanError, setScanError] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [electricityRate, setElectricityRate] = useState('0.35')
  const [activeSuggestion, setActiveSuggestion] = useState(-1)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (showMap) mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showMap])

  useEffect(() => {
    const q = query.trim()
    if (!selectedAddress && q.length >= 3) {
      const requestNumber = ++sequence.current
      setSearching(true)
      setSearchError('')
      timer.current = window.setTimeout(async () => {
        try {
          if (requestNumber !== sequence.current) return
          setSuggestions([])
          setActiveSuggestion(-1)
          setSearching(false)
          setSearchError(copy('Adres zoeken is uitgeschakeld in deze mockup.', 'Address search is disabled in this mockup.'))
        } catch {
          if (requestNumber !== sequence.current) return
          setSuggestions([])
          setSearching(false)
          setSearchError(copy('Adres zoeken lukt nu niet. Controleer uw verbinding en probeer opnieuw.', 'Address search is unavailable right now. Check your connection and try again.'))
        }
      }, 260)
      return () => window.clearTimeout(timer.current)
    }
    setSearching(false)
    setSuggestions([])
    setSearchError('')
    return undefined
  }, [query, selectedAddress, nl])

  const chooseAddress = (option) => {
    sequence.current += 1
    scanSequence.current += 1
    setSelectedAddress(option)
    setQuery(option.label)
    setSuggestions([])
    setSearchError('')
    setShowMap(false)
    setScanResult(null)
    setScanError('')
    setIsScanning(false)
  }

  const clearAddress = () => {
    sequence.current += 1
    scanSequence.current += 1
    setQuery('')
    setSelectedAddress(null)
    setSuggestions([])
    setShowMap(false)
    setScanResult(null)
    setScanError('')
    setIsScanning(false)
    window.setTimeout(() => document.getElementById(searchId)?.focus(), 0)
  }

  const startRoofScan = async () => {
    if (!selectedAddress?.coordinates || !selectedAddress?.rdCoordinates) {
      setShowMap(true)
      setScanError('address_coordinates_missing')
      return
    }
    const requestNumber = ++scanSequence.current
    setShowMap(true)
    setScanResult(null)
    setScanError('')
    setIsScanning(true)
    try {
      if (requestNumber === scanSequence.current) setScanError('scan_failed')
    } finally {
      if (requestNumber === scanSequence.current) setIsScanning(false)
    }
  }

  const roofAreaM2 = scanResult?.roof_area_m2
  const panelCount = scanResult?.panel_count
  const installedCapacityKwp = scanResult?.panel_capacity_kwp
  const productionEstimate = scanResult?.production_estimate
  const annualProductionKwh = productionEstimate?.status === 'estimated' ? productionEstimate.annual_kwh : null
  const selfConsumptionKwh = productionEstimate?.status === 'estimated' ? productionEstimate.self_consumption_kwh : null
  const parsedElectricityRate = Number(String(electricityRate).replace(',', '.'))
  const validElectricityRate = electricityRate.trim() !== '' && Number.isFinite(parsedElectricityRate) && parsedElectricityRate >= 0
  const annualSavings = validElectricityRate && Number.isFinite(selfConsumptionKwh)
    ? selfConsumptionKwh * parsedElectricityRate
    : null
  const twentyYearSavings = annualSavings === null ? null : annualSavings * 20
  const co2AvoidedKg = Number.isFinite(annualProductionKwh) ? annualProductionKwh * 0.5 : null
  const treeEquivalent = co2AvoidedKg === null ? null : co2AvoidedKg / 21

  const onAddressKeyDown = (event) => {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault()
      setActiveSuggestion((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault()
      setActiveSuggestion((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault()
      chooseAddress(suggestions[activeSuggestion])
    } else if (event.key === 'Escape') {
      setSuggestions([])
    }
  }

  return (
    <main className="sf-dakscanner">
      <Nav pathname="/dakscanner" lang={lang} setLang={setLang} />
      <section className="dak-hero">
        <div className="dak-hero-grid">
          <div className="dak-hero-copy">
            <div className="dak-eyebrow"><span className="dak-eyebrow-dot" />{copy('Dakscanner · eerste indicatie', 'Roof scanner · first look')}</div>
            <h1>{copy('Uw dak.<br />Eerst goed bekeken.', 'Your roof.<br />Seen clearly first.').split('<br />').map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h1>
            <p className="dak-hero-intro">{copy(
              'Zoek uw adres. Open 3D-dakdata meten de dakvlakken automatisch en tonen hoeveel LONGi-panelen er geometrisch passen.',
              'Search your address. Open 3D roof data automatically measure the roof planes and estimate how many LONGi panels fit.',
            )}</p>
            <div className="dak-hero-proof">
              <span><Sun size={15} />{copy('PDOK-luchtfoto’s', 'PDOK aerial imagery')}</span>
              <span><Compass size={15} />{copy('Automatische 3D-dakvlakken', 'Automatic 3D roof planes')}</span>
            </div>
          </div>
          <div className="dak-hero-art" aria-hidden="true">
            <div className="dak-orbit dak-orbit-outer" />
            <div className="dak-orbit dak-orbit-inner" />
            <div className="dak-scan-center"><Sun size={39} strokeWidth={1.1} /></div>
            <span className="dak-art-label dak-art-label-top">{copy('SCAN', 'SCAN')} / 01</span>
            <span className="dak-art-label dak-art-label-bottom">52° 08′  N&nbsp;&nbsp; 5° 07′ E</span>
            <span className="dak-art-tick dak-art-tick-one" />
            <span className="dak-art-tick dak-art-tick-two" />
          </div>
        </div>
        <div className="dak-hero-baseline">
          <span>{copy('Dakmodel: 3DBAG / AHN · luchtfoto: PDOK', 'Roof model: 3DBAG / AHN · aerial image: PDOK')}</span>
          <span>OPEN DATA&nbsp; · &nbsp;GEEN GOOGLE-BETAALKAART</span>
        </div>
      </section>

      <section className="dak-workspace" aria-labelledby="dak-address-title">
        <div className="dak-workspace-heading">
          <div>
            <span className="dak-kicker">{copy('01 / Kies uw woning', '01 / Choose your home')}</span>
            <h2 id="dak-address-title">{copy('Waar mogen we kijken?', 'Where should we look?')}</h2>
            <p>{copy('Zoek uw adres; de scanner koppelt het adrespunt automatisch aan een Nederlands 3D-dakmodel.', 'Search for your address; the scanner automatically matches it to a Dutch 3D roof model.')}</p>
          </div>
          <span className="dak-privacy-note"><ShieldCheck size={16} />{copy('Open Nederlandse dakdata', 'Open Dutch roof data')}</span>
        </div>

        <div className="dak-search-panel">
          <div className="dak-search-form">
            <label htmlFor={searchId}>{copy('Nederlands adres', 'Dutch address')}</label>
            <div className={`dak-search-input-wrap ${selectedAddress ? 'has-selection' : ''}`}>
              <Search size={19} aria-hidden="true" />
              <input
                id={searchId}
                data-testid="input-dakscanner-address"
                value={query}
                type="text"
                autoComplete="off"
                placeholder={copy('Bijv. Neude 11, Utrecht', 'For example, Neude 11, Utrecht')}
                onChange={(event) => {
                  scanSequence.current += 1
                  setSelectedAddress(null)
                  setQuery(event.target.value)
                  setShowMap(false)
                  setScanResult(null)
                  setScanError('')
                  setIsScanning(false)
                }}
                onKeyDown={onAddressKeyDown}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={suggestions.length > 0}
                aria-controls={resultsId}
                aria-activedescendant={activeSuggestion >= 0 ? `${resultsId}-${activeSuggestion}` : undefined}
              />
              {searching && <span className="dak-search-loading" role="status">{copy('Zoeken', 'Searching')}</span>}
              {selectedAddress && <button className="dak-clear-button" type="button" onClick={clearAddress} aria-label={copy('Adres wissen', 'Clear address')} data-testid="button-clear-address"><X size={17} /></button>}
            </div>
            {suggestions.length > 0 && (
              <ul id={resultsId} className="dak-address-options" role="listbox" aria-label={copy('Adreskeuzes', 'Address choices')}>
                {suggestions.map((option, index) => (
                  <li key={option.id} id={`${resultsId}-${index}`} role="option" aria-selected={activeSuggestion === index}>
                    <button type="button" onClick={() => chooseAddress(option)} onMouseEnter={() => setActiveSuggestion(index)} data-testid={`button-address-suggestion-${index}`}>
                      <MapPin size={16} /><span>{option.label}</span><ArrowRight size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchError && <p className="dak-inline-error" role="alert" data-testid="status-address-search-error"><TriangleAlert size={15} />{searchError}</p>}
            {!searching && !searchError && !selectedAddress && query.trim().length >= 3 && suggestions.length === 0 && (
              <p className="dak-no-address" role="status" data-testid="status-address-not-found">{copy('Geen adres gevonden. Controleer de spelling of probeer straat en plaats.', 'No address found. Check the spelling or try street and city.')}</p>
            )}
            {query.trim().length > 0 && query.trim().length < 3 && !selectedAddress && (
              <p className="dak-field-hint">{copy('Vul minimaal 3 tekens in om adressen te zoeken.', 'Enter at least 3 characters to search addresses.')}</p>
            )}
          </div>
          <button
            type="button"
            className="dak-scan-button"
            onClick={startRoofScan}
            disabled={!selectedAddress || isScanning}
            data-testid="button-request-roof-scan"
          >
            <>{isScanning ? copy('Dak wordt geanalyseerd…', 'Analysing roof…') : copy('Scan dak automatisch', 'Scan roof automatically')}{isScanning ? <span className="dak-button-pulse" /> : <ArrowUpRight size={18} />}</>
          </button>
        </div>
        {selectedAddress && <div className="dak-selected-address"><Check size={14} />{copy('Geselecteerd adres', 'Selected address')}: <strong>{selectedAddress.label}</strong></div>}

      </section>

      {showMap && selectedAddress?.coordinates && (
        <section ref={mapSectionRef} className="dak-results" aria-labelledby="dak-results-title" data-testid="section-roof-results">
          <div className="dak-results-heading">
            <div>
              <span className="dak-kicker">{copy('02 / Automatische dakscan', '02 / Automatic roof scan')}</span>
              <h2 id="dak-results-title">{scanResult ? copy('Dakvlakken automatisch herkend.', 'Roof planes detected automatically.') : isScanning ? copy('Dak wordt geanalyseerd…', 'Analysing the roof…') : copy('Dakscan', 'Roof scan')}</h2>
              <p>{selectedAddress?.label}</p>
            </div>
            <span className="dak-preliminary-tag"><span />{copy('Modelmatige schatting', 'Model-based estimate')}</span>
          </div>

          {isScanning && (
            <div className="dak-loading-panel" role="status" data-testid="status-roof-scanning">
              <div className="dak-skeleton-map"><div className="dak-skeleton-sweep" /></div>
              <div className="dak-skeleton-copy">
                <span className="dak-skeleton-line dak-skeleton-wide" />
                <span className="dak-skeleton-line" />
                <span className="dak-skeleton-line dak-skeleton-short" />
                <p>{copy('3D-dakvlakken, LONGi-pasvorm en PVGIS-opbrengst worden opgehaald.', 'Loading 3D roof planes, LONGi fit and PVGIS yield.')}</p>
              </div>
            </div>
          )}

          {scanError && !isScanning && (
            <div className={`dak-error-panel ${scanError === 'production_data_unavailable' ? 'is-unavailable' : ''}`} role="alert" data-testid="status-roof-scan-error">
              <div className="dak-error-icon"><TriangleAlert size={18} /></div>
              <div><strong>{copy('Scan niet volledig beschikbaar', 'Scan not fully available')}</strong><p>{scanErrorText(scanError, copy)}</p></div>
              {scanError !== 'production_data_unavailable' && <button type="button" onClick={startRoofScan}>{copy('Opnieuw proberen', 'Try again')}<ArrowUpRight size={14} /></button>}
            </div>
          )}

          {scanResult && (
            <>
              <div className="dak-results-grid">
                <div className="dak-map-card">
                  <div className="dak-map-topline">
                    <span><MapPin size={14} />{copy('PDOK-luchtfoto · 3DBAG-dakvlakken', 'PDOK aerial image · 3DBAG roof planes')}</span>
                    <span>{copy('Paneelzones: oost–zuid–westgericht', 'Panel zones: east–south–west-facing')}</span>
                  </div>
                  <DakscannerMap
                    latitude={selectedAddress.coordinates.latitude}
                    longitude={selectedAddress.coordinates.longitude}
                    rdCenter={selectedAddress.rdCoordinates}
                    roofPlanes={scanResult.roof_planes}
                    address={selectedAddress.label}
                    lang={lang}
                  />
                  <div className="dak-map-foot">
                    <span>{copy('Groen: geselecteerd · amber: uitgesloten · donker: panelen. Noord is boven.', 'Green: selected · amber: excluded · dark: panels. North is up.')}</span>
                    <span>{copy('Luchtfoto: PDOK · dakmodel: 3DBAG', 'Imagery: PDOK · roof model: 3DBAG')}</span>
                  </div>
                </div>
                <div className="dak-kpi-stack">
                  <article className="dak-kpi dak-kpi-main">
                    <span className="dak-kpi-label"><Compass size={15} />{copy('Gemodelleerd dakoppervlak', 'Modelled roof surface')}</span>
                    <strong data-testid="text-roof-area">{number(roofAreaM2, 1, lang)}<small> m²</small></strong>
                    <span className="dak-kpi-note">{copy('Som van de automatisch gevonden 3D-dakvlakken.', 'Sum of automatically detected 3D roof planes.')}</span>
                  </article>
                  <article className="dak-kpi dak-kpi-secondary">
                    <span className="dak-kpi-label"><span className="dak-kpi-index">A</span>{copy('LONGi-panelen · schuine daken', 'LONGi panels · pitched roofs')}</span>
                    <strong data-testid="text-panel-count">{number(panelCount, 0, lang)}<small> {copy('panelen', 'panels')}</small></strong>
                    <span className="dak-kpi-note">{copy('Alleen oost, zuid en west. Randmarges en obstakels zijn nog niet afgetrokken.', 'East, south and west only. Roof-edge margins and obstacles are not deducted yet.')}</span>
                  </article>
                  <article className="dak-kpi dak-kpi-secondary">
                    <span className="dak-kpi-label"><Sun size={15} />{copy('Geschatte jaarproductie', 'Estimated annual production')}</span>
                    <strong data-testid="text-annual-production">{number(annualProductionKwh, 0, lang)}<small> kWh</small></strong>
                    <span className="dak-kpi-note">{productionEstimate?.status === 'estimated'
                      ? copy(`PVGIS-simulatie · ${number(installedCapacityKwp, 2, lang)} kWp`, `PVGIS simulation · ${number(installedCapacityKwp, 2, lang)} kWp`)
                      : copy('PVGIS-opbrengst tijdelijk niet beschikbaar.', 'PVGIS yield temporarily unavailable.')}</span>
                  </article>
                </div>
              </div>

              {panelCount === 0 && (
                <div className="dak-no-eligible-roof" role="status" data-testid="status-no-eligible-roof">
                  <strong>{copy('Geen gunstig gericht dakvlak gevonden.', 'No favorably oriented roof plane found.')}</strong>
                  <span>{copy('Noordgerichte en vlakke dakdelen krijgen bewust geen panelen in deze schatting.', 'North-facing and flat roof planes are intentionally excluded from this estimate.')}</span>
                </div>
              )}

              <div className="dak-tech-row">
                <div className="dak-tech-card">
                  <span className="dak-kicker">{copy('LONGi-module · 485 Wp', 'LONGi module · 485 Wp')}</span>
                  <div className="dak-panel-spec">
                    <div className="dak-panel-drawing" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
                    <div>
                      <strong data-testid="text-longi-model">{LONGI_PANEL.modelCode}</strong>
                      <p>{copy('LONGi Hi-MO X10 ·', 'LONGi Hi-MO X10 ·')} {number(LONGI_PANEL.powerWatts, 0, lang)} Wp</p>
                      <p>{number(LONGI_PANEL.lengthMm, 0, lang)} × {number(LONGI_PANEL.widthMm, 0, lang)} × {number(LONGI_PANEL.thicknessMm, 0, lang)} mm · {number(LONGI_PANEL.weightKg, 1, lang)} kg</p>
                    </div>
                  </div>
                  <div className="dak-gap-note">
                    <span>{copy('Modulemaat', 'Module dimensions')}</span><strong>{number(LONGI_PANEL.lengthMm, 0, lang)} × {number(LONGI_PANEL.widthMm, 0, lang)} mm</strong>
                    <span>{copy('Speling in de berekening', 'Gap in the estimate')}</span><strong>{number(LONGI_PANEL.installationGapMm, 0, lang)} mm</strong>
                  </div>
                  <p className="dak-small-note">{copy('Het panelgewicht is exclusief montagerails en ballast. De speling is een rekenaanname; exacte klemposities en randafstanden hangen af van het montagesysteem.', 'Panel weight excludes rails and ballast. The gap is an estimate; exact clamp positions and edge setbacks depend on the mounting system.')}</p>
                  <a href={LONGI_PANEL.sourceUrl} target="_blank" rel="noreferrer" className="dak-source-link" data-testid="link-longi-datasheet">{copy('Officiële LONGi productdata', 'Official LONGi product data')}<ArrowUpRight size={14} /></a>
                </div>
                <div className="dak-tech-card dak-roof-card">
                  <span className="dak-kicker">{copy('Automatische dakvlakken', 'Automatic roof planes')}</span>
                  <div className="dak-fact"><span>{copy('Gunstig gericht · oost–zuid–west', 'Favorable · east–south–west')}</span><strong>{number(scanResult.suitable_roof_area_m2, 1, lang)} m²</strong></div>
                  <div className="dak-fact"><span>{copy('Noordgericht · uitgesloten', 'North-facing · excluded')}</span><strong>{number(scanResult.north_facing_roof_area_m2, 1, lang)} m²</strong></div>
                  <div className="dak-fact"><span>{copy('Plat dak · niet meegeteld', 'Flat roof · excluded from count')}</span><strong>{number(scanResult.flat_roof_area_m2, 1, lang)} m²</strong></div>
                  <div className="dak-fact"><span>{copy('Paneelvermogen', 'Installed module capacity')}</span><strong>{number(installedCapacityKwp, 2, lang)} kWp</strong></div>
                  <div className="dak-fact"><span>{copy('Paneelgewicht · zonder montage', 'Panel weight · excluding mounting')}</span><strong>{number(scanResult.panel_weight_kg, 1, lang)} kg</strong></div>
                  <div className="dak-roof-plane-list">
                    {scanResult.roof_planes.map((plane, index) => (
                      <div className="dak-roof-plane-row" key={plane.id}>
                        <span><strong>{copy('Dakvlak', 'Roof plane')} {index + 1}</strong> · {number(plane.area_m2, 1, lang)} m²</span>
                        <span className={plane.suitable_for_panels ? '' : 'is-excluded'}>
                          {compassDirection(plane.azimuth_deg, lang)}{plane.azimuth_deg != null ? ` (${number(plane.azimuth_deg, 0, lang)}°)` : ''}
                          {' · '}{number(plane.tilt_deg, 1, lang)}° {copy('helling', 'tilt')}
                          {' · '}{plane.suitable_for_panels
                            ? `${number(plane.panel_count, 0, lang)} ${copy('panelen', 'panels')}`
                            : plane.exclusion_reason === 'flat_roof'
                              ? copy('plat · uitgesloten', 'flat · excluded')
                              : plane.exclusion_reason === 'north_facing'
                                ? copy('noordgericht · uitgesloten', 'north-facing · excluded')
                                : copy('richting onbekend · uitgesloten', 'orientation unknown · excluded')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="dak-small-note">
                    <a href={scanResult.data_source.url} target="_blank" rel="noreferrer">{scanResult.data_source.provider}</a>
                    {' · '}{scanResult.data_source.height_dataset}{scanResult.data_source.height_year ? ` ${scanResult.data_source.height_year}` : ''}
                    {scanResult.model_quality.lod22_rmse_m != null ? ` · RMSE ${number(scanResult.model_quality.lod22_rmse_m, 2, lang)} m` : ''}
                    {' · '}<a href={scanResult.data_source.license_url} target="_blank" rel="noreferrer">{scanResult.data_source.license}</a>
                  </p>
                </div>
              </div>

              <section className="dak-estimate-section" aria-label={copy('Indicatie van opbrengst en besparing', 'Production and savings estimate')}>
                <div className="dak-estimate-intro">
                  <span className="dak-kicker">{copy('PVGIS · indicatie', 'PVGIS · estimate')}</span>
                  <h3>{copy('Wat kan dit dak opwekken?', 'What could this roof produce?')}</h3>
                  <p>{copy('Jaaropbrengst is gesimuleerd met de dakrichting en helling. Voor de besparing gebruiken we een aanname van 65% direct eigen verbruik; vul uw stroomprijs in om die te berekenen.', 'Annual yield is simulated from roof orientation and tilt. Savings use an assumed 65% direct self-consumption; enter your electricity rate to calculate them.')}</p>
                  <div className="dak-assumption-fields">
                    <label htmlFor="dak-electricity-rate">
                      <span>{copy('Stroomprijs (aanname, aanpasbaar)', 'Electricity rate (assumption, editable)')}</span>
                      <div><b>€</b><input id="dak-electricity-rate" type="number" min="0" max="5" step="0.01" inputMode="decimal" value={electricityRate} onChange={(event) => setElectricityRate(event.target.value)} data-testid="input-electricity-rate" /><b>/kWh</b></div>
                    </label>
                  </div>
                  <p className="dak-small-note">{copy('Standaard €0,35/kWh, gebaseerd op de voorbeeldberekening; pas aan naar uw contract. Besparing telt alleen geschat direct eigen verbruik mee, niet teruglevering.', 'Default €0.35/kWh, based on the example calculation; adjust to your contract. Savings count estimated direct self-use only, not exports.')}</p>
                </div>
                <div className="dak-value-board">
                  <div className="dak-value-primary">
                    <span>{copy('Geschatte besparing op eigen verbruik', 'Estimated savings on self-use')}</span>
                    <strong data-testid="text-annual-savings">{euro(annualSavings, lang)}<small> / {copy('jaar', 'year')}</small></strong>
                    <div className="dak-value-formula">{annualSavings === null
                      ? copy('Vul uw variabele stroomprijs in.', 'Enter your variable electricity rate.')
                      : `${number(selfConsumptionKwh, 0, lang)} kWh × ${euro(parsedElectricityRate, lang)}/kWh`}</div>
                  </div>
                  <div className="dak-value-secondary">
                    <span>{copy('Eenvoudige 20-jaarsindicatie', 'Simple 20-year estimate')}</span>
                    <strong data-testid="text-twenty-year-savings">{euro(twentyYearSavings, lang)}</strong>
                    <small>{copy('Zelfde tarief en opbrengst; geen degradatie, kosten of financiering meegerekend.', 'Same rate and yield; excludes degradation, costs and financing.')}</small>
                  </div>
                  <div className="dak-value-secondary">
                    <span>{copy('Direct eigen verbruik (aanname)', 'Direct self-use (assumption)')}</span>
                    <strong>{number(productionEstimate?.self_consumption_ratio_assumed * 100, 0, lang)}<small>%</small></strong>
                    <small>{number(selfConsumptionKwh, 0, lang)} kWh/{copy('jaar', 'year')}</small>
                  </div>
                </div>
              </section>

              <section className="dak-impact-grid" aria-label={copy('Milieu-impact indicatie', 'Environmental impact estimate')}>
                <article className="dak-impact-card">
                  <span className="dak-kicker">{copy('Milieu · indicatie', 'Impact · estimate')}</span>
                  <strong data-testid="text-co2-impact">{number(co2AvoidedKg, 0, lang)}<small> kg CO₂/{copy('jaar', 'year')}</small></strong>
                  <p>{copy('Grove equivalent met een rekenfactor van 0,5 kg CO₂ per opgewekte kWh.', 'Rough equivalent using a factor of 0.5 kg CO₂ per generated kWh.')}</p>
                </article>
                <article className="dak-impact-card">
                  <span className="dak-kicker">{copy('Ter vergelijking', 'For comparison')}</span>
                  <strong data-testid="text-tree-equivalent">{number(treeEquivalent, 0, lang)}<small> {copy('bomen', 'trees')}</small></strong>
                  <p>{copy('Indicatieve equivalent bij 21 kg CO₂-opname per boom per jaar; geen gemeten resultaat.', 'Indicative equivalent at 21 kg CO₂ absorbed per tree per year; not a measured result.')}</p>
                </article>
              </section>

              <div className="dak-caution">
                <div className="dak-caution-symbol"><TriangleAlert size={18} /></div>
                <div>
                  <strong>{copy('Dit is een automatische voorinschatting, geen installatierapport.', 'This is an automatic preliminary estimate, not an installation report.')}</strong>
                  <p>{copy('Noordgerichte daken tellen bewust niet mee; oost, zuid en west wel. 3DBAG/AHN kan kleine dakkapellen, schoorstenen, dakramen, schaduw en bestaande panelen missen. De automatische pasvorm gebruikt 20 mm tussenruimte en geen dakrandmarge. Platte daken tellen niet mee omdat rijafstand en ballast afhangen van montagesysteem, wind en gebouw. Paneelgewicht is exclusief montage. Een installateur moet pasvorm, draagkracht, randafstanden en ballast controleren.', 'North-facing roofs are intentionally excluded; east, south and west are included. 3DBAG/AHN may miss small dormers, chimneys, roof windows, shade and existing panels. The automatic fit uses a 20 mm gap and no roof-edge setback. Flat roofs are excluded because row spacing and ballast depend on mounting system, wind and building. Panel weight excludes mounting. An installer must verify fit, load capacity, setbacks and ballast.')}</p>
                  {scanResult.address_match === 'nearest_building' && <p className="dak-model-warning">{copy('Het adrespunt viel buiten een gebouwcontour; het dichtstbijzijnde dakmodel is gebruikt.', 'The address point fell outside a building footprint; the nearest roof model was used.')} ({number(scanResult.address_distance_m, 1, lang)} m)</p>}
                  {(scanResult.model_quality.indicator === false || scanResult.model_quality.height_data_insufficient === true) && <p className="dak-model-warning">{copy('De bron markeert de kwaliteit van dit dakmodel als beperkt; behandel de uitkomst extra voorzichtig.', 'The source flags this roof model as lower quality; treat the result with extra caution.')}</p>}
                </div>
              </div>
              <div className="dak-result-footer">
                <span>{productionEstimate?.status === 'estimated'
                  ? copy(`Opbrengst: PVGIS · verliezen aangenomen ${number(productionEstimate.system_loss_percent_assumed, 0, lang)}%. Besparing is exclusief teruglevering.`, `Yield: PVGIS · assumed losses ${number(productionEstimate.system_loss_percent_assumed, 0, lang)}%. Savings exclude exported electricity.`)
                  : copy('Jaaropbrengst is niet beschikbaar; de besparing kan daarom niet worden berekend.', 'Annual yield is unavailable, so savings cannot be calculated.')}</span>
                <button type="button" onClick={clearAddress} data-testid="button-scan-another-home">{copy('Ander adres kiezen', 'Choose another address')}<ArrowUpRight size={14} /></button>
              </div>
            </>
          )}
        </section>
      )}

      {!showMap && (
        <section className="dak-empty-wrap" aria-label={copy('Zo werkt de dakscan', 'How the roof scan works')}>
          <div className="dak-empty-step">
            <span className="dak-step-number">01</span>
            <div><strong>{copy('Kies een adres', 'Choose an address')}</strong><p>{copy('PDOK vindt de adreslocatie.', 'PDOK finds the address location.')}</p></div>
          </div>
          <div className="dak-empty-connector"><ArrowRight size={17} /></div>
          <div className="dak-empty-step">
            <span className="dak-step-number">02</span>
            <div><strong>{copy('3D-dakmodel ophalen', 'Load 3D roof model')}</strong><p>{copy('3DBAG/AHN bepaalt automatisch dakvlakken, helling en richting.', '3DBAG/AHN automatically detects roof planes, tilt and direction.')}</p></div>
          </div>
          <div className="dak-empty-connector"><ArrowRight size={17} /></div>
          <div className="dak-empty-step">
            <span className="dak-step-number">03</span>
            <div><strong>{copy('Bekijk panelen en opbrengst', 'Review panel fit and yield')}</strong><p>{copy('LONGi-pasvorm en PVGIS-opbrengst op basis van dakvlakken.', 'LONGi fit and PVGIS yield based on roof planes.')}</p></div>
          </div>
        </section>
      )}

      <footer className="dak-footer">
        <span>{copy('SolarFast · duidelijk over wat data wel en niet vertelt.', 'SolarFast · clear about what data can and cannot tell you.')}</span>
        <a href="mailto:info@solarfast.nl">{copy('Vragen over uw dak?', 'Questions about your roof?')}<ArrowUpRight size={14} /></a>
      </footer>
    </main>
  )
}
