import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const { default: RuntimeSmokeApp } = await server.ssrLoadModule('/scripts/RuntimeSmokeApp.jsx')
  const { default: seededOffers } = await server.ssrLoadModule('/src/data/offers.js')
  const { getPublicOfferEligibility } = await server.ssrLoadModule('/src/utils/customerOffers.js')
  const home = renderToString(React.createElement(RuntimeSmokeApp, { pathname: '/' }))
  const listing = renderToString(React.createElement(RuntimeSmokeApp, { pathname: '/offers' }))
  assert.match(home, /Early Bird Escape|Family Holiday/, 'Homepage Special Offers must render a canonical public Offer')
  assert.match(listing, /Offers &amp; Packages/, 'Public Offers page must render successfully during SSR')

  // Public Hotels are loaded in a client-side effect, which renderToString intentionally
  // does not run. Exercise the canonical visibility contract directly with public-ready data.
  const offer = seededOffers.find((candidate) => candidate.id === 1)
  const publicHotel = { id: 302, name: 'LankaStay Ocean Bay', publicationStatus: 'ACTIVE', setupStatus: 'SETUP_COMPLETE' }
  const room = { id: 30201, hotelId: 302, name: 'Deluxe Ocean View Room', status: 'ACTIVE', active: true, maxGuests: 2, shortDescription: 'Ocean room', bedConfiguration: 'King Bed', mainImage: '/room.jpg' }
  const physicalRooms = [{ id: 'pr-201', hotelId: 302, roomTypeId: 30201, operationalStatus: 'AVAILABLE', status: 'AVAILABLE', condition: 'READY' }]
  const result = getPublicOfferEligibility(offer, {
    publicHotels: [publicHotel], rooms: [room], physicalRooms,
    getCurrentRoomRate: () => ({ amount: 48000, status: 'ACTIVE' }),
    date: new Date('2026-09-09T12:00:00Z'),
  })
  assert.equal(result.visible, true, 'eligible seeded Offers must pass the canonical public visibility contract')
  console.log('Canonical seeded Offers pass public visibility and both public pages render during SSR.')
} finally {
  await server.close()
}
