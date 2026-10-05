import { useContext } from 'react'
import HotelsContext from './hotelsContext.js'

export default function useHotels() {
  const context = useContext(HotelsContext)
  if (!context) throw new Error('useHotels must be used within HotelsProvider')
  return context
}
