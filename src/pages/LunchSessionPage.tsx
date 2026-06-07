import { useEffect, useState } from 'react'
import { CalendarCheck, PlayCircle, StopCircle } from 'lucide-react'
import { lunchSessionApi } from '../api/lunchSession'
import { useAuth } from '../context/AuthContext'
import { notify } from '../utils/toast'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import type { LunchSession } from '../types/lunchSession'

export function LunchSessionPage() {
  const { user } = useAuth()
  const [session, setSession] = useState<LunchSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const canManage = user?.role.name === 'SUPER_ADMIN' || user?.role.name === 'ADMIN'

  useEffect(() => {
    fetchToday()
  }, [])

  async function fetchToday() {
    setLoading(true)
    try {
      const s = await lunchSessionApi.today()
      setSession(s)
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleOpen() {
    setSaving(true)
    try {
      const s = await lunchSessionApi.open()
      setSession(s)
      notify.success('Sesión de almuerzo abierta correctamente.')
    } catch (err) {
      notify.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleClose() {
    if (!session) return
    setSaving(true)
    try {
      const s = await lunchSessionApi.close(session.id)
      setSession(s)
      notify.success('Sesión de almuerzo cerrada.')
    } catch (err) {
      notify.error(err)
    } finally {
      setSaving(false)
    }
  }

  const isOpen = session?.status === 'OPEN'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        breadcrumb="Comedor"
        title="Sesión de Almuerzo"
        subtitle="Abre o cierra la sesión de servicio del día."
      />

      <Card variant="outlined" padding="lg">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Estado de la sesión */}
            <div className="flex items-center gap-4">
              <CalendarCheck size={32} className={isOpen ? 'text-green-500' : 'text-slate-400'} />
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500">Estado de hoy</span>
                {session ? (
                  <>
                    <Badge variant={isOpen ? 'success' : 'neutral'}>
                      {isOpen ? 'Sesión Abierta' : 'Sesión Cerrada'}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      Fecha: {session.date}
                      {session.opened_at && ` · Abierta a las ${new Date(session.opened_at).toLocaleTimeString()}`}
                    </span>
                    {session.closed_at && (
                      <span className="text-xs text-slate-400">
                        Cerrada a las {new Date(session.closed_at).toLocaleTimeString()}
                      </span>
                    )}
                  </>
                ) : (
                  <Badge variant="warning">Sin sesión hoy</Badge>
                )}
              </div>
            </div>

            {/* Acciones (solo ADMIN / SUPER_ADMIN) */}
            {canManage && (
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                {!session || !isOpen ? (
                  <Button
                    variant="primary"
                    onClick={handleOpen}
                    loading={saving}
                    disabled={saving || (!!session && !isOpen)}
                  >
                    <PlayCircle size={16} className="mr-1" />
                    Abrir Sesión
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={handleClose}
                    loading={saving}
                    disabled={saving}
                  >
                    <StopCircle size={16} className="mr-1" />
                    Cerrar Sesión
                  </Button>
                )}
              </div>
            )}

            {!canManage && (
              <p className="text-sm text-slate-400 pt-2 border-t border-slate-100">
                Solo los administradores pueden abrir o cerrar la sesión.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
