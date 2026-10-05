import { useContext } from 'react'
import HotelDraftContext from './hotelDraftContext.js'

export default function useHotelDraft() {
  const value = useContext(HotelDraftContext)
  if (!value) throw new Error('useHotelDraft must be used within HotelDraftProvider')
  return value
}
