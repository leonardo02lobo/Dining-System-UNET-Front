import { AlertCircle, Lock, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { authApi } from '../api/auth'
import type { ApiError, LoginCredentials } from '../types/auth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { UnetLogo } from '../components/ui/UnetLogo'

export function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const next: Partial<LoginCredentials> = {}
    if (!credentials.username.trim()) {
      next.username = 'El usuario o cédula es requerido'
    }
    if (!credentials.password) {
      next.password = 'La contraseña es requerida'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (!validate()) return

    setLoading(true)
    try {
      await authApi.login(credentials)
      window.location.href = "/"
    } catch (err) {
      const error = err as ApiError
      if (error.status === 401) {
        setApiError('Usuario o contraseña incorrectos')
      } else if (error.status === 0 || !error.status) {
        setApiError('No se pudo conectar con el servidor. Verifique su conexión.')
      } else {
        setApiError(error.message ?? 'Error inesperado. Intente nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-3 py-6 sm:px-4 sm:py-10">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#0d2147_0%,#1e3a6e_30%,#2d5aa0_60%,#4a7fd4_85%,#6fa3e0_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(14,32,64,0.15)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_20%,rgba(74,127,212,0.3)_0%,transparent_60%),radial-gradient(ellipse_40%_35%_at_10%_80%,rgba(21,43,84,0.5)_0%,transparent_55%)]" />

      <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center gap-6">
        <div className="flex w-full items-center gap-3 sm:gap-4">
          <div className="h-px flex-1 bg-white/25" />
          <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
            Sistema de Comedor Universitario
          </span>
          <div className="h-px flex-1 bg-white/25" />
        </div>

        <Card variant="elevated" padding="none" className="w-full overflow-visible">
          <div className="relative flex items-center gap-4 rounded-t-2xl bg-gradient-to-r from-slate-950 to-blue-950 px-6 py-7 sm:px-7">
            <UnetLogo />
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold tracking-tight text-white">
                Iniciar Sesión
              </span>
              <span className="text-xs text-white/65">
                Accede con tus credenciales universitarias
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-600" />
          </div>

          <form className="flex flex-col gap-4 p-6 sm:p-7" onSubmit={handleSubmit} noValidate>
            {apiError && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium leading-6 text-red-600" role="alert">
                <AlertCircle size={16} className="mt-px flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <Input
              id="username"
              label="Usuario / Cédula"
              type="text"
              placeholder="Ej: V-12345678"
              autoComplete="username"
              autoFocus
              fullWidth
              leftIcon={<User size={16} />}
              value={credentials.username}
              onChange={(e) => {
                setCredentials((c) => ({ ...c, username: e.target.value }))
                if (errors.username)
                  setErrors((er) => ({ ...er, username: undefined }))
              }}
              error={errors.username}
            />

            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              fullWidth
              leftIcon={<Lock size={16} />}
              value={credentials.password}
              onChange={(e) => {
                setCredentials((c) => ({ ...c, password: e.target.value }))
                if (errors.password)
                  setErrors((er) => ({ ...er, password: undefined }))
              }}
              error={errors.password}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Iniciar Sesión
            </Button>

            <div className="-mt-1 text-center">
              <a
                href="#"
                className="text-xs text-slate-500 transition hover:text-slate-700"
                onClick={(e) => e.preventDefault()}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </Card>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/55">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Estudiantes de pregrado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Personal administrativo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Personal docente</span>
          </div>
        </div>
      </div>
    </main>
  )
}
