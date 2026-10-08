import { apiRequest } from './authApi.js'

export const dashboardApi = {
  getDashboard: (hotelId) => apiRequest(`/api/v1/management/dashboard${hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : ''}`),
}
