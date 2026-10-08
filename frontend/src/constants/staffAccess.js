import { USER_ROLES } from './roles.js'

export const STAFF_ACCESS_MESSAGES = Object.freeze({
  customerDenied: 'This account does not have access to the LankaStay management portal.',
  inactive: 'This staff account is inactive. Please contact a manager.',
  mustChangePassword: 'You need to create a new password before continuing.',
  recoverySafe: 'If an eligible staff account exists for this email, password reset instructions will be provided.',
})

export const STAFF_LOGIN_DESTINATIONS = Object.freeze({
  [USER_ROLES.MANAGER]: '/management/dashboard',
  [USER_ROLES.HOTEL_STAFF]: '/management/dashboard',
  [USER_ROLES.RECEPTIONIST]: '/management/reservations',
})

// Future backend requirements:
// - authenticate with a secure token/session and BCrypt-equivalent password hashing
// - enforce role, ACTIVE status, and assignedHotelId/resource ownership checks
// - protect every management endpoint independently of frontend menu visibility
// - use mustChangePassword to force every management role through /staff/change-password
// - issue short-lived, one-time password reset tokens
// - provision Manager-created staff as ACTIVE with mustChangePassword and a securely issued temporary credential
