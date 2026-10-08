import { useCallback, useMemo } from 'react'
import initialCollections from '../data/stayCollections.js'
import StayCollectionsContext from './stayCollectionsContext.js'
import { createSlug } from '../utils/hotelManagement.js'
import { getActiveCollections, getHomeCollections } from '../utils/stayCollectionDomain.js'
import useAuth from './useAuth.js'
import usePersistentContent from './usePersistentContent.js'

const normalize = (value) => String(value ?? '')
const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

export function StayCollectionsProvider({ children }) {
  const { user } = useAuth()
  const persistence = usePersistentContent('STAY_COLLECTION', initialCollections, user)
  const { items: collections, loading, error, refresh, create, update, updateMany } = persistence
  const getCollectionById = useCallback((id) => collections.find((item) => normalize(item.id) === normalize(id)), [collections])
  const isDuplicateName = useCallback((title, excludeId) => collections.some((item) => normalize(item.id) !== normalize(excludeId) && item.status === 'ACTIVE' && normalizeName(item.title) === normalizeName(title)), [collections])
  const addCollection = useCallback(async (data) => {
    const base = createSlug(data.slug || data.title) || `collection-${Date.now()}`
    let id = base
    let suffix = 2
    while (collections.some((item) => normalize(item.id) === normalize(id))) id = `${base}-${suffix++}`
    await create({ ...data, id, slug: id, title: data.title.trim(), displayOrder: collections.length + 1, status: data.status || 'ACTIVE', showOnHome: Boolean(data.showOnHome), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    return id
  }, [collections, create])
  const updateCollection = useCallback((id, updates) => update(id, { ...updates, title: updates.title?.trim() }), [update])
  const setCollectionStatus = useCallback((id, status) => updateCollection(id, { status }), [updateCollection])
  const reorderCollections = useCallback(async (id, direction) => {
    const ordered = [...collections].sort((a, b) => a.displayOrder - b.displayOrder)
    const index = ordered.findIndex((item) => normalize(item.id) === normalize(id))
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return
    ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
    await updateMany(ordered.map((item, itemIndex) => ({ ...item, displayOrder: itemIndex + 1, updatedAt: new Date().toISOString() })))
  }, [collections, updateMany])
  const activeCollections = useMemo(() => getActiveCollections(collections), [collections])
  const homeCollections = useMemo(() => getHomeCollections(collections), [collections])
  const value = useMemo(() => ({ collections, activeCollections, homeCollections, loading, error, refresh, getCollectionById, isDuplicateName, addCollection, updateCollection, deactivateCollection: (id) => setCollectionStatus(id, 'INACTIVE'), reactivateCollection: (id) => setCollectionStatus(id, 'ACTIVE'), reorderCollections }), [collections, activeCollections, homeCollections, loading, error, refresh, getCollectionById, isDuplicateName, addCollection, updateCollection, setCollectionStatus, reorderCollections])
  return <StayCollectionsContext.Provider value={value}>{children}</StayCollectionsContext.Provider>
}
