// SE2030 LankaStay - Room Management API Service

import { apiRequest } from './authApi.js'

export const roomApi = {
  listPublicRooms: () => apiRequest('/api/public/rooms'),

  listRooms: (hotelId) => {
    const query = hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : ''
    return apiRequest(`/api/v1/management/rooms${query}`)
  },

  getRoom: (id) => apiRequest(`/api/v1/management/rooms/${id}`),

  createRoom: (data) => apiRequest('/api/v1/management/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateRoom: (id, data) => apiRequest(`/api/v1/management/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updateRoomStatus: (id, status) => apiRequest(`/api/v1/management/rooms/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  deleteRoom: (id) => apiRequest(`/api/v1/management/rooms/${id}`, {
    method: 'DELETE',
  }),

  listPhysicalRooms: () => apiRequest('/api/v1/management/physical-rooms'),
  createPhysicalRoom: (data) => apiRequest('/api/v1/management/physical-rooms', {
    method: 'POST', body: JSON.stringify(data),
  }),
  createPhysicalRooms: (data) => apiRequest('/api/v1/management/physical-rooms/batch', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updatePhysicalRoom: (id, data) => apiRequest(`/api/v1/management/physical-rooms/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deletePhysicalRoom: (id) => apiRequest(`/api/v1/management/physical-rooms/${id}`, { method: 'DELETE' }),
  addPhysicalRoomBlock: (id, data) => apiRequest(`/api/v1/management/physical-rooms/${id}/blocks`, {
    method: 'POST', body: JSON.stringify(data),
  }),
  addPhysicalRoomBlocks: (roomIds, block) => apiRequest('/api/v1/management/physical-rooms/blocks/batch', {
    method: 'POST', body: JSON.stringify({ roomIds, block }),
  }),
  updatePhysicalRoomsStatus: (roomIds, status) => apiRequest('/api/v1/management/physical-rooms/batch/status', {
    method: 'PATCH', body: JSON.stringify({ roomIds, status }),
  }),
  removePhysicalRoomBlock: (id, blockId) => apiRequest(`/api/v1/management/physical-rooms/${id}/blocks/${blockId}`, { method: 'DELETE' }),

  uploadImage: (file) => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest('/api/media/upload', { method: 'POST', body })
  },
}

export default roomApi
