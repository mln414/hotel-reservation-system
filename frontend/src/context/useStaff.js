import { useContext } from 'react'
import StaffContext from './staffContext.js'

export default function useStaff() {
  const context = useContext(StaffContext)
  if (!context) throw new Error('useStaff must be used within StaffProvider')
  return context
}
