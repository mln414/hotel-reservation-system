import { useContext } from 'react'
import DestinationsContext from './destinationsContext.js'

export default function useDestinations() {
  const context = useContext(DestinationsContext)
  if (!context) throw new Error('useDestinations must be used within DestinationsProvider')
  return context
}
