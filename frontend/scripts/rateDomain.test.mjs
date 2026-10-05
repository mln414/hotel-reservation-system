import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { calculateDerivedRate, formatRateAmount, getRateStatus, resolveEffectiveRate, resolveRoomEffectiveRate, roundLkr } from '../src/utils/rateFormatting.js'
import { buildCustomerHotelCardData } from '../src/utils/hotelDiscovery.js'

const base = { id: 'room-base', hotelId: 302, roomTypeId: 30201, rateType: 'BASE', pricingMethod: 'SET_PRICE', amount: 48000, status: 'ACTIVE' }
const hotelBase = { id: 'hotel-base', hotelId: 302, rateType: 'BASE', pricingMethod: 'SET_PRICE', amount: 48000, status: 'ACTIVE' }
const hotelSeasonal = { id: 'hotel-seasonal', hotelId: 302, rateType: 'SEASONAL', pricingMethod: 'INCREASE_BASE', changeType: 'PERCENTAGE', value: 10.01, validFrom: '2026-08-01', validTo: '2026-08-31', status: 'ACTIVE' }
const roomSeasonal = { id: 'room-seasonal', hotelId: 302, roomTypeId: 30201, rateType: 'SEASONAL', pricingMethod: 'INCREASE_BASE', changeType: 'PERCENTAGE', value: 8.01, validFrom: '2026-08-01', validTo: '2026-08-31', status: 'ACTIVE' }
const weekend = { id: 'weekend', hotelId: 302, rateType: 'WEEKEND', pricingMethod: 'INCREASE_BASE', changeType: 'PERCENTAGE', value: 5, validFrom: '2026-08-01', validTo: '2026-08-31', applicableDays: ['SAT', 'SUN'], status: 'ACTIVE' }
const august15 = new Date('2026-08-15T12:00:00')

assert.equal(calculateDerivedRate(48000, hotelSeasonal), 52804.8, '10.01% remains mathematically precise internally')
assert.equal(roundLkr(52804.8), 52805, 'LKR monetary presentation rounds at the display boundary')
assert.equal(formatRateAmount(52804.8), 'LKR 52,805')
assert.equal(calculateDerivedRate(48000, roomSeasonal), 51844.8, '8.01% remains mathematically precise internally')
assert.equal(formatRateAmount(51844.8), 'LKR 51,845')
assert.equal(getRateStatus(hotelSeasonal, new Date('2026-08-01T12:00:00')), 'CURRENT', 'Valid From is inclusive')
assert.equal(getRateStatus(hotelSeasonal, new Date('2026-08-31T12:00:00')), 'CURRENT', 'Valid To is inclusive')
assert.equal(getRateStatus(hotelSeasonal, new Date('2026-09-01T12:00:00')), 'EXPIRED', 'Seasonal rate does not leak outside its range')
assert.equal(resolveEffectiveRate([hotelBase, weekend], august15).amount, 50400, 'Saturday Weekend rate applies on a selected day')
assert.equal(resolveEffectiveRate([hotelBase, weekend], new Date('2026-08-17T12:00:00')).amount, 48000, 'Weekend rate does not apply on Monday')

const inherited = resolveRoomEffectiveRate({ roomRates: [base], hotelRates: [hotelBase, hotelSeasonal], date: august15 })
assert.equal(inherited.amount, 52804.8, 'Room inherits an applicable Hotel adjustment when no Room override exists')
assert.equal(inherited.resolvedScope, 'HOTEL')
const overridden = resolveRoomEffectiveRate({ roomRates: [base, roomSeasonal], hotelRates: [hotelBase, hotelSeasonal], date: august15 })
assert.equal(overridden.amount, 51844.8, 'Room-specific applicable rate overrides Hotel adjustment')
assert.equal(overridden.resolvedScope, 'ROOM_TYPE')
assert.notEqual(overridden.amount, calculateDerivedRate(52804.8, roomSeasonal), 'Hotel and Room adjustments never stack')
assert.equal(resolveRoomEffectiveRate({ roomRates: [], hotelRates: [hotelBase], date: august15 }).amount, 48000, 'Hotel Base is the fallback when a Room has no Base')
assert.equal(calculateDerivedRate(48000, { ...roomSeasonal, value: 'not-a-number' }), 0, 'invalid numeric input fails safely')

const hotel = { id: 302, name: 'LankaStay Ocean Bay', destinationId: 3, facilityIds: [], collectionIds: [], publicationStatus: 'ACTIVE', setupStatus: 'COMPLETE' }
const rooms = [{ id: 30201, hotelId: 302, name: 'Deluxe Ocean View Room', status: 'ACTIVE', maxGuests: 3 }, { id: 30202, hotelId: 302, name: 'Family Ocean Room', status: 'ACTIVE', maxGuests: 4 }]
const rateMap = new Map([[30201, overridden], [30202, { ...inherited, amount: 62000 }]])
const card = buildCustomerHotelCardData({ hotel, destinations: [{ id: 3, name: 'Galle', active: true }], facilities: [], collections: [], rooms, offers: [], getCurrentRoomRate: (id) => rateMap.get(id), getHotelAverageRating: () => 0, getHotelReviewCount: () => 0, checkReservationAvailability: () => ({ available: true }), searchContext: { hasDates: false, requestedRooms: 1, totalGuests: 2, nights: 0, offerId: '' } })
assert.equal(card.fromRate, 51844.8, 'Hotel From price is the minimum canonical effective Room Type price')
assert.equal(card.bestRoom.room.name, 'Deluxe Ocean View Room', 'Hotel card retains the Room Type that produced its From price')

const ratesSource = await readFile(new URL('../src/pages/ManageRates/ManageRates.jsx', import.meta.url), 'utf8')
assert.doesNotMatch(ratesSource, /section \|\| ['"]roomTypeRates['"]/, 'Rates landing has no silent Room Type default')
assert.doesNotMatch(ratesSource, /type=["']date["']/, 'Rates uses the shared custom CalendarPicker instead of native date inputs')
assert.match(ratesSource, /Select Hotel Rates or Room Type Rates before choosing a Hotel/)
assert.match(ratesSource, /<CalendarPicker/)

console.log('Rates navigation, calendar, precision, inheritance, applicability and Hotel From-price tests passed.')
