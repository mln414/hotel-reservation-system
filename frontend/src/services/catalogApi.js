import { apiRequest } from './authApi.js'

export const catalogApi = {
  listRooms: () => apiRequest('/api/public/rooms'),
  listRates: () => apiRequest('/api/public/room-rates'),
}
