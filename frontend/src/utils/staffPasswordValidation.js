import { getPasswordChecks } from './authValidation.js'

export function getStaffPasswordError(password) {
  if (!password) return 'Password is required.'
  if (password.length > 128) return 'Password must not exceed 128 characters.'
  const checks = getPasswordChecks(password)
  if (!checks.length) return 'Use at least 8 characters.'
  if (!checks.uppercase) return 'Include at least one uppercase letter.'
  if (!checks.lowercase) return 'Include at least one lowercase letter.'
  if (!checks.number) return 'Include at least one number.'
  if (!checks.special) return 'Include at least one special character.'
  return ''
}

export function validatePasswordConfirmation(password, confirmation) {
  if (!confirmation) return 'Please confirm the new password.'
  if (confirmation !== password) return 'Passwords do not match.'
  return ''
}
