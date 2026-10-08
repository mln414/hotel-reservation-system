function formatPolicyText(text, hotel) {
  return String(text || '').replaceAll('{checkInTime}', hotel.checkInTime || 'the stated check-in time').replaceAll('{checkOutTime}', hotel.checkOutTime || 'the stated check-out time')
}

export function getHotelPolicies(hotel) {
  if (Array.isArray(hotel?.policyRecords)) return hotel.policyRecords.filter((policy) => policy.status === 'ACTIVE').map((policy) => [String(policy.id), { title: policy.title, summary: policy.summary, details: Array.isArray(policy.details) ? policy.details : [policy.details], category: policy.category }])
  if (hotel?.policies && typeof hotel.policies === 'object') return Object.entries(hotel.policies)
  if (hotel?.checkInTime || hotel?.checkOutTime) return [['checkInOut', { title: 'Check-in & Check-out', summary: 'Check-in and check-out times are shown below.', details: [`Check-in is available from ${hotel.checkInTime || 'the stated time'}.`, `Check-out is required by ${hotel.checkOutTime || 'the stated time'}.`] }]]
  return []
}

export { formatPolicyText }
