import { useCallback, useEffect, useMemo, useState } from 'react'
import initialDining from '../data/dining.js'
import initialExperiences from '../data/experiences.js'
import initialFacilities from '../data/hotelFacilities.js'
import initialOffers from '../data/offers.js'
import initialTravelStories from '../data/travelStories.js'
import PropertyContentContext from './propertyContentContext.js'
import { slugify } from '../utils/contentDomain.js'
import { buildOfferDuplicate, createUniqueOfferSlug } from '../utils/offerManagement.js'
import { resolveCatalogImageUrl } from '../utils/hotelMedia.js'
import { offerApi } from '../services/offerApi.js'

const now = () => new Date().toISOString()
const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
const normalizeStatus = (item) => item.status || (item.active === false ? 'INACTIVE' : 'ACTIVE')
const normalizeDining = (item) => ({ ...item, status: normalizeStatus(item), active: normalizeStatus(item) === 'ACTIVE', fullDescription: item.fullDescription || item.shortDescription, mealServices: item.mealServices || item.mealPeriods || [], highlights: item.highlights || item.features || [] })
const categoryKeys = { 'Wildlife & Nature': 'WILDLIFE_NATURE', 'Culture & Heritage': 'CULTURE_HERITAGE', 'Beaches & Water': 'COAST_WATER', 'Coast & Adventure': 'COAST_WATER', 'Wellness & Relaxation': 'WELLNESS', Culture: 'CULTURE_HERITAGE', Adventure: 'ADVENTURE', Relaxation: 'WELLNESS', Nature: 'WILDLIFE_NATURE' }
const storyText = (content) => (content || []).map((item) => typeof item === 'string' ? item : [item.heading, ...(item.paragraphs || [])].filter(Boolean).join('\n')).join('\n\n')
const normalizeExperience = (item, index = 0) => {
  const title = item.title || item.name
  const status = item.status || (item.active === false ? 'INACTIVE' : 'ACTIVE')
  const contentType = item.contentType || 'EXPERIENCE'
  return { ...item, id: item.id, slug: item.slug || slugify(title), contentType, name: title, title, category: categoryKeys[item.category] || item.category || 'CULTURE_HERITAGE', destinationId: item.destinationId || (String(item.location || '').includes('Yala') ? 6 : item.hotelId === 302 ? 3 : null), shortDescription: item.shortDescription || item.summary || '', fullDescription: item.fullDescription || item.description || storyText(item.content), description: item.fullDescription || item.description || storyText(item.content), heroImage: item.heroImage || item.image, image: item.heroImage || item.image, galleryImages: item.galleryImages || [], suitableFor: item.suitableFor || [], highlights: item.highlights || [], relatedHotelIds: [...new Set(item.relatedHotelIds || (item.hotelId ? [item.hotelId] : []))], featuredOnHome: item.featuredOnHome ?? item.featured ?? false, featured: item.featuredOnHome ?? item.featured ?? false, displayOrder: item.displayOrder ?? index + 1, status, active: status === 'ACTIVE', bestTime: item.bestTime || item.availabilityNote || '', locationText: item.locationText || item.location || '', createdAt: item.createdAt || item.publishedDate || now(), updatedAt: item.updatedAt || item.publishedDate || now() }
}
const normalizeStory = (item, index) => normalizeExperience({ ...item, id: `story-${item.id}`, contentType: 'TRAVEL_STORY', category: 'CULTURE_HERITAGE', shortDescription: item.summary, fullDescription: storyText(item.content), heroImage: item.image, galleryImages: [], status: item.active ? 'ACTIVE' : 'INACTIVE', featuredOnHome: item.featured }, index)
const normalizeOffer = (item) => {
  const startDate = item.stayStartDate || item.startDate || item.validFrom || ''
  const endDate = item.stayEndDate || item.endDate || item.validTo || ''
  const minimumStay = item.minimumStay ?? item.minimumNights ?? 1
  const status = item.status || (item.active === false ? 'INACTIVE' : 'ACTIVE')
  const targetHotelIds = item.targetHotelIds || item.applicableHotelIds || []
  const targetRoomCategoryKeys = Array.isArray(item.targetRoomCategoryKeys || item.applicableRoomTypeGroupKeys)
    ? (item.targetRoomCategoryKeys || item.applicableRoomTypeGroupKeys)
    : String(item.targetRoomCategoryKeys || item.applicableRoomTypeGroupKeys || '').split(',').map((value) => value.trim()).filter(Boolean)
  const targetRoomTypeIds = item.targetRoomTypeIds || item.applicableRoomTypeIds || []
  const parsedDays = Array.isArray(item.applicableDays)
    ? item.applicableDays
    : (typeof item.applicableDays === 'string' && item.applicableDays ? item.applicableDays.split(',') : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])

  return {
    ...item,
    id: item.id,
    slug: item.slug || slugify(item.title),
    title: item.title,
    name: item.title,
    shortDescription: item.shortDescription || '',
    fullDescription: item.fullDescription || item.description || '',
    description: item.fullDescription || item.description || '',
    discountType: item.discountType || 'PERCENTAGE',
    discountValue: Number(item.discountValue || 0),
    fixedDiscountScope: item.fixedDiscountScope || 'PER_STAY',
    status,
    active: status === 'ACTIVE',
    stayStartDate: startDate,
    startDate,
    validFrom: startDate,
    stayEndDate: endDate,
    endDate,
    validTo: endDate,
    minimumStay,
    minimumNights: minimumStay,
    maximumStay: item.maximumStay || '',
    bookingStartDate: item.bookingStartDate || '',
    bookingEndDate: item.bookingEndDate || '',
    applicableDays: parsedDays,
    featuredOnHome: Boolean(item.featuredOnHome ?? item.featured),
    displayOrder: Number(item.displayOrder || 0),
    heroImage: resolveCatalogImageUrl(item.heroImage || item.image) || '/assets/images/placeholder.jpg',
    image: resolveCatalogImageUrl(item.heroImage || item.image) || '/assets/images/placeholder.jpg',
    terms: Array.isArray(item.terms) ? item.terms : (typeof item.terms === 'string' && item.terms ? [item.terms] : []),
    targetHotelIds,
    applicableHotelIds: targetHotelIds,
    targetRoomCategoryKeys,
    applicableRoomTypeGroupKeys: targetRoomCategoryKeys,
    targetRoomTypeIds,
    applicableRoomTypeIds: targetRoomTypeIds,
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(),
  }
}

export function PropertyContentProvider({ children }) {
  const [facilities, setFacilities] = useState(initialFacilities)
  const [diningItems, setDiningItems] = useState(() => initialDining.map(normalizeDining))
  const [experiences, setExperiences] = useState(() => [...initialExperiences.map(normalizeExperience), ...initialTravelStories.map(normalizeStory)])
  const [offers, setOffers] = useState(() => initialOffers.map(normalizeOffer))
  const [offerDrafts, setOfferDrafts] = useState({})
  const [offersLoading, setOffersLoading] = useState(false)

  const refreshOffers = useCallback(async () => {
    setOffersLoading(true)
    try {
      let records
      try {
        records = await offerApi.listOffers()
      } catch {
        records = await offerApi.listPublicOffers()
      }
      if (Array.isArray(records) && records.length > 0) {
        setOffers(records.map(normalizeOffer))
      }
    } catch {
      // Retain fallback initial offers
    } finally {
      setOffersLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshOffers()
  }, [refreshOffers])

  const addFacility = useCallback((data) => { const item = { ...data, id: createId('facility'), name: data.name.trim(), active: data.active !== false, createdAt: now(), updatedAt: now() }; setFacilities((current) => [...current, item]); return item }, [])
  const updateFacility = useCallback((id, updates) => setFacilities((current) => current.map((item) => String(item.id) === String(id) ? { ...item, ...updates, updatedAt: now() } : item)), [])
  const setFacilityActive = useCallback((id, active) => updateFacility(id, { active }), [updateFacility])

  const addDining = useCallback((data) => { const item = normalizeDining({ ...data, id: createId('dining'), createdAt: now(), updatedAt: now() }); setDiningItems((current) => [...current, item]); return item }, [])
  const updateDining = useCallback((id, updates) => setDiningItems((current) => current.map((item) => String(item.id) === String(id) ? normalizeDining({ ...item, ...updates, updatedAt: now() }) : item)), [])
  const setDiningStatus = useCallback((id, status) => updateDining(id, { status, active: status === 'ACTIVE' }), [updateDining])

  const addExperience = useCallback((data) => { const base = slugify(data.slug || data.title) || `content-${Date.now()}`; let slug = base; let suffix = 2; while (experiences.some((item) => item.slug === slug)) slug = `${base}-${suffix++}`; const created = normalizeExperience({ ...data, slug, id: createId('experience'), createdAt: now(), updatedAt: now() }, experiences.length); setExperiences((current) => [...current, created]); return created }, [experiences])
  const updateExperience = useCallback((id, updates) => setExperiences((current) => current.map((item) => String(item.id) === String(id) ? normalizeExperience({ ...item, ...updates, updatedAt: now() }) : item)), [])
  const setExperienceStatus = useCallback((id, status) => updateExperience(id, { status, active: status === 'ACTIVE' }), [updateExperience])

  const addOffer = useCallback(async (data) => {
    const payload = {
      title: data.title?.trim(),
      shortDescription: data.shortDescription?.trim(),
      fullDescription: data.fullDescription?.trim() || data.shortDescription?.trim(),
      discountType: data.discountType || 'PERCENTAGE',
      discountValue: Number(data.discountValue || 0),
      fixedDiscountScope: data.fixedDiscountScope || 'PER_STAY',
      stayStartDate: data.stayStartDate || data.startDate || null,
      stayEndDate: data.stayEndDate || data.endDate || null,
      bookingStartDate: data.bookingStartDate || null,
      bookingEndDate: data.bookingEndDate || null,
      minimumStay: data.minimumStay !== '' && data.minimumStay != null ? Number(data.minimumStay) : 1,
      maximumStay: data.maximumStay !== '' && data.maximumStay != null ? Number(data.maximumStay) : null,
      applicableDays: Array.isArray(data.applicableDays) ? data.applicableDays.join(',') : (data.applicableDays || null),
      status: data.status || 'ACTIVE',
      featured: Boolean(data.featuredOnHome),
      displayOrder: Number(data.displayOrder || 0),
      image: data.image || data.heroImage || null,
      terms: Array.isArray(data.terms) ? data.terms : [],
      targetHotelIds: Array.isArray(data.targetHotelIds) && data.targetHotelIds.length ? data.targetHotelIds.map(Number) : (Array.isArray(data.applicableHotelIds) && data.applicableHotelIds.length ? data.applicableHotelIds.map(Number) : null),
      targetRoomCategoryKeys: Array.isArray(data.targetRoomCategoryKeys) && data.targetRoomCategoryKeys.length ? data.targetRoomCategoryKeys.join(',') : null,
      targetRoomTypeIds: Array.isArray(data.targetRoomTypeIds) && data.targetRoomTypeIds.length ? data.targetRoomTypeIds.map(Number) : null,
    }

    try {
      const created = await offerApi.createOffer(payload)
      const normalized = normalizeOffer(created)
      setOffers((current) => [...current.filter((item) => String(item.id) !== String(normalized.id)), normalized])
      return normalized
    } catch (err) {
      const local = normalizeOffer({ ...data, id: createId('offer'), createdAt: now(), updatedAt: now() })
      setOffers((current) => [...current, local])
      throw err
    }
  }, [])

  const updateOffer = useCallback(async (id, updates) => {
    const isBackendId = Number.isInteger(Number(id)) && Number(id) > 0
    if (isBackendId) {
      const payload = {
        title: updates.title?.trim(),
        shortDescription: updates.shortDescription?.trim(),
        fullDescription: updates.fullDescription?.trim() || updates.shortDescription?.trim(),
        discountType: updates.discountType,
        discountValue: updates.discountValue != null ? Number(updates.discountValue) : undefined,
        fixedDiscountScope: updates.fixedDiscountScope,
        stayStartDate: updates.stayStartDate || updates.startDate || null,
        stayEndDate: updates.stayEndDate || updates.endDate || null,
        bookingStartDate: updates.bookingStartDate || null,
        bookingEndDate: updates.bookingEndDate || null,
        minimumStay: updates.minimumStay !== '' && updates.minimumStay != null ? Number(updates.minimumStay) : 1,
        maximumStay: updates.maximumStay !== '' && updates.maximumStay != null ? Number(updates.maximumStay) : null,
        applicableDays: Array.isArray(updates.applicableDays) ? updates.applicableDays.join(',') : (updates.applicableDays || null),
        featured: updates.featuredOnHome != null ? Boolean(updates.featuredOnHome) : undefined,
        displayOrder: updates.displayOrder != null ? Number(updates.displayOrder) : undefined,
        image: updates.image || updates.heroImage,
        terms: Array.isArray(updates.terms) ? updates.terms : undefined,
        targetHotelIds: Array.isArray(updates.targetHotelIds) ? updates.targetHotelIds.map(Number) : (Array.isArray(updates.applicableHotelIds) ? updates.applicableHotelIds.map(Number) : undefined),
        targetRoomCategoryKeys: Array.isArray(updates.targetRoomCategoryKeys) ? updates.targetRoomCategoryKeys.join(',') : undefined,
        targetRoomTypeIds: Array.isArray(updates.targetRoomTypeIds) ? updates.targetRoomTypeIds.map(Number) : undefined,
      }

      try {
        const saved = await offerApi.updateOffer(id, payload)
        const normalized = normalizeOffer(saved)
        setOffers((current) => current.map((item) => String(item.id) === String(id) ? normalized : item))
        return normalized
      } catch (err) {
        setOffers((current) => current.map((item) => String(item.id) === String(id) ? normalizeOffer({ ...item, ...updates, updatedAt: now() }) : item))
        throw err
      }
    } else {
      setOffers((current) => current.map((item) => String(item.id) === String(id) ? normalizeOffer({ ...item, ...updates, updatedAt: now() }) : item))
    }
  }, [])

  const setOfferStatus = useCallback(async (id, status) => {
    const isBackendId = Number.isInteger(Number(id)) && Number(id) > 0
    if (isBackendId) {
      try {
        const saved = await offerApi.updateOfferStatus(id, status)
        const normalized = normalizeOffer(saved)
        setOffers((current) => current.map((item) => String(item.id) === String(id) ? normalized : item))
        return normalized
      } catch (err) {
        setOffers((current) => current.map((item) => String(item.id) === String(id) ? normalizeOffer({ ...item, status, active: status === 'ACTIVE', updatedAt: now() }) : item))
        throw err
      }
    } else {
      setOffers((current) => current.map((item) => String(item.id) === String(id) ? normalizeOffer({ ...item, status, active: status === 'ACTIVE', updatedAt: now() }) : item))
    }
  }, [])

  const deleteOffer = useCallback(async (id) => {
    const isBackendId = Number.isInteger(Number(id)) && Number(id) > 0
    if (isBackendId) {
      await offerApi.deleteOffer(id)
    }
    setOffers((current) => current.filter((item) => String(item.id) !== String(id)))
  }, [])

  const duplicateOffer = useCallback(async (id) => {
    const source = offers.find((item) => String(item.id) === String(id))
    if (!source) return null

    const duplicateData = buildOfferDuplicate(source, {
      title: `${source.title} (Copy)`,
      status: 'DRAFT',
    })

    try {
      return await addOffer(duplicateData)
    } catch {
      const copy = normalizeOffer(buildOfferDuplicate(source, { id: createId('offer'), slug: createUniqueOfferSlug(`${source.slug || slugify(source.title)}-copy`, offers), createdAt: now() }))
      setOffers((current) => [...current, copy])
      return copy
    }
  }, [offers, addOffer])

  const saveOfferDraft = useCallback((key, draft) => setOfferDrafts((current) => ({ ...current, [String(key)]: draft })), [])
  const clearOfferDraft = useCallback((key) => setOfferDrafts((current) => { const next = { ...current }; delete next[String(key)]; return next }), [])

  const value = useMemo(() => ({
    facilities, diningItems, experiences, offers, offerDrafts, offersLoading, refreshOffers,
    addFacility, updateFacility, activateFacility: (id) => setFacilityActive(id, true), deactivateFacility: (id) => setFacilityActive(id, false),
    addDining, updateDining, activateDining: (id) => setDiningStatus(id, 'ACTIVE'), deactivateDining: (id) => setDiningStatus(id, 'INACTIVE'),
    addExperience, updateExperience, activateExperience: (id) => setExperienceStatus(id, 'ACTIVE'), deactivateExperience: (id) => setExperienceStatus(id, 'INACTIVE'),
    addOffer, updateOffer, activateOffer: (id) => setOfferStatus(id, 'ACTIVE'), deactivateOffer: (id) => setOfferStatus(id, 'INACTIVE'),
    deleteOffer, duplicateOffer, saveOfferDraft, clearOfferDraft,
  }), [facilities, diningItems, experiences, offers, offerDrafts, offersLoading, refreshOffers, addFacility, updateFacility, setFacilityActive, addDining, updateDining, setDiningStatus, addExperience, updateExperience, setExperienceStatus, addOffer, updateOffer, setOfferStatus, deleteOffer, duplicateOffer, saveOfferDraft, clearOfferDraft])

  return <PropertyContentContext.Provider value={value}>{children}</PropertyContentContext.Provider>
}
