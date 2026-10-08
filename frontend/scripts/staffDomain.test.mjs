import assert from 'node:assert/strict'
import { MANAGEMENT_PERMISSIONS, USER_ROLES } from '../src/constants/roles.js'
import { normalizeStaffAccess, sameStaffId, validateStaffAccess } from '../src/utils/staffManagement.js'

assert.equal(sameStaffId(5, '5'), true, 'staff lookup must safely normalize numeric/string IDs')
assert.equal(sameStaffId('staff-002', 'staff-003'), false, 'different stable staff IDs must not match')

assert.deepEqual(validateStaffAccess({ role: USER_ROLES.RECEPTIONIST, assignedHotelId: '' }), {
  assignedHotelId: 'Select the hotel this staff member can access.',
})
assert.deepEqual(validateStaffAccess({ role: USER_ROLES.MANAGER, assignedHotelId: '' }), {})
assert.equal(validateStaffAccess({ role: 'CUSTOMER', assignedHotelId: 302 }).role, 'Select a valid management role.')

assert.deepEqual(normalizeStaffAccess({ role: USER_ROLES.MANAGER, assignedHotelId: '302' }), {
  role: USER_ROLES.MANAGER,
  assignedHotelId: null,
})
assert.deepEqual(normalizeStaffAccess({ role: USER_ROLES.HOTEL_STAFF, assignedHotelId: '302' }), {
  role: USER_ROLES.HOTEL_STAFF,
  assignedHotelId: 302,
})

assert.ok(MANAGEMENT_PERMISSIONS[USER_ROLES.MANAGER].includes('staff'))
assert.ok(MANAGEMENT_PERMISSIONS[USER_ROLES.HOTEL_STAFF].includes('websiteContent'))
assert.ok(!MANAGEMENT_PERMISSIONS[USER_ROLES.RECEPTIONIST].includes('staff'))

console.log('PASS staff access domain invariants')
