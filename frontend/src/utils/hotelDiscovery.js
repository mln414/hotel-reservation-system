import { calculateNights } from './reservationDomain.js'
import { calculateOfferDiscount, getBestEligibleOffer, getEligibleOffersForStay } from './offerEligibility.js'
import { getCustomerOffers } from './customerOffers.js'
import { resolveStayRateQuote } from './rateFormatting.js'

const same = (first, second) => String(first) === String(second)
const activeRoom = (room) => room?.status === 'ACTIVE' || room?.active === true
const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function getHotelSearchContext(searchParams) {
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const adults = Math.max(1, numberOr(String(searchParams.get('adults') || '2').replace('+', ''), 2))
  const children = Math.max(0, numberOr(String(searchParams.get('children') || '0').replace('+', ''), 0))
  const requestedRooms = Math.max(1, numberOr(searchParams.get('rooms'), 1))
  const offerId = searchParams.get('offerId') || ''
  return { checkIn, checkOut, adults, children, requestedRooms, totalGuests: adults + children, offerId, hasDates: Boolean(checkIn && checkOut && checkOut > checkIn), nights: calculateNights(checkIn, checkOut) }
}

export function buildCustomerHotelCardData({ hotel, destinations, facilities, collections, rooms, physicalRooms, offers, getCurrentRoomRate, getHotelAverageRating, getHotelReviewCount, checkReservationAvailability, searchContext }) {
  const destination = destinations.find((item) => same(item.id, hotel.destinationId) && item.active) || null
  const hotelFacilities = (hotel.facilityIds || []).map((id) => facilities.find((item) => same(item.id, id) && item.active)).filter(Boolean)
  const hotelCollections = (hotel.collectionIds || []).map((id) => collections.find((item) => same(item.id, id) && item.status === 'ACTIVE')).filter(Boolean)
  const hotelRooms = rooms.filter((room) => same(room.hotelId, hotel.id) && activeRoom(room))
  const roomCandidates = hotelRooms.map((room) => {
    const rateDate = searchContext.hasDates ? new Date(`${searchContext.checkIn}T12:00:00`) : new Date()
    const rate = getCurrentRoomRate(room.id, rateDate)
    const stayRate = searchContext.hasDates ? resolveStayRateQuote(getCurrentRoomRate, room.id, searchContext.checkIn, searchContext.checkOut, searchContext.requestedRooms) : null
    const supportsGuests = Number(room.maxGuests ?? room.capacity ?? 0) * searchContext.requestedRooms >= searchContext.totalGuests
    const availability = searchContext.hasDates && supportsGuests
      ? checkReservationAvailability({ hotelId: hotel.id, roomTypeId: room.id, checkIn: searchContext.checkIn, checkOut: searchContext.checkOut, requestedQuantity: searchContext.requestedRooms })
      : null
    const sellable = Boolean(rate && Number(rate.amount) > 0 && (!searchContext.hasDates || stayRate?.complete) && supportsGuests && (!searchContext.hasDates || availability?.available !== false))
    const subtotal = searchContext.hasDates ? Number(stayRate?.originalTotal || 0) : Number(rate?.amount || 0)
    const eligibleOffers = searchContext.hasDates && sellable ? getEligibleOffersForStay(offers, room, searchContext.checkIn, searchContext.checkOut, searchContext.nights, { hotel }) : []
    const requestedOffer = searchContext.offerId ? eligibleOffers.find((offer) => same(offer.id, searchContext.offerId)) : null
    const bestOffer = searchContext.offerId ? requestedOffer : getBestEligibleOffer(eligibleOffers, { subtotal, nights: Math.max(1, searchContext.nights) * searchContext.requestedRooms })
    const discount = calculateOfferDiscount(bestOffer, subtotal, Math.max(1, searchContext.nights) * searchContext.requestedRooms)
    const finalNightRate = searchContext.hasDates ? (subtotal - discount) / Math.max(1, searchContext.nights * searchContext.requestedRooms) : Number(rate?.amount || 0)
    return { room, rate, stayRate, availability, supportsGuests, sellable, bestOffer, discount, finalNightRate }
  })
  const pricedRooms = roomCandidates.filter((item) => item.sellable).sort((first, second) => first.finalNightRate - second.finalNightRate || String(first.room.id).localeCompare(String(second.room.id)))
  const bestRoom = pricedRooms[0] || null
  const currentOffers = getCustomerOffers(offers, [hotel], hotelRooms, { physicalRooms, getCurrentRoomRate })
  const advertisedOffer = getBestEligibleOffer(currentOffers, { subtotal: Number(bestRoom?.rate?.amount || 1), nights: 1 })
  const rating = getHotelAverageRating(hotel.id)
  const reviewCount = getHotelReviewCount(hotel.id)
  return {
    hotel,
    destination,
    facilities: hotelFacilities,
    collections: hotelCollections,
    rooms: hotelRooms,
    roomCandidates,
    bestRoom,
    fromRate: bestRoom?.rate ? Number(bestRoom.rate.amount) : null,
    finalNightRate: bestRoom ? Number(bestRoom.finalNightRate) : null,
    eligibleOffer: bestRoom?.bestOffer || null,
    advertisedOffer,
    currentOffers,
    rating,
    reviewCount,
    available: searchContext.hasDates ? pricedRooms.length > 0 : true,
    hasRate: Boolean(bestRoom?.rate),
    hasSellableRooms: hotelRooms.length > 0,
    searchContext,
  }
}

export function getDiscoveryPriceBounds(items) {
  const values = items.map((item) => item.finalNightRate ?? item.fromRate).filter((value) => Number.isFinite(value) && value > 0)
  if (!values.length) return { minimum: 0, maximum: 0 }
  const floor = Math.floor(Math.min(...values) / 1000) * 1000
  const ceiling = Math.ceil(Math.max(...values) / 1000) * 1000
  return { minimum: floor, maximum: Math.max(floor + 1000, ceiling) }
}

export function filterCustomerHotels(items, filters) {
  const destinationIds = new Set((filters.destinationIds || []).map(String))
  const collectionIds = new Set((filters.collectionIds || []).map(String))
  const propertyTypes = new Set(filters.propertyTypes || [])
  const facilityIds = new Set((filters.facilityIds || []).map(String))
  const nameQuery = String(filters.nameQuery || '').trim().toLowerCase()
  return items.filter((item) => {
    const price = item.finalNightRate ?? item.fromRate
    return (!item.searchContext.hasDates || item.available)
      && (!nameQuery || `${item.hotel.name} ${item.destination?.name || ''}`.toLowerCase().includes(nameQuery))
      && (!destinationIds.size || destinationIds.has(String(item.destination?.id)))
      && (!collectionIds.size || item.collections.some((entry) => collectionIds.has(String(entry.id))))
      && (!propertyTypes.size || propertyTypes.has(item.hotel.propertyType))
      && [...facilityIds].every((id) => item.facilities.some((facility) => same(facility.id, id)))
      && (!filters.rating || (item.reviewCount > 0 && Number(item.rating) >= Number(filters.rating)))
      && (!filters.offersOnly || item.currentOffers.length > 0)
      && (filters.minimumPrice == null || price == null || price >= Number(filters.minimumPrice))
      && (filters.maximumPrice == null || price == null || price <= Number(filters.maximumPrice))
  })
}

export function sortCustomerHotels(items, sortBy = 'recommended') {
  const copy = [...items]
  const price = (item) => item.finalNightRate ?? item.fromRate ?? Number.POSITIVE_INFINITY
  if (sortBy === 'price-low-high') return copy.sort((a, b) => price(a) - price(b) || a.hotel.name.localeCompare(b.hotel.name))
  if (sortBy === 'price-high-low') return copy.sort((a, b) => price(b) - price(a) || a.hotel.name.localeCompare(b.hotel.name))
  if (sortBy === 'highest-rated') return copy.sort((a, b) => Number(b.rating || -1) - Number(a.rating || -1) || b.reviewCount - a.reviewCount || a.hotel.name.localeCompare(b.hotel.name))
  if (sortBy === 'most-reviewed') return copy.sort((a, b) => b.reviewCount - a.reviewCount || Number(b.rating || -1) - Number(a.rating || -1) || a.hotel.name.localeCompare(b.hotel.name))
  if (sortBy === 'name') return copy.sort((a, b) => a.hotel.name.localeCompare(b.hotel.name))
  return copy.sort((a, b) => Number(Boolean(b.hotel.featured)) - Number(Boolean(a.hotel.featured)) || Number(b.rating || -1) - Number(a.rating || -1) || b.reviewCount - a.reviewCount || price(a) - price(b) || a.hotel.name.localeCompare(b.hotel.name))
}

export function validateHotelDiscoveryRelationships({ hotels, destinations, facilities, collections, rooms, roomRates, offers, reviews, reservations }) {
  const issues = []
  hotels.forEach((hotel) => {
    if (!destinations.some((item) => same(item.id, hotel.destinationId))) issues.push({ type: 'MISSING_DESTINATION', hotelId: hotel.id })
    ;(hotel.collectionIds || []).forEach((id) => { if (!collections.some((item) => same(item.id, id))) issues.push({ type: 'INVALID_COLLECTION', hotelId: hotel.id, id }) })
    ;(hotel.facilityIds || []).forEach((id) => { if (!facilities.some((item) => same(item.id, id))) issues.push({ type: 'INVALID_FACILITY', hotelId: hotel.id, id }) })
  })
  rooms.forEach((room) => { if (!hotels.some((hotel) => same(hotel.id, room.hotelId))) issues.push({ type: 'ROOM_MISSING_HOTEL', roomId: room.id }) })
  roomRates.forEach((rate) => { if (!rooms.some((room) => same(room.id, rate.roomTypeId))) issues.push({ type: 'RATE_MISSING_ROOM', rateId: rate.id }) })
  reviews.forEach((review) => { if (!hotels.some((hotel) => same(hotel.id, review.hotelId)) || !reservations.some((reservation) => same(reservation.id, review.reservationId))) issues.push({ type: 'REVIEW_MISSING_RELATION', reviewId: review.id }) })
  offers.forEach((offer) => (offer.targetHotelIds || []).forEach((id) => { if (!hotels.some((hotel) => same(hotel.id, id))) issues.push({ type: 'OFFER_MISSING_HOTEL', offerId: offer.id, id }) }))
  return issues
}
