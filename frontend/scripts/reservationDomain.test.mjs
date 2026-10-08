import assert from 'node:assert/strict'
import { checkReservationAvailability, doDateRangesOverlap, getAvailableRoomQuantity, hasPhysicalRoomAssignmentConflict } from '../src/utils/reservationDomain.js'

const physicalRooms = [1, 2, 3].map((id) => ({ id: `p${id}`, hotelId: 1, roomTypeId: 10, operationalStatus: 'AVAILABLE' }))
const reservation = (id, checkIn, checkOut, quantity = 1, status = 'CONFIRMED', assignedPhysicalRoomIds = []) => ({ id, hotelId: 1, checkIn, checkOut, status, items: [{ roomTypeId: 10, quantity, assignedPhysicalRoomIds }] })

assert.equal(doDateRangesOverlap('2026-08-10', '2026-08-12', '2026-08-12', '2026-08-15'), false, 'checkout boundary must not overlap')
assert.equal(doDateRangesOverlap('2026-08-10', '2026-08-12', '2026-08-11', '2026-08-13'), true, 'intersecting stays must overlap')

const twoReserved = [reservation('a', '2026-08-10', '2026-08-13', 2)]
assert.equal(getAvailableRoomQuantity({ reservations: twoReserved, physicalRooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-10', checkOut: '2026-08-13' }), 1, 'last room scenario')
assert.equal(checkReservationAvailability({ reservations: twoReserved, physicalRooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-10', checkOut: '2026-08-13', requestedQuantity: 1 }).available, true)
assert.equal(checkReservationAvailability({ reservations: [...twoReserved, reservation('b', '2026-08-10', '2026-08-13')], physicalRooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-10', checkOut: '2026-08-13', requestedQuantity: 1 }).available, false, 'second last-room booking must be blocked')

assert.equal(checkReservationAvailability({ reservations: [reservation('q', '2026-08-10', '2026-08-13')], physicalRooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-10', checkOut: '2026-08-13', requestedQuantity: 2 }).available, true, 'quantity two fits remaining capacity')
assert.equal(checkReservationAvailability({ reservations: [reservation('q', '2026-08-10', '2026-08-13')], physicalRooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-10', checkOut: '2026-08-13', requestedQuantity: 3 }).available, false, 'quantity three exceeds remaining capacity')

const beforeCancel = [reservation('base', '2026-08-10', '2026-08-13', 2), reservation('c', '2026-08-10', '2026-08-13')]
assert.equal(getAvailableRoomQuantity({ reservations: beforeCancel, physicalRooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-10', checkOut: '2026-08-13' }), 0)
const afterCancel = beforeCancel.map((item) => item.id === 'c' ? { ...item, status: 'CANCELLED' } : item)
assert.equal(getAvailableRoomQuantity({ reservations: afterCancel, physicalRooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-10', checkOut: '2026-08-13' }), 1, 'cancelling quantity one releases one room immediately')

const self = [reservation('self', '2026-08-10', '2026-08-12', 3)]
assert.equal(checkReservationAvailability({ reservations: self, physicalRooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-10', checkOut: '2026-08-13', requestedQuantity: 3, excludeReservationId: 'self' }).available, true, 'edit excludes current reservation')
const editConflict = [...self, reservation('other', '2026-08-12', '2026-08-14', 3)]
const editConflictCheck = checkReservationAvailability({ reservations: editConflict, physicalRooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-10', checkOut: '2026-08-14', requestedQuantity: 3, excludeReservationId: 'self' })
assert.equal(editConflictCheck.available, false, 'edit extension into fully booked dates is blocked')
assert.match(editConflictCheck.message, /12 Aug 2026/, 'edit conflict identifies the insufficient date')

const assigned = [reservation('assigned', '2026-08-10', '2026-08-12', 1, 'CONFIRMED', ['p1'])]
assert.equal(hasPhysicalRoomAssignmentConflict(assigned, 'p1', '2026-08-11', '2026-08-13'), true, 'overlapping physical assignment blocked')
assert.equal(hasPhysicalRoomAssignmentConflict(assigned, 'p1', '2026-08-12', '2026-08-15'), false, 'same-day turnover assignment allowed')

console.log('Reservation domain tests passed.')
