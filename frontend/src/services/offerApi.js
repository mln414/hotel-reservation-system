// SE2030 LankaStay - Offer Management API Service

import { apiRequest } from './authApi.js'

export const offerApi = {
  listPublicOffers: ({ hotelId } = {}) => {
    const params = new URLSearchParams()
    if (hotelId) params.append('hotelId', hotelId)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return apiRequest(`/api/public/offers${qs}`)
  },

  listOffers: ({ hotelId } = {}) => {
    const params = new URLSearchParams()
    if (hotelId) params.append('hotelId', hotelId)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return apiRequest(`/api/v1/management/offers${qs}`)
  },

  getOffer: (id) => apiRequest(`/api/v1/management/offers/${id}`),

  createOffer: (data) => apiRequest('/api/v1/management/offers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateOffer: (id, data) => apiRequest(`/api/v1/management/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updateOfferStatus: (id, status) => apiRequest(`/api/v1/management/offers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  deleteOffer: (id) => apiRequest(`/api/v1/management/offers/${id}`, {
    method: 'DELETE',
  }),
}

export default offerApi
