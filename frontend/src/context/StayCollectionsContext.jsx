import { useCallback, useMemo, useState } from 'react'
import initialCollections from '../data/stayCollections.js'
import StayCollectionsContext from './stayCollectionsContext.js'
import { createSlug } from '../utils/hotelManagement.js'
import { getActiveCollections, getHomeCollections } from '../utils/stayCollectionDomain.js'

const normalize = (value) => String(value ?? '')
const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

export function StayCollectionsProvider({ children }) {
  const [collections, setCollections] = useState(initialCollections)
  const getCollectionById = useCallback((id) => collections.find((item) => normalize(item.id) === normalize(id)), [collections])
  const isDuplicateName = useCallback((title, excludeId) => collections.some((item) => normalize(item.id) !== normalize(excludeId) && item.status === 'ACTIVE' && normalizeName(item.title) === normalizeName(title)), [collections])
  const addCollection = useCallback((data) => {
    const base = createSlug(data.slug || data.title) || `collection-${Date.now()}`
    let id = base
    let suffix = 2
    setCollections((current) => {
      while (current.some((item) => normalize(item.id) === normalize(id))) id = `${base}-${suffix++}`
      return [...current, { ...data, id, slug: id, title: data.title.trim(), displayOrder: current.length + 1, status: data.status || 'ACTIVE', showOnHome: Boolean(data.showOnHome), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
    })
    return id
  }, [])
  const updateCollection = useCallback((id, updates) => setCollections((current) => current.map((item) => normalize(item.id) === normalize(id) ? { ...item, ...updates, title: updates.title?.trim() || item.title, updatedAt: new Date().toISOString() } : item)), [])
  const setCollectionStatus = useCallback((id, status) => updateCollection(id, { status }), [updateCollection])
  const reorderCollections = useCallback((id, direction) => setCollections((current) => {
    const ordered = [...current].sort((a, b) => a.displayOrder - b.displayOrder)
    const index = ordered.findIndex((item) => normalize(item.id) === normalize(id))
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return current
    ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
    return ordered.map((item, itemIndex) => ({ ...item, displayOrder: itemIndex + 1, updatedAt: new Date().toISOString() }))
  }), [])
  const activeCollections = useMemo(() => getActiveCollections(collections), [collections])
  const homeCollections = useMemo(() => getHomeCollections(collections), [collections])
  const value = useMemo(() => ({ collections, activeCollections, homeCollections, getCollectionById, isDuplicateName, addCollection, updateCollection, deactivateCollection: (id) => setCollectionStatus(id, 'INACTIVE'), reactivateCollection: (id) => setCollectionStatus(id, 'ACTIVE'), reorderCollections }), [collections, activeCollections, homeCollections, getCollectionById, isDuplicateName, addCollection, updateCollection, setCollectionStatus, reorderCollections])
  return <StayCollectionsContext.Provider value={value}>{children}</StayCollectionsContext.Provider>
}
