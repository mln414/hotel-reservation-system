import { ATTRACTION_TYPES, calculateDistanceKm } from '../utils/destinationDomain.js'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const cache = new Map()
const valueToType = new Map([['historic','HERITAGE'],['attraction','HERITAGE'],['beach','BEACH'],['viewpoint','VIEWPOINT'],['zoo','WILDLIFE'],['nature_reserve','WILDLIFE'],['place_of_worship','RELIGIOUS'],['museum','MUSEUM'],['park','PARK'],['garden','PARK'],['theme_park','FAMILY'],['mall','SHOPPING'],['marketplace','SHOPPING']])
const tourismPriority = new Map(['HERITAGE','BEACH','VIEWPOINT','MUSEUM','WILDLIFE','NATURE','RELIGIOUS','PARK','FAMILY','SHOPPING'].map((type,index)=>[type,index]))

function buildQueries(keys, radius, latitude, longitude) { return ATTRACTION_TYPES.filter((type) => keys.includes(type.key)).flatMap((type) => type.overpass).map((entry) => { const [key, value] = entry.split('='); const filter = value ? `["${key}"="${value}"]` : `["${key}"]`; return `nwr(around:${radius},${latitude},${longitude})${filter};` }).join('') }
function inferType(tags = {}) { for (const value of Object.values(tags)) if (valueToType.has(value)) return valueToType.get(value); return 'NATURE' }
function centerOf(element) { return element.center || { lat: element.lat, lon: element.lon } }

export async function discoverNearbyPlaces({ latitude, longitude, radiusKm = 10, categoryKeys = [], signal }) {
  const key = `${Number(latitude).toFixed(4)}:${Number(longitude).toFixed(4)}:${radiusKm}:${[...categoryKeys].sort().join(',')}`
  if (cache.has(key)) return cache.get(key)
  const queries = buildQueries(categoryKeys.length ? categoryKeys : ['HERITAGE','BEACH','NATURE','MUSEUM','RELIGIOUS','PARK','VIEWPOINT'], radiusKm * 1000, latitude, longitude)
  const query = `[out:json][timeout:20];(${queries});out center tags 80;`
  const timeoutController = new AbortController(); const timeout = globalThis.setTimeout(() => timeoutController.abort(), 25000)
  if (signal) signal.addEventListener('abort', () => timeoutController.abort(), { once: true })
  let response
  try { response = await fetch(OVERPASS_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: new URLSearchParams({ data: query }), signal: timeoutController.signal }) }
  finally { globalThis.clearTimeout(timeout) }
  if (!response.ok) throw new Error('Nearby place provider is unavailable.')
  const payload = await response.json(); const origin = { latitude, longitude }
  const results = (payload.elements || []).map((element) => { const center = centerOf(element); const name = element.tags?.name || element.tags?.['name:en']; if (!name || !Number.isFinite(center?.lat) || !Number.isFinite(center?.lon)) return null; const type = inferType(element.tags); const candidate = { sourceId: `${element.type}/${element.id}`, source: 'openstreetmap', name, type, latitude: center.lat, longitude: center.lon, shortAddress: [element.tags?.['addr:street'], element.tags?.['addr:city']].filter(Boolean).join(', '), suggestedIconKey: type }; return { ...candidate, distanceKm: calculateDistanceKm(origin, candidate) } }).filter(Boolean)
    .filter((item, index, all) => all.findIndex((candidate) => candidate.name.toLowerCase() === item.name.toLowerCase()) === index)
    .sort((a, b) => (tourismPriority.get(a.type) ?? 99) - (tourismPriority.get(b.type) ?? 99) || a.distanceKm - b.distanceKm || a.name.localeCompare(b.name)).slice(0, 30)
  cache.set(key, results); return results
}

export function clearNearbyPlacesCache() { cache.clear() }

export async function findAttractionPlace({ name, destination, signal }) {
  const query = [name, destination?.district, destination?.region, 'Sri Lanka'].filter(Boolean).join(', ')
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.search = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', countrycodes: 'lk' }).toString()
  const response = await fetch(url, { headers: { Accept: 'application/json', 'Accept-Language': 'en' }, signal })
  if (!response.ok) throw new Error('Place lookup is unavailable.')
  const [result] = await response.json()
  if (!result || !Number.isFinite(Number(result.lat)) || !Number.isFinite(Number(result.lon))) return null
  return { latitude: Number(Number(result.lat).toFixed(6)), longitude: Number(Number(result.lon).toFixed(6)), label: result.display_name || name }
}
