import { useCallback, useMemo } from 'react'
import WebsiteContentContext from './websiteContentContext.js'
import useAuth from './useAuth.js'
import usePersistentContent from './usePersistentContent.js'

const initialHeroSlides = [
  { id: 'hero-1', hotelId: 601, hotelMediaReference: 'main', displayOrder: 1, status: 'ACTIVE' },
  { id: 'hero-2', hotelId: 501, hotelMediaReference: 'main', displayOrder: 2, status: 'ACTIVE' },
  { id: 'hero-3', hotelId: 302, hotelMediaReference: 'main', displayOrder: 3, status: 'ACTIVE' },
]
const initialHeroSettings = [{ id: 'settings', animation: 'FADE', autoplay: true, transitionSeconds: 6, status: 'ACTIVE' }]
const initialFeaturedHotelIds = [501, 302, 101, 401]
const initialFeaturedExperienceIds = [1, 2, 'story-1']
const initialFeaturedHotels = initialFeaturedHotelIds.map((hotelId, index) => ({
  id: String(hotelId), hotelId, displayOrder: index + 1, status: 'ACTIVE',
}))
const initialFeaturedExperiences = initialFeaturedExperienceIds.map((experienceId, index) => ({
  id: String(experienceId), experienceId, displayOrder: index + 1, status: 'ACTIVE',
}))

const normalizeId = (value) => /^\d+$/.test(String(value)) ? Number(value) : value
const move = (items, id, direction) => {
  const index = items.findIndex((item) => String(item.id) === String(id))
  const target = index + direction
  if (index < 0 || target < 0 || target >= items.length) return null
  const next = [...items]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next.map((item, order) => ({ ...item, displayOrder: order + 1 }))
}

export function WebsiteContentProvider({ children }) {
  const { user } = useAuth()
  const heroStore = usePersistentContent('HERO_SLIDE', initialHeroSlides, user)
  const settingsStore = usePersistentContent('HERO_SETTINGS', initialHeroSettings, user)
  const featuredHotelStore = usePersistentContent('FEATURED_HOTEL', initialFeaturedHotels, user)
  const featuredExperienceStore = usePersistentContent('FEATURED_EXPERIENCE', initialFeaturedExperiences, user)
  const { create: createHeroSlide, update: updateHeroSlideEntry, updateMany: updateHeroSlides } = heroStore
  const { update: updateSettingsEntry } = settingsStore
  const { create: createFeaturedHotel, update: updateFeaturedHotel, updateMany: updateFeaturedHotels } = featuredHotelStore
  const { create: createFeaturedExperience, update: updateFeaturedExperience, updateMany: updateFeaturedExperiences } = featuredExperienceStore
  const { items: featuredHotelEntries } = featuredHotelStore
  const { items: featuredExperienceEntries } = featuredExperienceStore

  const heroSlides = heroStore.items
  const heroSettings = settingsStore.items.find((item) => String(item.id) === 'settings') || initialHeroSettings[0]
  const featuredHotelItems = featuredHotelStore.items
    .filter((item) => item.status === 'ACTIVE')
    .sort((a, b) => a.displayOrder - b.displayOrder)
  const featuredExperienceItems = featuredExperienceStore.items
    .filter((item) => item.status === 'ACTIVE')
    .sort((a, b) => a.displayOrder - b.displayOrder)
  const featuredHotelIds = featuredHotelItems.map((item) => normalizeId(item.hotelId ?? item.id))
  const featuredExperienceIds = featuredExperienceItems.map((item) => normalizeId(item.experienceId ?? item.id))

  const addHeroSlide = useCallback((data) => createHeroSlide({
    ...data,
    id: `hero-${Date.now()}`,
    displayOrder: heroSlides.length + 1,
    status: data.status || 'ACTIVE',
  }), [createHeroSlide, heroSlides.length])
  const updateHeroSlide = useCallback((id, updates) => updateHeroSlideEntry(id, updates), [updateHeroSlideEntry])
  const moveHeroSlide = useCallback(async (id, direction) => {
    const next = move(heroSlides, id, direction)
    if (next) await updateHeroSlides(next)
  }, [heroSlides, updateHeroSlides])
  const updateHeroSettings = useCallback((settings) => updateSettingsEntry('settings', settings), [updateSettingsEntry])

  const addFeaturedHotel = useCallback(async (id) => {
    if (featuredHotelIds.some((item) => String(item) === String(id)) || featuredHotelIds.length >= 6) return
    const displayOrder = featuredHotelItems.length + 1
    await createFeaturedHotel({ id: String(id), hotelId: id, displayOrder, status: 'ACTIVE' })
  }, [featuredHotelIds, featuredHotelItems.length, createFeaturedHotel])
  const removeFeaturedHotel = useCallback((id) => {
    const item = featuredHotelEntries.find((record) => String(record.hotelId ?? record.id) === String(id))
    return item ? updateFeaturedHotel(item.id, { status: 'INACTIVE' }) : undefined
  }, [featuredHotelEntries, updateFeaturedHotel])
  const moveFeaturedHotel = useCallback(async (id, direction) => {
    const next = move(featuredHotelItems, String(id), direction)
    if (next) await updateFeaturedHotels(next)
  }, [featuredHotelItems, updateFeaturedHotels])

  const setExperienceFeatured = useCallback(async (id, featured) => {
    const current = featuredExperienceEntries.find((item) => String(item.experienceId ?? item.id) === String(id))
    if (current) {
      await updateFeaturedExperience(current.id, { status: featured ? 'ACTIVE' : 'INACTIVE' })
      return
    }
    if (featured && featuredExperienceIds.length < 6) {
      await createFeaturedExperience({
        id: String(id),
        experienceId: normalizeId(id),
        displayOrder: featuredExperienceItems.length + 1,
        status: 'ACTIVE',
      })
    }
  }, [featuredExperienceEntries, updateFeaturedExperience, createFeaturedExperience, featuredExperienceIds.length, featuredExperienceItems.length])
  const moveFeaturedExperience = useCallback(async (id, direction) => {
    const next = move(featuredExperienceItems, String(id), direction)
    if (next) await updateFeaturedExperiences(next)
  }, [featuredExperienceItems, updateFeaturedExperiences])

  const value = useMemo(() => ({
    heroSlides,
    heroSettings,
    featuredHotelIds,
    featuredExperienceIds,
    contentLoading: heroStore.loading || settingsStore.loading || featuredHotelStore.loading || featuredExperienceStore.loading,
    contentError: [heroStore.error, settingsStore.error, featuredHotelStore.error, featuredExperienceStore.error].filter(Boolean).join(' '),
    addHeroSlide,
    updateHeroSlide,
    moveHeroSlide,
    updateHeroSettings,
    addFeaturedHotel,
    removeFeaturedHotel,
    moveFeaturedHotel,
    setExperienceFeatured,
    moveFeaturedExperience,
  }), [heroSlides, heroSettings, featuredHotelIds, featuredExperienceIds, heroStore.loading, settingsStore.loading, featuredHotelStore.loading, featuredExperienceStore.loading, heroStore.error, settingsStore.error, featuredHotelStore.error, featuredExperienceStore.error, addHeroSlide, updateHeroSlide, moveHeroSlide, updateHeroSettings, addFeaturedHotel, removeFeaturedHotel, moveFeaturedHotel, setExperienceFeatured, moveFeaturedExperience])

  return <WebsiteContentContext.Provider value={value}>{children}</WebsiteContentContext.Provider>
}
