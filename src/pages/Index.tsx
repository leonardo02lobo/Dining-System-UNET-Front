import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { NavBar } from '../components/ui/NavBar'

export function Index() {
  const { pathname } = useLocation()
  const showWatermark = pathname === '/'

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header isLogin={true}/>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 flex-shrink-0 overflow-y-auto border-r border-slate-300 bg-white">
          <NavBar />
        </aside>

        <main className="relative flex-1 overflow-y-auto bg-slate-50 p-6">
          {showWatermark && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center p-10"
              aria-hidden="true"
            >
              <img
                src="/assets/LOGO DECANATO.png"
                alt=""
                className="max-h-[70%] max-w-[75%] object-contain opacity-10"
              />
            </div>
          )}

          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
