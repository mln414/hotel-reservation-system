import assert from 'node:assert/strict'
import { getHotelDisplayImages, getHotelGalleryImages, getHotelMainImage } from '../src/utils/hotelMedia.js'
import { deduplicateCollectionIds, getActiveCollections, getCollectionHotelCount, getCollectionsForHotel, getHomeCollections, getHotelsForCollection } from '../src/utils/stayCollectionDomain.js'
import { getRoomDisplayImages, getRoomGalleryImages, getRoomMainImage } from '../src/utils/roomMedia.js'
import { resolveHotelCollectionIds, getCollectionSearchUrl } from '../src/utils/stayCollectionDomain.js'

const hotel = { id: 302, mainImage: 'pool.jpg', image: 'old.jpg', gallery: ['pool.jpg', 'beach.jpg', 'room.jpg', 'beach.jpg'], collectionIds: ['luxury', 'coast', 'luxury'] }
assert.equal(getHotelMainImage(hotel), 'pool.jpg')
assert.deepEqual(getHotelGalleryImages(hotel), ['beach.jpg', 'room.jpg'])
assert.deepEqual(getHotelDisplayImages(hotel), ['pool.jpg', 'beach.jpg', 'room.jpg'])
assert.deepEqual(deduplicateCollectionIds(hotel.collectionIds), ['luxury', 'coast'])

const collections = [
  { id: 'coast', title: 'Coast', status: 'ACTIVE', showOnHome: true, displayOrder: 2 },
  { id: 'luxury', title: 'Luxury', status: 'ACTIVE', showOnHome: true, displayOrder: 1 },
  { id: 'hidden', title: 'Hidden', status: 'INACTIVE', showOnHome: true, displayOrder: 3 },
]
assert.deepEqual(getActiveCollections(collections).map((item) => item.id), ['luxury', 'coast'])
assert.deepEqual(getHomeCollections(collections).map((item) => item.id), ['luxury', 'coast'])
assert.deepEqual(getCollectionsForHotel(hotel, collections).map((item) => item.id), ['luxury', 'coast'])
assert.deepEqual(getHotelsForCollection([hotel, { id: 1, collectionIds: ['coast'] }], 'luxury').map((item) => item.id), [302])
assert.equal(getCollectionHotelCount([hotel, { id: 1, collectionIds: ['coast'] }], 'coast'), 2)

const room = { mainImage: 'suite.jpg', image: 'legacy.jpg', gallery: ['suite.jpg', 'bath.jpg', 'bath.jpg'] }
assert.equal(getRoomMainImage(room), 'suite.jpg')
assert.deepEqual(getRoomGalleryImages(room), ['bath.jpg'])
assert.deepEqual(getRoomDisplayImages(room), ['suite.jpg', 'bath.jpg'])

console.log('Hotel, Collection and Room media domain tests passed.')

const seededAssignments = { 301: ['luxury-escapes', 'heritage-stays'], 302: ['coastal-getaways'] }
assert.deepEqual(resolveHotelCollectionIds({ id: 301, collectionIds: [] }, seededAssignments), seededAssignments[301])
assert.deepEqual(resolveHotelCollectionIds({ id: 301, collectionIds: ['family-holidays'] }, seededAssignments), ['family-holidays'])
assert.deepEqual(resolveHotelCollectionIds({ id: 301, collectionIds: [], lastUpdatedSection: 'collections' }, seededAssignments), [])
assert.deepEqual(resolveHotelCollectionIds({ id: 999, collectionIds: [] }, seededAssignments), [])
assert.equal(getCollectionSearchUrl({ id: 'heritage-stays', slug: 'heritage-stays' }), '/hotels?collection=heritage-stays')
const linkedHotels = [301, 302].map((id) => ({ id, collectionIds: resolveHotelCollectionIds({ id, collectionIds: [] }, seededAssignments) }))
assert.deepEqual(getHotelsForCollection(linkedHotels, 'heritage-stays').map((item) => item.id), [301])
