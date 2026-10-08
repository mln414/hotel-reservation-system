import { enumerateStayDates } from './reservationDomain.js'

export const RATE_TYPES = ['BASE', 'WEEKEND', 'SEASONAL', 'SPECIAL_DATE']
export const RATE_TYPE_LABELS = { BASE: 'Base Rate', WEEKEND: 'Weekend Rate', SEASONAL: 'Seasonal Rate', SPECIAL_DATE: 'Special Date Rate' }
export const RATE_TYPE_DESCRIPTIONS = { BASE: 'Default price, no expiry', WEEKEND: 'Price for selected recurring weekdays', SEASONAL: 'Temporary price for a date period', SPECIAL_DATE: 'Price for a particular date or event' }
export const PRICING_METHOD_LABELS = { SET_PRICE: 'Set New Price', INCREASE_BASE: 'Increase Base Price', DECREASE_BASE: 'Decrease Base Price' }
export const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const lkrFormatter = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0, minimumFractionDigits: 0 })

export function getLocalDate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return ''
  const year = value.getFullYear(); const month = String(value.getMonth() + 1).padStart(2, '0'); const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDayKey(date = new Date()) { return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()] }

export function getRateStatus(rate, date = new Date()) {
  if (!rate || rate.status !== 'ACTIVE') return 'INACTIVE'
  if (rate.rateType === 'BASE') return 'CURRENT'
  const today = getLocalDate(date)
  if (!rate.validFrom || (rate.validTo && rate.validFrom > rate.validTo)) return 'INACTIVE'
  if (today < rate.validFrom) return 'SCHEDULED'
  if (rate.validTo && today > rate.validTo) return 'EXPIRED'
  return 'CURRENT'
}

export function calculateDerivedRate(baseAmount, rate) {
  const base = Number(baseAmount)
  if (!rate) return 0
  if (rate.rateType === 'BASE' || rate.pricingMethod === 'SET_PRICE' || !rate.pricingMethod) {
    const amount = Number(rate.amount)
    return Number.isFinite(amount) && amount > 0 ? amount : 0
  }
  const value = Number(rate.value)
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(value) || value < 0) return 0
  const change = rate.changeType === 'PERCENTAGE' ? base * value / 100 : value
  const result = rate.pricingMethod === 'DECREASE_BASE' ? base - change : base + change
  return Number.isFinite(result) ? Math.max(0, result) : 0
}

export function getBaseRate(rates = []) {
  return rates.filter((rate) => rate.rateType === 'BASE' && rate.status === 'ACTIVE' && Number(rate.amount) > 0).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0] || null
}

export function getApplicableRateOverride(rates = [], date = new Date()) {
  const day = getDayKey(date)
  const priority = { SPECIAL_DATE: 3, SEASONAL: 2, WEEKEND: 1 }
  return rates.filter((rate) => getRateStatus(rate, date) === 'CURRENT' && rate.rateType !== 'BASE' && (rate.rateType !== 'WEEKEND' || (rate.applicableDays || []).includes(day))).sort((a, b) => priority[b.rateType] - priority[a.rateType] || new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0] || null
}

export function resolveEffectiveRate(rates = [], date = new Date()) {
  const base = getBaseRate(rates)
  const selected = getApplicableRateOverride(rates, date) || base
  if (!selected) return null
  const amount = calculateDerivedRate(base?.amount, selected)
  return amount > 0 ? { ...selected, amount, baseAmount: Number(base?.amount || 0), resolvedRateType: selected.rateType } : null
}

export function resolveRoomEffectiveRate({ roomRates = [], hotelRates = [], date = new Date() } = {}) {
  const roomBase = getBaseRate(roomRates)
  const hotelBase = getBaseRate(hotelRates)
  const roomOverride = getApplicableRateOverride(roomRates, date)
  const hotelOverride = getApplicableRateOverride(hotelRates, date)
  const base = roomBase || hotelBase
  const selected = roomOverride || hotelOverride || base
  if (!selected) return null
  const amount = calculateDerivedRate(base?.amount, selected)
  if (!Number.isFinite(amount) || amount <= 0) return null
  const scope = Boolean(roomOverride) || roomBase === selected ? 'ROOM_TYPE' : 'HOTEL'
  return { ...selected, amount, baseAmount: Number(base?.amount || 0), resolvedRateType: selected.rateType, resolvedScope: scope, inheritedFromHotel: scope === 'HOTEL' }
}

export function roundLkr(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount) : 0
}

export function formatLkrNumber(value) { return lkrFormatter.format(roundLkr(value)) }
export function formatRateAmount(value) { return `LKR ${formatLkrNumber(value)}` }

export function formatRateChange(rate) {
  if (!rate || rate.pricingMethod === 'SET_PRICE' || rate.rateType === 'BASE') return ''
  const sign = rate.pricingMethod === 'DECREASE_BASE' ? '−' : '+'
  return rate.changeType === 'PERCENTAGE' ? `${sign}${Number(rate.value)}%` : `${sign}${formatRateAmount(rate.value)}`
}

export function resolveStayRateQuote(getCurrentRoomRate, roomTypeId, checkIn, checkOut, quantity = 1) {
  const dates = enumerateStayDates(checkIn, checkOut)
  const roomQuantity = Math.max(1, Number(quantity || 1))
  const nightlyRates = dates.map((date) => getCurrentRoomRate?.(roomTypeId, new Date(`${date}T12:00:00`)))
  const complete = dates.length > 0 && nightlyRates.every((rate) => rate && Number(rate.amount) > 0)
  const originalTotal = complete ? nightlyRates.reduce((sum, rate) => sum + Number(rate.amount) * roomQuantity, 0) : 0
  return { dates, nightlyRates: nightlyRates.filter(Boolean), complete, quantity: roomQuantity, originalTotal, averageNightlyRate: originalTotal / Math.max(1, dates.length * roomQuantity) }
}

export function createManagedRate(data, { id = `room-rate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, now = new Date() } = {}) {
  const timestamp = now.toISOString()
  return { ...data, id, createdAt: timestamp, updatedAt: timestamp }
}
