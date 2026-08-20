import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'

/** Gate for authenticated app routes; bounces to /login when signed out. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-dvh place-items-center text-sm font-bold text-mute">Loading KKB…</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
