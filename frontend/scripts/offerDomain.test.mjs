import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  calculateDiscountedNightRate, calculateOfferDiscount, getBestEligibleOffer, getEffectiveOfferRoomTypes,
  getEligibleOffersForStay, getOfferOverlapConflicts, isOfferEligible,
} from '../src/utils/offerEligibility.js'
import { getOfferDisplayState } from '../src/utils/offerFormatting.js'
import { buildOfferDuplicate, createUniqueOfferSlug, getOfferLifecycleActions, validateCompleteOffer, validateOfferStep } from '../src/utils/offerManagement.js'

const rooms = [
  { id: 1, hotelId: 10, roomTypeGroupKey: 'DELUXE', status: 'ACTIVE' },
  { id: 2, hotelId: 10, roomTypeGroupKey: 'FAMILY', status: 'ACTIVE' },
  { id: 3, hotelId: 20, roomTypeGroupKey: 'DELUXE', status: 'ACTIVE' },
  { id: 4, hotelId: 20, roomTypeGroupKey: 'SUITE', status: 'INACTIVE' },
]
const base = { id: 'a', title: 'Twenty', status: 'ACTIVE', active: true, stayStartDate: '2026-12-01', stayEndDate: '2026-12-31', minimumStay: 3, applicableDays: ['MON','TUE','WED','THU','FRI','SAT','SUN'], discountType: 'PERCENTAGE', discountValue: 20, targetHotelIds: ['10'], targetRoomCategoryKeys: ['DELUXE'], targetRoomTypeIds: ['3'] }

assert.deepEqual(getEffectiveOfferRoomTypes(base, rooms).map((room) => room.id), [1, 2, 3], 'mixed targets must be a deduplicated active-room union')
assert.equal(getEffectiveOfferRoomTypes(base, [...rooms, { id: 5, hotelId: 10, roomTypeGroupKey: 'STANDARD', status: 'ACTIVE' }]).some((room) => room.id === 5), true, 'future Hotel Room Types must inherit dynamically')
assert.equal(getEffectiveOfferRoomTypes({ ...base, targetHotelIds: [], targetRoomTypeIds: [] }, [...rooms, { id: 6, hotelId: 30, roomTypeGroupKey: 'DELUXE', status: 'ACTIVE' }]).some((room) => room.id === 6), true, 'future category matches must inherit dynamically')
assert.equal(isOfferEligible(base, { room: rooms[0], checkIn: '2026-12-15', checkOut: '2026-12-18', nights: 3, bookingDate: new Date('2026-12-10') }), true)
assert.equal(isOfferEligible({ ...base, applicableDays: ['TUE', 'WED', 'THU'] }, { room: rooms[0], checkIn: '2026-12-15', checkOut: '2026-12-18', nights: 3, bookingDate: new Date('2026-12-10') }), true, 'restricted-day Offers apply when every stay night is allowed')
assert.equal(isOfferEligible({ ...base, applicableDays: ['MON'] }, { room: rooms[0], checkIn: '2026-12-15', checkOut: '2026-12-18', nights: 3, bookingDate: new Date('2026-12-10') }), false, 'restricted-day Offers reject stays containing other days')
assert.equal(isOfferEligible({ ...base, applicableDays: [] }, { room: rooms[0], checkIn: '2026-12-15', checkOut: '2026-12-18', nights: 3, bookingDate: new Date('2026-12-10') }), false, 'empty applicable days fail closed')
assert.equal(isOfferEligible({ ...base, applicableDays: undefined }, { room: rooms[0], checkIn: '2026-12-15', checkOut: '2026-12-18', nights: 3, bookingDate: new Date('2026-12-10') }), false, 'unnormalized missing applicable days fail closed')
assert.equal(isOfferEligible({ ...base, applicableDays: ['FUNDAY'] }, { room: rooms[0], checkIn: '2026-12-15', checkOut: '2026-12-18', nights: 3, bookingDate: new Date('2026-12-10') }), false, 'invalid applicable days fail closed')
assert.equal(isOfferEligible(base, { room: rooms[0], checkIn: '2026-12-15', checkOut: '2026-12-18', nights: 3, bookingDate: new Date('2026-08-09') }), false, 'Coming Soon Offers must not apply before their start date')
assert.equal(isOfferEligible(base, { room: rooms[0], checkIn: '2026-12-15', checkOut: '2026-12-17', nights: 2, bookingDate: new Date('2026-12-10') }), false, 'minimum stay must be enforced')
assert.equal(isOfferEligible(base, { room: rooms[0], checkIn: '2027-01-02', checkOut: '2027-01-05', nights: 3, bookingDate: new Date('2026-12-10') }), false, 'outside stays must fail')
assert.equal(calculateOfferDiscount(base, 48000), 9600)
assert.equal(calculateDiscountedNightRate(base, 48000), 38400)
assert.equal(calculateDiscountedNightRate({ ...base, discountType: 'FIXED_AMOUNT', discountValue: 5000 }, 48000), 43000)
assert.equal(calculateDiscountedNightRate({ ...base, discountType: 'FIXED_AMOUNT', discountValue: 90000 }, 48000), 0, 'discount cannot produce a negative rate')
const fifteen = { ...base, id: 'b', title: 'Fifteen', discountValue: 15 }
assert.equal(getBestEligibleOffer([fifteen, base], { subtotal: 144000, nights: 3 }).id, 'a', 'best eligible Offer is the single lowest-price result')
assert.equal(calculateOfferDiscount(getBestEligibleOffer([fifteen, base], { subtotal: 144000, nights: 3 }), 144000, 3), 28800, 'offers must not stack')
assert.equal(getOfferOverlapConflicts(base, [fifteen], rooms).length, 1)
assert.equal(getEligibleOffersForStay([base], rooms[0], '2026-12-15', '2026-12-18', 3, { bookingDate: new Date('2026-12-10') }).length, 1)
assert.equal(getOfferDisplayState({ ...base, status: 'DRAFT' }, new Date('2026-12-10')), 'DRAFT')
assert.equal(getOfferDisplayState({ ...base, active: false, status: 'INACTIVE' }, new Date('2026-12-10')), 'INACTIVE')

assert.equal(createUniqueOfferSlug('Early Bird Escape', [{ id: 1, slug: 'early-bird-escape' }]), 'early-bird-escape-2')
assert.ok(validateOfferStep({ ...base, title: '', shortDescription: '', fullDescription: '' }, 0, { offers: [], rooms }).title, 'Step 1 must block forward navigation when required identity is incomplete')
assert.ok(validateOfferStep({ ...base, minimumStay: 5, maximumStay: 2 }, 1, { rooms, editing: true }).maximumStay, 'maximum stay must not be lower than minimum stay')
assert.ok(validateOfferStep({ ...base, bookingStartDate: '2026-12-20', bookingEndDate: '2026-12-10' }, 1, { rooms, editing: true }).bookingDates, 'booking window must be chronological and separate from stay dates')
const complete = { ...base, slug: 'twenty', shortDescription: 'Short', fullDescription: 'Full', image: '/offer.jpg' }
assert.deepEqual(validateCompleteOffer(complete, { offers: [], rooms, editing: true }), {})
assert.equal(getOfferLifecycleActions({ ...complete, status: 'DRAFT' }, { complete: false }).canPublish, false, 'incomplete Draft must not expose publish')
assert.equal(getOfferLifecycleActions({ ...complete, status: 'DRAFT' }, { complete: true }).canPublish, true)
assert.equal(getOfferLifecycleActions({ ...complete, status: 'DRAFT' }, { complete: true, reservationCount: 1 }).canDelete, true, 'Reservation-linked Offers can be safely deleted after the backend preserves snapshots and detaches the live reference')
assert.equal(getOfferLifecycleActions({ ...complete, status: 'ACTIVE' }, { complete: true, reservationCount: 0, date: new Date('2026-12-10') }).canDelete, true, 'an active Offer may be permanently deleted after confirmation')
const originalForDuplicate = { ...complete, terms: ['One'], targetHotelIds: ['10'], auditHistory: ['protected'], reservationIds: ['r1'], usageCount: 9 }
const duplicate = buildOfferDuplicate(originalForDuplicate, { id: 'copy', slug: 'twenty-copy', createdAt: '2026-08-11T00:00:00.000Z' })
assert.equal(duplicate.status, 'DRAFT'); assert.equal(duplicate.id, 'copy'); assert.equal(duplicate.slug, 'twenty-copy'); assert.equal(duplicate.reservationIds, undefined); assert.equal(duplicate.usageCount, undefined)
duplicate.targetHotelIds.push('20'); duplicate.terms.push('Two')
assert.deepEqual(originalForDuplicate.targetHotelIds, ['10'], 'duplicate targeting must not share mutable arrays'); assert.deepEqual(originalForDuplicate.terms, ['One'], 'duplicate terms must not share mutable arrays')

const managementSource = await readFile(new URL('../src/pages/ManageOffers/ManageOffers.jsx', import.meta.url), 'utf8')
assert.match(managementSource, /createUniqueOfferSlug\(value,offers,offerId\)/, 'title changes must use unique slug generation')
assert.match(managementSource, /editing \? requestedIndex/, 'existing edit must honor any requested wizard step')
assert.match(managementSource, /validateOfferStep\(form,candidate/, 'new Offer navigation must validate every preceding step')
assert.match(managementSource, /savedStep:step\+1/, 'draft persistence must store the exact resume step')
assert.match(managementSource, /Offer saved successfully/, 'Save Draft must render the centered confirmation state')
assert.match(managementSource, /<CalendarPicker/, 'Offer date fields must use the shared custom CalendarPicker')
assert.match(managementSource, /Deactivate Offer/, 'active and scheduled management cards must expose Deactivate')
assert.match(managementSource, />Reactivate</, 'inactive management cards must expose Reactivate')
assert.match(managementSource, /Permanently Delete/, 'management cards must expose permanent delete')
assert.match(managementSource, /Reservation price and discount snapshots remain unchanged/, 'permanent delete confirmation must explain preserved reservation history')

console.log('Offer domain tests passed.')
