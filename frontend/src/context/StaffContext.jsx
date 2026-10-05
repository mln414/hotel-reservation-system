import { useCallback, useMemo, useState } from 'react'
import { apiRequest } from '../services/authApi.js'
import { sameStaffId } from '../utils/staffManagement.js'
import StaffContext from './staffContext.js'

const normalizeMember = (member) => ({ ...member, name: `${member.firstName} ${member.lastName}`.trim() })

export function StaffProvider({ children }) {
  const [staff, setStaff] = useState([])

  const refreshStaff = useCallback(async () => {
    const items = await apiRequest('/api/v1/admin/staff')
    const normalized = items.map(normalizeMember)
    setStaff(normalized)
    return normalized
  }, [])

  const getStaffById = useCallback((id) => staff.find((member) => sameStaffId(member.id, id)), [staff])

  const updateStaffAccess = useCallback(async (id, access) => {
    try {
      const member = normalizeMember(await apiRequest(`/api/v1/admin/staff/${id}`, { method: 'PATCH', body: JSON.stringify(access) }))
      setStaff((items) => items.map((item) => sameStaffId(item.id, id) ? member : item))
      return { staff: member }
    } catch (error) { return { error: error.message } }
  }, [])

  const setStaffAccessStatus = useCallback(async (id, status) => {
    try {
      const member = normalizeMember(await apiRequest(`/api/v1/admin/staff/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }))
      setStaff((items) => items.map((item) => sameStaffId(item.id, id) ? member : item))
      return { staff: member }
    } catch (error) { return { error: error.message } }
  }, [])

  const createStaff = useCallback(async (data) => {
    const result = await apiRequest('/api/v1/admin/staff', { method: 'POST', body: JSON.stringify(data) })
    const staffMember = normalizeMember(result.staff)
    setStaff((items) => [...items, staffMember])
    return { ...result, staff: staffMember }
  }, [])

  const resetStaffPassword = useCallback((id) => apiRequest(`/api/v1/admin/staff/${id}/reset-password`, { method: 'POST' }), [])

  const value = useMemo(() => ({
    staff, refreshStaff, getStaffById, updateStaffAccess, createStaff, resetStaffPassword,
    grantStaffAccess: (id) => setStaffAccessStatus(id, 'ACTIVE'),
    revokeStaffAccess: (id) => setStaffAccessStatus(id, 'DISABLED'),
  }), [staff, refreshStaff, getStaffById, updateStaffAccess, createStaff, resetStaffPassword, setStaffAccessStatus])

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>
}
