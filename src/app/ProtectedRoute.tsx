import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'

/** Gate for authenticated app routes; bounces to /login when signed out. */
export function ProtectedRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
