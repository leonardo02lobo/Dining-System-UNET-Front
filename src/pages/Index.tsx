import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { NavBar } from '../components/ui/NavBar'
import { LogoDecanato } from '../components/icons/LogoDecanato'

function HomeWatermark() {
  const { pathname } = useLocation()

  if (pathname !== '/') return null

  return (
    <div
      className="pointer-events-none absolute inset-0 p-10"
      aria-hidden="true"
    >
      <LogoDecanato className="absolute right-0 top-1/2 h-1/2 w-1/2 -translate-y-1/2 -rotate-45 opacity-20 object-contain" />
    </div>
  )
}

export function Index() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <Header isLogin={true} onMenuClick={() => setSidebarOpen((v) => !v)} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Backdrop del drawer (solo móvil) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-slate-300 bg-white transition-transform duration-200 lg:static lg:z-auto lg:w-52 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <NavBar onNavigate={() => setSidebarOpen(false)} />
        </aside>

        <main className="relative min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          <HomeWatermark />

          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
