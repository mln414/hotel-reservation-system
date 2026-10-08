import assert from 'node:assert/strict'
import { createSequentialRoomNumbers, getRoomTypeCustomerVisibility, getSuggestedRoomNumber, validateRoomNumberUniqueness } from '../src/utils/roomDomain.js'
import { checkReservationAvailability, getPhysicalRoomOperationalState, validateInventoryReduction } from '../src/utils/reservationDomain.js'

const rooms = [
  { id: 'a', hotelId: 1, roomTypeId: 10, roomNumber: '201', baseOperationalStatus: 'AVAILABLE', operationalBlocks: [] },
  { id: 'b', hotelId: 1, roomTypeId: 10, roomNumber: '202', baseOperationalStatus: 'AVAILABLE', operationalBlocks: [{ id: 'block', type: 'MAINTENANCE', reason: 'Repair', fromDate: '2026-08-12', throughDate: '2026-08-13', returnState: 'AVAILABLE' }] },
  { id: 'c', hotelId: 1, roomTypeId: 10, roomNumber: 'A-1', baseOperationalStatus: 'AVAILABLE', operationalBlocks: [] },
]
const reservations = [
  { id: 'assigned', hotelId: 1, status: 'CONFIRMED', checkIn: '2026-08-12', checkOut: '2026-08-14', items: [{ roomTypeId: 10, quantity: 1, assignedPhysicalRoomIds: ['a'] }] },
  { id: 'unassigned', hotelId: 1, status: 'CONFIRMED', checkIn: '2026-08-12', checkOut: '2026-08-14', items: [{ roomTypeId: 10, quantity: 1, assignedPhysicalRoomIds: [] }] },
]

assert.equal(validateRoomNumberUniqueness(rooms, 1, ' 201 '), false, 'Room numbers are Hotel-wide and case/space normalized')
assert.equal(validateRoomNumberUniqueness(rooms, 2, '201'), true, 'Same number may exist in another Hotel')
assert.equal(getSuggestedRoomNumber(rooms, 1, '2'), '203', 'Floor-aware suggestion finds the next unused numeric unit')
assert.deepEqual(createSequentialRoomNumbers('301', '3'), ['301', '302', '303'], 'Bulk preview is deterministic')
assert.deepEqual(createSequentialRoomNumbers('A1', '3'), [], 'Bulk generation requires a numeric start')
assert.equal(getPhysicalRoomOperationalState(rooms[1], '2026-08-12'), 'MAINTENANCE', 'Date-aware maintenance overrides the base state')
assert.equal(getPhysicalRoomOperationalState(rooms[1], '2026-08-14'), 'AVAILABLE', 'Room returns to its configured state after maintenance')

const availability = checkReservationAvailability({ reservations, physicalRooms: rooms, hotelId: 1, roomTypeId: 10, checkIn: '2026-08-12', checkOut: '2026-08-14', requestedQuantity: 2 })
assert.equal(availability.available, false, 'Scheduled restrictions reduce customer availability on every affected date')
assert.equal(availability.breakdown.daily[0].operationalCapacity, 2, 'Daily capacity excludes the maintained Physical Room')

const assignedConflict = validateInventoryReduction({ reservations, physicalRooms: rooms, hotelId: 1, roomTypeId: 10, roomIds: ['a'], fromDate: '2026-08-12', throughDate: '2026-08-13' })
assert.equal(assignedConflict.valid, false, 'Assigned reservations prevent inventory reduction')
assert.equal(assignedConflict.assignmentConflicts.length, 1)
const demandConflict = validateInventoryReduction({ reservations, physicalRooms: rooms, hotelId: 1, roomTypeId: 10, roomIds: ['c'], fromDate: '2026-08-12', throughDate: '2026-08-13' })
assert.equal(demandConflict.valid, false, 'Unassigned confirmed Room Type demand also protects capacity')
assert.ok(demandConflict.affectedDates.length > 0)

const customerState = getRoomTypeCustomerVisibility({ room: { id: 10, status: 'ACTIVE', name: 'Deluxe', shortDescription: 'Short', fullDescription: 'Full', maxGuests: 2, bedConfiguration: '1 King Bed', mainImage: 'photo.jpg', amenityIds: [] }, hotel: { publicationStatus: 'ACTIVE', setupStatus: 'SETUP_COMPLETE' }, physicalRooms: rooms, currentRate: { amount: 100 } })
assert.equal(customerState.bookable, true, 'Bookability derives from shared Hotel, Room Type, media, rate and current usable inventory state')
assert.equal(customerState.readiness.amenities, 0, 'Amenities are optional and do not block publication')

const seededRoom = { id: 11, hotelId: 301, status: 'ACTIVE', name: 'Heritage Courtyard King', shortDescription: 'Courtyard room', maxGuests: 2, inventoryCount: 6, mainImage: null }
const publishedHotel = { id: 301, publicationStatus: 'ACTIVE', setupStatus: 'COMPLETE' }
const noPhotoState = getRoomTypeCustomerVisibility({ room: seededRoom, hotel: publishedHotel, physicalRooms: [], currentRate: { id: 41, amount: 32000 } })
assert.equal(noPhotoState.bookable, false, 'A room without its required main photo remains hidden from customers')
assert.equal(noPhotoState.readiness.images, false, 'Management identifies the missing required photo')
assert.equal(getRoomTypeCustomerVisibility({ room: seededRoom, hotel: { ...publishedHotel, publicationStatus: 'INACTIVE' }, physicalRooms: [], currentRate: { amount: 32000 } }).bookable, false, 'Unpublished hotels remain hidden')
assert.equal(getRoomTypeCustomerVisibility({ room: seededRoom, hotel: publishedHotel, physicalRooms: [], currentRate: null }).bookable, false, 'A room without a rate remains hidden')

console.log('Room domain tests passed')
