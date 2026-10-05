import { getHotelMainImage, isPublicHotel, normalizeId, resolveHotelMedia } from './hotelMedia.js'
export { normalizeId }

export const EXPERIENCE_CATEGORIES = [
  ['CULTURE_HERITAGE', 'Culture & Heritage'], ['WILDLIFE_NATURE', 'Wildlife & Nature'],
  ['COAST_WATER', 'Coast & Water'], ['ADVENTURE', 'Adventure'], ['FOOD_TEA', 'Food & Tea'],
  ['WELLNESS', 'Wellness'], ['FAMILY', 'Family'],
]
export const categoryLabel = (key) => EXPERIENCE_CATEGORIES.find(([value]) => value === key)?.[1] || key || 'Uncategorised'
export const contentTypeLabel = (type) => type === 'TRAVEL_STORY' ? 'Travel Story' : 'Experience'
export const slugify = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const uniqueIds = (ids) => [...new Map((ids || []).map((id) => [normalizeId(id), id])).values()]

export function getPublicFeaturedHotels(featuredHotelIds, hotels) {
  return uniqueIds(featuredHotelIds).map((id) => hotels.find((hotel) => normalizeId(hotel.id) === normalizeId(id))).filter(isPublicHotel)
}

export function getValidHeroSlides(slides, hotels) {
  return (slides || []).filter((slide) => slide.status === 'ACTIVE').sort((a, b) => a.displayOrder - b.displayOrder).map((slide) => {
    const hotel = hotels.find((item) => normalizeId(item.id) === normalizeId(slide.hotelId))
    return isPublicHotel(hotel) ? { ...slide, hotel, image: resolveHotelMedia(hotel, slide.hotelMediaReference) } : null
  }).filter(Boolean)
}

export const getActiveExperiences = (items) => (items || []).filter((item) => item.status === 'ACTIVE' && item.contentType !== 'EXPERIENCE_COLLECTION')
export const getFeaturedExperiences = (items, ids) => uniqueIds(ids).map((id) => items.find((item) => normalizeId(item.id) === normalizeId(id))).filter((item) => item?.status === 'ACTIVE')
export const getExperiencesByCategory = (items, category) => category ? items.filter((item) => item.category === category) : items
export const getExperiencesByDestination = (items, destinationId) => destinationId ? items.filter((item) => normalizeId(item.destinationId) === normalizeId(destinationId)) : items
export const getRelatedHotelsForExperience = (experience, hotels) => uniqueIds(experience?.relatedHotelIds).map((id) => hotels.find((hotel) => normalizeId(hotel.id) === normalizeId(id))).filter(isPublicHotel)
export const getExperienceHeroImage = (item) => item?.heroImage || item?.image || getHotelMainImage(null)
