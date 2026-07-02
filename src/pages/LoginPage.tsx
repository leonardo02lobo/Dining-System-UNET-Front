import { AlertCircle, Lock, User } from 'lucide-react'
import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import type { ApiError, LoginCredentials } from '../types/auth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Header } from '../components/layout/Header'

export function LoginPage() {
  const { user, loading: authLoading, refetch } = useAuth()
  const navigate = useNavigate()

  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirigir si ya tiene sesión activa
  if (!authLoading && user) return <Navigate to="/" replace />

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return

    setLoading(true)
    try {
      await authApi.login(credentials)
      await refetch()
      navigate('/')
    } catch (err) {
      const error = err as ApiError
      if (error.status === 401) {
        setApiError('Usuario o contraseña incorrectos')
      } else if (error.status === 403) {
        setApiError('Cuenta inactiva. Contacte al administrador.')
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
    <>
      <div className="fixed top-0 left-0 w-full z-10">
        <Header />
      </div>

      <div className="flex min-h-screen items-center justify-center bg-slate-50 pt-20">
        <div className="w-full max-w-sm">
          <Card variant="elevated" padding="none" className="overflow-hidden">
            <div className="flex flex-col items-center gap-3 border-b border-slate-100 bg-white px-8 py-7">
              <div className="text-center">
                <h1 className="text-lg font-bold text-slate-800">Sistema de Comedor</h1>
                <p className="text-xs text-slate-500">
                  Universidad Nacional Experimental del Táchira
                </p>
              </div>
            </div>

            {/* Formulario */}
            <form className="flex flex-col gap-4 bg-white px-8 py-6" onSubmit={handleSubmit} noValidate>
              {apiError && (
                <div
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium leading-6 text-red-600"
                  role="alert"
                >
                  <AlertCircle size={16} className="mt-px flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              <Input
                id="username"
                label="Correo Electrónico"
                type="email"
                placeholder="correo@dominio.com"
                autoComplete="email"
                autoFocus
                fullWidth
                leftIcon={<User size={16} />}
                value={credentials.username}
                onChange={(e) => {
                  setCredentials((c) => ({ ...c, username: e.target.value }))
                  if (errors.username) setErrors((er) => ({ ...er, username: undefined }))
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
                  if (errors.password) setErrors((er) => ({ ...er, password: undefined }))
                }}
                error={errors.password}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                rightIcon={<span className="text-lg">→</span>}
              >
                Iniciar Sesión
              </Button>
            </form>
          </Card>

          <p className="mt-4 text-center text-xs text-slate-400">
            Estudiantes · Personal administrativo · Personal docente
          </p>
        </div>
      </div>
    </>
  )
}
