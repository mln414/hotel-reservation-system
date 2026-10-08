import assert from 'node:assert/strict'
import {
  getPasswordChecks,
  getPasswordStrength,
  isValidEmail,
  isValidPhone,
  validateCustomerPasswordChange,
  validateProfileFields,
} from '../src/utils/authValidation.js'

const invalidValues = ['', '   ', null, undefined, 42, {}, []]
for (const value of invalidValues) {
  assert.equal(isValidEmail(value), false, `email must reject ${String(value)} without throwing`)
  assert.equal(isValidPhone(value), false, `phone must reject ${String(value)} without throwing`)
  assert.deepEqual(Object.keys(getPasswordChecks(value)), ['length', 'letter', 'uppercase', 'lowercase', 'number', 'special'])
}

assert.equal(isValidEmail(' guest@example.com '), true)
assert.equal(isValidEmail('guest.example.com'), false)
assert.equal(isValidEmail('guest@@example.com'), false)
assert.equal(isValidPhone('+94 77 123 4567'), true)
assert.equal(isValidPhone('077123456'), true)
assert.equal(isValidPhone('12345678'), false)
assert.equal(isValidPhone('+94 (77) 123-4567'), false, 'central phone contract permits digits, spaces, and one leading plus only')
assert.equal(isValidPhone('1'.repeat(15)), true)
assert.equal(isValidPhone('1'.repeat(16)), false)

const validPassword = 'ValidPass1!'
assert.deepEqual(getPasswordChecks(validPassword), {
  length: true, letter: true, uppercase: true, lowercase: true, number: true, special: true,
})
assert.equal(getPasswordChecks('Aa1!' + 'x'.repeat(4)).length, true, '8 characters is the minimum')
assert.equal(getPasswordChecks('Aa1!' + 'x'.repeat(3)).length, false, '7 characters is below the minimum')
assert.equal(getPasswordChecks('Aa1!' + 'x'.repeat(124)).length, true, '128 characters is the maximum')
assert.equal(getPasswordChecks('Aa1!' + 'x'.repeat(125)).length, false, '129 characters exceeds the maximum')
assert.equal(getPasswordChecks('lowercase1!').uppercase, false)
assert.equal(getPasswordChecks('UPPERCASE1!').lowercase, false)
assert.equal(getPasswordChecks('NoNumber!').number, false)
assert.equal(getPasswordChecks('NoSpecial1').special, false)
assert.deepEqual(getPasswordStrength(null), { label: '', level: 0 })
assert.doesNotThrow(() => getPasswordStrength({ unexpected: true }))

const validProfile = validateProfileFields({ firstName: ' Lakshan ', lastName: ' Perera ', email: ' guest@example.com ', phone: ' +94 77 123 4567 ' })
assert.deepEqual(validProfile.errors, {})
assert.equal(validProfile.values.email, 'guest@example.com')
assert.equal(validateProfileFields({ firstName: 'A', lastName: 'B', email: 'bad', phone: '' }).errors.email, 'Enter a valid email address.')
assert.equal(validateProfileFields({ firstName: 'A', lastName: 'B', email: 'a@b.com', phone: 'bad' }).errors.phone, 'Enter a valid phone number.')
assert.deepEqual(validateProfileFields(null).errors, {
  firstName: 'First name is required.', lastName: 'Last name is required.', email: 'Email address is required.',
})
assert.doesNotThrow(() => validateProfileFields({ firstName: 1, lastName: {}, email: [], phone: null }))

assert.deepEqual(validateCustomerPasswordChange({ current: 'OldPass1!', next: validPassword, confirm: validPassword }), {})
assert.equal(validateCustomerPasswordChange({ current: '', next: '', confirm: '' }).current, 'Current password is required.')
assert.equal(validateCustomerPasswordChange({ current: 'OldPass1!', next: 'weak', confirm: 'weak' }).next, 'Use at least 8 characters with an uppercase letter, lowercase letter, and a number.')
assert.equal(validateCustomerPasswordChange({ current: 'OldPass1!', next: validPassword, confirm: 'Different1!' }).confirm, 'Passwords do not match.')
assert.doesNotThrow(() => validateCustomerPasswordChange({ current: null, next: 123, confirm: {} }))

console.log('Authentication validation unit tests passed.')
