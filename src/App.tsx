import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { LoginPage } from './pages/LoginPage'
import { Index } from './pages/Index'
import { Dashboard } from './pages/Dashboard'
import { CheckConsumes } from './pages/CheckConsumes'
import { RegisterDining } from './pages/RegisterDining'
import { SuspendStudent } from './pages/SuspendStudent'
import { ListUser } from './pages/ListUser'
import { LoginAuditPage } from './pages/LoginAuditPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Header />
        <Routes>
          <Route path="/" element={<Index />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="checkConsumes" element={<CheckConsumes />} />
            <Route path="registerDining" element={<RegisterDining />} />
            <Route path="suspendStudent" element={<SuspendStudent />} />
            <Route path="listUser" element={<ListUser />} />
            <Route path="loginAudit" element={<LoginAuditPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
