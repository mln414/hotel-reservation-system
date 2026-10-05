export const normalizeEntityId = (value) => String(value ?? '')
export const deduplicateCollectionIds = (ids) => [...new Set((ids || []).map(normalizeEntityId).filter(Boolean))]
export function resolveHotelCollectionIds(hotel, defaultAssignments = {}) {
  const assigned = deduplicateCollectionIds(hotel?.collectionIds)
  // Legacy API records return [] even though the original seeded catalog has
  // collection memberships. Preserve explicit edits, including clearing them.
  if (assigned.length || hotel?.lastUpdatedSection === 'collections') return assigned
  return deduplicateCollectionIds(defaultAssignments[hotel?.id])
}
export const getCollectionSearchUrl = (collection) => `/hotels?${new URLSearchParams({ collection: collection.slug || String(collection.id) })}`
export const getActiveCollections = (collections) => [...(collections || [])].filter((item) => item.status === 'ACTIVE').sort((a, b) => a.displayOrder - b.displayOrder)
export const getHomeCollections = (collections) => getActiveCollections(collections).filter((item) => item.showOnHome)
export const getCollectionsForHotel = (hotel, collections) => deduplicateCollectionIds(hotel?.collectionIds).map((id) => collections.find((item) => normalizeEntityId(item.id) === id)).filter(Boolean)
export const hotelHasCollection = (hotel, collectionId) => deduplicateCollectionIds(hotel?.collectionIds).includes(normalizeEntityId(collectionId))
export const getHotelsForCollection = (hotels, collectionId) => (hotels || []).filter((hotel) => hotelHasCollection(hotel, collectionId))
export const getCollectionHotelCount = (hotels, collectionId) => getHotelsForCollection(hotels, collectionId).length
