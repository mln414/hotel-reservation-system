import { useMemo } from 'react'
import useDestinations from '../context/useDestinations.js'
import useHotels from '../context/useHotels.js'
import usePropertyContent from '../context/usePropertyContent.js'
import useRates from '../context/useRates.js'
import useReservations from '../context/useReservations.js'
import useReviews from '../context/useReviews.js'
import useRooms from '../context/useRooms.js'
import useStayCollections from '../context/useStayCollections.js'
import useAuthoritativeAvailability from './useAuthoritativeAvailability.js'
import { buildCustomerHotelCardData, validateHotelDiscoveryRelationships } from '../utils/hotelDiscovery.js'

export default function useHotelDiscovery(searchContext) {
  const { hotels, publicHotels } = useHotels()
  const { destinations, activeDestinations } = useDestinations()
  const { facilities, offers } = usePropertyContent()
  const { collections, activeCollections } = useStayCollections()
  const { rooms, physicalRooms } = useRooms()
  const { roomRates, getCurrentRoomRate } = useRates()
  const { reservations } = useReservations()
  const { reviews, getHotelAverageRating, getHotelReviewCount } = useReviews()
  const context = useMemo(() => ({ checkIn: searchContext?.checkIn || '', checkOut: searchContext?.checkOut || '', adults: searchContext?.adults || 2, children: searchContext?.children || 0, requestedRooms: searchContext?.requestedRooms || 1, totalGuests: searchContext?.totalGuests || 2, offerId: searchContext?.offerId || '', hasDates: Boolean(searchContext?.hasDates), nights: searchContext?.nights || 0 }), [searchContext?.checkIn, searchContext?.checkOut, searchContext?.adults, searchContext?.children, searchContext?.requestedRooms, searchContext?.totalGuests, searchContext?.offerId, searchContext?.hasDates, searchContext?.nights])
  const availabilityQueries = useMemo(() => context.hasDates ? rooms
    .filter((room) => publicHotels.some((hotel) => String(hotel.id) === String(room.hotelId)) && room.status === 'ACTIVE')
    .map((room) => ({ hotelId: room.hotelId, roomId: room.id, checkIn: context.checkIn, checkOut: context.checkOut, quantity: context.requestedRooms })) : [], [context.hasDates, context.checkIn, context.checkOut, context.requestedRooms, publicHotels, rooms])
  const { getAvailability, loading: availabilityLoading } = useAuthoritativeAvailability(availabilityQueries)
  const hotelCards = useMemo(() => publicHotels.map((hotel) => buildCustomerHotelCardData({ hotel, destinations, facilities, collections, rooms, physicalRooms, offers, getCurrentRoomRate, getHotelAverageRating, getHotelReviewCount, checkReservationAvailability: getAvailability, searchContext: context })), [publicHotels, destinations, facilities, collections, rooms, physicalRooms, offers, getCurrentRoomRate, getHotelAverageRating, getHotelReviewCount, getAvailability, context])
  const relationshipIssues = useMemo(() => validateHotelDiscoveryRelationships({ hotels, destinations, facilities, collections, rooms, roomRates, offers, reviews, reservations }), [hotels, destinations, facilities, collections, rooms, roomRates, offers, reviews, reservations])
  return { hotelCards, relationshipIssues, activeDestinations, activeCollections, facilities: facilities.filter((item) => item.active), availabilityLoading }
}
