import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import HotelDraftContext from './hotelDraftContext.js'

const emptyHotelDraft = { name: '', propertyType: '', shortDescription: '', collectionIds: [], destinationId: '', address: '', city: '', province: '', postalCode: '', email: '', phone: '', website: '', latitude: '', longitude: '', mainImage: '', gallery: [] }

export function HotelDraftProvider({ children }) {
  const [draft, setDraft] = useState(emptyHotelDraft)
  const [step, setStep] = useState(1)
  const [dirty, setDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const timer = useRef(null)
  const hasDraft = Boolean(draft.name || draft.propertyType || draft.destinationId || draft.collectionIds.length || draft.mainImage)
  const updateDraft = useCallback((updates) => { setDraft((current) => ({ ...current, ...(typeof updates === 'function' ? updates(current) : updates) })); setDirty(true) }, [])
  useEffect(() => {
    if (!dirty) return undefined
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { setDirty(false); setLastSavedAt(new Date().toISOString()) }, 450)
    return () => window.clearTimeout(timer.current)
  }, [draft, step, dirty])
  const changeStep = useCallback((next) => { setStep(Math.min(5, Math.max(1, next))); setDirty(true) }, [])
  const resetDraft = useCallback(() => { setDraft(emptyHotelDraft); setStep(1); setDirty(false); setLastSavedAt(null) }, [])
  const value = useMemo(() => ({ draft, step, dirty, lastSavedAt, hasDraft, updateDraft, setStep: changeStep, resetDraft }), [draft, step, dirty, lastSavedAt, hasDraft, updateDraft, changeStep, resetDraft])
  return <HotelDraftContext.Provider value={value}>{children}</HotelDraftContext.Provider>
}
