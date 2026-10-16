import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { UpdatePrompt } from './components/UpdatePrompt'
import { Login } from './pages/Login'
import { AdminCalendar } from './pages/AdminCalendar'
import { AdminServices } from './pages/AdminServices'
import { AdminTechnicians } from './pages/AdminTechnicians'
import { AdminClients } from './pages/AdminClients'
import { AdminMaintenance } from './pages/AdminMaintenance'
import { AdminRescheduled } from './pages/AdminRescheduled'
import { AdminSettings } from './pages/AdminSettings'
import { AdminStatistics } from './pages/AdminStatistics'
import { TechnicianCalendar } from './pages/TechnicianCalendar'
import { Today } from './pages/Today'
import { Profile } from './pages/Profile'

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <UpdatePrompt />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['tecnico']}>
                  <TechnicianCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCalendar />
                </ProtectedRoute>
              }
            />
            <Route path="/hoje" element={<Today />} />
            <Route path="/perfil" element={<Profile />} />
            <Route
              path="/admin/servicos"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tecnicos"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminTechnicians />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clientes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminClients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manutencoes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMaintenance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/por-remarcar"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminRescheduled />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/estatisticas"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminStatistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/configuracoes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
