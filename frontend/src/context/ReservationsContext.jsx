import { useCallback, useEffect, useMemo, useState } from 'react'
import useRooms from './useRooms.js'
import useCustomer from './useCustomer.js'
import useAuth from './useAuth.js'
import ReservationsContext from './reservationsContext.js'
import { reservationApi } from '../services/reservationApi.js'
import { checkReservationAvailability, getReservationAssignmentState, getReservationCode, getReservationsForHotel, getReservationsForPhysicalRoom, getReservationsForRoomType, getCurrentReservationForPhysicalRoom, getNextReservationForPhysicalRoom, canCustomerCancelReservation, canCustomerModifyReservation, canReviewReservation } from '../utils/reservationDomain.js'

function normalize(reservation) {
  return {
    ...reservation,
    roomTypeId: reservation.roomTypeId ?? reservation.roomId,
    items: (reservation.items || []).map((item, index) => ({
      ...item,
      assignedPhysicalRoomIds: index === 0 && Array.isArray(reservation.assignedPhysicalRoomIds)
        ? reservation.assignedPhysicalRoomIds
        : index === 0 && reservation.assignedPhysicalRoomId
          ? [reservation.assignedPhysicalRoomId]
          : item.assignedPhysicalRoomIds || [],
    })),
  }
}

function requestError(error, availability = false) {
  if (error?.status === 409) return { error: 'Availability conflict', message: 'This room is no longer available for the selected dates.', status: 409 }
  if (error?.status === 400) return { error: 'Reservation validation failed', message: error.message, status: 400 }
  return { error: 'Unable to complete your reservation', message: availability ? 'Unable to check availability. Please try again.' : 'Unable to complete your reservation. Please try again.', status: error?.status || 0 }
}

export function ReservationsProvider({ children }) {
  const { rooms, physicalRooms, updateRoomCondition: updatePhysicalCondition } = useRooms()
  const { customer, loading: customerLoading } = useCustomer()
  const { user, loading: staffLoading } = useAuth()
  const [reservations, setReservations] = useState([])
  const [reservationsLoading, setReservationsLoading] = useState(true)
  const [reservationsError, setReservationsError] = useState('')
  const activeAccountKey = customer?.isLoggedIn
    ? `customer:${customer.id}`
    : user
      ? `staff:${user.id}:${user.role}`
      : ''

  const refreshReservations = useCallback(async () => {
    if (customerLoading || staffLoading) return []
    if (!activeAccountKey) {
      setReservations([]); setReservationsLoading(false); return []
    }
    // Clear account-owned records before the next account's request resolves.
    setReservations([]); setReservationsLoading(true); setReservationsError('')
    try {
      const records = activeAccountKey.startsWith('customer:')
        ? await reservationApi.listCustomer()
        : await reservationApi.listManagement()
      const normalized = Array.isArray(records) ? records.map(normalize) : []
      setReservations(normalized)
      return normalized
    } catch (error) {
      setReservations([])
      setReservationsError(error.message || 'Unable to load reservations. Please try again.')
      return []
    } finally { setReservationsLoading(false) }
  }, [activeAccountKey, customerLoading, staffLoading])

  useEffect(() => { refreshReservations() }, [refreshReservations])

  const getReservationById = useCallback((id) => reservations.find((item) => String(item.id) === String(id)), [reservations])
  const localAvailability = useCallback((query) => {
    const roomType = rooms.find((room) => String(room.id) === String(query.roomTypeId))
    const named = physicalRooms.filter((room) => String(room.roomTypeId) === String(query.roomTypeId))
    const unnamedCount = Math.max(0, Number(roomType?.inventoryCount || 0) - named.length)
    const inventory = [...physicalRooms, ...Array.from({ length: unnamedCount }, (_, index) => ({ id: `inventory-${roomType?.id}-${index}`, hotelId: roomType?.hotelId, roomTypeId: roomType?.id, operationalStatus: 'AVAILABLE' }))]
    return checkReservationAvailability({ ...query, reservations, physicalRooms: inventory })
  }, [reservations, rooms, physicalRooms])
  const checkReservationAvailabilityRemote = useCallback(async (query) => {
    try {
      return await reservationApi.availability({ hotelId: query.hotelId, roomId: query.roomTypeId || query.roomId, checkIn: query.checkIn, checkOut: query.checkOut, quantity: query.requestedQuantity || query.quantity || 1 })
    } catch (error) { return { available: false, ...requestError(error, true) } }
  }, [])
  const getReservationQuote = useCallback(async (query) => {
    try { return await reservationApi.quote(query) }
    catch (error) { return { available: false, ...requestError(error, true) } }
  }, [])
  const getManagementReservationQuote = useCallback(async (query) => {
    try { return await reservationApi.quoteManagement(query) }
    catch (error) { return { available: false, ...requestError(error, true) } }
  }, [])

  const addReservation = useCallback(async (data) => {
    const primary = data.items?.[0] || {}
    try {
      const saved = normalize(await reservationApi.createCustomer({
        hotelId: Number(data.hotelId), roomId: Number(data.roomId ?? primary.roomTypeId),
        rateId: Number(data.rateId ?? primary.rateId), checkIn: data.checkIn, checkOut: data.checkOut,
        adults: Number(data.adults), children: Number(data.children || 0), quantity: Number(data.rooms ?? primary.quantity),
        guestFirstName: data.guest?.firstName, guestLastName: data.guest?.lastName,
        guestEmail: data.guest?.email, guestPhone: data.guest?.phone,
        specialRequests: data.specialRequests || '', estimatedArrivalTime: data.estimatedArrivalTime || null,
        offerId: data.appliedOfferId ? Number(data.appliedOfferId) : null,
      }))
      setReservations((current) => [saved, ...current.filter((item) => String(item.id) !== String(saved.id))])
      return { reservation: saved }
    } catch (error) { return requestError(error) }
  }, [])

  const addManagementReservation = useCallback(async (data) => {
    const primary = data.items?.[0] || {}
    try {
      const saved = normalize(await reservationApi.createManagement({
        hotelId: Number(data.hotelId), roomId: Number(data.roomId ?? primary.roomTypeId),
        rateId: Number(data.rateId ?? primary.rateId), checkIn: data.checkIn, checkOut: data.checkOut,
        adults: Number(data.adults), children: Number(data.children || 0), quantity: Number(data.rooms ?? primary.quantity),
        guestFirstName: data.guest?.firstName, guestLastName: data.guest?.lastName,
        guestEmail: data.guest?.email, guestPhone: data.guest?.phone,
        specialRequests: data.specialRequests || '', estimatedArrivalTime: data.estimatedArrivalTime || null,
        offerId: data.appliedOfferId ? Number(data.appliedOfferId) : null,
      }))
      setReservations((current) => [saved, ...current.filter((item) => String(item.id) !== String(saved.id))])
      return { reservation: saved }
    } catch (error) { return requestError(error) }
  }, [])

  const cancelReservation = useCallback(async (id, details) => {
    try {
      const payload = { reason: details.cancellationReason || details.reason, note: details.cancellationNote || details.note || '' }
      const saved = normalize(customer?.isLoggedIn ? await reservationApi.cancelCustomer(id, payload) : await reservationApi.cancelManagement(id, payload))
      setReservations((current) => current.map((item) => String(item.id) === String(id) ? saved : item))
      return { success: true, reservation: saved }
    } catch (error) { return requestError(error) }
  }, [customer?.isLoggedIn])

  const deleteReservation = useCallback(async (id) => {
    try {
      await reservationApi.deleteCustomer(id)
      setReservations((current) => current.filter((item) => String(item.id) !== String(id)))
      return { success: true }
    } catch (error) {
      return { error: error.message || 'Unable to permanently delete the reservation.' }
    }
  }, [])

  const completeReservation = useCallback(async (id) => {
    try {
      const saved = normalize(await reservationApi.updateManagementStatus(id, { reservationStatus: 'COMPLETED' }))
      setReservations((current) => current.map((item) => String(item.id) === String(id) ? saved : item))
      return { success: true, reservation: saved }
    } catch (error) { return requestError(error) }
  }, [])

  const assignPhysicalRoom = useCallback(async (reservationId, physicalRoomId) => {
    const room = physicalRooms.find((entry) => String(entry.id) === String(physicalRoomId))
    if (!room) return { error: 'Physical room was not found.' }
    try {
      const saved = normalize(await reservationApi.assignManagementRoom(reservationId, room.roomNumber))
      setReservations((current) => current.map((item) => String(item.id) === String(reservationId) ? saved : item))
      return { success: true }
    } catch (error) { return { error: error.message || 'Room assignment failed.' } }
  }, [physicalRooms])

  const unassignPhysicalRoom = useCallback(async (reservationId, physicalRoomId = null) => {
    try {
      const room = physicalRoomId == null ? null : physicalRooms.find((entry) => String(entry.id) === String(physicalRoomId))
      if (physicalRoomId != null && !room) return { error: 'Physical room was not found.' }
      const saved = normalize(await reservationApi.assignManagementRoom(reservationId, room?.roomNumber || null, Boolean(room)))
      setReservations((current) => current.map((item) => String(item.id) === String(reservationId) ? saved : item))
      return { success: true }
    } catch (error) { return { error: error.message || 'Room unassignment failed.' } }
  }, [physicalRooms])

  const updateReservation = useCallback(() => ({ error: 'Reservation modification is not available in the approved backend workflow.' }), [])
  const value = useMemo(() => ({
    reservations, reservationsLoading, reservationsError, refreshReservations, getReservationById,
    addReservation, addManagementReservation, updateReservation, cancelReservation, deleteReservation, completeReservation, assignPhysicalRoom, unassignPhysicalRoom,
    updateRoomCondition: updatePhysicalCondition, checkReservationAvailability: localAvailability, checkReservationAvailabilityRemote, getReservationQuote, getManagementReservationQuote,
    getReservationsForHotel: (id) => getReservationsForHotel(reservations, id),
    getReservationsForRoomType: (id) => getReservationsForRoomType(reservations, id),
    getReservationsForPhysicalRoom: (id) => getReservationsForPhysicalRoom(reservations, id),
    getCurrentReservationForPhysicalRoom: (id, date) => getCurrentReservationForPhysicalRoom(reservations, id, date),
    getNextReservationForPhysicalRoom: (id, date) => getNextReservationForPhysicalRoom(reservations, id, date),
    getReservationAssignmentState, getReservationCode, canCustomerModifyReservation, canCustomerCancelReservation, canReviewReservation,
  }), [reservations, reservationsLoading, reservationsError, refreshReservations, getReservationById, addReservation, addManagementReservation, updateReservation, cancelReservation, deleteReservation, completeReservation, assignPhysicalRoom, unassignPhysicalRoom, updatePhysicalCondition, localAvailability, checkReservationAvailabilityRemote, getReservationQuote, getManagementReservationQuote])
  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>
}
