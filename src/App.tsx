import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './app/ProtectedRoute'
import { AppLayout } from './app/layout/AppLayout'
import { Login } from './app/routes/Login'
import { Dashboard } from './app/routes/Dashboard'
import { GroupDetail } from './app/routes/GroupDetail'
import { Activity } from './app/routes/Activity'
import { Privacy, Terms } from './app/routes/Legal'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups/:groupId" element={<GroupDetail />} />
          <Route path="/activity" element={<Activity />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
