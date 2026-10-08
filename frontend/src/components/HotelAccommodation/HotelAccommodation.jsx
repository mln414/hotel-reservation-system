import { BedDouble, CircleCheck, Images, Ruler, Users, Waves } from 'lucide-react'
import { Link } from 'react-router'
import { useMemo } from 'react'
import usePropertyContent from '../../context/usePropertyContent.js'
import useRates from '../../context/useRates.js'
import useRooms from '../../context/useRooms.js'
import { calculateOfferDiscount, formatOfferDiscount, getBestEligibleOffer, getCurrentOffersForRoom, getEligibleOffersForStay } from '../../utils/offerEligibility.js'
import { formatLkrNumber, formatRateAmount, resolveStayRateQuote } from '../../utils/rateFormatting.js'
import { getRoomTypeCustomerVisibility, getRoomTypeDisplayImages } from '../../utils/roomDomain.js'
import { applyImageFallback, getRoomImageOrPlaceholder } from '../../utils/roomMedia.js'
import useAuthoritativeAvailability from '../../hooks/useAuthoritativeAvailability.js'
import './HotelAccommodation.css'
import './HotelAccommodationEnhancements.css'

function buildQuery(searchContext, offerId) {
  return new URLSearchParams(Object.fromEntries([
    ['checkIn', searchContext?.checkIn], ['checkOut', searchContext?.checkOut],
    ['adults', searchContext?.adults], ['children', searchContext?.children],
    ['rooms', searchContext?.requestedRooms], ['offerId', offerId],
  ].filter(([, value]) => value !== '' && value != null))).toString()
}

export default function HotelAccommodation({ hotel, searchContext }) {
  const { rooms, physicalRooms, loading: roomsLoading } = useRooms()
  const { offers } = usePropertyContent()
  const { getCurrentRoomRate, ratesLoading } = useRates()
  const hasDates = Boolean(searchContext?.hasDates)
  const requestedRooms = Number(searchContext?.requestedRooms || 1)
  const guestCount = Number(searchContext?.adults || 0) + Number(searchContext?.children || 0)
  const candidates = rooms.filter((room) => String(room.hotelId) === String(hotel.id))
  const availabilityQueries = useMemo(() => hasDates ? candidates.map((room) => ({
    hotelId: hotel.id,
    roomId: room.id,
    checkIn: searchContext.checkIn,
    checkOut: searchContext.checkOut,
    quantity: requestedRooms,
  })) : [], [hasDates, candidates, hotel.id, searchContext.checkIn, searchContext.checkOut, requestedRooms])
  const { getAvailability } = useAuthoritativeAvailability(availabilityQueries)
  const roomCards = candidates.map((room) => {
    const currentRate = getCurrentRoomRate(room.id, hasDates ? new Date(`${searchContext.checkIn}T12:00:00`) : new Date())
    const visibility = getRoomTypeCustomerVisibility({ room, hotel, physicalRooms, currentRate })
    if (!visibility.bookable) return null
    const quote = hasDates ? resolveStayRateQuote(getCurrentRoomRate, room.id, searchContext.checkIn, searchContext.checkOut, requestedRooms) : null
    const availability = hasDates ? getAvailability({ hotelId: hotel.id, roomId: room.id, checkIn: searchContext.checkIn, checkOut: searchContext.checkOut, quantity: requestedRooms }) : null
    const capacityFits = !hasDates || guestCount <= Number(room.maxGuests || room.capacity || 0) * requestedRooms
    const eligibleOffers = hasDates ? getEligibleOffersForStay(offers, room, searchContext.checkIn, searchContext.checkOut, searchContext.nights, { hotel }) : getCurrentOffersForRoom(offers, room)
    const intended = searchContext?.offerId ? eligibleOffers.find((offer) => String(offer.id) === String(searchContext.offerId)) : null
    const featuredOffer = searchContext?.offerId ? intended : getBestEligibleOffer(eligibleOffers, { subtotal: quote?.originalTotal || Number(currentRate?.amount || 0), nights: hasDates ? searchContext.nights * requestedRooms : 1 })
    const discount = quote?.complete ? calculateOfferDiscount(featuredOffer, quote.originalTotal, searchContext.nights * requestedRooms) : 0
    return { room, currentRate, quote, availability, capacityFits, featuredOffer, discount, query: buildQuery(searchContext, searchContext?.offerId || featuredOffer?.id), images: getRoomTypeDisplayImages(room) }
  }).filter(Boolean)

  return <section className="hotel-accommodation-section" id="accommodation" aria-labelledby="hotel-accommodation-title">
    <div className="hotel-accommodation-heading"><span aria-hidden="true">4</span><div><h2 id="hotel-accommodation-title">Accommodation</h2><p>Live Room Types, Rates and inventory configured for this Hotel.</p></div></div>
    {roomCards.length ? <div className="hotel-room-grid">{roomCards.map(({ room, currentRate, quote, availability, capacityFits, featuredOffer, discount, query, images }) => {
      const canReserve = (!hasDates || (quote?.complete && availability?.available !== false && capacityFits))
      return <article className="hotel-room-card" key={room.id}>
        <div className="hotel-room-image-wrap"><img src={getRoomImageOrPlaceholder(room)} onError={applyImageFallback} alt={`${room.name} at ${hotel.name}`} />{room.viewType && <span>{room.viewType}</span>}{images.length > 1 && <small className="hotel-room-gallery-count"><Images size={14} />{images.length} Photos</small>}</div>
        <div className="hotel-room-card-body"><h3>{room.name}</h3>{featuredOffer && <div className="hotel-room-offer"><strong>{formatOfferDiscount(featuredOffer)} available</strong><span>{featuredOffer.title}</span></div>}<p className="hotel-room-description">{room.shortDescription}</p>
          <dl className="hotel-room-meta"><div><Users size={16} /><dt>Capacity</dt><dd>{room.maxGuests} Guests</dd></div><div><BedDouble size={16} /><dt>Bed Type</dt><dd>{room.bedConfiguration}</dd></div>{room.roomSize > 0 && <div><Ruler size={16} /><dt>Room Size</dt><dd>{room.roomSize} m²</dd></div>}{room.viewType && <div><Waves size={16} /><dt>View</dt><dd>{room.viewType}</dd></div>}</dl>
          <ul className="hotel-room-amenities" aria-label="Room amenities">{(room.amenities || []).slice(0, 4).map((amenity) => <li key={amenity}><CircleCheck size={14} />{amenity}</li>)}</ul>
          {hasDates && <p className={`hotel-room-live-status ${canReserve ? 'is-available' : 'is-unavailable'}`}>{!capacityFits ? 'Guest count exceeds this Room Type capacity.' : !quote?.complete ? 'A Rate is not configured for every selected night.' : availability?.message || 'Checking live availability…'}</p>}
          <div className="hotel-room-card-footer"><div className="hotel-room-price"><span>{hasDates ? `${searchContext.nights} night stay` : 'From'}</span><strong>{hasDates && quote?.complete ? formatRateAmount(Math.max(0, quote.originalTotal - discount)) : currentRate ? formatRateAmount(currentRate.amount) : 'Rate unavailable'}</strong><small>{hasDates ? ` for ${requestedRooms} ${requestedRooms === 1 ? 'room' : 'rooms'}` : '/ night'}</small>{discount > 0 && <em>Save LKR {formatLkrNumber(discount)}</em>}</div><div className="hotel-room-actions"><Link className="hotel-room-button hotel-room-button--secondary" to={`/rooms/${room.id}${query ? `?${query}` : ''}`}>View Room</Link>{canReserve ? <Link className="hotel-room-button hotel-room-button--primary" to={`${hasDates ? `/booking/${room.id}` : `/rooms/${room.id}`}${query ? `?${query}` : ''}`}>{hasDates ? 'Reserve' : 'Check Availability'}</Link> : <span className="hotel-room-button hotel-room-button--disabled" aria-disabled="true">Unavailable</span>}</div></div>
        </div></article>
    })}</div> : <p className="hotel-accommodation-empty">{roomsLoading || ratesLoading ? 'Loading Room Types and Rates...' : 'No Room Types are currently bookable for this Hotel. Management can review the Room Type readiness checklist for the exact missing setup.'}</p>}
  </section>
}
