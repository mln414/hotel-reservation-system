import assert from 'node:assert/strict'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import ReservationCard from '../src/components/ReservationCard/ReservationCard.jsx'
import { getReservationDisplayData, getReservationImage, applyReservationImageFallback } from '../src/utils/reservationMedia.js'
import { getHotelMainImage } from '../src/utils/hotelMedia.js'

export default function run() {
  const reservation = { id: 10, hotelId: 501, roomId: 50101, status: 'CONFIRMED', checkIn: '2026-09-15', checkOut: '2026-09-17', items: [{ roomTypeId: 50101, roomName: 'Family Loft Suite' }] }
  const stay = { reservationId: 10, hotelId: 501, hotelName: 'LankaStay Highland Mist', hotelDestination: 'Nuwara Eliya', hotelImage: '/assets/images/nuwara-eliya.png' }
  const { hotel, room } = getReservationDisplayData(reservation, [], [], [stay])
  assert.equal(hotel.name, stay.hotelName)
  assert.equal(room.name, 'Family Loft Suite')
  assert.equal(getReservationImage(hotel, room), getHotelMainImage({ mainImage: stay.hotelImage }))
  const html = renderToString(<MemoryRouter><ReservationCard reservation={reservation} hotel={hotel} room={room} /></MemoryRouter>)
  assert.match(html, /LankaStay Highland Mist/)
  assert.doesNotMatch(html, /Hotel information unavailable|data:image\/svg/)
  // A broken room photo must not take precedence over the search page's hotel photo.
  const publicHotel = { id: 301, name: 'Heritage Fort', mainImage: '/assets/images/home/heritage-fort.png' }
  assert.equal(getReservationImage(publicHotel, { mainImage: '/broken-room.png' }), getHotelMainImage(publicHotel))
  const current = { src: getReservationImage(publicHotel, { mainImage: '/room.png' }), getAttribute() { return this.src } }
  applyReservationImageFallback({ currentTarget: current }, publicHotel, { mainImage: '/room.png' })
  assert.equal(current.src, '/room.png')
  applyReservationImageFallback({ currentTarget: current }, publicHotel, { mainImage: '/room.png' })
  assert.equal(current.src, getHotelMainImage(null))
  applyReservationImageFallback({ currentTarget: current }, publicHotel, { mainImage: '/room.png' })
  assert.equal(current.src, getHotelMainImage(null))
  const unrelated = getReservationDisplayData(reservation, [], [], [{ ...stay, hotelId: 301 }])
  assert.equal(Boolean(unrelated.hotel), false)
  console.log('Reservation image/render regression tests passed')
}
