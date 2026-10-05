import { useContext } from 'react'
import RoomsContext from './roomsContext.js'

export default function useRooms() {
  const context = useContext(RoomsContext)
  if (!context) throw new Error('useRooms must be used within RoomsProvider')
  return context
}
