// SE2030 LankaStay - Rate Management API Service

import { apiRequest } from './authApi.js'

export const rateApi = {
  listPublicRates: () => apiRequest('/api/public/room-rates'),

  listRates: ({ hotelId, roomId } = {}) => {
    const params = new URLSearchParams()
    if (hotelId) params.append('hotelId', hotelId)
    if (roomId) params.append('roomId', roomId)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return apiRequest(`/api/v1/management/rates${qs}`)
  },

  getRate: (id) => apiRequest(`/api/v1/management/rates/${id}`),

  createRate: (data) => apiRequest('/api/v1/management/rates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateRate: (id, data) => apiRequest(`/api/v1/management/rates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updateRateStatus: (id, status) => apiRequest(`/api/v1/management/rates/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  deleteRate: (id) => apiRequest(`/api/v1/management/rates/${id}`, {
    method: 'DELETE',
  }),
}

export default rateApi
