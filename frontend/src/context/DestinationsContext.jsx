import { useCallback, useMemo, useState } from 'react'
import initialDestinations from '../data/destinations.js'
import { canTransitionDestinationStatus, DESTINATION_STATUS, normalizeDestination, slugifyDestination, validateDestinationForReview } from '../utils/destinationDomain.js'
import DestinationsContext from './destinationsContext.js'

function uniqueSlug(name, destinations, excludeId = '') {
  const base = slugifyDestination(name) || 'destination'; let slug = base; let suffix = 2
  while (destinations.some((item) => String(item.id) !== String(excludeId) && item.slug === slug)) slug = `${base}-${suffix++}`
  return slug
}

export function DestinationsProvider({ children }) {
  const [destinations, setDestinations] = useState(() => initialDestinations.map(normalizeDestination))
  const [createDraft, setCreateDraft] = useState(null)
  const [editDrafts, setEditDrafts] = useState({})

  const getDestinationById = useCallback((id) => destinations.find((destination) => String(destination.id) === String(id)), [destinations])
  const getDestinationBySlug = useCallback((slug) => destinations.find((destination) => destination.slug === slug), [destinations])

  const addDestination = useCallback((data) => {
    const now = new Date().toISOString()
    const created = normalizeDestination({ ...data, id: Date.now(), slug: uniqueSlug(data.name, destinations), status: data.status || DESTINATION_STATUS.DRAFT, active: data.status === DESTINATION_STATUS.ACTIVE, createdAt: now, updatedAt: now, lastUpdatedSection: 'Destination Info' })
    setDestinations((current) => [...current, created])
    setCreateDraft(null); return created
  }, [destinations])

  const updateDestination = useCallback((id, updates) => {
    const now = new Date().toISOString()
    setDestinations((current) => current.map((destination) => String(destination.id) === String(id) ? normalizeDestination({ ...destination, ...updates, ...(updates.name ? { name: updates.name.trim(), slug: uniqueSlug(updates.name, current, id) } : {}), updatedAt: now, lastUpdatedAt: now, lastUpdatedSection: updates.lastUpdatedSection || 'Destination Info' }) : destination))
    setEditDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next })
    return normalizeDestination({ ...getDestinationById(id), ...updates, updatedAt: now, lastUpdatedAt: now })
  }, [getDestinationById])

  const setDestinationStatus = useCallback((id, status) => setDestinations((current) => current.map((destination) => {
    if (String(destination.id) !== String(id)) return destination
    if (!canTransitionDestinationStatus(destination.status, status) || (status === DESTINATION_STATUS.ACTIVE && Object.keys(validateDestinationForReview(destination)).length)) return destination
    const now = new Date().toISOString()
    return { ...destination, status, active: status === DESTINATION_STATUS.ACTIVE, updatedAt: now, lastUpdatedAt: now, lastUpdatedSection: 'Visibility' }
  })), [])

  const saveDestinationDraft = useCallback((id, draft, metadata) => {
    const now = new Date().toISOString()
    const currentRecord = id ? destinations.find((destination) => String(destination.id) === String(id)) : null
    const status = currentRecord?.status && currentRecord.status !== DESTINATION_STATUS.DRAFT ? currentRecord.status : DESTINATION_STATUS.DRAFT
    const payload = normalizeDestination({ ...draft, status, active: status === DESTINATION_STATUS.ACTIVE, ...metadata, updatedAt: now, lastUpdatedAt: now })
    if (id) {
      setDestinations((current) => current.map((destination) => String(destination.id) === String(id) ? normalizeDestination({ ...destination, ...payload, id: destination.id, slug: payload.name ? uniqueSlug(payload.name, current, id) : destination.slug }) : destination))
      setEditDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next })
      return { ...payload, id }
    }
    const created = normalizeDestination({ ...payload, id: Date.now(), slug: uniqueSlug(payload.name, destinations), createdAt: now })
    setDestinations((current) => [...current, created]); setCreateDraft(null)
    return created
  }, [destinations])

  const submitDestinationForReview = useCallback((id, draft) => {
    const errors = validateDestinationForReview(draft)
    if (Object.keys(errors).length) return { ok: false, errors }
    const now = new Date().toISOString()
    let submitted = null
    setDestinations((current) => current.map((destination) => {
      if (String(destination.id) !== String(id)) return destination
      submitted = normalizeDestination({ ...destination, ...draft, status: DESTINATION_STATUS.READY_FOR_REVIEW, active: false, lastSavedStep: 6, lastCompletedStep: 6, draftStep: 5, submittedAt: now, updatedAt: now, lastUpdatedAt: now, lastUpdatedSection: 'Review & Submit' })
      return submitted
    }))
    setEditDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next })
    return { ok: true, destination: submitted }
  }, [])
  const updateCreateDraft = useCallback((draft) => setCreateDraft((current) => typeof draft === 'function' ? draft(current) : draft), [])
  const clearCreateDraft = useCallback(() => setCreateDraft(null), [])
  const updateEditDraft = useCallback((id, draft) => setEditDrafts((current) => ({ ...current, [String(id)]: typeof draft === 'function' ? draft(current[String(id)]) : draft })), [])
  const clearEditDraft = useCallback((id) => setEditDrafts((current) => { const next = { ...current }; delete next[String(id)]; return next }), [])

  const activeDestinations = useMemo(() => destinations.filter((destination) => destination.status === DESTINATION_STATUS.ACTIVE), [destinations])
  const value = useMemo(() => ({ destinations, activeDestinations, getDestinationById, getDestinationBySlug, addDestination, updateDestination,
    approveDestination: (id) => setDestinationStatus(id, DESTINATION_STATUS.ACTIVE), reactivateDestination: (id) => setDestinationStatus(id, DESTINATION_STATUS.ACTIVE), deactivateDestination: (id) => setDestinationStatus(id, DESTINATION_STATUS.INACTIVE), setDestinationStatus,
    saveDestinationDraft, submitDestinationForReview,
    createDraft, updateCreateDraft, clearCreateDraft, editDrafts, updateEditDraft, clearEditDraft,
  }), [destinations, activeDestinations, getDestinationById, getDestinationBySlug, addDestination, updateDestination, setDestinationStatus, saveDestinationDraft, submitDestinationForReview, createDraft, updateCreateDraft, clearCreateDraft, editDrafts, updateEditDraft, clearEditDraft])

  return <DestinationsContext.Provider value={value}>{children}</DestinationsContext.Provider>
}
