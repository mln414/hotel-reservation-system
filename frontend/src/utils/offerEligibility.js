import { getOfferDisplayState, toDateKey } from './offerFormatting.js'

const same = (a, b) => String(a) === String(b)
const includesId = (items = [], id) => items.some((item) => same(item, id))
const hotelTargets = (offer) => offer?.targetHotelIds || offer?.applicableHotelIds || []
const categoryTargets = (offer) => offer?.targetRoomCategoryKeys || offer?.applicableRoomTypeGroupKeys || []
const roomTargets = (offer) => offer?.targetRoomTypeIds || offer?.applicableRoomTypeIds || []
const activeRoom = (room) => room?.status === 'ACTIVE' || room?.active === true
const publicHotel = (hotel) => Boolean(hotel && (hotel.publicationStatus || hotel.status) === 'ACTIVE' && (!hotel.setupStatus || hotel.setupStatus === 'COMPLETE'))
const categoryOf = (room) => room?.roomTypeGroupKey || room?.category
const startOf = (offer) => offer?.stayStartDate || offer?.startDate || offer?.validFrom
const endOf = (offer) => offer?.stayEndDate || offer?.endDate || offer?.validTo

export function isOfferDiscountValid(offer) {
  const value = Number(offer?.discountValue)
  if (!Number.isFinite(value) || value <= 0) return false
  if (offer?.discountType === 'FIXED_AMOUNT') return true
  return offer?.discountType === 'PERCENTAGE' && value <= 100
}

export function offerAppliesToRoom(offer, room) {
  return Boolean(offer && room && (includesId(hotelTargets(offer), room.hotelId) || includesId(categoryTargets(offer), categoryOf(room)) || includesId(roomTargets(offer), room.id)))
}

export function offerAppliesToHotel(offer, hotelId, rooms = [], { activeRoomsOnly = false } = {}) {
  return includesId(hotelTargets(offer), hotelId) || rooms.some((room) => same(room.hotelId, hotelId) && (!activeRoomsOnly || activeRoom(room)) && offerAppliesToRoom(offer, room))
}

export function getEffectiveOfferRoomTypes(offer, rooms = [], { activeOnly = true } = {}) {
  const byId = new Map()
  rooms.forEach((room) => {
    if ((!activeOnly || activeRoom(room)) && offerAppliesToRoom(offer, room)) byId.set(String(room.id), room)
  })
  return [...byId.values()]
}
export const getEffectiveOfferRooms = getEffectiveOfferRoomTypes

export function getEffectiveOfferHotels(offer, hotels = [], rooms = [], { activeOnly = false } = {}) {
  const ids = new Set(getEffectiveOfferRoomTypes(offer, rooms, { activeOnly }).map((room) => String(room.hotelId)))
  hotelTargets(offer).forEach((id) => ids.add(String(id)))
  return hotels.filter((hotel) => ids.has(String(hotel.id)) && (!activeOnly || publicHotel(hotel)))
}

function dateRangeEligible(offer, checkIn, checkOut) {
  const start = toDateKey(startOf(offer)); const end = toDateKey(endOf(offer))
  if (!start || !end || !toDateKey(checkIn) || !toDateKey(checkOut) || checkOut <= checkIn) return false
  const finalNight = new Date(`${checkOut}T12:00:00`); finalNight.setDate(finalNight.getDate() - 1)
  return checkIn >= start && toDateKey(finalNight) <= end
}

function daysEligible(offer, checkIn, checkOut) {
  const applicable = offer?.applicableDays
  if (!Array.isArray(applicable) || !applicable.length) return false
  if (applicable.length === 7) return true
  const keys = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; const cursor = new Date(`${checkIn}T12:00:00`); const end = new Date(`${checkOut}T12:00:00`)
  while (cursor < end) { if (!applicable.includes(keys[cursor.getDay()])) return false; cursor.setDate(cursor.getDate() + 1) }
  return true
}

export function isOfferActiveForStay(offer, checkIn, checkOut, bookingDate = new Date()) {
  if (!offer || getOfferDisplayState(offer, bookingDate) !== 'ACTIVE') return false
  if (!dateRangeEligible(offer, checkIn, checkOut)) return false
  const booked = toDateKey(bookingDate); const bookFrom = offer.bookingStartDate; const bookBy = offer.bookingEndDate
  return (!bookFrom || booked >= bookFrom) && (!bookBy || booked <= bookBy)
}

export function isOfferEligible(offer, { room, hotel, checkIn, checkOut, nights, bookingDate = new Date() } = {}) {
  const stayNights = Number(nights)
  if (!isOfferDiscountValid(offer) || !room || !activeRoom(room) || (hotel && !publicHotel(hotel)) || !offerAppliesToRoom(offer, room)) return false
  if (!isOfferActiveForStay(offer, checkIn, checkOut, bookingDate) || !daysEligible(offer, checkIn, checkOut)) return false
  if (stayNights < Number(offer.minimumStay ?? offer.minimumNights ?? 1)) return false
  if (offer.maximumStay && stayNights > Number(offer.maximumStay)) return false
  return true
}

export function getEligibleOffersForRoomType(offers = [], args = {}) { return offers.filter((offer) => isOfferEligible(offer, args)) }
export function getEligibleOffersForStay(offers = [], room, checkIn, checkOut, nights, extra = {}) { return getEligibleOffersForRoomType(offers, { room, checkIn, checkOut, nights, ...extra }) }

export function calculateOfferDiscount(offer, subtotal, nights = 1) {
  const total = Math.max(0, Number(subtotal || 0)); if (!offer || !total || !isOfferDiscountValid(offer)) return 0
  const value = Math.max(0, Number(offer.discountValue || 0)); let discount
  if (offer.discountType === 'FIXED_AMOUNT') discount = value * (offer.fixedDiscountScope === 'PER_NIGHT' ? Math.max(1, Number(nights || 1)) : 1)
  else discount = total * value / 100
  return Math.min(total, Math.max(0, discount))
}

export function calculateDiscountedNightRate(offer, rate) { return Math.max(0, Number(rate || 0) - calculateOfferDiscount(offer, rate, 1)) }
export function calculateDiscountedPrice(offer, subtotal, nights = 1) { return Math.max(0, Number(subtotal || 0) - calculateOfferDiscount(offer, subtotal, nights)) }
export function calculateOfferStayTotal(offer, nightlyRates = []) {
  const rates = Array.isArray(nightlyRates) ? nightlyRates.map(Number) : []
  const originalTotal = rates.reduce((sum, rate) => sum + Math.max(0, rate), 0)
  const discount = offer?.discountType === 'FIXED_AMOUNT' && offer?.fixedDiscountScope === 'PER_NIGHT'
    ? rates.reduce((sum, rate) => sum + Math.min(Math.max(0, rate), Number(offer.discountValue || 0)), 0)
    : calculateOfferDiscount(offer, originalTotal, rates.length)
  return { originalTotal, discount, finalTotal: Math.max(0, originalTotal - discount) }
}

export function getBestEligibleOffer(offers = [], { subtotal = 0, nights = 1 } = {}) {
  return offers.map((offer) => ({ offer, savings: calculateOfferDiscount(offer, subtotal, nights) })).sort((a, b) => b.savings - a.savings || String(a.offer.title).localeCompare(String(b.offer.title)))[0]?.offer || null
}
export const pickBestOffer = (offers = [], subtotal = 0, nights = 1) => getBestEligibleOffer(offers, { subtotal, nights })

export function getCurrentOffersForHotel(offers = [], hotelId, rooms = []) { return offers.filter((offer) => isOfferDiscountValid(offer) && getOfferDisplayState(offer) === 'ACTIVE' && offerAppliesToHotel(offer, hotelId, rooms, { activeRoomsOnly: true })) }
export function getCurrentOffersForRoom(offers = [], room) { return activeRoom(room) ? offers.filter((offer) => isOfferDiscountValid(offer) && getOfferDisplayState(offer) === 'ACTIVE' && offerAppliesToRoom(offer, room)) : [] }

export function formatOfferDiscount(offer, suffix = ' OFF') {
  if (!offer) return ''
  return offer.discountType === 'FIXED_AMOUNT' ? `LKR ${Number(offer.discountValue).toLocaleString('en-LK')}${suffix}` : `${Number(offer.discountValue)}%${suffix}`
}

export function getOfferCoverageSummary(offer, hotels = [], rooms = [], rates = [], getCurrentRoomRate) {
  const effectiveRooms = getEffectiveOfferRoomTypes(offer, rooms); const hotelIds = new Set(effectiveRooms.map((room) => String(room.hotelId)))
  const rateReady = effectiveRooms.filter((room) => getCurrentRoomRate
    ? Number(getCurrentRoomRate(room.id)?.amount) > 0
    : rates.some((rate) => same(rate.roomTypeId, room.id) && rate.status === 'ACTIVE' && Number(rate.amount) > 0)).length
  return { entireHotels: hotelTargets(offer).length, roomCategories: categoryTargets(offer).length, specificRooms: roomTargets(offer).length, effectiveHotels: hotels.filter((hotel) => hotelIds.has(String(hotel.id))).length || hotelIds.size, effectiveRooms: effectiveRooms.length, rateReady, missingRates: effectiveRooms.length - rateReady }
}
export const getOfferCoverage = (offer, rooms = []) => getOfferCoverageSummary(offer, [], rooms)
export function getOfferTargetSummary(offer) { return [`${hotelTargets(offer).length} entire hotel${hotelTargets(offer).length === 1 ? '' : 's'}`, `${categoryTargets(offer).length} categor${categoryTargets(offer).length === 1 ? 'y' : 'ies'}`, `${roomTargets(offer).length} specific room${roomTargets(offer).length === 1 ? '' : 's'}`].join(' · ') }

export function getOfferOverlapConflicts(subject, offers = [], rooms = []) {
  const subjectRooms = new Set(getEffectiveOfferRoomTypes(subject, rooms).map((room) => String(room.id))); const start = startOf(subject); const end = endOf(subject)
  return offers.filter((offer) => String(offer.id) !== String(subject.id) && ['ACTIVE', 'SCHEDULED'].includes(getOfferDisplayState(offer)) && start <= endOf(offer) && end >= startOf(offer)).map((offer) => ({ offer, roomTypeIds: getEffectiveOfferRoomTypes(offer, rooms).map((room) => String(room.id)).filter((id) => subjectRooms.has(id)), overlapStart: start > startOf(offer) ? start : startOf(offer), overlapEnd: end < endOf(offer) ? end : endOf(offer) })).filter((item) => item.roomTypeIds.length)
}

export function getOfferUsage(offerId, reservations = []) {
  const matched = reservations.filter((reservation) => same(reservation.appliedOfferId, offerId)); const today = toDateKey(new Date())
  return { total: matched.length, upcoming: matched.filter((item) => item.status === 'CONFIRMED' && item.checkIn >= today).length, completed: matched.filter((item) => item.status === 'COMPLETED' || item.checkOut < today).length, reservations: matched }
}
