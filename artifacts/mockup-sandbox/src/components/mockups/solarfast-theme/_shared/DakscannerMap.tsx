// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, LocateFixed, Minus, Plus } from 'lucide-react'

const TILE_SIZE = 256
function worldPixel(latitude, longitude, zoom) {
  const scale = TILE_SIZE * (2 ** zoom)
  const lat = Math.max(-85.0511, Math.min(85.0511, latitude))
  const sin = Math.sin((lat * Math.PI) / 180)
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  }
}

export default function DakscannerMap({
  latitude,
  longitude,
  rdCenter,
  roofPlanes = [],
  address,
  lang = 'nl',
}) {
  const [zoom, setZoom] = useState(19)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 0, height: 0 })
  const mapRef = useRef(null)
  const gestureRef = useRef(null)
  const nl = lang === 'nl'

  useEffect(() => {
    const element = mapRef.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Remote PDOK map tiles are intentionally disabled in this isolated baseline.
  const tiles: Array<{ key: string; src: string; left: string; top: string; valid: boolean }> = []

  const screenPlanes = useMemo(() => {
    if (!size.width || !size.height || !rdCenter) return []
    const latitudeScale = Math.max(0.01, Math.cos((latitude * Math.PI) / 180))
    const pixelsPerMeter = (TILE_SIZE * (2 ** zoom)) / (2 * Math.PI * 6_378_137 * latitudeScale)
    const project = (point) => ({
      x: size.width / 2 + (point[0] - rdCenter.easting) * pixelsPerMeter - pan.x,
      y: size.height / 2 - (point[1] - rdCenter.northing) * pixelsPerMeter - pan.y,
    })
    return roofPlanes.map((plane) => ({
      id: plane.id,
      suitable: plane.suitable_for_panels,
      outline: (plane.polygon_rd || []).map(project),
      panels: (plane.panel_polygons_rd || []).map((polygon) => polygon.map(project)),
    }))
  }, [roofPlanes, rdCenter, latitude, zoom, pan, size.width, size.height])

  const zoomBy = (delta) => {
    const nextZoom = Math.max(16, Math.min(20, zoom + delta))
    if (nextZoom === zoom) return
    const factor = 2 ** (nextZoom - zoom)
    setPan((current) => ({ x: current.x * factor, y: current.y * factor }))
    setZoom(nextZoom)
  }

  const startGesture = (event) => {
    if (event.button !== 0 || event.target.closest('[data-map-control]')) return
    event.preventDefault()
    mapRef.current.setPointerCapture(event.pointerId)
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPan: pan,
      moved: false,
    }
  }

  const moveGesture = (event) => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    const dx = event.clientX - gesture.startX
    const dy = event.clientY - gesture.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) gesture.moved = true
    if (gesture.moved) {
      setPan({ x: gesture.startPan.x + dx, y: gesture.startPan.y + dy })
    }
  }

  const endGesture = (event) => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    gestureRef.current = null
  }

  return (
    <div
      ref={mapRef}
      className="dak-map"
      role="group"
      aria-label={nl ? 'PDOK-luchtfoto met automatisch herkende dakvlakken en paneelindeling; sleep om de kaart te verplaatsen' : 'PDOK aerial image with automatically detected roof planes and panel layout; drag to move the map'}
      data-testid="dakscanner-map"
      onPointerDown={startGesture}
      onPointerMove={moveGesture}
      onPointerUp={endGesture}
      onPointerCancel={() => { gestureRef.current = null }}
    >
      <div className="dak-map-tiles" aria-hidden="true">
        {tiles.map((tile) => tile.valid && (
          <img key={tile.key} src={tile.src} alt="" draggable="false" loading="lazy"
            style={{ left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }} />
        ))}
      </div>
      <div className="dak-map-shade" aria-hidden="true" />
      {screenPlanes.length > 0 && (
        <svg className="dak-map-roof-overlay" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
          {screenPlanes.map((plane) => (
            <polygon key={`${plane.id}-roof`} className={`dak-map-roof-plane${plane.suitable ? '' : ' is-excluded'}`} points={plane.outline.map((point) => `${point.x},${point.y}`).join(' ')} />
          ))}
          {screenPlanes.flatMap((plane) => plane.panels.map((panel, index) => (
            <polygon key={`${plane.id}-panel-${index}`} className="dak-map-panel" points={panel.map((point) => `${point.x},${point.y}`).join(' ')} />
          )))}
        </svg>
      )}
      <div className="dak-map-label" title={address} data-map-control>
        <LocateFixed size={13} />{nl ? 'PDOK · 3DBAG-dakmodel' : 'PDOK · 3DBAG roof model'}
      </div>
      <div className="dak-map-controls" data-map-control>
        <button type="button" onClick={() => zoomBy(1)} disabled={zoom >= 20} aria-label={nl ? 'Kaart inzoomen' : 'Zoom in'} data-testid="button-map-zoom-in"><Plus size={16} /></button>
        <button type="button" onClick={() => zoomBy(-1)} disabled={zoom <= 16} aria-label={nl ? 'Kaart uitzoomen' : 'Zoom out'} data-testid="button-map-zoom-out"><Minus size={16} /></button>
      </div>
      <div className="dak-map-north" title={nl ? 'Noord is boven' : 'North is up'} aria-label={nl ? 'Noord is boven' : 'North is up'} data-map-control>
        <span>N</span><ArrowUp size={15} strokeWidth={2.5} />
      </div>
      <a className="dak-map-attribution" href="https://www.pdok.nl/" target="_blank" rel="noreferrer" data-map-control>
        {nl ? 'Bron: PDOK · Luchtfoto Actueel Ortho 8cm RGB' : 'Source: PDOK · Current Ortho aerial image 8cm RGB'}
      </a>
    </div>
  )
}
