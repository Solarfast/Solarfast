import test from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml, getPageMetadata } from './seo.js'

test('results and unknown routes are kept out of search indexes', () => {
  assert.equal(getPageMetadata('/results', '', 'nl').noIndex, true)
  assert.equal(getPageMetadata('/not-a-real-page', '', 'nl').noIndex, true)
})

test('calculator metadata follows the selected product query', () => {
  const solar = getPageMetadata('/calculator', '?product=solar', 'nl')
  const airco = getPageMetadata('/calculator', '?product=airco', 'nl')

  assert.notEqual(solar.title, airco.title)
  assert.match(solar.description, /zonnepaneel/i)
  assert.match(airco.description, /airco|koeling/i)
})

test('HTML metadata values are escaped', () => {
  assert.equal(escapeHtml('A & B <SolarFast>'), 'A &amp; B &lt;SolarFast&gt;')
})
