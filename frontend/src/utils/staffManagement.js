import { MANAGEMENT_ROLES, USER_ROLES } from '../constants/roles.js'

export const STAFF_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'DISABLED',
  DISABLED: 'DISABLED',
  LOCKED: 'LOCKED',
})

export const STAFF_ROLE_LABELS = Object.freeze({
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.HOTEL_STAFF]: 'Hotel Staff',
  [USER_ROLES.RECEPTIONIST]: 'Receptionist',
})

export function sameStaffId(left, right) {
  return String(left) === String(right)
}

export function validateStaffAccess({ role, assignedHotelId }) {
  const errors = {}
  if (!MANAGEMENT_ROLES.includes(role)) errors.role = 'Select a valid management role.'
  if (role !== USER_ROLES.MANAGER && !assignedHotelId) {
    errors.assignedHotelId = 'Select the hotel this staff member can access.'
  }
  return errors
}

export function normalizeStaffAccess({ role, assignedHotelId }) {
  return {
    role,
    assignedHotelId: role === USER_ROLES.MANAGER ? null : Number(assignedHotelId),
  }
}
