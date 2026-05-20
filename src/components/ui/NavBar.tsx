import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { authApi } from '../../api/auth'
import type { RoleName, User } from '../../types/auth'

interface NavItem {
    to: string
    label: string
    roles: RoleName[]
}

const navBar: NavItem[] = [
    { to: '/dashboard',      label: 'Dashboard',            roles: ['SUPER_ADMIN'] },
    { to: '/checkConsumes',  label: 'Consultar Consumo',    roles: ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'] },
    { to: '/registerDining', label: 'Registrar Consumo',    roles: ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'] },
    { to: '/suspendStudent', label: 'Suspender Estudiante', roles: ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'] },
    { to: '/listUser',       label: 'Listar Usuarios',      roles: ['SUPER_ADMIN', 'ADMIN'] },
]

export function NavBar() {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        authApi.me().then(setUser).catch(() => setUser(null))
    }, [])

    const visibleLinks = navBar.filter(item => user && item.roles.includes(user.role.name))

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
                {visibleLinks.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
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
                        {label}
                    </NavLink>
                ))}
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