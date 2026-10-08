import { useEffect, useMemo, useState } from 'react'
import { reservationApi } from '../services/reservationApi.js'

export function availabilityKey({ hotelId, roomId, roomTypeId, checkIn, checkOut, quantity, requestedQuantity }) {
  return [hotelId, roomId ?? roomTypeId, checkIn, checkOut, quantity ?? requestedQuantity ?? 1].join(':')
}

function toRequest(query) {
  return {
    hotelId: query.hotelId,
    roomId: query.roomId ?? query.roomTypeId,
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    quantity: query.quantity ?? query.requestedQuantity ?? 1,
  }
}

// Customer discovery is deliberately backed by the same server availability
// calculation for guests and authenticated customers. The cache is per rendered
// query set; quote and create still perform their own final server-side checks.
export default function useAuthoritativeAvailability(queries = []) {
  const requests = useMemo(() => queries
    .map(toRequest)
    .filter((query) => query.hotelId && query.roomId && query.checkIn && query.checkOut && query.checkOut > query.checkIn), [queries])
  const requestKey = requests.map(availabilityKey).sort().join('|')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!requests.length) {
      setResults({})
      setLoading(false)
      return undefined
    }

    setResults({})
    setLoading(true)
    Promise.all(requests.map(async (request) => {
      const key = availabilityKey(request)
      try {
        return [key, await reservationApi.availability(request)]
      } catch (error) {
        return [key, { available: null, message: error.message || 'Live availability could not be checked.' }]
      }
    })).then((entries) => {
      if (active) setResults(Object.fromEntries(entries))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [requestKey])

  const getAvailability = (query) => results[availabilityKey(toRequest(query))] || null
  return { getAvailability, loading }
}
