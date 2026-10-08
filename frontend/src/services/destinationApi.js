import { apiRequest } from './authApi.js'

function toDestinationRequest(destination) {
  return {
    name: destination.name,
    slug: destination.slug,
    shortDescription: destination.shortDescription,
    fullDescription: destination.fullDescription,
    category: destination.category,
    region: destination.region || null,
    district: destination.district || null,
    latitude: destination.latitude ?? null,
    longitude: destination.longitude ?? null,
    status: destination.status,
    mainImage: destination.mainImage || null,
    cardImagePosition: destination.cardImagePosition,
    heroImagePosition: destination.heroImagePosition,
    heroFitMode: destination.heroFitMode,
    lastSavedStep: destination.lastSavedStep,
    lastCompletedStep: destination.lastCompletedStep,
    lastUpdatedSection: destination.lastUpdatedSection,
    themeKeys: destination.themeKeys || [],
    highlights: destination.highlights || [],
    attractions: (destination.attractions || []).map((attraction, index) => ({
      name: attraction.name,
      type: attraction.type,
      shortDescription: attraction.shortDescription,
      latitude: attraction.latitude ?? null,
      longitude: attraction.longitude ?? null,
      image: attraction.image || null,
      estimatedTravelTime: attraction.estimatedTravelTime || null,
      source: attraction.source || null,
      sourceId: attraction.sourceId || null,
      status: attraction.status,
      displayOrder: Number.isInteger(attraction.displayOrder) ? attraction.displayOrder : index,
    })),
  }
}

export const destinationApi = {
  listPublicDestinations: () => apiRequest('/api/destinations'),

  getPublicDestination: (identifier) => apiRequest(`/api/destinations/${encodeURIComponent(identifier)}`),

  listManagementDestinations: () => apiRequest('/api/management/destinations'),

  createDestination: (destination) => apiRequest('/api/management/destinations', {
    method: 'POST',
    body: JSON.stringify(toDestinationRequest(destination)),
  }),

  updateDestination: (id, destination) => apiRequest(`/api/management/destinations/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...toDestinationRequest(destination), version: destination.version }),
  }),

  updateDestinationStatus: (id, status) => apiRequest(`/api/management/destinations/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  uploadImage: (file) => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest('/api/media/upload', { method: 'POST', body })
  },
}
