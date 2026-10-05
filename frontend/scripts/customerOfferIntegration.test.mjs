import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  buildOfferStayQuote,
  CUSTOMER_OFFER_STATES,
  getCustomerOfferCoverage,
  getCustomerOffers,
  getCustomerOfferState,
  getPublicOfferEligibility,
  getOfferQuoteReason,
  isCustomerOfferVisible,
} from '../src/utils/customerOffers.js'
import { calculateOfferDiscount, getEffectiveOfferRoomTypes, isOfferEligible, isOfferDiscountValid } from '../src/utils/offerEligibility.js'
import { resolveStayRateQuote } from '../src/utils/rateFormatting.js'

// A focused frontend integration fixture using the real LankaStay Ocean Bay identifiers and Base Rate.
const oceanBay = { id: 302, name: 'LankaStay Ocean Bay', publicationStatus: 'ACTIVE', setupStatus: 'COMPLETE', status: 'ACTIVE' }
const oceanRoom = { id: 30201, hotelId: 302, name: 'Deluxe Ocean View Room', roomTypeGroupKey: 'DELUXE', maxGuests: 3, capacity: 3, status: 'ACTIVE', active: true }
const realTestOffer = {
  id: 'customer-offer-test', title: 'Customer Offer Integration Test', slug: 'customer-offer-integration-test', shortDescription: 'A public Offer test.', status: 'ACTIVE', active: true,
  stayStartDate: '2026-08-01', stayEndDate: '2026-12-31', validFrom: '2026-08-01', validTo: '2026-12-31',
  minimumStay: 3, minimumNights: 3, applicableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  discountType: 'PERCENTAGE', discountValue: 15, targetHotelIds: [302], targetRoomCategoryKeys: ['DELUXE'], targetRoomTypeIds: [30201], image: '/offer.jpg',
}
const rates = new Map([['2026-08-20', 48000], ['2026-08-21', 52000], ['2026-08-22', 48000]])
const getCurrentRoomRate = (_id, date) => ({ id: `rate-${date.toISOString().slice(0, 10)}`, roomTypeId: 30201, amount: rates.get(date.toISOString().slice(0, 10)) || 48000, status: 'ACTIVE' })
const available = () => ({ available: true, availableQuantity: 2, message: '2 rooms available' })

assert.equal(isCustomerOfferVisible(realTestOffer, [oceanBay], [oceanRoom], new Date('2026-08-09')), true, 'real test Offer must be customer-visible through a public Hotel and active Room Type')
assert.deepEqual(getCustomerOfferCoverage(realTestOffer, [oceanBay], [oceanRoom]), { hotels: [oceanBay], roomTypes: [oceanRoom] }, 'coverage must deduplicate Hotel, category and specific targets')
assert.deepEqual(getEffectiveOfferRoomTypes(realTestOffer, [oceanRoom]).map((room) => room.id), [30201], 'three matching target paths must still resolve one Room Type')
assert.equal(getCustomerOfferState(realTestOffer, new Date('2026-08-09')), CUSTOMER_OFFER_STATES.AVAILABLE)
assert.equal(getCustomerOfferState({ ...realTestOffer, stayEndDate: '2026-08-14', validTo: '2026-08-14' }, new Date('2026-08-09')), CUSTOMER_OFFER_STATES.ENDING)
assert.equal(getCustomerOfferState({ ...realTestOffer, stayStartDate: '2026-09-01', validFrom: '2026-09-01' }, new Date('2026-08-09')), CUSTOMER_OFFER_STATES.COMING)
assert.equal(getCustomerOffers([{ ...realTestOffer, status: 'DRAFT' }, { ...realTestOffer, id: 'inactive', active: false, status: 'INACTIVE' }, realTestOffer], [oceanBay], [oceanRoom], new Date('2026-08-09')).length, 1, 'draft and inactive Offers must be hidden')
assert.equal(isCustomerOfferVisible(realTestOffer, [{ ...oceanBay, publicationStatus: 'INACTIVE', status: 'INACTIVE' }], [oceanRoom], new Date('2026-08-09')), false, 'unpublished Hotels must hide the Offer')
assert.equal(isCustomerOfferVisible(realTestOffer, [oceanBay], [{ ...oceanRoom, status: 'INACTIVE', active: false }], new Date('2026-08-09')), false, 'inactive Room Types must hide the Offer')
assert.equal(isCustomerOfferVisible({ ...realTestOffer, targetHotelIds: [999], targetRoomCategoryKeys: [], targetRoomTypeIds: [] }, [oceanBay], [oceanRoom], new Date('2026-08-09')), false, 'broken targeting must hide the Offer safely')

const publicOceanBay = { ...oceanBay, setupStatus: 'SETUP_COMPLETE' }
const bookableOceanRoom = { ...oceanRoom, shortDescription: 'Ocean room', fullDescription: 'A complete ocean-facing Room Type.', bedConfiguration: '1 King Bed', mainImage: '/ocean-room.jpg' }
const physicalRooms = [{ id: 'pr-201', hotelId: 302, roomTypeId: 30201, status: 'AVAILABLE', operationalStatus: 'AVAILABLE', condition: 'READY' }]
const canonicalOptions = { publicHotels: [publicOceanBay], rooms: [bookableOceanRoom], physicalRooms, getCurrentRoomRate, date: new Date('2026-08-09') }
assert.equal(getPublicOfferEligibility(realTestOffer, canonicalOptions).visible, true, 'canonical public eligibility must require a public Hotel, customer-bookable Room Type and current Rate')
assert.equal(getPublicOfferEligibility({ ...realTestOffer, applicableDays: undefined }, canonicalOptions).visible, false, 'missing applicable days must not expose malformed raw Offer data')
assert.equal(getPublicOfferEligibility({ ...realTestOffer, applicableDays: [] }, canonicalOptions).visible, false, 'empty applicable days must not expose an incomplete Offer')
assert.equal(getPublicOfferEligibility({ ...realTestOffer, applicableDays: ['FUNDAY'] }, canonicalOptions).visible, false, 'invalid applicable days must fail public configuration checks')
assert.equal(getPublicOfferEligibility({ ...realTestOffer, applicableDays: ['MON', 'MON'] }, canonicalOptions).visible, false, 'duplicate applicable days must fail public configuration checks')
assert.equal(getPublicOfferEligibility({ ...realTestOffer, stayEndDate: '2026-07-31', validTo: '2026-07-31' }, canonicalOptions).visible, false, 'invalid stay date ranges must remain hidden')
assert.equal(getPublicOfferEligibility({ ...realTestOffer, status: 'INACTIVE', active: false }, canonicalOptions).visible, false, 'deactivation must remove the Offer from canonical customer visibility immediately')
assert.equal(getPublicOfferEligibility(realTestOffer, { ...canonicalOptions, getCurrentRoomRate: () => null }).visible, false, 'missing current Rate must hide the Offer publicly')
assert.match(getPublicOfferEligibility(realTestOffer, { ...canonicalOptions, getCurrentRoomRate: () => null }).reason, /Rate-ready/)
assert.equal(getCustomerOffers([realTestOffer], [publicOceanBay], [bookableOceanRoom], { physicalRooms, getCurrentRoomRate, date: new Date('2026-08-09') }).length, 1, 'canonical collection must expose an eligible reactivated Offer without refresh-only caches')

const quote = buildOfferStayQuote({ offer: realTestOffer, room: oceanRoom, hotel: oceanBay, checkIn: '2026-08-20', checkOut: '2026-08-23', rooms: 1, adults: 2, children: 0, getCurrentRoomRate, checkReservationAvailability: available })
assert.equal(quote.eligible, true, 'target, status, dates, minimum stay, capacity, Rate and availability must all pass')
assert.equal(quote.originalTotal, 148000, 'date-aware Rates must total every night')
assert.equal(quote.discount, 22200, '15% must apply to the complete date-aware stay total')
assert.equal(quote.finalTotal, 125800, 'final total must equal original less savings with stable integer rounding')
assert.equal(calculateOfferDiscount(realTestOffer, 48000, 1), 7200, 'the real LKR 48,000 Rate must produce a LKR 7,200 discount at 15%')
assert.equal(48000 - calculateOfferDiscount(realTestOffer, 48000, 1), 40800, 'the real LKR 48,000 Rate must produce LKR 40,800 after 15%')
const editedOffer = { ...realTestOffer, discountValue: 20 }
assert.equal(calculateOfferDiscount(editedOffer, 48000, 1), 9600, 'an Offer edit from 15% to 20% must propagate to LKR 9,600 savings')
assert.equal(48000 - calculateOfferDiscount(editedOffer, 48000, 1), 38400, 'the edited 20% Offer must produce LKR 38,400 without changing the Rate')
assert.equal(52000 - calculateOfferDiscount(editedOffer, 52000, 1), 41600, 'a Rate edit to LKR 52,000 must produce LKR 41,600 under the same 20% Offer')
assert.equal(buildOfferStayQuote({ offer: realTestOffer, room: oceanRoom, hotel: oceanBay, checkIn: '2026-08-20', checkOut: '2026-08-22', rooms: 1, adults: 2, children: 0, getCurrentRoomRate, checkReservationAvailability: available }).eligible, false, 'minimum stay must block a short stay')
const shortQuote = buildOfferStayQuote({ offer: realTestOffer, room: oceanRoom, hotel: oceanBay, checkIn: '2026-08-20', checkOut: '2026-08-22', rooms: 1, adults: 2, children: 0, getCurrentRoomRate, checkReservationAvailability: available })
assert.match(getOfferQuoteReason(shortQuote, realTestOffer), /at least 3 nights/)
assert.equal(buildOfferStayQuote({ offer: realTestOffer, room: oceanRoom, hotel: oceanBay, checkIn: '2026-08-20', checkOut: '2026-08-23', rooms: 1, adults: 4, children: 0, getCurrentRoomRate, checkReservationAvailability: available }).eligible, false, 'guest capacity must be enforced')
assert.equal(buildOfferStayQuote({ offer: realTestOffer, room: oceanRoom, hotel: oceanBay, checkIn: '2026-08-20', checkOut: '2026-08-23', rooms: 1, adults: 2, children: 0, getCurrentRoomRate, checkReservationAvailability: () => ({ available: false, message: 'Sold out' }) }).eligible, false, 'sold-out inventory must block the Offer')
assert.equal(buildOfferStayQuote({ offer: realTestOffer, room: oceanRoom, hotel: oceanBay, checkIn: '2026-08-20', checkOut: '2026-08-23', rooms: 1, adults: 2, children: 0, getCurrentRoomRate: () => null, checkReservationAvailability: available }).eligible, false, 'missing Rates must block a discounted quote')

const repriced = resolveStayRateQuote(() => ({ amount: 60000, status: 'ACTIVE' }), 30201, '2026-08-20', '2026-08-23', 1)
assert.equal(repriced.originalTotal, 180000, 'Rate edits must propagate without copied Offer prices')
assert.equal(calculateOfferDiscount(realTestOffer, repriced.originalTotal, 3), 27000, 'discount edits and Rate edits must compose from current data')
assert.equal(calculateOfferDiscount({ ...realTestOffer, discountType: 'FIXED_AMOUNT', discountValue: 5000, fixedDiscountScope: 'PER_STAY' }, 148000, 3), 5000)
assert.equal(calculateOfferDiscount({ ...realTestOffer, discountType: 'FIXED_AMOUNT', discountValue: 5000, fixedDiscountScope: 'PER_NIGHT' }, 148000, 3), 15000)
assert.equal(isOfferDiscountValid({ ...realTestOffer, discountValue: 120 }), false, 'percentage discounts over 100% must be invalid')
assert.equal(calculateOfferDiscount({ ...realTestOffer, discountValue: 120 }, 148000, 3), 0, 'invalid discounts must fail safe, not create free or negative stays')
assert.equal(isOfferEligible({ ...realTestOffer, maximumStay: 2 }, { room: oceanRoom, hotel: oceanBay, checkIn: '2026-08-20', checkOut: '2026-08-23', nights: 3, bookingDate: new Date('2026-08-09') }), false, 'maximum stay must be enforced')

const homeSource = await readFile(new URL('../src/pages/Home/Home.jsx', import.meta.url), 'utf8')
const offersSource = await readFile(new URL('../src/pages/Offers/Offers.jsx', import.meta.url), 'utf8')
assert.match(homeSource, /<OfferCard/, 'Home must reuse the shared OfferCard')
assert.match(offersSource, /<OfferCard/, 'Offers discovery must reuse the shared OfferCard')
const reservationsSource = await readFile(new URL('../src/data/reservations.js', import.meta.url), 'utf8')
assert.match(reservationsSource, /res-1024[\s\S]*?totalAmount: 144000/, 'existing confirmed Reservation snapshots must remain unchanged')

console.log('Customer Offer integration tests passed for Hotel 302, Room Type 30201 and the LKR 48,000 shared Rate.')
