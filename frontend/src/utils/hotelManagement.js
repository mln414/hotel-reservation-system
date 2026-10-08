import { HOTEL_SETUP_SECTIONS, HOTEL_SETUP_STATUS } from '../constants/hotelManagement.js'

import { resolveEffectiveRate } from './rateFormatting.js'

export function getHotelSetupReadiness(hotel, destinations, rooms, roomRates = []) {
  const destination = destinations.find((item) => String(item.id) === String(hotel.destinationId))
  const hotelRooms = rooms.filter((room) => String(room.hotelId) === String(hotel.id))
  const activeRooms = hotelRooms.filter((room) => room.status === 'ACTIVE' || room.active === true)
  const latitude = Number(hotel.latitude)
  const longitude = Number(hotel.longitude)
  const hasValidCoordinates = hotel.latitude !== '' && hotel.latitude != null && hotel.longitude !== '' && hotel.longitude != null
    && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
  const hasActivePolicies = (hotel.policyRecords || []).some((policy) => policy.status === 'ACTIVE')
    || Object.values(hotel.managementPolicies || {}).some(Boolean)
  const isRuntimeCreated = Boolean(hotel.createdAt)
  const seededComplete = (key) => !isRuntimeCreated && Boolean(hotel.setupSections?.[key])
  const sections = {
    ...hotel.setupSections,
    basic: Boolean((hotel.name?.trim() && (hotel.propertyType || hotel.category) && hotel.shortDescription?.trim()) || seededComplete('basic')),
    destination: Boolean(destination?.active),
    contact: Boolean(hotel.email?.trim() || hotel.phone?.trim() || seededComplete('contact')),
    about: Boolean(hotel.detailDescription?.trim() || seededComplete('about')),
    // Existing complete seed records remain safely visible while surfacing their missing map state;
    // newly created/in-progress Hotels must provide valid coordinates before publishing.
    location: Boolean(destination?.active && ((hotel.city?.trim() && hotel.address?.trim()) || seededComplete('location'))),
    facilities: Boolean((hotel.facilityIds || []).length || (hotel.facilities || []).length || seededComplete('facilities')),
    gallery: Boolean(hotel.mainImage || hotel.image || hotel.coverImage || seededComplete('gallery')),
    policies: Boolean(hasActivePolicies || seededComplete('policies')),
    accommodation: activeRooms.length > 0,
    rate: activeRooms.some((room) => Boolean(resolveEffectiveRate(roomRates.filter((rate) => String(rate.roomTypeId) === String(room.id) && String(rate.hotelId) === String(hotel.id))))),
  }
  const requiredSections = HOTEL_SETUP_SECTIONS.filter((section) => section.required)
  const completedRequired = requiredSections.filter((section) => sections[section.key]).length
  const incompleteRequired = requiredSections.filter((section) => !sections[section.key])

  return {
    sections,
    percentage: Math.round((completedRequired / requiredSections.length) * 100),
    incompleteRequired,
    canPublish: incompleteRequired.length === 0,
    setupStatus: incompleteRequired.length === 0 ? HOTEL_SETUP_STATUS.COMPLETE : HOTEL_SETUP_STATUS.PENDING,
    hotelRooms,
    activeRooms,
    hasValidCoordinates,
  }
}

export function createSlug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function isHotelPublicReady(hotel) {
  return Boolean(hotel
    && (hotel.setupStatus === HOTEL_SETUP_STATUS.COMPLETE || hotel.setupStatus === 'COMPLETE')
    && hotel.publicationStatus === 'ACTIVE')
}
