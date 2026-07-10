import { ChevronDown, Lock, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canAccess } from '../../config/routeAccess'
import { Button } from './Button'
import { Modal } from './Modal'

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
      { to: '/comedor/sesion',           label: 'Sesión de Almuerzo'  },
      { to: '/comedor/consultar',        label: 'Consultar Consumo'   },
      { to: '/comedor/registrar',        label: 'Registro al Comedor' },
      { to: '/comedor/reporte',          label: 'Reporte de Comedor'  },
      { to: '/comedor/registro-manual',  label: 'Registro Manual'     },
      { to: '/suspendStudent',           label: 'Suspender Usuario'   },
      { to: '/suspendidos',              label: 'Usuarios Suspendidos' },
      { to: '/verificar-acceso-directo',  label: 'Verificar Acceso Directo' },
      { to: '/accesos_directos',         label: 'Accesos Directos'         },
      { to: '/usuarios',                 label: 'Lista de Usuario'       },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { to: '/inventario',              label: 'Registrar Inventario'  },
      { to: '/inventario/general',      label: 'Inventario General'    },
      { to: '/inventario/reportes-consumo', label: 'Reportes de Consumo' },
      { to: '/inventario/crear',        label: 'Crear Almuerzo'        },
      { to: '/inventario/pruebas-almuerzo', label: 'Pruebas de Almuerzo' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/auditoria',      label: 'Auditoría de Acceso'  },
      { to: '/admin/permisos', label: 'Gestión de Permisos'  },
      { to: '/sedes',          label: 'Sedes'                 },
    ],
  },
]

interface NavBarProps {
  /** Se invoca al navegar; usado para cerrar el drawer en móvil. */
  onNavigate?: () => void
}

export function NavBar({ onNavigate }: NavBarProps = {}) {
  const { user, logout, permissions } = useAuth()
  const { pathname } = useLocation()
  const currentGroup = navGroups.find((group) => group.items.some((item) => item.to === pathname))?.label ?? null
  const [openGroup, setOpenGroup] = useState<string | null>(currentGroup)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const role = user?.role.name

  useEffect(() => {
    if (currentGroup) setOpenGroup(currentGroup)
  }, [currentGroup])

  function toggleGroup(label: string) {
    setOpenGroup((prev) => (prev === label ? null : label))
  }

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  return (
    <nav className="flex h-full flex-col bg-white">
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-3 text-base font-bold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        <RotateCcw size={22} className="text-green-500 flex-shrink-0" />
        Menu Principal
      </NavLink>

      <hr className="border-slate-300" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        {navGroups.map((group) => {
          const visible = group.items.filter((item) =>
            role ? canAccess(item.to, role, permissions) : false
          )
          if (visible.length === 0) return null

          const isOpen = openGroup === group.label

          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center justify-between px-4 pt-4 pb-1 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
              >
                {group.label}
                <ChevronDown
                  size={15}
                  className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <ul>
                  {visible.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end
                        onClick={onNavigate}
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
              )}

              <hr className="mt-3 border-slate-300" />
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setLogoutModalOpen(true)}
        className="flex items-center gap-2 px-4 py-3 text-base font-bold text-slate-800 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <Lock size={20} className="text-red-500 flex-shrink-0" />
        Cerrar Sesión
      </button>

      <Modal
        open={logoutModalOpen}
        onClose={() => {
          if (!loggingOut) setLogoutModalOpen(false)
        }}
        title="Cerrar sesión"
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={loggingOut}
              onClick={() => setLogoutModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={loggingOut}
              onClick={handleLogout}
            >
              Salir
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-600">
          ¿Está seguro de que desea salir de la sesión?
        </p>
      </Modal>
    </nav>
  )
}
