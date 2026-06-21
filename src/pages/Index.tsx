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
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <Header isLogin={true}/>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-52 flex-shrink-0 overflow-y-auto border-r border-slate-300 bg-white">
          <NavBar />
        </aside>

        <main className="relative min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
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
