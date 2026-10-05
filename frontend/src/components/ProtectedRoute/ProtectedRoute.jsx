import { Navigate, Outlet, useLocation } from 'react-router'

function ProtectedRoute({ isAllowed = true, redirectPath = '/login' }) {
  const location = useLocation()

  if (!isAllowed) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute
