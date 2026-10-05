import { useContext } from 'react'
import CustomerContext from './customerContext.js'

export default function useCustomer() {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomer must be used within a CustomerProvider')
  return context
}
