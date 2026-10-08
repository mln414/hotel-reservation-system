import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/authApi.js'
import AuthContext from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const current = await authApi.me()
      setUser(current)
      return current
    } catch (error) {
      if (error.status === 401) setUser(null)
      return null
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    const handleAuthError = (event) => {
      if (event.detail?.status === 401) setUser(null)
      else refresh()
    }
    window.addEventListener('lankastay:auth-error', handleAuthError)
    return () => window.removeEventListener('lankastay:auth-error', handleAuthError)
  }, [refresh])

  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials)
    setUser(result.user)
    return result
  }, [])

  const changeInitialPassword = useCallback(async (data) => {
    const current = await authApi.changeInitialPassword(data)
    setUser(current)
    return current
  }, [])

  const changePassword = useCallback((data) => authApi.changePassword(data), [])
  const logout = useCallback(async () => {
    try { await authApi.logout() } finally { setUser(null) }
  }, [])

  // Security: this state mirrors the backend session for UX; it is never proof of authorization.
  const value = useMemo(() => ({ user, loading, login, logout, refresh, changeInitialPassword, changePassword }),
    [user, loading, login, logout, refresh, changeInitialPassword, changePassword])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
