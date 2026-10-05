import { useCallback, useEffect, useMemo, useState } from 'react'
import initialAmenities from '../data/roomAmenities.js'
import RoomsContext from './roomsContext.js'
import { ROOM_TYPE_STATUS } from './roomsContext.js'
import { moveItemById } from '../utils/roomDomain.js'
import { resolveCatalogImageUrl } from '../utils/hotelMedia.js'
import { roomApi } from '../services/roomApi.js'
import useAuth from './useAuth.js'

const amenityIdByName = new Map(initialAmenities.map((amenity) => [amenity.name.toLowerCase(), amenity.id]))

function parseAmenities(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // fallback
    }
  }
  return []
}

function normalizeRoomType(room) {
  const roomSize = Number.parseFloat(String(room.sizeSqm ?? room.size ?? room.roomSize)) || 0
  const amenityIds = parseAmenities(room.amenitiesJson || room.amenityIds)
  const legacyNames = (room.amenities || []).map((name) => amenityIdByName.get(name.toLowerCase())).filter(Boolean)
  const mergedAmenityIds = [...new Set([...amenityIds, ...legacyNames])]

  return {
    ...room,
    id: room.id,
    hotelId: room.hotelId,
    name: room.name || '',
    slug: room.slug || '',
    status: room.status === 'ACTIVE' ? ROOM_TYPE_STATUS.ACTIVE : ROOM_TYPE_STATUS.INACTIVE,
    roomTypeGroupKey: room.roomCategory || room.roomTypeGroupKey || 'STANDARD',
    roomCategory: room.roomCategory || room.roomTypeGroupKey || 'STANDARD',
    inventoryCount: Number(room.inventoryCount ?? room.inventory ?? 0),
    maxGuests: Number(room.maxOccupancy ?? room.maxGuests ?? room.capacity ?? 2),
    adultCapacity: Number(room.maxAdults ?? room.adultCapacity ?? room.capacity ?? 2),
    childCapacity: Number(room.maxChildren ?? room.childCapacity ?? 0),
    bedConfiguration: room.bedType || room.bedConfiguration || '1 King Bed',
    bedType: room.bedType || room.bedConfiguration || '1 King Bed',
    roomSize: room.sizeSqm ?? room.roomSize ?? roomSize,
    sizeSqm: room.sizeSqm ?? room.roomSize ?? roomSize,
    basePrice: Number(room.basePrice ?? room.price ?? 0),
    price: Number(room.basePrice ?? room.price ?? 0),
    viewType: room.viewType || room.view || 'No Specific View',
    mainImage: resolveCatalogImageUrl(room.mainImage || room.image) || '',
    image: resolveCatalogImageUrl(room.mainImage || room.image) || '',
    gallery: Array.isArray(room.gallery) ? room.gallery.map((g) => g.imageUrl || g) : Array.isArray(room.galleryImages) ? room.galleryImages : [],
    shortDescription: room.description || room.shortDescription || '',
    fullDescription: room.description || room.fullDescription || room.detailDescription || room.shortDescription || '',
    description: room.description || room.fullDescription || room.shortDescription || '',
    amenityIds: mergedAmenityIds,
    amenitiesJson: room.amenitiesJson || JSON.stringify(mergedAmenityIds),
    readinessComplete: Boolean(room.readinessComplete),
    missingReadinessReasons: Array.isArray(room.missingReadinessReasons) ? room.missingReadinessReasons : [],
    updatedAt: room.updatedAt || null,
  }
}

function syncLegacyFields(room, amenities) {
  const amenityNames = (room.amenityIds || []).map((id) => amenities.find((amenity) => amenity.id === id)?.name).filter(Boolean)
  return {
    ...room,
    active: room.status === ROOM_TYPE_STATUS.ACTIVE,
    capacity: room.maxGuests,
    bedType: room.bedConfiguration,
    size: `${room.roomSize || 0} m²`,
    view: room.viewType,
    image: room.mainImage,
    amenities: amenityNames,
  }
}

export function RoomsProvider({ children }) {
  const { user } = useAuth()
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [physicalRooms, setPhysicalRooms] = useState([])
  const [amenities, setAmenities] = useState(() => initialAmenities.map((amenity, displayOrder) => ({ ...amenity, displayOrder })))
  const [roomTypeDrafts, setRoomTypeDrafts] = useState({})

  const loadRoomsFromBackend = useCallback(async () => {
    try {
      const publicRooms = await roomApi.listPublicRooms()
      const managedRooms = user ? await roomApi.listRooms().catch(() => []) : []
      const byId = new Map([...publicRooms, ...managedRooms].map((room) => [String(room.id), room]))
      setRoomTypes([...byId.values()].map(normalizeRoomType))
      const inventory = user ? await roomApi.listPhysicalRooms().catch(() => []) : []
      setPhysicalRooms(Array.isArray(inventory) ? inventory : [])
    } catch {
      // Fallback — keep whatever state exists
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadRoomsFromBackend()
  }, [loadRoomsFromBackend])

  const getRoomById = useCallback((id) => roomTypes.find((room) => String(room.id) === String(id)), [roomTypes])
  const getRoomsByHotelId = useCallback((hotelId) => roomTypes.filter((room) => String(room.hotelId) === String(hotelId)), [roomTypes])
  const getActiveRoomTypesByHotelId = useCallback((hotelId) => roomTypes.filter((room) => String(room.hotelId) === String(hotelId) && room.status === ROOM_TYPE_STATUS.ACTIVE), [roomTypes])
  const getPhysicalRoomsByTypeId = useCallback((roomTypeId) => physicalRooms.filter((room) => String(room.roomTypeId) === String(roomTypeId)), [physicalRooms])

  const addRoomType = useCallback(async (data) => {
    const payload = {
      hotelId: Number(data.hotelId),
      name: String(data.name || '').trim(),
      roomCategory: String(data.roomCategory || data.roomTypeGroupKey || 'STANDARD').trim(),
      description: String(data.fullDescription || data.description || data.shortDescription || '').trim(),
      maxOccupancy: Number(data.maxGuests || data.capacity || 2),
      maxAdults: Number(data.adultCapacity || data.maxGuests || 2),
      maxChildren: Number(data.childCapacity || 0),
      sizeSqm: data.roomSize ? Number(data.roomSize) : null,
      bedType: String(data.bedConfiguration || data.bedType || '1 King Bed').trim(),
      inventoryCount: Number(data.inventoryCount || 1),
      basePrice: Number(data.basePrice || data.price || 0),
      mainImage: data.mainImage || data.image || null,
      amenitiesJson: JSON.stringify(data.amenityIds || []),
      gallery: (data.gallery || []).map((img, idx) => ({
        imageUrl: typeof img === 'string' ? img : img.imageUrl,
        caption: typeof img === 'object' ? img.caption : null,
        displayOrder: idx,
        isCover: (data.mainImage || data.image) === (typeof img === 'string' ? img : img.imageUrl),
      })),
    }

    const created = await roomApi.createRoom(payload)
    const normalized = syncLegacyFields(normalizeRoomType(created), amenities)
    setRoomTypes((current) => [...current.filter((r) => String(r.id) !== String(normalized.id)), normalized])
    return normalized
  }, [amenities])

  const updateRoomType = useCallback(async (id, updates) => {
    const existing = roomTypes.find((r) => String(r.id) === String(id)) || {}
    const merged = { ...existing, ...updates }

    const payload = {
      name: String(merged.name || '').trim(),
      roomCategory: String(merged.roomCategory || merged.roomTypeGroupKey || 'STANDARD').trim(),
      description: String(merged.fullDescription || merged.description || merged.shortDescription || '').trim(),
      maxOccupancy: Number(merged.maxGuests || merged.capacity || 2),
      maxAdults: Number(merged.adultCapacity || merged.maxGuests || 2),
      maxChildren: Number(merged.childCapacity || 0),
      sizeSqm: merged.roomSize ? Number(merged.roomSize) : null,
      bedType: String(merged.bedConfiguration || merged.bedType || '1 King Bed').trim(),
      inventoryCount: Number(merged.inventoryCount || 1),
      basePrice: Number(merged.basePrice || merged.price || 0),
      mainImage: merged.mainImage || merged.image || null,
      amenitiesJson: JSON.stringify(merged.amenityIds || []),
      gallery: (merged.gallery || []).map((img, idx) => ({
        imageUrl: typeof img === 'string' ? img : img.imageUrl,
        caption: typeof img === 'object' ? img.caption : null,
        displayOrder: idx,
        isCover: (merged.mainImage || merged.image) === (typeof img === 'string' ? img : img.imageUrl),
      })),
    }

    const updated = await roomApi.updateRoom(id, payload)
    const normalized = syncLegacyFields(normalizeRoomType(updated), amenities)
    setRoomTypes((current) => current.map((room) => String(room.id) === String(id) ? normalized : room))
    return normalized
  }, [roomTypes, amenities])

  const setRoomTypeStatus = useCallback(async (id, status) => {
    const updated = await roomApi.updateRoomStatus(id, status)
    const normalized = syncLegacyFields(normalizeRoomType(updated), amenities)
    setRoomTypes((current) => current.map((room) => String(room.id) === String(id) ? normalized : room))
    return normalized
  }, [amenities])

  const deleteRoomType = useCallback(async (id) => {
    await roomApi.deleteRoom(id)
    setRoomTypes((current) => current.filter((room) => String(room.id) !== String(id)))
  }, [])

  const physicalPayload = (data) => ({ roomTypeId: Number(data.roomTypeId), roomNumber: String(data.roomNumber).trim(), floor: data.floor || '', wing: data.wing || '', baseOperationalStatus: data.baseOperationalStatus || 'AVAILABLE', condition: data.condition || 'READY', notes: data.notes || '' })
  const addPhysicalRoom = useCallback(async (data) => {
    try {
      const room = await roomApi.createPhysicalRoom(physicalPayload(data))
      setPhysicalRooms((current) => [...current, room])
      await loadRoomsFromBackend()
      return { room }
    } catch (error) { return { error: error.message } }
  }, [loadRoomsFromBackend])

  const addPhysicalRooms = useCallback(async (items) => {
    try {
      const added = await roomApi.createPhysicalRooms(items.map(physicalPayload))
      setPhysicalRooms((current) => [...current, ...added])
      await loadRoomsFromBackend()
      return { added, conflicts: [] }
    } catch (error) { return { error: error.message, conflicts: [], added: [] } }
  }, [loadRoomsFromBackend])

  const updatePhysicalRoom = useCallback(async (id, updates) => {
    const existing = physicalRooms.find((room) => String(room.id) === String(id))
    if (!existing) return { error: 'Physical room was not found.' }
    try {
      const room = await roomApi.updatePhysicalRoom(id, physicalPayload({ ...existing, ...updates }))
      setPhysicalRooms((current) => current.map((item) => String(item.id) === String(id) ? room : item))
      return { room }
    } catch (error) { return { error: error.message } }
  }, [physicalRooms])

  const updatePhysicalRoomsStatus = useCallback(async (ids, status) => {
    try {
      const updated = await roomApi.updatePhysicalRoomsStatus(ids.map(Number), status)
      const byId = new Map(updated.map((room) => [String(room.id), room]))
      setPhysicalRooms((current) => current.map((room) => byId.get(String(room.id)) || room))
      return { updated }
    } catch (error) { return { error: error.message, updated: [] } }
  }, [])
  const updateRoomCondition = useCallback((id, condition) => updatePhysicalRoom(id, { condition }), [updatePhysicalRoom])

  const scheduleOperationalBlock = useCallback(async (ids, data) => {
    try {
      const added = await roomApi.addPhysicalRoomBlocks((Array.isArray(ids) ? ids : [ids]).map(Number), data)
      await loadRoomsFromBackend()
      return { added }
    } catch (error) {
      return { error: error.message, added: [] }
    }
  }, [loadRoomsFromBackend])
  const removeOperationalBlock = useCallback(async (roomId, blockId) => {
    try {
      await roomApi.removePhysicalRoomBlock(roomId, blockId)
      setPhysicalRooms((current) => current.map((room) => String(room.id) === String(roomId) ? { ...room, operationalBlocks: (room.operationalBlocks || []).filter((block) => String(block.id) !== String(blockId)) } : room))
      return { success: true }
    } catch (error) { return { error: error.message } }
  }, [])

  const deletePhysicalRoom = useCallback(async (id) => {
    try {
      await roomApi.deletePhysicalRoom(id)
      setPhysicalRooms((current) => current.filter((room) => String(room.id) !== String(id)))
      await loadRoomsFromBackend()
      return { success: true }
    } catch (error) { return { error: error.message } }
  }, [loadRoomsFromBackend])

  const addAmenity = useCallback((data) => {
    const amenity = { ...data, id: `amenity-${Date.now()}`, name: data.name.trim(), active: data.active !== false, displayOrder: amenities.length }
    setAmenities((current) => [...current, amenity])
    return amenity
  }, [amenities.length])
  const updateAmenity = useCallback((id, updates) => setAmenities((current) => current.map((amenity) => amenity.id === id ? { ...amenity, ...updates, ...(updates.name ? { name: updates.name.trim() } : {}) } : amenity)), [])
  const setAmenityActive = useCallback((id, active) => updateAmenity(id, { active }), [updateAmenity])
  const reorderAmenity = useCallback((id, direction) => setAmenities((current) => moveItemById(current, id, direction)), [])
  const saveRoomTypeDraft = useCallback((key, draft) => setRoomTypeDrafts((current) => ({ ...current, [String(key)]: draft })), [])
  const clearRoomTypeDraft = useCallback((key) => setRoomTypeDrafts((current) => { const next = { ...current }; delete next[String(key)]; return next }), [])

  const rooms = useMemo(() => roomTypes.map((room) => syncLegacyFields(room, amenities)), [roomTypes, amenities])
  const value = useMemo(() => ({
    loading,
    rooms, roomTypes: rooms, physicalRooms, amenities,
    refreshRooms: loadRoomsFromBackend,
    getRoomById, getRoomsByHotelId, getActiveRoomTypesByHotelId, getPhysicalRoomsByTypeId,
    addRoomType, updateRoomType, deleteRoomType,
    deactivateRoomType: (id) => setRoomTypeStatus(id, ROOM_TYPE_STATUS.INACTIVE),
    reactivateRoomType: (id) => setRoomTypeStatus(id, ROOM_TYPE_STATUS.ACTIVE),
    setRoomTypeStatus,
    addPhysicalRoom, addPhysicalRooms, updatePhysicalRoom, deletePhysicalRoom, updatePhysicalRoomStatus: (id, status) => updatePhysicalRoom(id, { baseOperationalStatus: status }), updatePhysicalRoomsStatus, updateRoomCondition, scheduleOperationalBlock, removeOperationalBlock,
    addAmenity, updateAmenity, activateAmenity: (id) => setAmenityActive(id, true), deactivateAmenity: (id) => setAmenityActive(id, false), reorderAmenity,
    roomTypeDrafts, saveRoomTypeDraft, clearRoomTypeDraft,
  }), [loading, rooms, physicalRooms, amenities, loadRoomsFromBackend, getRoomById, getRoomsByHotelId, getActiveRoomTypesByHotelId, getPhysicalRoomsByTypeId, addRoomType, updateRoomType, deleteRoomType, setRoomTypeStatus, addPhysicalRoom, addPhysicalRooms, updatePhysicalRoom, deletePhysicalRoom, updatePhysicalRoomsStatus, updateRoomCondition, scheduleOperationalBlock, removeOperationalBlock, addAmenity, updateAmenity, setAmenityActive, reorderAmenity, roomTypeDrafts, saveRoomTypeDraft, clearRoomTypeDraft])

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>
}
