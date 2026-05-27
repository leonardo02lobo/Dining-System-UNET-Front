import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN:       'Administrador',
  TAQUILLERO:  'Taquillero',
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('es-VE', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export function GreetingBar() {
  const { user } = useAuth()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!user) return null

  const roleName = ROLE_LABELS[user.role.name] ?? user.role.name

  return (
    <div className="flex-shrink-0 bg-blue-600 px-6 py-1.5 text-xs text-white">
      <span className="font-semibold">Hola {user.name}</span>
      <span className="mx-2 opacity-60">•</span>
      <span>Bienvenid@ a la sección para {roleName}</span>
      <span className="mx-2 opacity-60">•</span>
      <span>{formatDateTime(now)}</span>
    </div>
  )
}
