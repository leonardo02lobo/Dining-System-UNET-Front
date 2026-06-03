import { Lock, RotateCcw } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canAccess } from '../../config/routeAccess'

interface NavItem {
  to: string
  label: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Comedor',
    items: [
      { to: '/comedor/consultar',        label: 'Consultar Consumo'   },
      { to: '/comedor/registrar',        label: 'Registro al Comedor' },
      { to: '/comedor/reporte',          label: 'Reporte de Comedor'  },
      { to: '/comedor/registro-manual',  label: 'Registro Manual'     },
      { to: '/suspendStudent',           label: 'Suspender Usuario'   },
      { to: '/usuarios',                 label: 'Lista de Usuario'    },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { to: '/inventario',       label: 'Registrar Inventario' },
      { to: '/inventario/crear', label: 'Crear Almuerzo'       },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/auditoria',      label: 'Auditoría de Acceso'  },
      { to: '/admin/permisos', label: 'Gestión de Permisos'  },
    ],
  },
]

export function NavBar() {
  const { user, logout, permissions } = useAuth()

  const role = user?.role.name

  return (
    <nav className="flex h-full flex-col bg-white">

      {/* ── Menu Principal ─────────────────────────── */}
      <NavLink
        to="/"
        end
        className="flex items-center gap-2 px-4 py-3 text-base font-bold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        <RotateCcw size={22} className="text-green-500 flex-shrink-0" />
        Menu Principal
      </NavLink>

      <hr className="border-slate-300" />

      {/* ── Grupos ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {navGroups.map((group) => {
          const visible = group.items.filter((item) =>
            role ? canAccess(item.to, role, permissions) : false
          )
          if (visible.length === 0) return null

          return (
            <div key={group.label}>
              {/* Cabecera del grupo */}
              <p className="px-4 pt-4 pb-1 text-sm font-bold text-slate-900">
                {group.label}
              </p>

              {/* Items */}
              <ul>
                {visible.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `block px-6 py-1.5 text-sm transition-colors ${
                          isActive
                            ? 'font-semibold text-blue-600 bg-blue-50 border-l-2 border-blue-600'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <hr className="mt-3 border-slate-300" />
            </div>
          )
        })}
      </div>

      {/* ── Cierra Sesion ──────────────────────────── */}
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-2 px-4 py-3 text-base font-bold text-slate-800 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <Lock size={20} className="text-red-500 flex-shrink-0" />
        Cierra Sesion
      </button>
    </nav>
  )
}
