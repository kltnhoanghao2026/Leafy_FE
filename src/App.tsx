import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage'
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardPage } from './features/metrics-view/pages/DashboardPage'
import { ZoneDetailMetricsPage } from './features/metrics-view/pages/ZoneDetailMetricsPage'
import { DeviceManagementPage } from './features/device-management/pages/DeviceManagementPage'
import { CommunityView } from './features/community/pages/CommunityView'
import { ProtectedRoute } from './components/ProtectedRoute'
import { GuestOnlyRoute } from './components/GuestOnlyRoute'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest-only routes */}
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="metrics/:zoneId" element={<ZoneDetailMetricsPage />} />
            <Route path="devices" element={<DeviceManagementPage />} />
            <Route path="community" element={<CommunityView />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#111827',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            padding: '16px',
            fontWeight: 'bold',
            fontSize: '14px'
          },
        }} 
      />
    </BrowserRouter>
  )
}

export default App
