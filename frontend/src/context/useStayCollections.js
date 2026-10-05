import { useContext } from 'react'
import StayCollectionsContext from './stayCollectionsContext.js'

export default function useStayCollections() {
  const value = useContext(StayCollectionsContext)
  if (!value) throw new Error('useStayCollections must be used within StayCollectionsProvider')
  return value
}
