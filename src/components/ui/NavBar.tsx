import { NavLink } from 'react-router-dom'

export function NavBar() {
    return (
        <aside className="flex h-full w-full flex-col gap-6 rounded-3xl bg-slate-950/95 p-6 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
            <a href="/" className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-300/30">
                    <img
                        src="/assets/Atras.png"
                        alt="Menú principal"
                        className="h-8 w-8 object-contain"
                    />
                </div>

                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
                        Sistema
                    </p>
                    <h2 className="text-lg font-semibold leading-tight">Menú Principal</h2>
                </div>
            </a>

            <nav className="flex flex-1 flex-col gap-3">
                <NavLink
                    to="/dashboard"
                    end
                    className={({ isActive }) =>
                        [
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            isActive
                                ? 'bg-white/10 text-white'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        ].join(' ')
                    }
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/checkConsumes"
                    end
                    className={({ isActive }) =>
                        [
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            isActive
                                ? 'bg-white/10 text-white'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        ].join(' ')
                    }
                >
                    Consultar Consumo
                </NavLink>
                <NavLink
                    to="/registerDining"
                    end
                    className={({ isActive }) =>
                        [
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            isActive
                                ? 'bg-white/10 text-white'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        ].join(' ')
                    }
                >
                    Registrar Consumo
                </NavLink>
                <NavLink
                    to="/suspendStudent"
                    end
                    className={({ isActive }) =>
                        [
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            isActive
                                ? 'bg-white/10 text-white'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        ].join(' ')
                    }
                >
                    Suspender Estudiante
                </NavLink>
                <NavLink
                    to="/listUser"
                    end
                    className={({ isActive }) =>
                        [
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            isActive
                                ? 'bg-white/10 text-white'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        ].join(' ')
                    }
                >
                    Listar Usuarios
                </NavLink>
            </nav>
            <a href="/login" className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-300/30">
                    <img
                        src="/assets/logout4.png"
                        alt="Menú principal"
                        className="h-8 w-8 object-contain"
                    />
                </div>

                <div>
                    <h2 className="text-lg font-semibold leading-tight">Cerrar Sesion</h2>
                </div>
            </a>
        </aside>
    )
}