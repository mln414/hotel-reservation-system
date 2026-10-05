import { useCallback, useEffect, useMemo, useState } from 'react'
import CustomerContext from './customerContext.js'
import { authApi } from '../services/authApi.js'

const emptyCustomer = {
  id: null,
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: '',
  status: '',
  createdAt: null,
  memberSince: '',
  isLoggedIn: false,
}

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(emptyCustomer)
  const [loading, setLoading] = useState(true)

  const refreshCustomer = useCallback(async () => {
    try {
      const data = await authApi.customerMe()
      if (data && data.email) {
        setCustomer({
          ...emptyCustomer,
          ...data,
          memberSince: data.createdAt ? data.createdAt.slice(0, 10) : '',
          isLoggedIn: true,
        })
        return data
      }
      setCustomer({ ...emptyCustomer, isLoggedIn: false })
    } catch {
      setCustomer({ ...emptyCustomer, isLoggedIn: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCustomer()
  }, [refreshCustomer])

  useEffect(() => {
    const clearExpiredCustomer = () => setCustomer({ ...emptyCustomer })
    window.addEventListener('lankastay:customer-unauthorized', clearExpiredCustomer)
    return () => window.removeEventListener('lankastay:customer-unauthorized', clearExpiredCustomer)
  }, [])

  const loginCustomer = useCallback(async (credentials) => {
    const data = await authApi.customerLogin(credentials)
    const activeCustomer = {
      ...emptyCustomer,
      ...data,
      memberSince: data.createdAt ? data.createdAt.slice(0, 10) : '',
      isLoggedIn: true,
    }
    setCustomer(activeCustomer)
    return activeCustomer
  }, [])

  const registerCustomer = useCallback(async (registrationData) => {
    const data = await authApi.customerRegister(registrationData)
    return data
  }, [])

  const logoutCustomer = useCallback(async () => {
    try {
      await authApi.customerLogout()
    } finally {
      setCustomer({ ...emptyCustomer, isLoggedIn: false })
    }
  }, [])

  const updateCustomer = useCallback(async (updates) => {
    const data = await authApi.updateCustomerProfile({
      firstName: updates.firstName,
      lastName: updates.lastName,
      phone: updates.phone,
      email: updates.email,
    })
    const updated = {
      ...emptyCustomer,
      ...data,
      memberSince: data.createdAt ? data.createdAt.slice(0, 10) : '',
      isLoggedIn: true,
    }
    setCustomer(updated)
    return { success: true, customer: updated }
  }, [])

  const changePassword = useCallback(async (passwordData) => {
    return await authApi.customerChangePassword(passwordData)
  }, [])

  const value = useMemo(
    () => ({
      customer,
      loading,
      loginCustomer,
      registerCustomer,
      logoutCustomer,
      updateCustomer,
      changePassword,
      refreshCustomer,
    }),
    [customer, loading, loginCustomer, registerCustomer, logoutCustomer, updateCustomer, changePassword, refreshCustomer]
  )

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
}
