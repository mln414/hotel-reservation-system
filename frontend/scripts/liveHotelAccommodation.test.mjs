import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const api = process.env.LANKASTAY_TEST_API || 'http://127.0.0.1:8080'
const load = async (path) => {
  const response = await fetch(`${api}${path}`)
  assert.equal(response.status, 200, `${path} must be available`)
  return response.json()
}

const [hotels, apiRooms, rates] = await Promise.all([
  load('/api/public/hotels'), load('/api/public/rooms'), load('/api/public/room-rates'),
])
const rooms = apiRooms.map((room) => ({
  ...room,
  shortDescription: room.description,
  maxGuests: room.maxOccupancy,
  bedConfiguration: room.bedType,
  roomSize: room.sizeSqm,
  amenities: [],
}))
const roomHref = (id) => new RegExp(`href="/rooms/${id}(?:\\?|")`)
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const { default: HotelAccommodation } = await server.ssrLoadModule('/src/components/HotelAccommodation/HotelAccommodation.jsx')
  const { default: RoomsContext } = await server.ssrLoadModule('/src/context/roomsContext.js')
  const { default: RatesContext } = await server.ssrLoadModule('/src/context/ratesContext.js')
  const { default: PropertyContentContext } = await server.ssrLoadModule('/src/context/propertyContentContext.js')

  assert.equal(hotels.length, 7, 'Only published hotels belong on public details pages')
  assert.equal(apiRooms.some((room) => room.hotelId === 101), false, 'Unpublished City Grand stays private')

  for (const hotel of hotels) {
    const ownRooms = rooms.filter((room) => String(room.hotelId) === String(hotel.id))
    const getCurrentRoomRate = (roomId) => {
      const rate = rates.find((item) => String(item.roomId) === String(roomId) && item.status === 'ACTIVE')
      return rate ? { id: rate.id, amount: Number(rate.baseNightlyRate), status: rate.status } : null
    }
    const html = renderToString(
      React.createElement(MemoryRouter, { initialEntries: [`/hotels/${hotel.id}`] },
        React.createElement(RoomsContext.Provider, { value: { rooms, physicalRooms: [] } },
          React.createElement(RatesContext.Provider, { value: { getCurrentRoomRate } },
            React.createElement(PropertyContentContext.Provider, { value: { offers: [] } },
              React.createElement(HotelAccommodation, { hotel, searchContext: { hasDates: false, requestedRooms: 1 } })
            )
          )
        )
      )
    )
    const cards = (html.match(/class="hotel-room-card"/g) || []).length
    assert.equal(cards, ownRooms.length, `${hotel.name} should render only its own Room Types`)
    for (const room of ownRooms) assert.match(html, roomHref(room.id), `${room.name} should link to its real room ID`)
    for (const room of rooms.filter((room) => String(room.hotelId) !== String(hotel.id))) {
      assert.doesNotMatch(html, roomHref(room.id), `${hotel.name} must not show room ${room.id}`)
    }
    console.log(`${hotel.id} ${hotel.name}: API ${ownRooms.length}, rendered ${cards}`)
  }
} finally {
  await server.close()
}
