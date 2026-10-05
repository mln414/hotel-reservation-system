// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

import { apiRequest } from './authApi.js'

export const hotelApi = {
  listPublicHotels: () => apiRequest('/api/public/hotels'),

  getPublicHotel: (identifier) => apiRequest(`/api/public/hotels/${encodeURIComponent(identifier)}`),

  listHotels: (params = {}) => {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.destinationId) query.append('destinationId', params.destinationId)
    if (params.setupStatus) query.append('setupStatus', params.setupStatus)
    if (params.publicationStatus) query.append('publicationStatus', params.publicationStatus)
    if (params.propertyType) query.append('propertyType', params.propertyType)
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return apiRequest(`/api/v1/hotels${queryString}`)
  },

  getHotel: (id) => apiRequest(`/api/v1/hotels/${id}`),

  createHotel: (data) => apiRequest('/api/v1/hotels', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateHotel: (id, data) => apiRequest(`/api/v1/hotels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updateHotelStatus: (id, status) => apiRequest(`/api/v1/hotels/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  deleteHotel: (id, confirmationName) => apiRequest(`/api/v1/hotels/${id}?confirmationName=${encodeURIComponent(confirmationName)}`, {
    method: 'DELETE',
  }),

  uploadImage: (file) => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest('/api/media/upload', { method: 'POST', body })
  },
}
