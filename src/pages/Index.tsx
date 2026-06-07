import { Outlet } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { NavBar } from '../components/ui/NavBar'

export function Index() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <Header isLogin={true}/>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 flex-shrink-0 overflow-y-auto border-r border-slate-300 bg-white">
          <NavBar />
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
