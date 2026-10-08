import { apiRequest } from './authApi.js'

const contentPath = (type) => `/api/v1/management/content/${encodeURIComponent(type)}`
const publicPath = (type) => `/api/public/content/${encodeURIComponent(type)}`
const keyPath = (type, key) => `${contentPath(type)}/${encodeURIComponent(String(key))}`

export const contentApi = {
  list: (type, management = false) => apiRequest(management ? contentPath(type) : publicPath(type)),
  isInitialized: (type) => apiRequest(`${publicPath(type)}/initialized`),

  seedIfEmpty: (type, records) => apiRequest(`${contentPath(type)}/seed`, {
    method: 'POST',
    body: JSON.stringify({
      entries: records.map((content) => ({ key: String(content.id), content })),
    }),
  }),

  create: (type, content) => apiRequest(contentPath(type), {
    method: 'POST',
    body: JSON.stringify({ key: String(content.id), content }),
  }),

  update: (type, key, content) => apiRequest(keyPath(type, key), {
    method: 'PUT',
    body: JSON.stringify(content),
  }),

  updateMany: (type, records) => apiRequest(contentPath(type), {
    method: 'PUT',
    body: JSON.stringify({
      entries: records.map((content) => ({ key: String(content.id), content })),
    }),
  }),

  delete: (type, key) => apiRequest(keyPath(type, key), { method: 'DELETE' }),
}

export default contentApi
