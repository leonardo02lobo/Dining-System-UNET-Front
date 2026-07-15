import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { Index } from './pages/Index'
import { CheckConsumes } from './pages/CheckConsumes'
import { RegisterDining } from './pages/RegisterDining'
import { ListUser } from './pages/ListUser'
import { LoginAuditPage } from './pages/LoginAuditPage'
import { InventoryPage } from './pages/InventoryPage'
import { CreateLunchPage } from './pages/CreateLunchPage'
import { LunchTemplatesPage } from './pages/LunchTemplatesPage'
import { LunchTestPage } from './pages/LunchTestPage'
import { ReportsPage } from './pages/ReportsPage'
import { ManualRegistrationPage } from './pages/ManualRegistrationPage'
import { PermissionsPage } from './pages/PermissionsPage'
import { EmailTemplatePage } from './pages/EmailTemplatePage'
import { LunchSessionPage } from './pages/LunchSessionPage'
import { AccesoDirectoPage } from './pages/AccesoDirectoPage'
import { GeneralInventoryPage } from './pages/GeneralInventoryPage'
import { ConsumptionReportPage } from './pages/ConsumptionReportPage'
import { SessionHistoryPage } from './pages/SessionHistoryPage'
import { ExternalPeoplePage } from './pages/ExternalPeoplePage'
import { VerifyAccesoDirectoPage } from './pages/VerifyAccesoDirectoPage'
import { SedesPage } from './pages/SedesPage'
import { SuspendedListPage } from './pages/SuspendedListPage'
import { SuspendStudent } from './pages/SuspendStudent'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Index />}>
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="comedor/consultar" element={<CheckConsumes />} />
              <Route path="comedor/registrar" element={<RegisterDining />} />
              <Route path="comedor/reporte" element={<ReportsPage />} />
              <Route path="comedor/historial" element={<SessionHistoryPage />} />
              <Route path="comedor/registro-manual" element={<ManualRegistrationPage />} />
              <Route path="admin/permisos" element={<PermissionsPage />} />
              <Route path="admin/plantilla-correo" element={<EmailTemplatePage />} />
              <Route path="inventario" element={<InventoryPage />} />
              <Route path="inventario/general" element={<GeneralInventoryPage />} />
              <Route path="inventario/reportes-consumo" element={<ConsumptionReportPage />} />
              <Route path="inventario/crear" element={<CreateLunchPage />} />
              <Route path="inventario/plantillas" element={<LunchTemplatesPage />} />
              <Route path="inventario/pruebas-almuerzo" element={<LunchTestPage />} />
              <Route path="usuarios" element={<ListUser />} />
              <Route path="auditoria" element={<LoginAuditPage />} />
              <Route path="comedor/suspender" element={<SuspendStudent />} />
              <Route path="suspendidos" element={<SuspendedListPage />} />
              <Route path="comedor/sesion" element={<LunchSessionPage />} />
              <Route path="accesos_directos" element={<AccesoDirectoPage />} />
              <Route path="gente-externa" element={<ExternalPeoplePage />} />
              <Route path="verificar-acceso-directo" element={<VerifyAccesoDirectoPage />} />
              <Route path="sedes" element={<SedesPage />} />

              <Route path="checkConsumes" element={<Navigate to="/comedor/consultar" replace />} />
              <Route path="registerDining" element={<Navigate to="/comedor/registrar" replace />} />
              <Route path="listUser" element={<Navigate to="/usuarios" replace />} />
              <Route path="loginAudit" element={<Navigate to="/auditoria" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
