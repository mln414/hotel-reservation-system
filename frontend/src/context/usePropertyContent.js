import { useContext } from 'react'
import PropertyContentContext from './propertyContentContext.js'

export default function usePropertyContent() {
  const value = useContext(PropertyContentContext)
  if (!value) throw new Error('usePropertyContent must be used within PropertyContentProvider')
  return value
}
