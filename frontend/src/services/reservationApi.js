import { apiRequest } from './authApi.js'

const query = (params) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString()

export const reservationApi = {
  listCustomer: () => apiRequest('/api/v1/customer/reservations'),
  getCustomer: (id) => apiRequest(`/api/v1/customer/reservations/${encodeURIComponent(id)}`),
  createCustomer: (data) => apiRequest('/api/v1/customer/reservations', { method: 'POST', body: JSON.stringify(data) }),
  quote: (data) => apiRequest('/api/v1/customer/reservations/quote', { method: 'POST', body: JSON.stringify(data) }),
  cancelCustomer: (id, data) => apiRequest(`/api/v1/customer/reservations/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: JSON.stringify(data) }),
  deleteCustomer: (id) => apiRequest(`/api/v1/customer/reservations/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  availability: (params) => apiRequest(`/api/v1/customer/reservations/availability?${query(params)}`),
  listManagement: (hotelId) => apiRequest(`/api/v1/management/reservations${hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : ''}`),
  quoteManagement: (data) => apiRequest('/api/v1/management/reservations/quote', { method: 'POST', body: JSON.stringify(data) }),
  createManagement: (data) => apiRequest('/api/v1/management/reservations', { method: 'POST', body: JSON.stringify(data) }),
  updateManagementStatus: (id, data) => apiRequest(`/api/v1/management/reservations/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  cancelManagement: (id, data) => apiRequest(`/api/v1/management/reservations/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: JSON.stringify(data) }),
  assignManagementRoom: (id, roomNumber, remove = false) => apiRequest(`/api/v1/management/reservations/${encodeURIComponent(id)}/assign-room`, { method: 'PATCH', body: JSON.stringify({ roomNumber, remove }) }),
}
