import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const [{ default: RuntimeSmokeApp }, { default: DestinationCard }] = await Promise.all([
    server.ssrLoadModule('/scripts/RuntimeSmokeApp.jsx'),
    server.ssrLoadModule('/src/components/DestinationCard/DestinationCard.jsx'),
  ])
  const html = renderToString(React.createElement(RuntimeSmokeApp, { pathname: '/destinations' }))
  const expectedDestinations = ['Colombo', 'Negombo', 'Galle', 'Sigiriya', 'Nuwara Eliya', 'Yala', 'Kandy', 'Ella']

  assert.equal((html.match(/<article class="customer-destination-card"/g) || []).length, 8, 'all eight active Destination cards must render')
  assert.equal((html.match(/class="customer-destination-card-media"/g) || []).length, 8, 'every card must render one media wrapper')
  assert.equal((html.match(/class="customer-destination-card-body"/g) || []).length, 8, 'every card must render one visible body')
  assert.equal((html.match(/class="customer-destination-card-cta"/g) || []).length, 8, 'every card must render its Explore CTA')
  const renderedCards = html.split('<article class="customer-destination-card">').slice(1)
  expectedDestinations.forEach((name, index) => {
    const card = renderedCards[index]
    assert.match(card, /class="customer-destination-card-media"/, `${name} must render its confined media area`)
    assert.match(card, /<img [^>]*>|class="customer-destination-card-fallback"/, `${name} must render an image or fallback`)
    assert.match(card, /class="customer-destination-card-primary-theme"/, `${name} must render its primary Theme`)
    assert.match(card, new RegExp(`<h3>${name}</h3>`), `${name} must render its visible title`)
    assert.match(card, /class="customer-destination-card-description">[^<]+/, `${name} must render its shared description`)
    assert.match(card, /class="customer-destination-card-highlights"/, `${name} must render its shared Highlights`)
    assert.match(card, /class="customer-destination-card-stays(?: customer-destination-card-stays--empty)?"/, `${name} must render its public Hotel count or zero-stay message`)
    assert.match(card, new RegExp(`aria-label="Explore ${name} Destination"`), `${name} must render its Destination Details CTA`)
  })

  const missingImageData = {
    destination: { id: 'missing', slug: 'missing-image', name: 'Fallback Coast', region: 'Southern Province', shortDescription: 'The body must remain visible when media is missing.' },
    route: '/destinations/missing-image', mainImage: '', primaryTheme: { key: 'COAST', label: 'Coast & Beaches' }, secondaryThemes: [],
    highlights: ['Beach'], remainingHighlightCount: 0, publicHotelCount: 0,
  }
  const fallbackHtml = renderToString(React.createElement(MemoryRouter, null, React.createElement(DestinationCard, { data: missingImageData })))
  assert.match(fallbackHtml, /customer-destination-card-media/, 'fallback must remain inside the media wrapper')
  assert.match(fallbackHtml, /customer-destination-card-fallback/, 'missing media must render the designed fallback')
  assert.match(fallbackHtml, /customer-destination-card-body/, 'fallback must not remove or cover the card body')
  assert.match(fallbackHtml, /<h3>Fallback Coast<\/h3>/)
  assert.match(fallbackHtml, /The body must remain visible when media is missing\./)
  assert.match(fallbackHtml, /No stays listed yet/)
  assert.match(fallbackHtml, /Explore Destination/)

  const css = await readFile(new URL('../src/components/DestinationCard/DestinationCard.css', import.meta.url), 'utf8')
  assert.match(css, /\.customer-destination-card-media\s*\{[^}]*width:\s*100%;[^}]*aspect-ratio:\s*4\s*\/\s*3;[^}]*overflow:\s*hidden;[^}]*flex:\s*none;/s, 'media must be a non-flexing 4:3 normal-flow region')
  assert.match(css, /\.customer-destination-card-overlay-link\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*2;[^}]*inset:\s*0;[^}]*background:\s*transparent;/s, 'whole-card overlay must be transparent and predictably layered')
  assert.match(css, /\.customer-destination-card-body\s*\{[^}]*position:\s*relative;[^}]*display:\s*flex;[^}]*flex:\s*1 1 auto;[^}]*flex-direction:\s*column;/s, 'card body must remain a normal-flow flex column')
  assert.doesNotMatch(css, /\.customer-destination-card-media\s*\{[^}]*position:\s*absolute/s, 'media wrapper must never be absolutely positioned')

  console.log('Destination card rendered visual-structure tests passed.')
} finally {
  await server.close()
}
