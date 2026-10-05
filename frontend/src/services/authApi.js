const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

let csrf = null
let csrfPromise = null

async function readJson(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return { message: 'The server returned an invalid response.' } }
}

async function ensureCsrf() {
  if (csrf) return csrf
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_BASE_URL}/api/v1/auth/csrf`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          const error = new Error(`Could not initialize secure authentication (HTTP ${response.status}).`)
          error.status = response.status
          throw error
        }
        const body = await response.json()
        if (!body?.token || !body?.headerName) throw new Error('The authentication service returned an invalid CSRF response.')
        csrf = { token: body.token, headerName: body.headerName }
        return csrf
      })
      .catch((cause) => {
        if (cause?.status !== undefined) throw cause
        const error = new Error(`The browser could not connect to ${API_BASE_URL}. Check the frontend origin and CORS configuration.`)
        error.status = 0
        error.cause = cause
        throw error
      })
      .finally(() => { csrfPromise = null })
  }
  return csrfPromise
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers)
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfHeader = await ensureCsrf()
    headers.set(csrfHeader.headerName, csrfHeader.token)
  }
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, method, headers, credentials: 'include' })
  } catch (cause) {
    const error = new Error(`The browser could not connect to ${API_BASE_URL}. Check the frontend origin and CORS configuration.`)
    error.status = 0
    error.cause = cause
    throw error
  }
  const body = await readJson(response)
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      const isCustomerRequest = path.startsWith('/api/v1/customer/')
      const isLoginRequest = path === '/api/v1/auth/login' || path === '/api/v1/customer/auth/login'
      if (!isLoginRequest) {
        window.dispatchEvent(new CustomEvent(isCustomerRequest
          ? 'lankastay:customer-unauthorized'
          : 'lankastay:auth-error', { detail: { status: response.status, body } }))
      }
    }
    if (response.status === 403 && body?.message === 'Initial password change is required.' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lankastay:auth-error', { detail: { status: response.status, body } }))
    }
    const error = new Error(body?.message || 'The request could not be completed.')
    error.status = response.status
    error.body = body
    throw error
  }
  return body
}

export const authApi = {
  me: () => apiRequest('/api/v1/auth/me'),
  login: (credentials) => apiRequest('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  changeInitialPassword: (data) => apiRequest('/api/v1/auth/change-initial-password', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data) => apiRequest('/api/v1/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  logout: async () => {
    try { return await apiRequest('/api/v1/auth/logout', { method: 'POST' }) }
    finally { csrf = null }
  },
  customerRegister: (data) => apiRequest('/api/v1/customer/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  customerLogin: (credentials) => apiRequest('/api/v1/customer/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  customerForgotPassword: (data) => apiRequest('/api/v1/customer/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  customerResetPassword: (data) => apiRequest('/api/v1/customer/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  customerMe: () => apiRequest('/api/v1/customer/auth/me'),
  customerProfile: () => apiRequest('/api/v1/customer/profile'),
  updateCustomerProfile: (data) => apiRequest('/api/v1/customer/profile', { method: 'PUT', body: JSON.stringify(data) }),
  customerChangePassword: (data) => apiRequest('/api/v1/customer/profile/change-password', { method: 'POST', body: JSON.stringify(data) }),
  customerLogout: async () => {
    try { return await apiRequest('/api/v1/customer/auth/logout', { method: 'POST' }) }
    finally { csrf = null }
  },
  forgotPassword: (data) => apiRequest('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => apiRequest('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
}
