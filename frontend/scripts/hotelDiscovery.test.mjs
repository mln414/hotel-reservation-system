import assert from 'node:assert/strict'
import {
  buildCustomerHotelCardData,
  filterCustomerHotels,
  getDiscoveryPriceBounds,
  sortCustomerHotels,
  validateHotelDiscoveryRelationships,
} from '../src/utils/hotelDiscovery.js'

const hotel = { id: 10, name: 'Coast House', destinationId: 1, facilityIds: [5], collectionIds: [8], propertyType: 'Resort', publicationStatus: 'ACTIVE', setupStatus: 'COMPLETE', featured: true }
const destinations = [{ id: 1, name: 'Galle', active: true }]
const facilities = [{ id: 5, name: 'Pool', active: true }]
const collections = [{ id: 8, title: 'Coastal Getaways', status: 'ACTIVE' }]
const rooms = [{ id: 100, hotelId: 10, name: 'Ocean Room', maxGuests: 3, status: 'ACTIVE', roomTypeGroupKey: 'DELUXE' }]
const offer = { id: 20, title: 'Stay & Save', status: 'ACTIVE', active: true, stayStartDate: '2026-08-01', stayEndDate: '2026-12-31', minimumStay: 2, applicableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], discountType: 'PERCENTAGE', discountValue: 20, targetHotelIds: [10] }
const searchContext = { checkIn: '2026-08-15', checkOut: '2026-08-18', adults: 2, children: 0, requestedRooms: 1, totalGuests: 2, hasDates: true, nights: 3 }
const dependencies = {
  hotel, destinations, facilities, collections, rooms, offers: [offer], searchContext,
  getCurrentRoomRate: () => ({ id: 30, roomTypeId: 100, amount: 50000, status: 'ACTIVE' }),
  getHotelAverageRating: () => 4.7,
  getHotelReviewCount: () => 12,
  checkReservationAvailability: () => ({ available: true, availableQuantity: 2 }),
}

const card = buildCustomerHotelCardData(dependencies)
assert.equal(card.destination.name, 'Galle', 'destination display must resolve through destinationId')
assert.deepEqual(card.facilities.map((item) => item.name), ['Pool'], 'facilities must resolve through facilityIds')
assert.deepEqual(card.collections.map((item) => item.title), ['Coastal Getaways'], 'collections must resolve through collectionIds')
assert.equal(card.fromRate, 50000, 'price must come from the active Room Rate')
assert.equal(card.finalNightRate, 40000, 'eligible best Offer must produce the final nightly rate')
assert.equal(card.rating, 4.7, 'rating must come from active review aggregation')
assert.equal(card.reviewCount, 12, 'review count must come from active review aggregation')
assert.equal(card.available, true, 'central availability must control dated results')

const renamed = buildCustomerHotelCardData({ ...dependencies, destinations: [{ ...destinations[0], name: 'Galle Fort' }] })
assert.equal(renamed.destination.name, 'Galle Fort', 'destination edits must propagate without copying Hotel records')
const repriced = buildCustomerHotelCardData({ ...dependencies, getCurrentRoomRate: () => ({ id: 30, roomTypeId: 100, amount: 60000, status: 'ACTIVE' }) })
assert.equal(repriced.fromRate, 60000, 'Rate edits must propagate to discovery')
assert.equal(repriced.finalNightRate, 48000, 'Offer calculation must follow the updated Rate')
const soldOut = buildCustomerHotelCardData({ ...dependencies, checkReservationAvailability: () => ({ available: false, availableQuantity: 0 }) })
assert.equal(soldOut.available, false, 'inventory/reservation changes must remove a sold-out Hotel for dated searches')
const unreviewed = buildCustomerHotelCardData({ ...dependencies, getHotelAverageRating: () => null, getHotelReviewCount: () => 0 })
assert.equal(filterCustomerHotels([unreviewed], { rating: 4 }).length, 0, 'unreviewed Hotels must not satisfy rating filters')

const second = { ...card, hotel: { ...hotel, id: 11, name: 'City House', featured: false, propertyType: 'Hotel' }, destination: { id: 2, name: 'Colombo' }, facilities: [], collections: [], fromRate: 30000, finalNightRate: 30000, rating: 4.2, reviewCount: 30 }
assert.deepEqual(filterCustomerHotels([card, second], { destinationIds: ['1'], facilityIds: ['5'], propertyTypes: ['Resort'] }).map((item) => item.hotel.id), [10], 'filters must combine automatically by intersection')
assert.deepEqual(sortCustomerHotels([card, second], 'price-low-high').map((item) => item.hotel.id), [11, 10], 'price sorting must be deterministic')
assert.deepEqual(sortCustomerHotels([card, second], 'highest-rated').map((item) => item.hotel.id), [10, 11], 'rating sorting must use shared review aggregates')
assert.deepEqual(getDiscoveryPriceBounds([card, second]), { minimum: 30000, maximum: 40000 }, 'price bounds must be derived from live displayed prices')

const validRelationships = validateHotelDiscoveryRelationships({ hotels: [hotel], destinations, facilities, collections, rooms, roomRates: [{ id: 30, roomTypeId: 100 }], offers: [offer], reviews: [{ id: 40, hotelId: 10, reservationId: 50 }], reservations: [{ id: 50, hotelId: 10 }] })
assert.equal(validRelationships.length, 0, 'valid shared relationships must pass integrity validation')
const invalidRelationships = validateHotelDiscoveryRelationships({ hotels: [{ ...hotel, destinationId: 999, facilityIds: [999], collectionIds: [999] }], destinations, facilities, collections, rooms: [{ ...rooms[0], hotelId: 999 }], roomRates: [{ id: 30, roomTypeId: 999 }], offers: [{ ...offer, targetHotelIds: [999] }], reviews: [{ id: 40, hotelId: 999, reservationId: 999 }], reservations: [] })
assert.deepEqual(new Set(invalidRelationships.map((issue) => issue.type)), new Set(['MISSING_DESTINATION', 'INVALID_COLLECTION', 'INVALID_FACILITY', 'ROOM_MISSING_HOTEL', 'RATE_MISSING_ROOM', 'REVIEW_MISSING_RELATION', 'OFFER_MISSING_HOTEL']), 'broken shared references must be detected explicitly')

console.log('Hotel discovery relationship tests passed.')
