import { Navigate, Outlet, useLocation } from 'react-router'
import { MANAGEMENT_ROLES } from '../../constants/roles.js'
import useAuth from '../../context/useAuth.js'

function ManagementProtectedRoute({ allowedRoles = MANAGEMENT_ROLES }) {
  const location = useLocation()
  const { user, loading } = useAuth()

  if (loading) return <p role="status">Checking your secure session...</p>

  if (!user) {
    return <Navigate to="/staff/login" replace state={{ from: location }} />
  }

  if (user.status !== 'ACTIVE' || !allowedRoles.includes(user.role)) {
    return <Navigate to="/staff/login" replace state={{ accessDenied: true }} />
  }

  if (user.mustChangePassword) {
    return <Navigate to="/staff/change-password" replace state={{ from: location }} />
  }

  // Security: frontend route guards are UX only; backend authorization remains authoritative.
  return <Outlet />
}

export default ManagementProtectedRoute
