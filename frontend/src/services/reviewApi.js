// SE2030 LankaStay - Review Management API Service

import { apiRequest } from './authApi.js'

export const reviewApi = {
  // Public
  listPublicHotelReviews: (hotelId) => apiRequest(`/api/public/hotels/${encodeURIComponent(hotelId)}/reviews`),

  getPublicRatingSummary: (hotelId) => apiRequest(`/api/public/hotels/${encodeURIComponent(hotelId)}/ratings`),

  listPublicReviews: ({ hotelId, rating, sort } = {}) => {
    const params = new URLSearchParams()
    if (hotelId) params.append('hotelId', hotelId)
    if (rating) params.append('rating', rating)
    if (sort) params.append('sort', sort)
    const qs = params.toString()
    return apiRequest(`/api/public/reviews${qs ? `?${qs}` : ''}`)
  },

  // Customer
  listMyReviews: () => apiRequest('/api/v1/customer/reviews'),

  listEligibleStays: () => apiRequest('/api/v1/customer/reviews/eligible-stays'),

  createReview: (payload) => apiRequest('/api/v1/customer/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  updateReview: (id, payload) => apiRequest(`/api/v1/customer/reviews/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  deleteReview: (id) => apiRequest(`/api/v1/customer/reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }),

  // Management
  listManagementReviews: ({ hotelId, search, rating, status } = {}) => {
    const params = new URLSearchParams()
    if (hotelId) params.append('hotelId', hotelId)
    if (search) params.append('search', search)
    if (rating) params.append('rating', rating)
    if (status) params.append('status', status)
    const qs = params.toString()
    return apiRequest(`/api/v1/management/reviews${qs ? `?${qs}` : ''}`)
  },

  getManagementReview: (id) => apiRequest(`/api/v1/management/reviews/${encodeURIComponent(id)}`),

  hideReview: (id, payload) => apiRequest(`/api/v1/management/reviews/${encodeURIComponent(id)}/hide`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),

  restoreReview: (id) => apiRequest(`/api/v1/management/reviews/${encodeURIComponent(id)}/restore`, {
    method: 'PATCH',
  }),

  addResponse: (id, payload) => apiRequest(`/api/v1/management/reviews/${encodeURIComponent(id)}/response`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  updateResponse: (id, payload) => apiRequest(`/api/v1/management/reviews/${encodeURIComponent(id)}/response`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  removeResponse: (id) => apiRequest(`/api/v1/management/reviews/${encodeURIComponent(id)}/response`, {
    method: 'DELETE',
  }),

  uploadPhoto: (file) => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest('/api/media/upload', { method: 'POST', body })
  },
}

export default reviewApi
