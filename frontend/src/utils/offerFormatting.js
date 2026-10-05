import { formatReservationDate } from './reservationFormatting.js'

export function toDateKey(date = new Date()) {
  if (typeof date === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getOfferDisplayState(offer, date = new Date()) {
  const status = String(offer?.status || '').toUpperCase()
  if (status === 'DRAFT') return 'DRAFT'
  if (status === 'INACTIVE' || offer?.active === false) return 'INACTIVE'
  const today = toDateKey(date)
  const start = offer?.stayStartDate || offer?.startDate || offer?.validFrom
  const end = offer?.stayEndDate || offer?.endDate || offer?.validTo
  if (!today || !toDateKey(start) || !toDateKey(end) || start > end) return 'INACTIVE'
  if (today < start) return 'SCHEDULED'
  if (today > end) return 'EXPIRED'
  return 'ACTIVE'
}

export const getOfferStatus = getOfferDisplayState
export const isCustomerVisibleOffer = (offer, date = new Date()) => getOfferDisplayState(offer, date) === 'ACTIVE'
export const formatOfferDate = (value) => formatReservationDate(value)
export function getOfferStatusLabel(status) {
  return { ACTIVE: 'Available Now', SCHEDULED: 'Coming Soon', EXPIRED: 'Expired', DRAFT: 'Draft', INACTIVE: 'Unavailable' }[status] || status
}
