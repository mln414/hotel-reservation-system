import { useCallback, useEffect, useState } from 'react'
import { contentApi } from '../services/contentApi.js'

const replaceById = (items, item) => [...items.filter((current) => String(current.id) !== String(item.id)), item]
const seedRequests = new Map()

function seedContentOnce(type, records) {
  const pending = seedRequests.get(type)
  if (pending) return pending
  const request = contentApi.seedIfEmpty(type, records).finally(() => {
    if (seedRequests.get(type) === request) seedRequests.delete(type)
  })
  seedRequests.set(type, request)
  return request
}

export default function usePersistentContent(type, initialItems, user) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isManager = user?.role === 'MANAGER'

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      let records = await contentApi.list(type, isManager)
      if (isManager && records.length === 0 && initialItems.length > 0) {
        records = await seedContentOnce(type, initialItems)
      }
      if (!isManager && records.length === 0 && initialItems.length > 0 && !(await contentApi.isInitialized(type))) {
        setItems((current) => current.length ? current : initialItems)
      } else {
        setItems(records)
      }
      setError('')
      return records
    } catch (cause) {
      setError(cause.message || 'Content could not be loaded from the server.')
      throw cause
    } finally {
      setLoading(false)
    }
  }, [initialItems, isManager, type])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const create = useCallback(async (content) => {
    try {
      const saved = await contentApi.create(type, content)
      setItems((current) => replaceById(current, saved))
      setError('')
      return saved
    } catch (cause) {
      setError(cause.message || 'Content could not be saved.')
      throw cause
    }
  }, [type])

  const update = useCallback(async (id, updates) => {
    const current = items.find((item) => String(item.id) === String(id))
    if (!current) throw new Error('The content item was not found.')
    try {
      const saved = await contentApi.update(type, id, { ...current, ...updates, updatedAt: new Date().toISOString() })
      setItems((previous) => previous.map((item) => String(item.id) === String(id) ? saved : item))
      setError('')
      return saved
    } catch (cause) {
      setError(cause.message || 'Content could not be saved.')
      throw cause
    }
  }, [items, type])

  const updateMany = useCallback(async (records) => {
    try {
      const saved = await contentApi.updateMany(type, records)
      setItems((current) => {
        const byId = new Map(saved.map((item) => [String(item.id), item]))
        return current.map((item) => byId.get(String(item.id)) || item)
      })
      setError('')
      return saved
    } catch (cause) {
      setError(cause.message || 'Content could not be reordered.')
      throw cause
    }
  }, [type])

  return { items, setItems, loading, error, refresh, create, update, updateMany }
}
