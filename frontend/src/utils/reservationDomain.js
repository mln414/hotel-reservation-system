const DAY_MS = 86400000
export const ACTIVE_RESERVATION_STATUSES = ['CONFIRMED']
export const ROOM_CONDITIONS = ['READY', 'SERVICE_REQUIRED', 'CLEANING']
export function createConfirmedReservation(data,{id=`res-${Date.now()}`,reservationCode,now=new Date()}={}){const timestamp=now.toISOString();return{...data,id,reservationCode,reference:reservationCode,status:'CONFIRMED',createdAt:timestamp,updatedAt:timestamp}}

export function toDateKey(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}
export function parseStayDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const [year, month, day] = value.split('-').map(Number)
  const timestamp = Date.UTC(year, month - 1, day)
  const date = new Date(timestamp)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null
}
export function calculateNights(checkIn, checkOut) {
  const start = parseStayDate(checkIn); const end = parseStayDate(checkOut)
  if (!start || !end) return 0
  const nights = (end - start) / DAY_MS
  return Number.isInteger(nights) && nights > 0 ? nights : 0
}
export function doDateRangesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return Boolean(parseStayDate(firstStart) && parseStayDate(firstEnd) && parseStayDate(secondStart) && parseStayDate(secondEnd) && firstStart < secondEnd && firstEnd > secondStart)
}
export function enumerateStayDates(checkIn, checkOut) {
  const start = parseStayDate(checkIn); const nights = calculateNights(checkIn, checkOut)
  return start && nights ? Array.from({ length: nights }, (_, index) => new Date(start.getTime() + index * DAY_MS).toISOString().slice(0, 10)) : []
}
export function addDays(dateKey, days) { const date = parseStayDate(dateKey); return date ? new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10) : '' }
export function isToday(value, now = new Date()) { return value === toDateKey(now) }
export function isPastStay(reservation, now = new Date()) { return reservation.checkOut <= toDateKey(now) }
export function isUpcomingStay(reservation, now = new Date()) { return reservation.checkIn > toDateKey(now) }
export function formatStayDate(value, options = {}) {
  const date = parseStayDate(value); if (!date) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', ...(options.year === false ? {} : { year: 'numeric' }), timeZone: 'UTC' }).format(date)
}
export function formatStayRange(checkIn, checkOut, options) { return `${formatStayDate(checkIn, options)} → ${formatStayDate(checkOut, options)}` }
export function getReservationItems(reservation) {
  if (Array.isArray(reservation?.items) && reservation.items.length) return reservation.items
  const roomTypeId = reservation?.roomTypeId ?? reservation?.roomId
  return roomTypeId == null ? [] : [{ roomTypeId, quantity: Number(reservation.rooms ?? reservation.roomQuantity ?? 1), nightlyRateSnapshot: Number(reservation.roomRate ?? 0), assignedPhysicalRoomIds: reservation.physicalRoomId ? [reservation.physicalRoomId] : [] }]
}
export function getPrimaryReservationItem(reservation) { return getReservationItems(reservation)[0] || null }
export function getReservationCode(reservation) { return reservation?.reservationCode || reservation?.reference || String(reservation?.id || '') }
export function getGuestName(reservation) { return reservation?.guest?.name || [reservation?.guest?.firstName, reservation?.guest?.lastName].filter(Boolean).join(' ') || reservation?.customerName || 'Guest unavailable' }
export function getStayState(reservation, now = new Date()) {
  if (reservation.status === 'CANCELLED') return 'PAST'
  const today = toDateKey(now)
  if (reservation.checkIn === today) return 'ARRIVING_TODAY'
  if (reservation.checkOut === today) return 'DUE_OUT'
  if (reservation.checkIn < today && reservation.checkOut > today) return 'CURRENT_STAY'
  if (reservation.checkIn > today) return 'UPCOMING'
  return 'PAST'
}
export function getReservationsForHotel(reservations, hotelId) { return reservations.filter((item) => String(item.hotelId) === String(hotelId)) }
export function getReservationsForRoomType(reservations, roomTypeId) { return reservations.filter((reservation) => getReservationItems(reservation).some((item) => String(item.roomTypeId) === String(roomTypeId))) }
export function getReservationsForPhysicalRoom(reservations, physicalRoomId) { return reservations.filter((reservation) => getReservationItems(reservation).some((item) => (item.assignedPhysicalRoomIds || []).some((id) => String(id) === String(physicalRoomId)))) }
export function getOverlappingReservations(reservations, { hotelId, roomTypeId, checkIn, checkOut, excludeReservationId }) {
  return reservations.filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status) && String(reservation.id) !== String(excludeReservationId ?? '') && String(reservation.hotelId) === String(hotelId) && getReservationItems(reservation).some((item) => String(item.roomTypeId) === String(roomTypeId)) && doDateRangesOverlap(reservation.checkIn, reservation.checkOut, checkIn, checkOut))
}
export function getOperationalBlocksForRoom(room) { return Array.isArray(room?.operationalBlocks) ? room.operationalBlocks : [] }
export function getPhysicalRoomOperationalState(room, date = toDateKey()) {
  const base = room?.baseOperationalStatus || room?.operationalStatus || room?.status || 'AVAILABLE'
  if (base === 'INACTIVE') return 'INACTIVE'
  const blocks = getOperationalBlocksForRoom(room)
  const block = blocks.find((item) => item.fromDate <= date && item.throughDate >= date)
  if (block) return block.type
  const lastCompleted = blocks.filter((item) => item.throughDate < date).sort((a, b) => b.throughDate.localeCompare(a.throughDate))[0]
  if (lastCompleted?.returnState === 'INACTIVE') return 'INACTIVE'
  if (!blocks.length && ['BLOCKED', 'MAINTENANCE'].includes(base)) return base
  return 'AVAILABLE'
}
export function isPhysicalRoomOperationalForStay(room, checkIn, checkOut) { const dates = enumerateStayDates(checkIn, checkOut); return dates.length > 0 && dates.every((date) => getPhysicalRoomOperationalState(room, date) === 'AVAILABLE') }
export function getOperationalRoomCapacity(physicalRooms, hotelId, roomTypeId, date = toDateKey()) { return physicalRooms.filter((room) => String(room.hotelId) === String(hotelId) && String(room.roomTypeId) === String(roomTypeId) && getPhysicalRoomOperationalState(room, date) === 'AVAILABLE').length }
export function getReservedRoomQuantity(reservations, query) {
  const overlaps = getOverlappingReservations(reservations, query)
  const dates = enumerateStayDates(query.checkIn, query.checkOut)
  return dates.reduce((maximum, date) => Math.max(maximum, overlaps.filter((reservation) => reservation.checkIn <= date && reservation.checkOut > date).reduce((total, reservation) => total + getReservationItems(reservation).filter((item) => String(item.roomTypeId) === String(query.roomTypeId)).reduce((sum, item) => sum + Number(item.quantity || 0), 0), 0)), 0)
}
export function getAvailabilityBreakdown({ reservations, physicalRooms, hotelId, roomTypeId, checkIn, checkOut, excludeReservationId, inventoryCount }) {
  const allPhysical = physicalRooms.filter((room) => String(room.hotelId) === String(hotelId) && String(room.roomTypeId) === String(roomTypeId))
  const totalInventory = inventoryCount == null ? allPhysical.length : Math.max(allPhysical.length, Number(inventoryCount) || 0)
  const unnamed = totalInventory - allPhysical.length
  const query = { hotelId, roomTypeId, checkIn, checkOut, excludeReservationId }
  const overlapping = getOverlappingReservations(reservations, query)
  const daily = enumerateStayDates(checkIn, checkOut).map((date) => {
    const operationalCapacity = getOperationalRoomCapacity(physicalRooms, hotelId, roomTypeId, date) + unnamed
    const reserved = overlapping.filter((reservation) => reservation.checkIn <= date && reservation.checkOut > date).reduce((total, reservation) => total + getReservationItems(reservation).filter((item) => String(item.roomTypeId) === String(roomTypeId)).reduce((sum, item) => sum + Number(item.quantity || 0), 0), 0)
    return { date, reserved, operationalCapacity, available: operationalCapacity - reserved }
  })
  const currentCapacity = getOperationalRoomCapacity(physicalRooms, hotelId, roomTypeId) + unnamed
  const operationalCapacity = daily.length ? Math.min(...daily.map((item) => item.operationalCapacity)) : currentCapacity
  const availableQuantity = daily.length ? Math.min(...daily.map((item) => item.available)) : currentCapacity
  return { physical: totalInventory, operationallyUnavailable: totalInventory - operationalCapacity, operationalCapacity, reservedQuantity: daily.length ? Math.max(...daily.map((item) => item.reserved)) : 0, availableQuantity, daily, dataInconsistency: availableQuantity < 0 }
}
export function getAvailableRoomQuantity(args) { return getAvailabilityBreakdown(args).availableQuantity }
export function getAvailabilityStatus(quantity) { return quantity <= 0 ? 'SOLD OUT' : quantity === 1 ? 'LAST ROOM' : quantity <= 2 ? 'LOW AVAILABILITY' : 'AVAILABLE' }
export function checkReservationAvailability(args) {
  const requestedQuantity = Number(args.requestedQuantity || 1)
  if (!calculateNights(args.checkIn, args.checkOut)) return { available: false, code: 'INVALID_DATES', message: 'Invalid stay dates.', breakdown: getAvailabilityBreakdown(args) }
  const breakdown = getAvailabilityBreakdown(args)
  const insufficientDate = breakdown.daily.find((day) => day.available < requestedQuantity)
  return insufficientDate ? { available: false, code: 'INSUFFICIENT_INVENTORY', message: `${formatStayDate(insufficientDate.date)}: only ${Math.max(0, insufficientDate.available)} room${insufficientDate.available === 1 ? '' : 's'} remaining.`, breakdown } : { available: true, code: 'AVAILABLE', message: requestedQuantity === breakdown.availableQuantity ? `Only ${breakdown.availableQuantity} room${breakdown.availableQuantity === 1 ? '' : 's'} left for these dates.` : 'Room type is available.', breakdown }
}
export function getReservationAssignmentState(reservation) { const item = getPrimaryReservationItem(reservation); const assigned = item?.assignedPhysicalRoomIds?.length || 0; const required = Number(item?.quantity || 0); if (!assigned && reservation?.assignmentState) return String(reservation.assignmentState).replaceAll('_', ' '); return assigned <= 0 ? 'UNASSIGNED' : assigned < required ? 'PARTIALLY ASSIGNED' : 'ASSIGNED' }
export function hasPhysicalRoomAssignmentConflict(reservations, physicalRoomId, checkIn, checkOut, excludeReservationId) { return getReservationsForPhysicalRoom(reservations, physicalRoomId).some((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status) && String(reservation.id) !== String(excludeReservationId ?? '') && doDateRangesOverlap(reservation.checkIn, reservation.checkOut, checkIn, checkOut)) }
export function getCurrentReservationForPhysicalRoom(reservations, physicalRoomId, date = toDateKey()) { return getReservationsForPhysicalRoom(reservations, physicalRoomId).find((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status) && reservation.checkIn <= date && reservation.checkOut > date) || null }
export function getNextReservationForPhysicalRoom(reservations, physicalRoomId, date = toDateKey()) { return getReservationsForPhysicalRoom(reservations, physicalRoomId).filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status) && reservation.checkIn > date).sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0] || null }
export function validateInventoryReduction({ reservations, physicalRooms, hotelId, roomTypeId, roomIds, fromDate, throughDate, inventoryCount }) {
  const selected = new Set((roomIds || []).map(String)); const endExclusive = addDays(throughDate, 1); const dates = enumerateStayDates(fromDate, endExclusive)
  const assignmentConflicts = reservations.filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status) && String(reservation.hotelId) === String(hotelId) && doDateRangesOverlap(reservation.checkIn, reservation.checkOut, fromDate, endExclusive) && getReservationItems(reservation).some((item) => String(item.roomTypeId) === String(roomTypeId) && (item.assignedPhysicalRoomIds || []).some((id) => selected.has(String(id)))))
  const relevantReservations = getOverlappingReservations(reservations, { hotelId, roomTypeId, checkIn: fromDate, checkOut: endExclusive })
  const configured = physicalRooms.filter((room) => String(room.hotelId) === String(hotelId) && String(room.roomTypeId) === String(roomTypeId)).length
  const unnamed = inventoryCount == null ? 0 : Math.max(0, Number(inventoryCount) - configured)
  const affectedDates = dates.filter((date) => { const remaining = unnamed + physicalRooms.filter((room) => String(room.hotelId) === String(hotelId) && String(room.roomTypeId) === String(roomTypeId) && !selected.has(String(room.id)) && getPhysicalRoomOperationalState(room, date) === 'AVAILABLE').length; const demand = relevantReservations.filter((reservation) => reservation.checkIn <= date && reservation.checkOut > date).reduce((total, reservation) => total + getReservationItems(reservation).filter((item) => String(item.roomTypeId) === String(roomTypeId)).reduce((sum, item) => sum + Number(item.quantity || 0), 0), 0); return remaining < demand })
  return { valid: assignmentConflicts.length === 0 && affectedDates.length === 0, assignmentConflicts, affectedDates }
}
export const validatePhysicalRoomOperationalChange = validateInventoryReduction
export function canCustomerModifyReservation(reservation, customerId, now = new Date()) { return String(reservation?.customerId) === String(customerId) && reservation?.status === 'CONFIRMED' && reservation.checkIn > toDateKey(now) }
export function canCustomerCancelReservation(reservation, customerId, now = new Date()) { return canCustomerModifyReservation(reservation, customerId, now) }
export function canReviewReservation(reservation, customerId, existingReviews = []) { return String(reservation?.customerId) === String(customerId) && reservation?.status === 'COMPLETED' && !existingReviews.some((review) => String(review.reservationId) === String(reservation.id) && review.active !== false) }
export function generateReservationCode(sequence = 1, now = new Date()) { return `LS-${now.getFullYear()}-${String(sequence).padStart(5, '0')}` }
