import { useCallback, useEffect, useMemo, useState } from 'react'
import useRooms from './useRooms.js'
import RatesContext from './ratesContext.js'
import initialHotels from '../data/hotels.js'
import { createManagedRate, resolveEffectiveRate, resolveRoomEffectiveRate } from '../utils/rateFormatting.js'
import { rateApi } from '../services/rateApi.js'
import useAuth from './useAuth.js'

const timestamp = () => new Date().toISOString()
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const mapBackendRate = (rate) => ({
  id: rate.id,
  hotelId: rate.hotelId,
  roomTypeId: rate.roomId || rate.roomTypeId,
  roomId: rate.roomId || rate.roomTypeId,
  name: rate.ratePlanName,
  ratePlanName: rate.ratePlanName,
  ratePlanCode: rate.ratePlanCode,
  rateType: rate.rateType || 'BASE',
  pricingMethod: rate.pricingMethod || 'SET_PRICE',
  amount: Number(rate.baseNightlyRate),
  baseNightlyRate: Number(rate.baseNightlyRate),
  weekendAmount: Number(rate.weekendNightlyRate || rate.baseNightlyRate),
  weekendNightlyRate: Number(rate.weekendNightlyRate || rate.baseNightlyRate),
  validFrom: rate.validFrom || '',
  validTo: rate.validTo || '',
  minimumStay: rate.minimumStay ?? '',
  applicableDays: Array.isArray(rate.applicableDays)
    ? rate.applicableDays
    : (typeof rate.applicableDays === 'string' && rate.applicableDays ? rate.applicableDays.split(',') : []),
  mealPlan: rate.mealPlan || 'ROOM_ONLY',
  cancellationPolicy: rate.cancellationPolicy || 'FLEXIBLE_24H',
  depositRequired: Boolean(rate.depositRequired),
  depositPercentage: Number(rate.depositPercentage || 0),
  notes: rate.notes || '',
  status: rate.status || 'ACTIVE',
  createdAt: rate.createdAt,
  updatedAt: rate.updatedAt,
})

export function RatesProvider({ children }) {
  const { user } = useAuth()
  const { rooms } = useRooms()
  const [hotelRates, setHotelRates] = useState(() => initialHotels.filter((hotel) => Number(hotel.price) > 0).map((hotel) => ({ id: `legacy-hotel-rate-${hotel.id}`, hotelId: hotel.id, name: 'Base Rate', rateType: 'BASE', pricingMethod: 'SET_PRICE', amount: Number(hotel.price), status: 'ACTIVE', notes: 'Default property-level rate.', createdAt: null, updatedAt: null, legacy: true })))
  const [roomRates, setRoomRates] = useState(() => rooms.filter((room) => Number(room.price) > 0).map((room) => ({
    id: `legacy-rate-${room.id}`, hotelId: room.hotelId, roomTypeId: room.id, roomId: room.id,
    name: 'Base Rate', ratePlanName: 'Base Rate', ratePlanCode: `BASE-${room.id}`, rateType: 'BASE', pricingMethod: 'SET_PRICE', amount: Number(room.price), baseNightlyRate: Number(room.price), weekendAmount: Number(room.price), weekendNightlyRate: Number(room.price), validFrom: '2026-01-01', validTo: '2027-12-31',
    applicableDays: [], minimumStay: '', notes: 'Migrated from the existing room price.',
    status: 'ACTIVE', createdAt: null, updatedAt: null, legacy: true,
  })))
  const [ratesLoading, setRatesLoading] = useState(false)

  const refreshRates = useCallback(async () => {
    setRatesLoading(true)
    try {
      const publicRates = await rateApi.listPublicRates()
      const managedRates = user ? await rateApi.listRates().catch(() => []) : []
      if (Array.isArray(publicRates)) {
        const byId = new Map([...publicRates, ...managedRates].map((rate) => [String(rate.id), rate]))
        setRoomRates([...byId.values()].map(mapBackendRate))
        setHotelRates([])
      }
    } catch {
      // Retain existing state on network error
    } finally {
      setRatesLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshRates()
  }, [refreshRates])

  const addHotelRate = useCallback((data) => {
    const record = createManagedRate(data, { id: makeId('hotel-rate') })
    setHotelRates((current) => [...current, record])
    return record
  }, [])

  const updateHotelRate = useCallback((id, updates) => {
    setHotelRates((current) => current.map((record) => String(record.id) === String(id) ? { ...record, ...updates, updatedAt: timestamp() } : record))
  }, [])

  const addRoomRate = useCallback(async (data) => {
    const hotelId = Number(data.hotelId)
    const roomId = Number(data.roomTypeId || data.roomId)
    const ratePlanName = data.name?.trim() || data.ratePlanName?.trim() || 'New Rate Plan'
    const ratePlanCode = data.ratePlanCode?.trim() || `RP-${Date.now().toString(36).toUpperCase()}`
    const baseNightlyRate = Number(data.amount || data.baseNightlyRate || 0)
    const weekendNightlyRate = Number(data.weekendAmount || data.weekendNightlyRate || baseNightlyRate)
    const applicableDaysStr = Array.isArray(data.applicableDays) ? data.applicableDays.join(',') : (data.applicableDays || null)

    const payload = {
      hotelId,
      roomId,
      ratePlanName,
      ratePlanCode,
      rateType: data.rateType || 'BASE',
      pricingMethod: data.pricingMethod || 'SET_PRICE',
      baseNightlyRate,
      weekendNightlyRate,
      validFrom: data.validFrom || null,
      validTo: data.validTo || null,
      minimumStay: data.minimumStay !== '' && data.minimumStay != null ? Number(data.minimumStay) : 1,
      applicableDays: applicableDaysStr,
      mealPlan: data.mealPlan || 'ROOM_ONLY',
      cancellationPolicy: data.cancellationPolicy || 'FLEXIBLE_24H',
      depositRequired: Boolean(data.depositRequired),
      depositPercentage: data.depositPercentage ? Number(data.depositPercentage) : 0,
      notes: data.notes || null,
    }

    try {
      const created = await rateApi.createRate(payload)
      const mapped = mapBackendRate(created)
      setRoomRates((current) => [...current.filter((r) => String(r.id) !== String(mapped.id)), mapped])
      return mapped
    } catch (err) {
      // Fallback local update if offline
      const fallback = createManagedRate(data, { id: makeId('room-rate') })
      setRoomRates((current) => [...current, fallback])
      throw err
    }
  }, [])

  const updateRoomRate = useCallback(async (id, updates) => {
    const isBackendId = Number.isInteger(Number(id)) && Number(id) > 0
    if (isBackendId) {
      const baseNightlyRate = updates.amount != null ? Number(updates.amount) : (updates.baseNightlyRate != null ? Number(updates.baseNightlyRate) : undefined)
      const weekendNightlyRate = updates.weekendAmount != null ? Number(updates.weekendAmount) : (updates.weekendNightlyRate != null ? Number(updates.weekendNightlyRate) : baseNightlyRate)
      const applicableDaysStr = Array.isArray(updates.applicableDays) ? updates.applicableDays.join(',') : (updates.applicableDays || null)

      const payload = {
        ratePlanName: updates.name?.trim() || updates.ratePlanName?.trim(),
        ratePlanCode: updates.ratePlanCode?.trim(),
        rateType: updates.rateType,
        pricingMethod: updates.pricingMethod,
        baseNightlyRate,
        weekendNightlyRate,
        validFrom: updates.validFrom || null,
        validTo: updates.validTo || null,
        minimumStay: updates.minimumStay !== '' && updates.minimumStay != null ? Number(updates.minimumStay) : 1,
        applicableDays: applicableDaysStr,
        mealPlan: updates.mealPlan || 'ROOM_ONLY',
        cancellationPolicy: updates.cancellationPolicy || 'FLEXIBLE_24H',
        depositRequired: Boolean(updates.depositRequired),
        depositPercentage: updates.depositPercentage ? Number(updates.depositPercentage) : 0,
        notes: updates.notes || null,
      }

      try {
        const saved = await rateApi.updateRate(id, payload)
        const mapped = mapBackendRate(saved)
        setRoomRates((current) => current.map((item) => String(item.id) === String(id) ? mapped : item))
        return mapped
      } catch (err) {
        setRoomRates((current) => current.map((record) => String(record.id) === String(id) ? { ...record, ...updates, updatedAt: timestamp() } : record))
        throw err
      }
    } else {
      setRoomRates((current) => current.map((record) => String(record.id) === String(id) ? { ...record, ...updates, updatedAt: timestamp() } : record))
    }
  }, [])

  const activateRoomRate = useCallback(async (id) => {
    const isBackendId = Number.isInteger(Number(id)) && Number(id) > 0
    if (isBackendId) {
      try {
        const updated = await rateApi.updateRateStatus(id, 'ACTIVE')
        const mapped = mapBackendRate(updated)
        setRoomRates((current) => current.map((item) => String(item.id) === String(id) ? mapped : item))
        return mapped
      } catch (err) {
        setRoomRates((current) => current.map((item) => String(item.id) === String(id) ? { ...item, status: 'ACTIVE', updatedAt: timestamp() } : item))
        throw err
      }
    } else {
      setRoomRates((current) => current.map((item) => String(item.id) === String(id) ? { ...item, status: 'ACTIVE', updatedAt: timestamp() } : item))
    }
  }, [])

  const deactivateRoomRate = useCallback(async (id) => {
    const isBackendId = Number.isInteger(Number(id)) && Number(id) > 0
    if (isBackendId) {
      try {
        const updated = await rateApi.updateRateStatus(id, 'INACTIVE')
        const mapped = mapBackendRate(updated)
        setRoomRates((current) => current.map((item) => String(item.id) === String(id) ? mapped : item))
        return mapped
      } catch (err) {
        setRoomRates((current) => current.map((item) => String(item.id) === String(id) ? { ...item, status: 'INACTIVE', updatedAt: timestamp() } : item))
        throw err
      }
    } else {
      setRoomRates((current) => current.map((item) => String(item.id) === String(id) ? { ...item, status: 'INACTIVE', updatedAt: timestamp() } : item))
    }
  }, [])

  const deleteRoomRate = useCallback(async (id) => {
    const isBackendId = Number.isInteger(Number(id)) && Number(id) > 0
    if (isBackendId) {
      await rateApi.deleteRate(id)
    }
    setRoomRates((current) => current.filter((item) => String(item.id) !== String(id)))
  }, [])

  const getRatesByRoomId = useCallback((roomTypeId) => roomRates.filter((rate) => String(rate.roomTypeId) === String(roomTypeId)), [roomRates])
  const getRatesForHotel = useCallback((hotelId) => hotelRates.filter((rate) => String(rate.hotelId) === String(hotelId)), [hotelRates])

  const getCurrentRoomRate = useCallback((roomTypeId, date = new Date()) => {
    const room = rooms.find((item) => String(item.id) === String(roomTypeId))
    const resolved = resolveRoomEffectiveRate({ roomRates: getRatesByRoomId(roomTypeId), hotelRates: room ? getRatesForHotel(room.hotelId) : [], date })
    if (!resolved) return null
    // LankaStay weekend definition: Friday night (5) and Saturday night (6)
    const weekend = date.getDay() === 5 || date.getDay() === 6
    return weekend && Number(resolved.weekendAmount) > 0 ? { ...resolved, amount: Number(resolved.weekendAmount) } : resolved
  }, [rooms, getRatesByRoomId, getRatesForHotel])

  const getCurrentHotelRate = useCallback((hotelId, date = new Date()) => resolveEffectiveRate(getRatesForHotel(hotelId), date), [getRatesForHotel])
  const getHotelStartingRate = useCallback((hotelId, date = new Date()) => rooms.filter((room) => String(room.hotelId) === String(hotelId) && room.status === 'ACTIVE').map((room) => getCurrentRoomRate(room.id, date)).filter(Boolean).sort((a, b) => Number(a.amount) - Number(b.amount))[0] || null, [rooms, getCurrentRoomRate])

  const value = useMemo(() => ({
    hotelRates, roomRates, ratesLoading, refreshRates, getRatesForHotel, getRatesByRoomId, getCurrentHotelRate, getCurrentRoomRate, getHotelStartingRate,
    addHotelRate, updateHotelRate, activateHotelRate: (id) => updateHotelRate(id, { status: 'ACTIVE' }), deactivateHotelRate: (id) => updateHotelRate(id, { status: 'INACTIVE' }),
    addRoomRate, updateRoomRate, activateRoomRate, deactivateRoomRate, deleteRoomRate,
  }), [hotelRates, roomRates, ratesLoading, refreshRates, getRatesForHotel, getRatesByRoomId, getCurrentHotelRate, getCurrentRoomRate, getHotelStartingRate, addHotelRate, updateHotelRate, addRoomRate, updateRoomRate, activateRoomRate, deactivateRoomRate, deleteRoomRate])

  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>
}
