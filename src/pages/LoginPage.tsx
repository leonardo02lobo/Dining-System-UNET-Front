import { AlertCircle, Lock, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { authApi } from '../api/auth'
import type { ApiError, LoginCredentials } from '../types/auth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { UnetLogo } from '../components/ui/UnetLogo'
import styles from './LoginPage.module.css'

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
      window.location.href = "/control"
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
    <main className={styles.page}>
      <div className={styles.background}>
        <div className={styles.backgroundOverlay} />
      </div>

      <div className={styles.content}>
        {/* Decorative campus strip */}
        <div className={styles.campusStrip}>
          <div className={styles.campusStripLine} />
          <span className={styles.campusStripText}>
            Sistema de Comedor Universitario
          </span>
          <div className={styles.campusStripLine} />
        </div>

        <Card variant="elevated" padding="none" className={styles.loginCard}>
          {/* Card header with brand */}
          <div className={styles.cardBrand}>
            <UnetLogo />
            <div className={styles.cardBrandText}>
              <span className={styles.cardBrandTitle}>Iniciar Sesión</span>
              <span className={styles.cardBrandSub}>
                Accede con tus credenciales universitarias
              </span>
            </div>
          </div>

          {/* Form body */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {apiError && (
              <div className={styles.alert} role="alert">
                <AlertCircle size={16} className={styles.alertIcon} />
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
            >
              Iniciar Sesión
            </Button>

            <div className={styles.forgotLink}>
              <a href="#" onClick={(e) => e.preventDefault()}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </Card>

        {/* Info badges */}
        <div className={styles.infoBadges}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span>Estudiantes de pregrado</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span>Personal administrativo</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span>Personal docente</span>
          </div>
        </div>
      </div>
    </main>
  )
}
