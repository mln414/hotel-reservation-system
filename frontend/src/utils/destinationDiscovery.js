import { getDestinationMainImage, getDestinationThemes } from './destinationDomain.js'

const normalize = (value) => String(value || '').trim().toLowerCase()

export function buildDestinationHotelCounts(destinations = [], publicHotels = []) {
  const counts = new Map(destinations.map((destination) => [String(destination.id), 0]))
  publicHotels.forEach((hotel) => {
    const key = String(hotel.destinationId)
    if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1)
  })
  return counts
}

export function getDestinationCardData(destination, hotelCounts = new Map()) {
  const themes = getDestinationThemes(destination)
  return {
    destination,
    route: `/destinations/${destination.slug}`,
    mainImage: getDestinationMainImage(destination),
    primaryTheme: themes[0] || null,
    secondaryThemes: themes.slice(1, 3),
    themes,
    highlights: (destination.highlights || []).slice(0, 3),
    remainingHighlightCount: Math.max(0, (destination.highlights || []).length - 3),
    publicHotelCount: hotelCounts.get(String(destination.id)) || 0,
  }
}

export function getOrderedDestinationCards(destinations = [], publicHotels = []) {
  const canonicalOrder = new Map(destinations.map((destination, index) => [String(destination.id), index]))
  const counts = buildDestinationHotelCounts(destinations, publicHotels)
  return destinations.map((destination) => getDestinationCardData(destination, counts)).sort((first, second) => {
    const firstHasOrder = first.destination.displayOrder !== '' && first.destination.displayOrder != null && Number.isFinite(Number(first.destination.displayOrder))
    const secondHasOrder = second.destination.displayOrder !== '' && second.destination.displayOrder != null && Number.isFinite(Number(second.destination.displayOrder))
    const firstOrder = Number(first.destination.displayOrder)
    const secondOrder = Number(second.destination.displayOrder)
    if (firstHasOrder && secondHasOrder && firstOrder !== secondOrder) return firstOrder - secondOrder
    if (firstHasOrder !== secondHasOrder) return firstHasOrder ? -1 : 1
    const canonicalDifference = canonicalOrder.get(String(first.destination.id)) - canonicalOrder.get(String(second.destination.id))
    return canonicalDifference || first.destination.name.localeCompare(second.destination.name)
  })
}

export function filterDestinationCards(cards = [], { themeKey = '', query = '' } = {}) {
  const search = normalize(query)
  return cards.filter((card) => {
    const matchesTheme = !themeKey || (card.destination.themeKeys || []).includes(themeKey)
    const searchable = [
      card.destination.name,
      card.destination.shortDescription,
      ...card.themes.flatMap((theme) => [theme.label, theme.description]),
      ...(card.destination.highlights || []),
    ].map(normalize).join(' ')
    return matchesTheme && (!search || searchable.includes(search))
  })
}

export function groupNearbyPlacesByCategory(results = [], categoryKeys = []) {
  return categoryKeys.map((categoryKey) => ({
    categoryKey,
    results: results.filter((item) => item.type === categoryKey).sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)),
  }))
}
