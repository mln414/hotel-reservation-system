import assert from 'node:assert/strict'
import { getExperiencesByCategory, getExperiencesByDestination, getFeaturedExperiences, getPublicFeaturedHotels, getRelatedHotelsForExperience, getValidHeroSlides, slugify } from '../src/utils/contentDomain.js'
import { getHotelGallery, getHotelMainImage, resolveHotelMedia } from '../src/utils/hotelMedia.js'

const hotels = [
  { id: 302, name: 'Ocean Bay', mainImage: 'main-a', image: 'main-a', gallery: ['gallery-a', 'gallery-b'], publicationStatus: 'ACTIVE', setupStatus: 'COMPLETE' },
  { id: 501, name: 'Hidden Hotel', image: 'hidden', gallery: [], publicationStatus: 'INACTIVE', setupStatus: 'COMPLETE' },
]
assert.equal(getHotelMainImage(hotels[0]), 'main-a')
assert.deepEqual(getHotelGallery(hotels[0]), ['gallery-a', 'gallery-b'])
assert.equal(resolveHotelMedia(hotels[0], 'gallery:gallery-b'), 'gallery-b')
assert.equal(resolveHotelMedia(hotels[0], 'gallery:removed'), 'main-a', 'removed Hero media falls back to Main Photo')
assert.deepEqual(getPublicFeaturedHotels([501, '302', 302], hotels).map((item) => item.id), [302], 'visibility and mixed ID types resolve safely')
assert.equal(getValidHeroSlides([{ id: 1, hotelId: '302', hotelMediaReference: 'gallery:gallery-a', displayOrder: 1, status: 'ACTIVE' }, { id: 2, hotelId: 501, hotelMediaReference: 'main', displayOrder: 2, status: 'ACTIVE' }], hotels).length, 1)
const experiences = [{ id: 1, status: 'ACTIVE', category: 'WILDLIFE_NATURE', destinationId: 6 }, { id: 2, status: 'DRAFT', category: 'COAST_WATER', destinationId: 3 }]
assert.equal(getFeaturedExperiences([experiences[0]], ['1', 1]).length, 1)
assert.equal(getExperiencesByCategory(experiences, 'WILDLIFE_NATURE').length, 1)
assert.equal(getExperiencesByDestination(experiences, '6').length, 1)
assert.deepEqual(getRelatedHotelsForExperience({ relatedHotelIds: [302, '302', 501] }, hotels).map((item) => item.id), [302])
assert.equal(slugify('Yala Safari at Sunrise'), 'yala-safari-at-sunrise')
console.log('Content domain tests passed.')
