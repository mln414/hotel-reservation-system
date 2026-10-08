// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

import { useCallback, useEffect, useMemo, useState } from 'react'
import HotelsContext from './hotelsContext.js'
import { HOTEL_PUBLICATION_STATUS, HOTEL_SETUP_STATUS } from '../constants/hotelManagement.js'
import { getHotelSetupReadiness, isHotelPublicReady } from '../utils/hotelManagement.js'
import useDestinations from './useDestinations.js'
import useRooms from './useRooms.js'
import usePropertyContent from './usePropertyContent.js'
import useRates from './useRates.js'
import useAuth from './useAuth.js'
import { initialHotelCollectionIds } from '../data/stayCollections.js'
import { resolveHotelCollectionIds } from '../utils/stayCollectionDomain.js'
import { getHotelMainImage } from '../utils/hotelMedia.js'
import { hotelApi } from '../services/hotelApi.js'

function getFacilityIds(names, facilities) {
  return (Array.isArray(names) ? names : []).map((name) => {
    const normalized = String(name).toLowerCase()
    const match = facilities.find((facility) => facility.name.toLowerCase() === normalized || (normalized === 'spa' && facility.id === 'spa'))
    return match?.id
  }).filter(Boolean)
}

function normalizeInitialHotel(hotel, destinationByName, facilities) {
  const destination = destinationByName.get((hotel.destination || hotel.destinationName || '').toLowerCase())
  const image = getHotelMainImage(hotel)
  const completeSections = {
    basic: true, destination: true, contact: true, about: true, location: true,
    facilities: true, accommodation: true, rate: true, gallery: true, policies: true,
  }
  return {
    ...hotel,
    propertyType: hotel.propertyType || hotel.category || 'Hotel',
    collectionIds: resolveHotelCollectionIds(hotel, initialHotelCollectionIds),
    mainImage: image,
    image,
    destinationId: hotel.destinationId || destination?.id || 1,
    facilityIds: hotel.facilityIds || getFacilityIds(hotel.facilities, facilities),
    languages: Array.isArray(hotel.languages) ? hotel.languages : String(hotel.languages || '').split(',').map((item) => item.trim()).filter(Boolean),
    video: hotel.video || hotel.videoUrl || '',
    setupStatus: hotel.setupStatus === 'COMPLETE' ? HOTEL_SETUP_STATUS.COMPLETE : hotel.setupStatus || HOTEL_SETUP_STATUS.COMPLETE,
    publicationStatus: hotel.publicationStatus || (hotel.status === 'ACTIVE' ? HOTEL_PUBLICATION_STATUS.ACTIVE : HOTEL_PUBLICATION_STATUS.INACTIVE),
    setupSections: completeSections,
    updatedAt: hotel.updatedAt || null,
  }
}

export function HotelsProvider({ children }) {
  const { user } = useAuth()
  const { destinations } = useDestinations()
  const { rooms } = useRooms()
  const { facilities } = usePropertyContent()
  const { roomRates, getHotelStartingRate } = useRates()
  const [hotels, setHotels] = useState([])
  const [publicHotelRecords, setPublicHotelRecords] = useState([])
  const [hotelsLoading, setHotelsLoading] = useState(true)
  const [hotelsError, setHotelsError] = useState('')
  const [hotelActionError, setHotelActionError] = useState('')
  const [workspaceDrafts, setWorkspaceDrafts] = useState({})

  const normalizeApiHotels = useCallback((records) => {
    const destinationByName = new Map(destinations.map((d) => [d.name.toLowerCase(), d]))
    const destinationNames = new Map(destinations.map((d) => [String(d.id), d.name]))
    return records.map((hotel) => ({
      ...normalizeInitialHotel(hotel, destinationByName, facilities),
      destination: hotel.destinationName || destinationNames.get(String(hotel.destinationId)) || 'Destination unavailable',
    }))
  }, [destinations, facilities])

  // Customer discovery is always loaded from the public backend contract.
  useEffect(() => {
    let active = true
    setHotelsLoading(true)
    setHotelsError('')
    hotelApi.listPublicHotels()
      .then((records) => {
        if (!active) return
        if (!Array.isArray(records)) throw new Error('The Hotel service returned an invalid list.')
        setPublicHotelRecords(normalizeApiHotels(records))
      })
      .catch((error) => { if (active) setHotelsError(error.message || 'Unable to load hotel information. Please try again.') })
      .finally(() => { if (active) setHotelsLoading(false) })
    return () => { active = false }
  }, [normalizeApiHotels])

  // Management receives the authenticated, role-scoped Hotel list.
  useEffect(() => {
    if (!user) { setHotels([]); return undefined }
    let active = true
    setHotelsLoading(true)
    setHotelsError('')
    hotelApi.listHotels()
      .then((backendHotels) => {
        if (!active) return
        if (!Array.isArray(backendHotels)) throw new Error('The Hotel service returned an invalid list.')
        setHotels(normalizeApiHotels(backendHotels))
      })
      .catch((error) => { if (active) setHotelsError(error.message || 'Unable to load hotel information. Please try again.') })
      .finally(() => { if (active) setHotelsLoading(false) })
    return () => { active = false }
  }, [user, normalizeApiHotels])

  useEffect(() => {
    const destinationNames = new Map(destinations.map((destination) => [String(destination.id), destination.name]))
    setHotels((current) => current.map((hotel) => {
      const destinationName = destinationNames.get(String(hotel.destinationId))
      return destinationName && hotel.destination !== destinationName ? { ...hotel, destination: destinationName } : hotel
    }))
  }, [destinations])

  const resolvedHotels = useMemo(() => hotels.map((hotel) => {
    const currentStartingRate = getHotelStartingRate(hotel.id)
    const legacyRoomPrices = rooms.filter((room) => String(room.hotelId) === String(hotel.id) && room.status === 'ACTIVE' && Number(room.price) > 0).map((room) => Number(room.price))
    const resolvedFacilities = (hotel.facilityIds || []).map((id) => facilities.find((facility) => String(facility.id) === String(id))).filter((facility) => facility?.active).map((facility) => facility.name)
    return {
      ...hotel,
      facilities: resolvedFacilities.length ? resolvedFacilities : hotel.facilities || [],
      price: currentStartingRate?.amount ?? (legacyRoomPrices.length ? Math.min(...legacyRoomPrices) : hotel.price || 0),
      setupStatus: getHotelSetupReadiness(hotel, destinations, rooms, roomRates).setupStatus
    }
  }), [hotels, destinations, rooms, facilities, roomRates, getHotelStartingRate])

  const resolvedPublicHotels = useMemo(() => publicHotelRecords.map((hotel) => {
    const currentStartingRate = getHotelStartingRate(hotel.id)
    const legacyRoomPrices = rooms.filter((room) => String(room.hotelId) === String(hotel.id) && room.status === 'ACTIVE' && Number(room.price) > 0).map((room) => Number(room.price))
    return {
      ...hotel,
      price: currentStartingRate?.amount ?? (legacyRoomPrices.length ? Math.min(...legacyRoomPrices) : hotel.price || 0),
    }
  }), [publicHotelRecords, rooms, getHotelStartingRate])

  const getHotelById = useCallback((id) => resolvedHotels.find((hotel) => String(hotel.id) === String(id)), [resolvedHotels])

  const loadPublicHotel = useCallback(async (identifier) => {
    const response = await hotelApi.getPublicHotel(identifier)
    const normalized = normalizeApiHotels([response])[0]
    setPublicHotelRecords((current) => [...current.filter((hotel) => String(hotel.id) !== String(normalized.id)), normalized])
    return normalized
  }, [normalizeApiHotels])

  const addHotelDraft = useCallback(async (data) => {
    const destination = destinations.find((item) => String(item.id) === String(data.destinationId))
    const payload = {
      name: data.name,
      destinationId: Number(data.destinationId),
      propertyType: data.propertyType || 'Hotel',
      category: data.propertyType || 'Hotel',
      price: data.price || 0,
      mainImage: data.mainImage || data.image || '',
      shortDescription: data.shortDescription || '',
      address: data.address || '',
      city: data.city || '',
      province: data.province || '',
      postalCode: data.postalCode || '',
      email: data.email || '',
      phone: data.phone || '',
      website: data.website || '',
      collectionIds: data.collectionIds || [],
    }

    try {
      setHotelActionError('')
      const backendHotel = await hotelApi.createHotel({ ...payload, gallery: data.gallery || [] })
      const normalized = {
        ...normalizeApiHotels([backendHotel])[0],
        destination: destination?.name || backendHotel.destinationName || 'Destination unavailable',
        setupSections: { basic: true, destination: true, contact: false, about: false, location: true, facilities: false, accommodation: false, rate: false, gallery: true, policies: false },
      }
      setHotels((current) => [...current, normalized])
      return normalized
    } catch (error) {
      setHotelActionError(error.message || 'Unable to create the Hotel.')
      throw error
    }
  }, [destinations, normalizeApiHotels])

  const updateHotel = useCallback(async (id, updates) => {
    setHotelActionError('')
    const payload = {
      ...updates,
      ...(Array.isArray(updates.languages) ? { languages: updates.languages.join(', ') } : {}),
      ...(updates.facilityIds ? { facilities: updates.facilityIds.map((facilityId) => facilities.find((item) => String(item.id) === String(facilityId))?.name).filter(Boolean) } : {}),
      ...(updates.video !== undefined ? { videoUrl: updates.video } : {}),
    }
    delete payload.facilityIds
    delete payload.video
    delete payload.image
    try {
      const response = await hotelApi.updateHotel(id, payload)
      const normalized = normalizeApiHotels([response])[0]
      setHotels((current) => current.map((hotel) => String(hotel.id) === String(id) ? { ...hotel, ...normalized } : hotel))
      if (normalized.publicationStatus === HOTEL_PUBLICATION_STATUS.ACTIVE) {
        setPublicHotelRecords((current) => current.some((hotel) => String(hotel.id) === String(id))
          ? current.map((hotel) => String(hotel.id) === String(id) ? normalized : hotel)
          : [...current, normalized])
      }
      return normalized
    } catch (error) {
      setHotelActionError(error.message || 'Unable to save Hotel changes.')
      throw error
    }
  }, [facilities, normalizeApiHotels])

  const setHotelPublicationStatus = useCallback(async (id, publicationStatus) => {
    setHotelActionError('')
    try {
      const response = await hotelApi.updateHotelStatus(id, publicationStatus)
      const normalized = normalizeApiHotels([response])[0]
      setHotels((current) => current.map((hotel) => String(hotel.id) === String(id) ? normalized : hotel))
      setPublicHotelRecords((current) => publicationStatus === HOTEL_PUBLICATION_STATUS.ACTIVE
        ? [...current.filter((hotel) => String(hotel.id) !== String(id)), normalized]
        : current.filter((hotel) => String(hotel.id) !== String(id)))
      return normalized
    } catch (error) {
      setHotelActionError(error.message || 'Unable to change Hotel publication status.')
      throw error
    }
  }, [normalizeApiHotels])

  const deleteHotel = useCallback(async (id, confirmationName) => {
    // Delete from backend API
    setHotelActionError('')
    try { await hotelApi.deleteHotel(id, confirmationName) }
    catch (error) { setHotelActionError(error.message || 'Unable to delete the Hotel.'); throw error }
    // Remove from local state
    setHotels((current) => current.filter((hotel) => String(hotel.id) !== String(id)))
    setPublicHotelRecords((current) => current.filter((hotel) => String(hotel.id) !== String(id)))
    setWorkspaceDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next })
  }, [])

  const addHotelGalleryImages = useCallback(async (id, images) => {
    const valid = (images || []).filter(Boolean)
    const hotel = getHotelById(id)
    if (!hotel || !valid.length) return hotel
    return updateHotel(id, { gallery: [...new Set([...(hotel.gallery || []), ...valid])], lastUpdatedSection: 'gallery' })
  }, [getHotelById, updateHotel])

  const setHotelMainImage = useCallback(async (id, image) => {
    if (!image) return
    const hotel = getHotelById(id)
    if (!hotel) return undefined
    return updateHotel(id, { mainImage: image, gallery: [...new Set([...(hotel.gallery || []), hotel.mainImage || hotel.image].filter((item) => item && item !== image))], lastUpdatedSection: 'gallery' })
  }, [getHotelById, updateHotel])

  const setHotelCollections = useCallback(async (id, collectionIds) => {
    const deduplicated = [...new Set((collectionIds || []).map(String))]
    return updateHotel(id, { collectionIds: deduplicated, lastUpdatedSection: 'collections' })
  }, [updateHotel])

  const updateHotelWorkspaceDraft = useCallback((id, updates) => setWorkspaceDrafts((current) => ({ ...current, [String(id)]: { ...(current[String(id)] || {}), ...(typeof updates === 'function' ? updates(current[String(id)] || {}) : updates), dirty: true, updatedAt: new Date().toISOString() } })), [])
  const clearHotelWorkspaceDraft = useCallback((id) => setWorkspaceDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next }), [])

  const removeHotelGalleryImage = useCallback(async (id, image) => {
    const hotel = getHotelById(id)
    if (!hotel) return undefined
    return updateHotel(id, { gallery: (hotel.gallery || []).filter((item) => item !== image), lastUpdatedSection: 'gallery' })
  }, [getHotelById, updateHotel])
  const moveHotelGalleryImage = useCallback(async (id, image, direction) => {
    const hotel = getHotelById(id)
    if (!hotel) return undefined
    const gallery = [...(hotel.gallery || [])]; const index = gallery.indexOf(image); const target = index + direction
    if (index < 0 || target < 0 || target >= gallery.length) return hotel
    ;[gallery[index], gallery[target]] = [gallery[target], gallery[index]]
    return updateHotel(id, { gallery, lastUpdatedSection: 'gallery' })
  }, [getHotelById, updateHotel])

  const updateSetupSection = useCallback(async (id, section, isComplete, updates = {}) => {
    const hotel = getHotelById(id)
    if (!hotel) throw new Error('Hotel not found.')
    return updateHotel(id, { ...updates, lastUpdatedSection: section })
  }, [getHotelById, updateHotel])

  const publicHotels = useMemo(() => resolvedPublicHotels.filter((hotel) => (
    isHotelPublicReady(hotel)
    && destinations.some((destination) => String(destination.id) === String(hotel.destinationId) && destination.active)
  )), [resolvedPublicHotels, destinations])

  const value = useMemo(() => ({
    hotels: resolvedHotels,
    publicHotels,
    destinations,
    rooms,
    hotelsLoading,
    hotelsError,
    hotelActionError,
    getHotelById,
    loadPublicHotel,
    addHotelDraft,
    updateHotel,
    updateSetupSection,
    setHotelPublicationStatus,
    deleteHotel,
    addHotelGalleryImages,
    setHotelMainImage,
    removeHotelGalleryImage,
    moveHotelGalleryImage,
    setHotelCollections,
    getHotelMainImage,
    workspaceDrafts,
    updateHotelWorkspaceDraft,
    clearHotelWorkspaceDraft,
  }), [resolvedHotels, publicHotels, destinations, rooms, hotelsLoading, hotelsError, hotelActionError, getHotelById, loadPublicHotel, addHotelDraft, updateHotel, updateSetupSection, setHotelPublicationStatus, deleteHotel, addHotelGalleryImages, setHotelMainImage, removeHotelGalleryImage, moveHotelGalleryImage, setHotelCollections, workspaceDrafts, updateHotelWorkspaceDraft, clearHotelWorkspaceDraft])

  return <HotelsContext.Provider value={value}>{children}</HotelsContext.Provider>
}
