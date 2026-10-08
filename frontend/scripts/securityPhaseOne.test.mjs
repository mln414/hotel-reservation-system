import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { databaseConfig } from '../../scripts/qa/db-config.js'

const calls = []
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url, options })
  return new Response(JSON.stringify(url.endsWith('/csrf') ? { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } :
    { message: 'If an account exists for that email, password reset instructions have been sent.' }), { status: 200 })
}
const source = (await readFile(new URL('../src/services/authApi.js', import.meta.url), 'utf8')).replaceAll('import.meta.env', '({})')
const { authApi } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
for (const [method, path, body] of [
  ['customerForgotPassword', '/api/v1/customer/auth/forgot-password', { email: 'customer@example.test' }],
  ['forgotPassword', '/api/v1/auth/forgot-password', { email: 'staff@example.test' }],
  ['customerResetPassword', '/api/v1/customer/auth/reset-password', { token: 'url-token', newPassword: 'Secure1!Changed', confirmNewPassword: 'Secure1!Changed' }],
  ['resetPassword', '/api/v1/auth/reset-password', { token: 'url-token', newPassword: 'Secure1!Changed', confirmNewPassword: 'Secure1!Changed' }],
]) {
  await authApi[method](body)
  const call = calls.at(-1)
  assert.ok(call.url.endsWith(path))
  assert.equal(call.options.method, 'POST')
  assert.equal(call.options.credentials, 'include')
  assert.equal(call.options.headers.get('X-XSRF-TOKEN'), 'test-csrf')
  assert.deepEqual(JSON.parse(call.options.body), body)
}
assert.ok(!calls.some(({url}) => /check-email|forgot-password\/change-password|dev-last-reset-link/.test(url)))
assert.throws(() => databaseConfig({}), /Missing required database configuration/)
assert.throws(() => databaseConfig({DB_HOST:'localhost',DB_PORT:'abc',DB_NAME:'qa',DB_USER:'qa',DB_PASSWORD:'test-only'}), /DB_PORT/)
assert.equal(databaseConfig({DB_HOST:'localhost',DB_PORT:'3306',DB_NAME:'qa',DB_USER:'qa',DB_PASSWORD:'test-only'}).DB_USER, 'qa')

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  for (const page of ['ForgotPassword', 'StaffForgotPassword']) {
    const { default: Component } = await vite.ssrLoadModule('/src/pages/' + page + '/' + page + '.jsx')
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Component)))
    assert.match(html, /type="email"/)
    assert.match(html, /Send Reset Instructions/)
    assert.doesNotMatch(html, /type="password"/)
    assert.doesNotMatch(html, /No account found/)
  }
  for (const [page,path] of [['ResetPassword','/reset-password?token=from-email'], ['StaffResetPassword','/staff/reset-password?token=from-email']]) {
    const { default: Component } = await vite.ssrLoadModule('/src/pages/' + page + '/' + page + '.jsx')
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Component)))
    assert.match(html, /type="password"/)
    assert.doesNotMatch(html, /from-email/) // Raw token must not be displayed in form text.
  }
} finally { await vite.close() }
console.log('Phase 1 frontend security regression tests passed: separate API flows, CSRF, secret config, recovery/reset UI rendering.')
