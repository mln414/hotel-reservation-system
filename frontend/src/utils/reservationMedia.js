import { getHotelMainImage } from './hotelMedia.js'
import { getRoomMainImage } from './roomMedia.js'
import { getPrimaryRoomTypeId } from './reviewDomain.js'

// Only use a catalog entry or the authenticated customer's matching stay.
// Past bookings need their hotel display data even after it is unpublished.
export function getReservationDisplayData(reservation, hotels = [], rooms = [], stays = []) {
  if (!reservation) return { hotel: null, room: null }
  const stay = stays.find((item) => String(item.reservationId) === String(reservation.id)
    && String(item.hotelId) === String(reservation.hotelId))
  const catalogHotel = hotels.find((item) => String(item.id) === String(reservation.hotelId))
  const hotel = catalogHotel ? {
    ...catalogHotel,
    name: catalogHotel.name || stay?.hotelName,
    destination: catalogHotel.destination || stay?.hotelDestination,
    mainImage: getHotelMainImage(catalogHotel) !== getHotelMainImage(null)
      ? getHotelMainImage(catalogHotel) : stay?.hotelImage,
  } : (stay && {
    id: stay.hotelId, name: stay.hotelName, destination: stay.hotelDestination,
    mainImage: stay.hotelImage,
  })
  const room = rooms.find((item) => String(item.id) === String(getPrimaryRoomTypeId(reservation))
    && String(item.hotelId) === String(reservation.hotelId)) || {
    id: getPrimaryRoomTypeId(reservation), hotelId: reservation.hotelId,
    name: reservation.items?.[0]?.roomName || stay?.roomName || 'Room information unavailable',
  }
  return { hotel, room }
}

function imageCandidates(hotel, room) {
  const placeholder = getHotelMainImage(null)
  return [...new Set([getHotelMainImage(hotel), getRoomMainImage(room)]
    .filter((src) => src && src !== placeholder)), placeholder]
}

export function getReservationImage(hotel, room) {
  return imageCandidates(hotel, room)[0]
}

export function applyReservationImageFallback(event, hotel, room) {
  const images = imageCandidates(hotel, room)
  const target = event.currentTarget
  const index = images.indexOf(target.getAttribute('src'))
  // Advance to the room image, then the placeholder, without an error loop.
  if (index < images.length - 1) target.src = images[index + 1]
}
