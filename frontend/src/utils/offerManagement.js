import { getEffectiveOfferRoomTypes, isOfferDiscountValid } from './offerEligibility.js'
import { getOfferDisplayState, toDateKey } from './offerFormatting.js'

const clone = (value) => typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value))

export function createUniqueOfferSlug(value, offers = [], excludeId = null) {
  const base = String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'offer'
  const used = new Set(offers.filter((offer) => String(offer.id) !== String(excludeId)).map((offer) => offer.slug))
  if (!used.has(base)) return base
  let suffix = 2
  while (used.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export function validateOfferStep(form, step, { offers = [], offerId = null, rooms = [], today = toDateKey(new Date()), editing = false } = {}) {
  const errors = {}
  if (step === 0) {
    if (!String(form.title || '').trim()) errors.title = 'Offer title is required.'
    if (!String(form.shortDescription || '').trim()) errors.descriptions = 'A short description is required.'
    if (!String(form.fullDescription || '').trim()) errors.fullDescription = 'A full description is required.'
    const slug = createUniqueOfferSlug(form.slug || form.title, offers, offerId)
    if (form.slug && slug !== form.slug) errors.slug = 'This slug is already in use.'
  }
  if (step === 1) {
    if (!isOfferDiscountValid(form)) errors.discount = 'Use a percentage from 0.01 to 100, or a positive fixed amount.'
    const minimum = Number(form.minimumStay)
    const maximum = form.maximumStay == null || form.maximumStay === '' ? null : Number(form.maximumStay)
    if (!Number.isInteger(minimum) || minimum < 1) errors.minimumStay = 'Minimum stay must be at least 1 whole night.'
    if (maximum !== null && (!Number.isInteger(maximum) || maximum < minimum)) errors.maximumStay = 'Maximum stay must be a whole number at least equal to minimum stay.'
    if (!form.stayStartDate || !form.stayEndDate || form.stayEndDate < form.stayStartDate) errors.dates = 'Choose a valid stay-date range.'
    if (!editing && form.stayStartDate && form.stayStartDate < today) errors.dates = 'A new Offer cannot start in the past.'
    if ((form.bookingStartDate && !form.bookingEndDate) || (!form.bookingStartDate && form.bookingEndDate) || (form.bookingStartDate && form.bookingEndDate < form.bookingStartDate)) errors.bookingDates = 'Choose both booking dates in chronological order, or leave both blank.'
    if (!Array.isArray(form.applicableDays) || !form.applicableDays.length) errors.applicableDays = 'Select at least one applicable stay day.'
  }
  if (step === 2 && !getEffectiveOfferRoomTypes(form, rooms).length) errors.targets = 'At least one active Room Type must be covered.'
  if (step === 3 && !form.image) errors.image = 'A main promotional image is required.'
  return errors
}

export function validateCompleteOffer(form, options = {}) {
  return [0, 1, 2, 3].reduce((all, step) => ({ ...all, ...validateOfferStep(form, step, options) }), {})
}

export function isOfferComplete(form, options = {}) {
  return Object.keys(validateCompleteOffer(form, options)).length === 0
}

export function getOfferLifecycleActions(offer, { complete = false, reservationCount: _reservationCount = 0, date = new Date() } = {}) {
  const state = getOfferDisplayState(offer, date)
  return {
    state,
    canContinue: state === 'DRAFT' && !complete,
    canPublish: state === 'DRAFT' && complete,
    canDeactivate: state === 'ACTIVE' || state === 'SCHEDULED',
    canReactivate: state === 'INACTIVE' && complete && toDateKey(offer.stayEndDate || offer.validTo) >= toDateKey(date),
    // Reservation monetary snapshots remain intact while the nullable live
    // offer reference is detached transactionally by the backend.
    canDelete: true,
    deleteBlockedByReservations: false,
  }
}

export function buildOfferDuplicate(source, { id, slug, createdAt }) {
  const copied = clone({
    shortDescription: source.shortDescription || '', fullDescription: source.fullDescription || source.description || '',
    description: source.fullDescription || source.description || '', terms: source.terms || [], termsText: source.termsText || '',
    discountType: source.discountType, discountValue: source.discountValue, fixedDiscountScope: source.fixedDiscountScope,
    stayStartDate: source.stayStartDate || source.validFrom || '', stayEndDate: source.stayEndDate || source.validTo || '',
    bookingStartDate: source.bookingStartDate || '', bookingEndDate: source.bookingEndDate || '', minimumStay: source.minimumStay ?? source.minimumNights ?? 1,
    maximumStay: source.maximumStay || '', applicableDays: source.applicableDays || [], targetHotelIds: source.targetHotelIds || source.applicableHotelIds || [],
    targetRoomCategoryKeys: source.targetRoomCategoryKeys || source.applicableRoomTypeGroupKeys || [], targetRoomTypeIds: source.targetRoomTypeIds || source.applicableRoomTypeIds || [],
    image: source.image || '', imageFraming: source.imageFraming || { fit: 'cover', horizontal: 'center', vertical: 'center' },
  })
  return { ...copied, id, slug, title: `${source.title} Copy`, status: 'DRAFT', active: false, createdAt, updatedAt: createdAt, version: 1 }
}
