import { Fragment, useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { permissionsApi, type Permission } from '../api/permissions'
import { userApi } from '../api/user'
import type { UserAccount } from '../types/user'
import type { RoleName } from '../types/auth'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Toggle } from '../components/ui/Toggle'
import { Spinner } from '../components/ui/Spinner'
import { Card } from '../components/ui/Card'
import { SearchInput } from '../components/ui/SearchInput'

/** Agrupa cada ruta en una sección legible (espejo de los grupos del NavBar). */
function sectionOf(route: string): string {
  if (route.startsWith('/inventario')) return 'Inventario'
  if (route.startsWith('/admin') || route === '/auditoria' || route === '/sedes') return 'Administración'
  return 'Comedor'
}

const SECTION_ORDER = ['Comedor', 'Inventario', 'Administración']

const ROLE_LABEL: Record<RoleName, string> = {
  SUPER_ADMIN:  'Super Admin',
  ADMIN:        'Admin',
  TAQUILLERO:   'Taquillero',
  ACCESO_DIRECTO: 'Acceso Directo',
}

const ROLE_VARIANT: Record<RoleName, 'info' | 'warning' | 'neutral'> = {
  SUPER_ADMIN:  'info',
  ADMIN:        'warning',
  TAQUILLERO:   'neutral',
  ACCESO_DIRECTO: 'neutral',
}

export function PermissionsPage() {
  const [users,        setUsers]        = useState<UserAccount[]>([])
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [permissions,  setPermissions]  = useState<Permission[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [permsLoading, setPermsLoading] = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState<string | null>(null)
  const [search,       setSearch]       = useState('')

  // Load user list once
  useEffect(() => {
    void (async () => {
      try {
        const data = await userApi.list()
        setUsers(data)
        if (data.length) setSelectedUser(data[0])
      } catch (err: any) {
        setError(err.message ?? 'Error al cargar los usuarios')
      } finally {
        setUsersLoading(false)
      }
    })()
  }, [])

  // Load permissions when selected user changes
  useEffect(() => {
    if (!selectedUser) return
    setPermsLoading(true)
    setError(null)
    setSuccess(null)
    void (async () => {
      try {
        const data = await permissionsApi.getByUser(selectedUser.id, selectedUser.role.name)
        setPermissions(data)
      } catch (err: any) {
        setError(err.message ?? 'Error al cargar los permisos')
      } finally {
        setPermsLoading(false)
      }
    })()
  }, [selectedUser])

  function handleUserChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const user = users.find((u) => String(u.id) === e.target.value) ?? null
    setSelectedUser(user)
  }

  function togglePermission(route: string) {
    setPermissions((prev) =>
      prev.map((p) => p.route === route ? { ...p, enabled: !p.enabled } : p)
    )
  }

  async function handleSave() {
    if (!selectedUser) return
    setSaving(true)
    setError(null)
    try {
      await permissionsApi.update(selectedUser.id, permissions)
      setSuccess(`Permisos de ${selectedUser.name} guardados correctamente`)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar los permisos')
    } finally {
      setSaving(false)
    }
  }

  const userOptions = users.map((u) => ({
    value: String(u.id),
    label: `${u.name} — ${ROLE_LABEL[u.role.name]}`,
  }))

  // Filtra por texto y agrupa por sección para una lista larga más manejable.
  const term = search.trim().toLowerCase()
  const filtered = term
    ? permissions.filter(
        (p) => p.label.toLowerCase().includes(term) || p.route.toLowerCase().includes(term),
      )
    : permissions
  const grouped = SECTION_ORDER
    .map((section) => ({
      section,
      items: filtered.filter((p) => sectionOf(p.route) === section),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div>
      <PageHeader
        title="Gestión de permisos por Usuario"
        subtitle="Configura qué funcionalidades puede acceder cada usuario"
      />

      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {usersLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Card variant="outlined" padding="md" className="mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <Select
                label="Seleccionar Usuario"
                options={userOptions}
                value={selectedUser ? String(selectedUser.id) : ''}
                onChange={handleUserChange}
                className="w-full sm:w-80"
              />
              {selectedUser && (
                <div className="flex items-center gap-2 pb-0.5">
                  <span className="text-sm text-slate-500">Rol:</span>
                  <Badge variant={ROLE_VARIANT[selectedUser.role.name]}>
                    {ROLE_LABEL[selectedUser.role.name]}
                  </Badge>
                  <span className="text-sm text-slate-500">Estado:</span>
                  <Badge variant={selectedUser.is_active ? 'success' : 'danger'}>
                    {selectedUser.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              )}
              <div className="w-full sm:ml-auto sm:w-72">
                <SearchInput
                  placeholder="Buscar funcionalidad o ruta…"
                  debounceMs={200}
                  onSearch={setSearch}
                  fullWidth
                />
              </div>
            </div>
          </Card>

          <div className="relative w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
            {permsLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                <Spinner size="lg" />
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Módulo / Funcionalidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Permiso
                  </th>
                </tr>
              </thead>
              <tbody>
                {grouped.length === 0 && !permsLoading && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-sm text-slate-400">
                      No hay funcionalidades que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
                {grouped.map((group) => (
                  <Fragment key={group.section}>
                    <tr className="bg-slate-50/70">
                      <td
                        colSpan={2}
                        className="px-6 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {group.section}
                      </td>
                    </tr>
                    {group.items.map((perm) => (
                      <tr
                        key={perm.route}
                        className="border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 text-slate-700">
                          {perm.label}
                          <span className="ml-2 text-xs text-slate-400">{perm.route}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Toggle
                            checked={perm.enabled}
                            onChange={() => togglePermission(perm.route)}
                          />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              leftIcon={<Save size={15} />}
              loading={saving}
              onClick={handleSave}
            >
              Guardar Cambios
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
