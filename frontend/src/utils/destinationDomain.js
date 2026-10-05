import { isValidProvinceDistrict } from './sriLankaAdministrative.js'

export const DESTINATION_STATUS = Object.freeze({ DRAFT: 'DRAFT', READY_FOR_REVIEW: 'READY_FOR_REVIEW', ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' })

export const DESTINATION_THEMES = Object.freeze([
  { key: 'URBAN', label: 'City & Urban', description: 'City stays, dining and shopping.' },
  { key: 'COAST', label: 'Coast & Beaches', description: 'Beaches, lagoons and ocean escapes.' },
  { key: 'HERITAGE', label: 'Culture & Heritage', description: 'Historic places and living culture.' },
  { key: 'NATURE', label: 'Wildlife & Nature', description: 'Wildlife, forests and natural landscapes.' },
  { key: 'HILLS', label: 'Hill Country & Scenic', description: 'Mountains, tea country and viewpoints.' },
  { key: 'ADVENTURE', label: 'Adventure', description: 'Active outdoor discovery.' },
  { key: 'WELLNESS', label: 'Wellness', description: 'Restorative and slow travel.' },
])

export const ATTRACTION_TYPES = Object.freeze([
  { key: 'HERITAGE', label: 'Heritage / Landmark', overpass: ['historic', 'tourism=attraction'] },
  { key: 'BEACH', label: 'Beach / Coast', overpass: ['natural=beach'] },
  { key: 'NATURE', label: 'Nature', overpass: ['natural', 'tourism=viewpoint'] },
  { key: 'WILDLIFE', label: 'Wildlife', overpass: ['tourism=zoo', 'leisure=nature_reserve'] },
  { key: 'VIEWPOINT', label: 'Viewpoint', overpass: ['tourism=viewpoint'] },
  { key: 'RELIGIOUS', label: 'Temple / Religious Site', overpass: ['amenity=place_of_worship'] },
  { key: 'MUSEUM', label: 'Museum', overpass: ['tourism=museum'] },
  { key: 'PARK', label: 'Park / Garden', overpass: ['leisure=park', 'leisure=garden'] },
  { key: 'FAMILY', label: 'Family Attraction', overpass: ['tourism=zoo', 'leisure=theme_park'] },
  { key: 'SHOPPING', label: 'Shopping / City Attraction', overpass: ['shop=mall', 'amenity=marketplace'] },
])

const LEGACY_THEME_MAP = {
  'urban escape': ['URBAN'], 'coastal escape': ['COAST'], 'heritage & coast': ['HERITAGE', 'COAST'],
  'heritage & nature': ['HERITAGE', 'NATURE'], 'hill country': ['HILLS'], 'wildlife & nature': ['NATURE'],
  'culture & hills': ['HERITAGE', 'HILLS'], 'mountain escape': ['HILLS', 'ADVENTURE'],
}

const LOCATION_DEFAULTS = {
  colombo: ['Western Province', 6.9271, 79.8612, 'Colombo'], negombo: ['Western Province', 7.2083, 79.8358, 'Gampaha'],
  galle: ['Southern Province', 6.0329, 80.2168, 'Galle'], sigiriya: ['Central Province', 7.957, 80.7603, 'Matale'],
  'nuwara-eliya': ['Central Province', 6.9497, 80.7891, 'Nuwara Eliya'], yala: ['Southern Province', 6.3725, 81.5185, 'Hambantota'],
  kandy: ['Central Province', 7.2906, 80.6337, 'Kandy'], ella: ['Uva Province', 6.8667, 81.0466, 'Badulla'],
  trincomalee: ['Eastern Province', 8.5874, 81.2152, 'Trincomalee'],
}

const GALLE_ATTRACTIONS = [
  { id: 'galle-fort', name: 'Galle Fort', type: 'HERITAGE', shortDescription: 'The UNESCO-listed fortified old town at the heart of historic Galle.', latitude: 6.0305, longitude: 80.2167, status: 'ACTIVE', displayOrder: 0 },
  { id: 'galle-lighthouse', name: 'Galle Lighthouse', type: 'HERITAGE', shortDescription: 'A landmark lighthouse on the southern edge of Galle Fort.', latitude: 6.0247, longitude: 80.2197, status: 'ACTIVE', displayOrder: 1 },
  { id: 'unawatuna-beach', name: 'Unawatuna Beach', type: 'BEACH', shortDescription: 'A popular sheltered bay south of Galle.', latitude: 6.0097, longitude: 80.2494, status: 'ACTIVE', displayOrder: 2 },
  { id: 'peace-pagoda', name: 'Japanese Peace Pagoda', type: 'RELIGIOUS', shortDescription: 'A hilltop pagoda overlooking the coast.', latitude: 6.0187, longitude: 80.2394, status: 'ACTIVE', displayOrder: 3 },
]

export function slugifyDestination(value = '') { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
export function getLegacyThemeKeys(category = '') { return LEGACY_THEME_MAP[category.trim().toLowerCase()] || [] }
export function getTheme(key) { return DESTINATION_THEMES.find((theme) => theme.key === key) }
export function getAttractionType(key) { return ATTRACTION_TYPES.find((type) => type.key === key) || ATTRACTION_TYPES[0] }
export function getDestinationThemes(destination) { return (destination?.themeKeys || getLegacyThemeKeys(destination?.category)).map(getTheme).filter(Boolean) }
export function getDestinationMainImage(destination) { return destination?.mainImage || destination?.image || '' }

export function normalizeAttraction(item, index = 0) {
  if (typeof item === 'string') return { id: `legacy-${slugifyDestination(item)}`, name: item, type: 'HERITAGE', shortDescription: '', latitude: null, longitude: null, status: 'ACTIVE', displayOrder: index }
  return { id: item.id || `attraction-${index}-${slugifyDestination(item.name)}`, name: item.name || '', type: item.type || 'HERITAGE', shortDescription: item.shortDescription || item.description || '', latitude: numberOrNull(item.latitude), longitude: numberOrNull(item.longitude), image: item.image || '', estimatedTravelTime: item.estimatedTravelTime || item.travelTime || '', source: item.source || '', sourceId: item.sourceId || '', status: item.status || 'ACTIVE', displayOrder: Number.isFinite(item.displayOrder) ? item.displayOrder : index }
}

export function normalizeDestination(destination) {
  const slug = destination.slug || slugifyDestination(destination.name)
  const defaults = LOCATION_DEFAULTS[slug] || ['Sri Lanka', null, null]
  const status = destination.status || (destination.active === true ? DESTINATION_STATUS.ACTIVE : destination.active === false ? DESTINATION_STATUS.INACTIVE : DESTINATION_STATUS.DRAFT)
  const seededAttractions = destination.attractions?.length ? destination.attractions : (slug === 'galle' ? GALLE_ATTRACTIONS : [])
  return {
    ...destination, slug, status, active: status === DESTINATION_STATUS.ACTIVE,
    themeKeys: [...new Set(destination.themeKeys?.length ? destination.themeKeys : getLegacyThemeKeys(destination.category))],
    shortDescription: destination.shortDescription || '', fullDescription: destination.fullDescription || destination.description || destination.shortDescription || '',
    description: destination.fullDescription || destination.description || destination.shortDescription || '',
    region: destination.region || destination.location || defaults[0], location: destination.region || destination.location || defaults[0], district: destination.district || defaults[3] || '',
    latitude: numberOrNull(destination.latitude) ?? defaults[1], longitude: numberOrNull(destination.longitude) ?? defaults[2],
    mainImage: destination.mainImage || destination.image || '', image: destination.mainImage || destination.image || '', galleryImages: destination.galleryImages || [],
    highlights: Array.isArray(destination.highlights) ? destination.highlights.filter(Boolean) : [],
    attractions: seededAttractions.map(normalizeAttraction).sort((a, b) => a.displayOrder - b.displayOrder),
    imageFocalPoint: { x: Number(destination.imageFocalPoint?.x ?? 50), y: Number(destination.imageFocalPoint?.y ?? 50) },
    locationConfirmed: Boolean(destination.locationConfirmed ?? (hasCoordinates(destination) || (Number.isFinite(defaults[1]) && Number.isFinite(defaults[2])))),
    draftStep: Number.isFinite(Number(destination.draftStep)) ? Number(destination.draftStep) : 0,
    lastSavedStep: destination.lastSavedStep != null && Number.isFinite(Number(destination.lastSavedStep)) ? Number(destination.lastSavedStep) : ([DESTINATION_STATUS.ACTIVE, DESTINATION_STATUS.READY_FOR_REVIEW].includes(status) ? 6 : 0),
    lastCompletedStep: destination.lastCompletedStep != null && Number.isFinite(Number(destination.lastCompletedStep)) ? Number(destination.lastCompletedStep) : ([DESTINATION_STATUS.ACTIVE, DESTINATION_STATUS.READY_FOR_REVIEW].includes(status) ? 6 : 0),
    updatedAt: destination.updatedAt || destination.lastUpdatedAt || null, lastUpdatedAt: destination.lastUpdatedAt || destination.updatedAt || null, lastUpdatedSection: destination.lastUpdatedSection || '',
  }
}

function numberOrNull(value) { const number = Number(value); return value === '' || value == null || !Number.isFinite(number) ? null : number }
export function hasCoordinates(item) { return item?.latitude !== null && item?.latitude !== '' && item?.latitude !== undefined && item?.longitude !== null && item?.longitude !== '' && item?.longitude !== undefined && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)) }
export function calculateDistanceKm(from, to) {
  if (!hasCoordinates(from) || !hasCoordinates(to)) return null
  const rad = (value) => value * Math.PI / 180; const radius = 6371
  const lat1 = rad(Number(from.latitude)); const lat2 = rad(Number(to.latitude)); const deltaLat = lat2 - lat1; const deltaLon = rad(Number(to.longitude) - Number(from.longitude))
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
export function formatDistanceKm(value) { return Number.isFinite(value) ? `${value < 1 ? value.toFixed(1) : value.toFixed(1)} km` : '' }
export function getActiveAttractions(destination) { return (destination?.attractions || []).filter((item) => item.status === 'ACTIVE').sort((a, b) => a.displayOrder - b.displayOrder) }
export function getHotelsForDestination(hotels, destinationId) { return (hotels || []).filter((hotel) => String(hotel.destinationId) === String(destinationId)) }
export function getAttractionsForHotel(destination, hotel, limit = 4) { return getActiveAttractions(destination).map((attraction) => ({ ...attraction, distanceKm: calculateDistanceKm(hotel, attraction) })).sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)).slice(0, limit) }
export function isDuplicateAttraction(attractions, candidate, excludeId = '') { const name = candidate.name?.trim().toLowerCase(); return (attractions || []).some((item) => String(item.id) !== String(excludeId) && ((candidate.source && candidate.sourceId && item.source === candidate.source && String(item.sourceId) === String(candidate.sourceId)) || (item.name?.trim().toLowerCase() === name && (!hasCoordinates(item) || !hasCoordinates(candidate) || calculateDistanceKm(item, candidate) < .15)))) }
export function validateDestinationStep(destination, stepIndex) {
  const errors = {}
  if (stepIndex === 0) {
    if (!destination.name?.trim()) errors.name = 'Destination Name is required.'
    if (!destination.shortDescription?.trim()) errors.shortDescription = 'Short Description is required.'
    if (!destination.fullDescription?.trim()) errors.fullDescription = 'Full Description is required.'
  }
  if (stepIndex === 1 && !destination.themeKeys?.length) errors.themeKeys = 'Select at least one Travel Theme.'
  if (stepIndex === 2) {
    if (!destination.region?.trim()) errors.region = 'Select a Province.'
    if (!destination.district?.trim()) errors.district = 'Select a District.'
    else if (destination.region && !isValidProvinceDistrict(destination.region, destination.district)) errors.district = 'Select a District within the chosen Province.'
    if (!hasCoordinates(destination) || !destination.locationConfirmed) errors.location = 'Confirm the Destination centre on the map.'
  }
  if (stepIndex === 3 && !destination.mainImage) errors.mainImage = 'Add a Main Image before continuing.'
  if (stepIndex === 4 && !destination.highlights?.length) errors.highlights = 'Add at least one Destination Highlight.'
  return errors
}

export function validateDestinationForReview(destination) {
  return [0, 1, 2, 3, 4].reduce((errors, stepIndex) => ({ ...errors, ...validateDestinationStep(destination, stepIndex) }), {})
}

export const validateDestinationForActivation = validateDestinationForReview

export function getFirstInvalidDestinationStep(destination) {
  for (let stepIndex = 0; stepIndex < 5; stepIndex += 1) if (Object.keys(validateDestinationStep(destination, stepIndex)).length) return stepIndex
  return null
}

export function getHighestReachableDestinationStep(destination) {
  const invalidStep = getFirstInvalidDestinationStep(destination)
  return invalidStep == null ? 5 : invalidStep
}

export function getDestinationResumeStep(destination, requestedStep = null) {
  const reachable = getHighestReachableDestinationStep(destination)
  if (Number.isInteger(requestedStep) && requestedStep >= 0) return Math.min(requestedStep, reachable)
  if (destination?.status === DESTINATION_STATUS.DRAFT && Number(destination.lastSavedStep) > 0) return Math.min(Math.max(0, Number(destination.lastSavedStep) - 1), reachable)
  return 0
}

export function createDestinationSaveMetadata(stepIndex, previousCompletedStep = 0, savedAt = new Date().toISOString()) {
  const sections = ['Destination Identity', 'Travel Themes', 'Location', 'Media', 'Highlights & Attractions', 'Review & Submit']
  return { draftStep: stepIndex, lastSavedStep: stepIndex + 1, lastCompletedStep: Math.max(Number(previousCompletedStep || 0), stepIndex + 1), updatedAt: savedAt, lastUpdatedAt: savedAt, lastUpdatedSection: sections[stepIndex] }
}

export function canTransitionDestinationStatus(from, to) {
  return (from === DESTINATION_STATUS.DRAFT && to === DESTINATION_STATUS.READY_FOR_REVIEW)
    || (from === DESTINATION_STATUS.READY_FOR_REVIEW && to === DESTINATION_STATUS.ACTIVE)
    || (from === DESTINATION_STATUS.ACTIVE && to === DESTINATION_STATUS.INACTIVE)
    || (from === DESTINATION_STATUS.INACTIVE && to === DESTINATION_STATUS.ACTIVE)
}

export function getDestinationLifecycleActions(status) {
  if (status === DESTINATION_STATUS.DRAFT) return ['VIEW', 'CONTINUE_SETUP']
  if (status === DESTINATION_STATUS.READY_FOR_REVIEW) return ['VIEW', 'REVIEW']
  if (status === DESTINATION_STATUS.ACTIVE) return ['VIEW', 'EDIT', 'DEACTIVATE']
  if (status === DESTINATION_STATUS.INACTIVE) return ['VIEW', 'EDIT', 'REACTIVATE']
  return ['VIEW']
}
