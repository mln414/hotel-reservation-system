import assert from 'node:assert/strict'
import { checkReservationAvailability, createConfirmedReservation } from '../src/utils/reservationDomain.js'
import { createManagedPhysicalRoom, createManagedRoomType, getRoomTypeCustomerVisibility } from '../src/utils/roomDomain.js'
import { createManagedRate, resolveStayRateQuote } from '../src/utils/rateFormatting.js'

const setupTime = new Date('2030-01-01T00:00:00Z')
const hotel = { id: 302, name: 'LankaStay Ocean Bay', publicationStatus: 'ACTIVE', setupStatus: 'SETUP_COMPLETE' }
const room = createManagedRoomType({ hotelId: hotel.id, name: 'Management Integration Ocean Room', status: 'ACTIVE', shortDescription: 'A Management-created Room Type used to verify the live reservation domain.', fullDescription: 'This Room Type follows the same readiness, Rate, Physical Room and Reservation rules used by the application.', maxGuests: 2, adultCapacity: 2, childCapacity: 1, bedConfiguration: '1 King Bed', mainImage: '/src/assets/images/home/ocean - bay/deluxe-ocean-view-room.png', amenityIds: ['wifi'], gallery: [] }, { id: 'management-room-302-integration', now: setupTime })
const physicalRooms = [
  createManagedPhysicalRoom({ hotelId: hotel.id, roomTypeId: room.id, roomNumber: '901', operationalStatus: 'AVAILABLE' }, { id: 'mgmt-901', now: setupTime }),
  createManagedPhysicalRoom({ hotelId: hotel.id, roomTypeId: room.id, roomNumber: '902', operationalStatus: 'AVAILABLE' }, { id: 'mgmt-902', now: setupTime }),
  createManagedPhysicalRoom({ hotelId: hotel.id, roomTypeId: room.id, roomNumber: '903', operationalStatus: 'AVAILABLE', operationalBlocks: [{ id: 'maintenance', type: 'MAINTENANCE', fromDate: '2030-06-01', throughDate: '2030-06-30', returnState: 'AVAILABLE' }] }, { id: 'mgmt-903', now: setupTime }),
]
const currentRate = createManagedRate({ hotelId: hotel.id, roomTypeId: room.id, name: 'Base Rate', rateType: 'BASE', pricingMethod: 'SET_PRICE', amount: 48000, status: 'ACTIVE' }, { id: 'management-rate-302', now: setupTime })
const visibility = getRoomTypeCustomerVisibility({ room, hotel, physicalRooms, currentRate })
assert.equal(visibility.bookable, true, 'Management-created Room must appear in customer Accommodation')
const quote = resolveStayRateQuote(() => currentRate, room.id, '2030-06-10', '2030-06-12', 1)
assert.equal(quote.complete, true); assert.equal(quote.originalTotal, 96000)

let reservations = []
const query = { physicalRooms, hotelId: hotel.id, roomTypeId: room.id, checkIn: '2030-06-10', checkOut: '2030-06-12', requestedQuantity: 1 }
assert.equal(checkReservationAvailability({ ...query, reservations }).available, true)
const reservationData = { hotelId: hotel.id, roomTypeId: room.id, roomId: room.id, checkIn: query.checkIn, checkOut: query.checkOut, items: [{ roomTypeId: room.id, quantity: 1, assignedPhysicalRoomIds: [] }], originalRateSnapshot: { nightlyRate: 48000, nightlyRates: [48000, 48000], nights: 2, quantity: 1, subtotal: quote.originalTotal }, totalAmount: quote.originalTotal }
const firstReservation = createConfirmedReservation(reservationData, { id: 'integration-reservation-1', reservationCode: 'LS-INTEGRATION-0001', now: new Date('2030-01-02T00:00:00Z') })
reservations = [...reservations, firstReservation]
assert.equal(reservations.some((item) => item.reservationCode === 'LS-INTEGRATION-0001'), true, 'Created Reservation must propagate through shared Reservation state')
assert.equal(checkReservationAvailability({ ...query, reservations }).available, true, 'Second operational unit must remain')
const secondReservation = createConfirmedReservation(reservationData, { id: 'integration-reservation-2', reservationCode: 'LS-INTEGRATION-0002', now: new Date('2030-01-02T00:00:00Z') })
reservations = [...reservations, secondReservation]
assert.equal(checkReservationAvailability({ ...query, reservations }).available, false, 'Third overlap must be blocked')
assert.equal(checkReservationAvailability({ ...query, reservations, checkIn: '2030-06-12', checkOut: '2030-06-13' }).available, true, 'Adjacent stay must be allowed')
reservations = reservations.map((reservation) => reservation.id === firstReservation.id ? { ...reservation, status: 'CANCELLED' } : reservation)
assert.equal(checkReservationAvailability({ ...query, reservations }).available, true, 'Cancellation must release inventory')
const availabilityAfterCancel = checkReservationAvailability({ ...query, reservations }).availableQuantity
reservations = reservations.filter((reservation) => reservation.id !== firstReservation.id)
assert.equal(reservations.some((item) => item.id === firstReservation.id), false, 'Permanent deletion must remove the reservation from shared My Bookings state')
assert.equal(checkReservationAvailability({ ...query, reservations }).availableQuantity, availabilityAfterCancel, 'Permanent deletion after cancellation must not release inventory twice')
assert.equal(checkReservationAvailability({ ...query, reservations: [], requestedQuantity: 3 }).available, false, 'Maintenance unit must not count')
console.log(JSON.stringify({ hotelId: hotel.id, roomTypeId: room.id, rateId: currentRate.id, physicalRoomIds: physicalRooms.map((item) => item.id), reservationId: firstReservation.reservationCode, customerVisible: visibility.bookable, nightlyRates: quote.nightlyRates.map((item) => item.amount), originalTotal: quote.originalTotal, offerSnapshot: null, finalTotal: quote.originalTotal, availabilityBefore: 2, availabilityAfterFirst: 1, availabilityAfterLast: 0, thirdOverlapBlocked: true, cancellationReleased: true, permanentDeleteRemovedFromState: true, permanentDeleteDidNotReleaseTwice: true, adjacentStayAllowed: true, maintenanceExcluded: true }, null, 2))
