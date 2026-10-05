import { calculateOfferStayTotal, getEffectiveOfferRoomTypes, isOfferDiscountValid, isOfferEligible } from './offerEligibility.js'
import { getOfferDisplayState, toDateKey } from './offerFormatting.js'
import { enumerateStayDates } from './reservationDomain.js'
import { isHotelPublicReady } from './hotelManagement.js'
import { getRoomTypeCustomerVisibility } from './roomDomain.js'

const same = (first, second) => String(first) === String(second)
const DAY_MS = 24 * 60 * 60 * 1000
const VALID_OFFER_DAYS = new Set(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])

export const CUSTOMER_OFFER_STATES = {
  AVAILABLE: 'AVAILABLE_NOW',
  ENDING: 'ENDING_SOON',
  COMING: 'COMING_SOON',
}

export const CUSTOMER_OFFER_STATE_LABELS = {
  [CUSTOMER_OFFER_STATES.AVAILABLE]: 'Available Now',
  [CUSTOMER_OFFER_STATES.ENDING]: 'Ending Soon',
  [CUSTOMER_OFFER_STATES.COMING]: 'Coming Soon',
}

export function isValidOfferDiscount(offer) {
  return isOfferDiscountValid(offer)
}

export function getCustomerOfferState(offer, date = new Date(), endingSoonDays = 7) {
  const state = getOfferDisplayState(offer, date)
  if (state === 'SCHEDULED') return CUSTOMER_OFFER_STATES.COMING
  if (state !== 'ACTIVE') return null
  const today = toDateKey(date)
  const end = offer?.stayEndDate || offer?.endDate || offer?.validTo
  const remaining = today && toDateKey(end)
    ? Math.ceil((new Date(`${end}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY_MS)
    : Number.POSITIVE_INFINITY
  return remaining <= endingSoonDays ? CUSTOMER_OFFER_STATES.ENDING : CUSTOMER_OFFER_STATES.AVAILABLE
}

export function getCustomerOfferCoverage(offer, hotels = [], rooms = []) {
  // Customer surfaces pass HotelsContext.publicHotels. The shared helper is also
  // applied defensively for direct callers so unpublished Hotels fail closed.
  const publicHotels = hotels.filter(isHotelPublicReady)
  const publicHotelIds = new Set(publicHotels.map((hotel) => String(hotel.id)))
  const roomTypes = getEffectiveOfferRoomTypes(offer, rooms, { activeOnly: true })
    .filter((room) => publicHotelIds.has(String(room.hotelId)))
  const coveredHotelIds = new Set(roomTypes.map((room) => String(room.hotelId)))
  return {
    hotels: publicHotels.filter((hotel) => coveredHotelIds.has(String(hotel.id))),
    roomTypes,
  }
}

function publicConfigurationReady(offer) {
  const minimum = Number(offer?.minimumStay ?? offer?.minimumNights ?? 1)
  const maximum = offer?.maximumStay === '' || offer?.maximumStay == null ? null : Number(offer.maximumStay)
  const start = toDateKey(offer?.stayStartDate || offer?.validFrom)
  const end = toDateKey(offer?.stayEndDate || offer?.validTo)
  const applicableDays = offer?.applicableDays
  const validApplicableDays = Array.isArray(applicableDays) && applicableDays.length > 0
    && new Set(applicableDays).size === applicableDays.length
    && applicableDays.every((day) => VALID_OFFER_DAYS.has(day))
  return Boolean(offer?.title && offer?.slug && (offer?.shortDescription || offer?.description) && offer?.image
    && isOfferDiscountValid(offer) && start && end && start <= end
    && validApplicableDays
    && (!(offer?.bookingStartDate || offer?.bookingEndDate) || (toDateKey(offer.bookingStartDate) && toDateKey(offer.bookingEndDate) && offer.bookingStartDate <= offer.bookingEndDate))
    && Number.isInteger(minimum) && minimum >= 1
    && (maximum == null || (Number.isInteger(maximum) && maximum >= minimum)))
}

export function getPublicOfferEligibility(offer, { publicHotels = [], rooms = [], physicalRooms, getCurrentRoomRate, date = new Date() } = {}) {
  const customerState = getCustomerOfferState(offer, date)
  const today = toDateKey(date)
  const bookingWindowOpen = (!offer?.bookingStartDate || today >= offer.bookingStartDate) && (!offer?.bookingEndDate || today <= offer.bookingEndDate)
  const configurationReady = publicConfigurationReady(offer)
  const targetedRooms = getEffectiveOfferRoomTypes(offer, rooms, { activeOnly: true })
  const publicHotelIds = new Set(publicHotels.filter(isHotelPublicReady).map((hotel) => String(hotel.id)))
  const publicRooms = targetedRooms.filter((room) => publicHotelIds.has(String(room.hotelId)))
  const eligibleRooms = publicRooms.filter((room) => {
    const hotel = publicHotels.find((item) => same(item.id, room.hotelId))
    const currentRate = getCurrentRoomRate?.(room.id, date)
    if (!currentRate || Number(currentRate.amount) <= 0) return false
    if (!Array.isArray(physicalRooms)) return true
    return getRoomTypeCustomerVisibility({ room, hotel, physicalRooms, currentRate }).bookable
  })
  const eligibleHotelIds = new Set(eligibleRooms.map((room) => String(room.hotelId)))
  let reason = ''
  if (!customerState) reason = 'Offer stay period is not currently customer-applicable.'
  else if (!bookingWindowOpen) reason = 'Offer booking window is not currently open.'
  else if (!configurationReady) reason = 'Offer configuration is incomplete.'
  else if (!targetedRooms.length) reason = 'No active eligible Room Types.'
  else if (!publicRooms.length) reason = 'No targeted Hotel is currently public-ready.'
  else if (!eligibleRooms.length) reason = 'No current Rate-ready, customer-bookable Room Types.'
  return {
    visible: Boolean(customerState && bookingWindowOpen && configurationReady && eligibleRooms.length),
    customerState,
    configurationReady,
    bookingWindowOpen,
    reason,
    hotels: publicHotels.filter((hotel) => eligibleHotelIds.has(String(hotel.id))),
    roomTypes: eligibleRooms,
    targetedRooms,
    publicRooms,
  }
}

export function getCustomerCoverageStatus(offer, allHotels = [], publicHotels = [], rooms = [], getCurrentRoomRate, physicalRooms) {
  const result = getPublicOfferEligibility(offer, { publicHotels, rooms, getCurrentRoomRate, physicalRooms })
  const { targetedRooms, publicRooms } = result
  const rateReadyRooms = result.roomTypes
  const missingHotelTargets = (offer.targetHotelIds || offer.applicableHotelIds || []).filter((id) => !allHotels.some((hotel) => same(hotel.id, id)))
  const relationshipReason = missingHotelTargets.length ? 'One or more targeted Hotels no longer exist.'
      : !result.configurationReady ? 'Offer configuration is incomplete.'
        : !result.bookingWindowOpen ? 'Offer booking window is not currently open.'
      : !targetedRooms.length ? 'No active eligible Room Types.'
        : !publicRooms.length ? 'No targeted Hotel is currently public-ready.'
          : !rateReadyRooms.length ? 'No current Rate-ready, customer-bookable Room Types.'
            : result.reason
  return { targetedRooms, publicRooms, rateReadyRooms, customerVisible: result.visible, canBecomeVisible: result.configurationReady && result.bookingWindowOpen && rateReadyRooms.length > 0, reason: relationshipReason }
}

export function isCustomerOfferVisible(offer, hotels = [], rooms = [], dateOrOptions = new Date(), options = {}) {
  const suppliedOptions = dateOrOptions instanceof Date ? options : dateOrOptions
  const date = dateOrOptions instanceof Date ? dateOrOptions : suppliedOptions?.date || new Date()
  if (suppliedOptions?.getCurrentRoomRate) return getPublicOfferEligibility(offer, { publicHotels: hotels, rooms, date, ...suppliedOptions }).visible
  const state = getCustomerOfferState(offer, date)
  return Boolean(state && isValidOfferDiscount(offer) && getCustomerOfferCoverage(offer, hotels, rooms).roomTypes.length)
}

export function getCustomerOffers(offers = [], hotels = [], rooms = [], dateOrOptions = new Date(), options = {}) {
  const suppliedOptions = dateOrOptions instanceof Date ? options : dateOrOptions
  const date = dateOrOptions instanceof Date ? dateOrOptions : suppliedOptions?.date || new Date()
  const priority = {
    [CUSTOMER_OFFER_STATES.AVAILABLE]: 0,
    [CUSTOMER_OFFER_STATES.ENDING]: 1,
    [CUSTOMER_OFFER_STATES.COMING]: 2,
  }
  return offers.filter((offer) => isCustomerOfferVisible(offer, hotels, rooms, date, suppliedOptions)).sort((first, second) => {
    const firstState = getCustomerOfferState(first, date)
    const secondState = getCustomerOfferState(second, date)
    return priority[firstState] - priority[secondState]
      || Number(second.featured || 0) - Number(first.featured || 0)
      || Number(first.displayOrder ?? Number.MAX_SAFE_INTEGER) - Number(second.displayOrder ?? Number.MAX_SAFE_INTEGER)
      || String(first.validTo || '').localeCompare(String(second.validTo || ''))
      || String(first.title).localeCompare(String(second.title))
  })
}

export function buildOfferStayQuote({ offer, room, hotel, checkIn, checkOut, rooms = 1, adults = 2, children = 0, getCurrentRoomRate, checkReservationAvailability }) {
  const dates = enumerateStayDates(checkIn, checkOut)
  const quantity = Math.max(1, Number(rooms || 1))
  const totalGuests = Math.max(0, Number(adults || 0)) + Math.max(0, Number(children || 0))
  const capacity = Number(room?.maxGuests ?? room?.capacity ?? 0) * quantity
  const nightlyRates = dates.map((date) => getCurrentRoomRate?.(room?.id, new Date(`${date}T12:00:00`))).filter(Boolean)
  const hasRates = dates.length > 0 && nightlyRates.length === dates.length && nightlyRates.every((rate) => Number(rate.amount) > 0)
  const availability = dates.length && room && hotel
    ? checkReservationAvailability?.({ hotelId: hotel.id, roomTypeId: room.id, checkIn, checkOut, requestedQuantity: quantity })
    : null
  const supportsGuests = totalGuests > 0 && capacity >= totalGuests
  const eligible = Boolean(hasRates && supportsGuests && availability?.available && isOfferEligible(offer, { room, hotel, checkIn, checkOut, nights: dates.length }))
  const rateAmounts = nightlyRates.flatMap((rate) => Array.from({ length: quantity }, () => Number(rate.amount)))
  const totals = calculateOfferStayTotal(eligible ? offer : null, rateAmounts)
  return {
    offer,
    room,
    hotel,
    dates,
    checkIn,
    checkOut,
    nights: dates.length,
    quantity,
    nightlyRates,
    hasRates,
    availability,
    supportsGuests,
    eligible,
    originalTotal: totals.originalTotal,
    discount: totals.discount,
    finalTotal: totals.finalTotal,
    averageNightlyRate: totals.originalTotal ? totals.originalTotal / Math.max(1, dates.length * quantity) : 0,
    averageFinalNightlyRate: totals.finalTotal ? totals.finalTotal / Math.max(1, dates.length * quantity) : 0,
  }
}

export function getOfferQuoteReason(quote, offer) {
  if (!quote.dates.length) return 'Choose valid check-in and check-out dates.'
  if (!quote.supportsGuests) return 'This Room Type cannot support the selected guests and room quantity.'
  if (!quote.hasRates) return 'A valid Rate is not available for every night of this stay.'
  if (!quote.availability?.available) return quote.availability?.message || 'This Room Type is sold out for the selected dates.'
  if (!isOfferEligible(offer, { room: quote.room, hotel: quote.hotel, checkIn: quote.checkIn, checkOut: quote.checkOut, nights: quote.nights })) {
    const minimum = Number(offer?.minimumStay ?? offer?.minimumNights ?? 1)
    const maximum = Number(offer?.maximumStay || 0)
    if (quote.nights < minimum) return `This Offer requires at least ${minimum} ${minimum === 1 ? 'night' : 'nights'}.`
    if (maximum && quote.nights > maximum) return `This Offer allows a maximum stay of ${maximum} nights.`
    return 'The selected dates do not meet this Offer’s validity or day rules.'
  }
  return ''
}

export function offerMatchesQuery(offer, coverage, query) {
  const value = String(query || '').trim().toLowerCase()
  if (!value) return true
  return [offer.title, offer.shortDescription, offer.description, ...coverage.hotels.map((hotel) => hotel.name)]
    .filter(Boolean).join(' ').toLowerCase().includes(value)
}

export function findOfferById(offers = [], id) {
  return offers.find((offer) => same(offer.id, id)) || null
}
