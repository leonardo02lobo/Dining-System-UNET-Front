import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { Index } from './pages/Index'
import { Dashboard } from './pages/Dashboard'
import { CheckConsumes } from './pages/CheckConsumes'
import { RegisterDining } from './pages/RegisterDining'
import { SuspendStudent } from './pages/SuspendStudent'
import { ListUser } from './pages/ListUser'
import { LoginAuditPage } from './pages/LoginAuditPage'
import { InventoryPage } from './pages/InventoryPage'
import { CreateLunchPage } from './pages/CreateLunchPage'
import { ReportsPage } from './pages/ReportsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Standalone — sin header/sidebar */}
          <Route path="/login" element={<LoginPage />} />

          {/* Layout principal con Header, GreetingBar, NavBar y Footer */}
          <Route path="/" element={<Index />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="comedor/consultar" element={<CheckConsumes />} />
            <Route path="comedor/registrar" element={<RegisterDining />} />
            <Route path="comedor/reporte" element={<ReportsPage />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="inventario/crear" element={<CreateLunchPage />} />
            <Route path="usuarios" element={<ListUser />} />
            <Route path="auditoria" element={<LoginAuditPage />} />
            <Route path="suspendStudent" element={<SuspendStudent />} />

            {/* Redirects backward-compat */}
            <Route path="checkConsumes" element={<Navigate to="/comedor/consultar" replace />} />
            <Route path="registerDining" element={<Navigate to="/comedor/registrar" replace />} />
            <Route path="listUser" element={<Navigate to="/usuarios" replace />} />
            <Route path="loginAudit" element={<Navigate to="/auditoria" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
