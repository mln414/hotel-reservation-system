import { useCallback, useMemo, useState } from 'react'
import WebsiteContentContext from './websiteContentContext.js'

const initialHeroSlides = [
  { id: 'hero-1', hotelId: 601, hotelMediaReference: 'main', displayOrder: 1, status: 'ACTIVE' },
  { id: 'hero-2', hotelId: 501, hotelMediaReference: 'main', displayOrder: 2, status: 'ACTIVE' },
  { id: 'hero-3', hotelId: 302, hotelMediaReference: 'main', displayOrder: 3, status: 'ACTIVE' },
]

const move = (items, id, direction) => { const index = items.findIndex((item) => String(item.id) === String(id)); const target = index + direction; if (index < 0 || target < 0 || target >= items.length) return items; const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next.map((item, order) => typeof item === 'object' ? { ...item, displayOrder: order + 1 } : item) }
const moveId = (items, id, direction) => { const index = items.findIndex((item) => String(item) === String(id)); const target = index + direction; if (index < 0 || target < 0 || target >= items.length) return items; const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next }

export function WebsiteContentProvider({ children }) {
  const [heroSlides, setHeroSlides] = useState(initialHeroSlides)
  const [heroSettings, setHeroSettings] = useState({ animation: 'FADE', autoplay: true, transitionSeconds: 6 })
  const [featuredHotelIds, setFeaturedHotelIds] = useState([501, 302, 101, 401])
  const [featuredExperienceIds, setFeaturedExperienceIds] = useState([1, 2, 'story-1'])
  const addHeroSlide = useCallback((data) => { const item = { ...data, id: `hero-${Date.now()}`, displayOrder: heroSlides.length + 1 }; setHeroSlides((current) => [...current, item]); return item }, [heroSlides.length])
  const updateHeroSlide = useCallback((id, updates) => setHeroSlides((current) => current.map((item) => String(item.id) === String(id) ? { ...item, ...updates } : item)), [])
  const moveHeroSlide = useCallback((id, direction) => setHeroSlides((current) => move(current, id, direction)), [])
  const addFeaturedHotel = useCallback((id) => setFeaturedHotelIds((current) => current.some((item) => String(item) === String(id)) || current.length >= 6 ? current : [...current, id]), [])
  const removeFeaturedHotel = useCallback((id) => setFeaturedHotelIds((current) => current.filter((item) => String(item) !== String(id))), [])
  const moveFeaturedHotel = useCallback((id, direction) => setFeaturedHotelIds((current) => moveId(current, id, direction)), [])
  const setExperienceFeatured = useCallback((id, featured) => setFeaturedExperienceIds((current) => featured ? (current.some((item) => String(item) === String(id)) || current.length >= 6 ? current : [...current, id]) : current.filter((item) => String(item) !== String(id))), [])
  const moveFeaturedExperience = useCallback((id, direction) => setFeaturedExperienceIds((current) => moveId(current, id, direction)), [])
  const value = useMemo(() => ({ heroSlides, heroSettings, featuredHotelIds, featuredExperienceIds, addHeroSlide, updateHeroSlide, moveHeroSlide, updateHeroSettings: setHeroSettings, addFeaturedHotel, removeFeaturedHotel, moveFeaturedHotel, setExperienceFeatured, moveFeaturedExperience }), [heroSlides, heroSettings, featuredHotelIds, featuredExperienceIds, addHeroSlide, updateHeroSlide, moveHeroSlide, addFeaturedHotel, removeFeaturedHotel, moveFeaturedHotel, setExperienceFeatured, moveFeaturedExperience])
  return <WebsiteContentContext.Provider value={value}>{children}</WebsiteContentContext.Provider>
}
