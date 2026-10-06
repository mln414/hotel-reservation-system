import { useCallback, useEffect, useMemo, useState } from 'react'
import { MANAGEMENT_ROLES } from '../constants/roles.js'
import initialDestinations from '../data/destinations.js'
import { destinationApi } from '../services/destinationApi.js'
import { canTransitionDestinationStatus, DESTINATION_STATUS, normalizeDestination, slugifyDestination, validateDestinationForReview } from '../utils/destinationDomain.js'
import useAuth from './useAuth.js'
import DestinationsContext from './destinationsContext.js'

function uniqueSlug(name, destinations, excludeId = '') {
  const base = slugifyDestination(name) || 'destination'; let slug = base; let suffix = 2
  while (destinations.some((item) => String(item.id) !== String(excludeId) && item.slug === slug)) slug = `${base}-${suffix++}`
  return slug
}

export function DestinationsProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [destinations, setDestinations] = useState(() => initialDestinations.map(normalizeDestination))
  const [destinationsLoading, setDestinationsLoading] = useState(false)
  const [destinationsLoadError, setDestinationsLoadError] = useState('')
  const [publicDestinationDetails, setPublicDestinationDetails] = useState({})
  const [createDraft, setCreateDraft] = useState(null)
  const [editDrafts, setEditDrafts] = useState({})
  const isManagementUser = MANAGEMENT_ROLES.includes(user?.role)

  const getDestinationById = useCallback((id) => destinations.find((destination) => String(destination.id) === String(id)), [destinations])
  const getDestinationBySlug = useCallback((slug) => destinations.find((destination) => destination.slug === slug), [destinations])

  const replaceDestination = useCallback((record) => {
    const saved = normalizeDestination(record)
    setDestinations((current) => current.some((item) => String(item.id) === String(saved.id))
      ? current.map((item) => String(item.id) === String(saved.id) ? saved : item)
      : [...current, saved])
    return saved
  }, [])

  const loadDestinations = useCallback(async () => {
    setDestinationsLoading(true)
    setDestinationsLoadError('')
    setDestinations([])
    try {
      const records = isManagementUser
        ? await destinationApi.listManagementDestinations()
        : await destinationApi.listPublicDestinations()
      if (!Array.isArray(records)) throw new Error('The Destination service returned an invalid list.')
      setDestinations(records.map(normalizeDestination))
    } catch (error) {
      setDestinations([])
      setDestinationsLoadError(error.message || 'Destinations could not be loaded.')
      throw error
    } finally {
      setDestinationsLoading(false)
    }
  }, [isManagementUser])

  const loadPublicDestination = useCallback(async (identifier) => {
    const record = normalizeDestination(await destinationApi.getPublicDestination(identifier))
    setPublicDestinationDetails((current) => ({ ...current, [String(identifier)]: record }))
    setDestinations((current) => current.some((item) => String(item.id) === String(record.id))
      ? current.map((item) => String(item.id) === String(record.id) ? record : item)
      : [...current, record])
    return record
  }, [])

  useEffect(() => {
    if (authLoading) return
    loadDestinations().catch(() => {})
  }, [authLoading, isManagementUser, loadDestinations])

  const addDestination = useCallback(async (data) => {
    const created = replaceDestination(await destinationApi.createDestination({
      ...data,
      slug: data.slug || uniqueSlug(data.name, destinations),
      status: data.status || DESTINATION_STATUS.DRAFT,
    }))
    setCreateDraft(null); return created
  }, [destinations, replaceDestination])

  const updateDestination = useCallback(async (id, updates) => {
    const current = getDestinationById(id)
    if (!current) throw new Error('Destination not found. Reload the destination list and try again.')
    const merged = normalizeDestination({
      ...current,
      ...updates,
      ...(updates.name ? { name: updates.name.trim(), slug: uniqueSlug(updates.name, destinations, id) } : {}),
      lastUpdatedSection: updates.lastUpdatedSection || 'Destination Info',
    })
    const saved = replaceDestination(await destinationApi.updateDestination(id, merged))
    setEditDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next })
    return saved
  }, [destinations, getDestinationById, replaceDestination])

  const setDestinationStatus = useCallback(async (id, status) => {
    const current = getDestinationById(id)
    if (!current) throw new Error('Destination not found. Reload the destination list and try again.')
    if (!canTransitionDestinationStatus(current.status, status)
      || (status === DESTINATION_STATUS.ACTIVE && Object.keys(validateDestinationForReview(current)).length)) return current
    return replaceDestination(await destinationApi.updateDestinationStatus(id, status))
  }, [getDestinationById, replaceDestination])

  const saveDestinationDraft = useCallback(async (id, draft, metadata) => {
    const currentRecord = id ? getDestinationById(id) : null
    const status = currentRecord?.status && currentRecord.status !== DESTINATION_STATUS.DRAFT ? currentRecord.status : DESTINATION_STATUS.DRAFT
    const payload = normalizeDestination({ ...currentRecord, ...draft, status, ...metadata })
    const saved = replaceDestination(id
      ? await destinationApi.updateDestination(id, payload)
      : await destinationApi.createDestination({ ...payload, slug: uniqueSlug(payload.name, destinations) }))
    if (id) setEditDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next })
    else setCreateDraft(null)
    return saved
  }, [destinations, getDestinationById, replaceDestination])

  const submitDestinationForReview = useCallback(async (id, draft) => {
    const errors = validateDestinationForReview(draft)
    if (Object.keys(errors).length) return { ok: false, errors }
    const payload = normalizeDestination({
      ...getDestinationById(id),
      ...draft,
      status: DESTINATION_STATUS.READY_FOR_REVIEW,
      lastSavedStep: 6,
      lastCompletedStep: 6,
      lastUpdatedSection: 'Review & Submit',
    })
    const submitted = replaceDestination(id
      ? await destinationApi.updateDestination(id, payload)
      : await destinationApi.createDestination({ ...payload, slug: uniqueSlug(payload.name, destinations) }))
    setEditDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next })
    if (!id) setCreateDraft(null)
    return { ok: true, destination: submitted }
  }, [destinations, getDestinationById, replaceDestination])
  const updateCreateDraft = useCallback((draft) => setCreateDraft((current) => typeof draft === 'function' ? draft(current) : draft), [])
  const clearCreateDraft = useCallback(() => setCreateDraft(null), [])
  const updateEditDraft = useCallback((id, draft) => setEditDrafts((current) => ({ ...current, [String(id)]: typeof draft === 'function' ? draft(current[String(id)]) : draft })), [])
  const clearEditDraft = useCallback((id) => setEditDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next }), [])

  const activeDestinations = useMemo(() => destinations.filter((destination) => destination.status === DESTINATION_STATUS.ACTIVE), [destinations])
  const value = useMemo(() => ({ destinations, destinationsLoading, destinationsLoadError, loadDestinations, publicDestinationDetails, loadPublicDestination, activeDestinations, getDestinationById, getDestinationBySlug, addDestination, updateDestination,
    approveDestination: (id) => setDestinationStatus(id, DESTINATION_STATUS.ACTIVE), reactivateDestination: (id) => setDestinationStatus(id, DESTINATION_STATUS.ACTIVE), deactivateDestination: (id) => setDestinationStatus(id, DESTINATION_STATUS.INACTIVE), setDestinationStatus,
    saveDestinationDraft, submitDestinationForReview,
    createDraft, updateCreateDraft, clearCreateDraft, editDrafts, updateEditDraft, clearEditDraft,
  }), [destinations, destinationsLoading, destinationsLoadError, loadDestinations, publicDestinationDetails, loadPublicDestination, activeDestinations, getDestinationById, getDestinationBySlug, addDestination, updateDestination, setDestinationStatus, saveDestinationDraft, submitDestinationForReview, createDraft, updateCreateDraft, clearCreateDraft, editDrafts, updateEditDraft, clearEditDraft])

  return <DestinationsContext.Provider value={value}>{children}</DestinationsContext.Provider>
}
