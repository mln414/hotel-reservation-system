import assert from 'node:assert/strict'
import { buildDestinationHotelCounts, filterDestinationCards, getDestinationCardData, getOrderedDestinationCards, groupNearbyPlacesByCategory } from '../src/utils/destinationDiscovery.js'

const destinations = [
  { id: 1, slug: 'colombo', name: 'Colombo', mainImage: 'colombo.jpg', shortDescription: 'A lively capital.', themeKeys: ['URBAN'], highlights: ['Dining', 'Shopping'], status: 'ACTIVE' },
  { id: 2, slug: 'galle', name: 'Galle', mainImage: 'galle.jpg', shortDescription: 'A historic coastal city.', themeKeys: ['HERITAGE', 'COAST'], highlights: ['Galle Fort', 'Southern Beaches', 'Lighthouse', 'Museums'], status: 'ACTIVE' },
  { id: 3, slug: 'yala', name: 'Yala', mainImage: 'yala.jpg', shortDescription: 'A wildlife landscape.', themeKeys: ['NATURE'], highlights: ['Safari'], status: 'ACTIVE' },
]
const publicHotels = [{ id: 10, destinationId: '2' }, { id: 11, destinationId: 2 }]

const counts = buildDestinationHotelCounts(destinations, publicHotels)
assert.equal(counts.get('2'), 2, 'public Hotel counts must normalize relationship IDs')
assert.equal(counts.get('1'), 0, 'zero-Hotel destinations must remain represented')

const cards = getOrderedDestinationCards(destinations, publicHotels)
assert.deepEqual(cards.map((card) => card.destination.name), ['Colombo', 'Galle', 'Yala'], 'canonical Destination order must remain stable')
assert.equal(cards[1].mainImage, 'galle.jpg', 'card media must derive from the Destination record')
assert.equal(cards[1].primaryTheme.key, 'HERITAGE', 'first configured theme must remain primary')
assert.deepEqual(cards[1].secondaryThemes.map((theme) => theme.key), ['COAST'], 'secondary themes must preserve relationships without repeating primary')
assert.deepEqual(cards[1].highlights, ['Galle Fort', 'Southern Beaches', 'Lighthouse'], 'cards must display at most three configured Highlights')
assert.equal(cards[1].remainingHighlightCount, 1)
assert.equal(cards[1].publicHotelCount, 2)

assert.deepEqual(filterDestinationCards(cards, { themeKey: 'COAST' }).map((card) => card.destination.name), ['Galle'], 'theme filters must use themeKeys')
assert.deepEqual(filterDestinationCards(cards, { query: 'galle' }).map((card) => card.destination.name), ['Galle'], 'search must match current Destination names')
assert.deepEqual(filterDestinationCards(cards, { query: 'beach' }).map((card) => card.destination.name), ['Galle'], 'search must match Highlights')
assert.deepEqual(filterDestinationCards(cards, { query: 'culture' }).map((card) => card.destination.name), ['Galle'], 'search must match canonical Theme definitions')
assert.equal(filterDestinationCards(cards, { themeKey: 'NATURE', query: 'Galle' }).length, 0, 'search and Theme must combine by intersection')

const renamed = getDestinationCardData({ ...destinations[1], name: 'Historic Galle', shortDescription: 'Updated shared description.', mainImage: 'updated.jpg' }, counts)
assert.equal(renamed.destination.name, 'Historic Galle', 'Destination name changes must propagate')
assert.equal(renamed.destination.shortDescription, 'Updated shared description.', 'Destination description changes must propagate')
assert.equal(renamed.mainImage, 'updated.jpg', 'Destination image changes must propagate')
assert.equal(getOrderedDestinationCards(destinations, publicHotels.slice(0, 1))[1].publicHotelCount, 1, 'Hotel publication changes must update counts through publicHotels')
assert.deepEqual(getOrderedDestinationCards([{ ...destinations[0], displayOrder: 2 }, { ...destinations[1], displayOrder: 1 }, destinations[2]], publicHotels).map((card) => card.destination.name), ['Galle', 'Colombo', 'Yala'], 'displayOrder must take precedence when configured')

const nearbyGroups=groupNearbyPlacesByCategory([{sourceId:'nature-far',type:'NATURE',distanceKm:4.2},{sourceId:'nature-near',type:'NATURE',distanceKm:1.1},{sourceId:'beach',type:'BEACH',distanceKm:2.4}],['NATURE','WILDLIFE','BEACH'])
assert.deepEqual(nearbyGroups.map((group)=>[group.categoryKey,group.results.length]),[['NATURE',2],['WILDLIFE',0],['BEACH',1]],'selected Nearby categories retain honest partial and zero-result groups')
assert.deepEqual(nearbyGroups[0].results.map((item)=>item.sourceId),['nature-near','nature-far'],'Nearby results sort nearest first within each category')

console.log('Destination discovery tests passed.')
