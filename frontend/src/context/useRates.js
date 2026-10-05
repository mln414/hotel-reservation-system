import { useContext } from 'react'
import RatesContext from './ratesContext.js'

export default function useRates() {
  const context = useContext(RatesContext)
  if (!context) throw new Error('useRates must be used within a RatesProvider')
  return context
}
