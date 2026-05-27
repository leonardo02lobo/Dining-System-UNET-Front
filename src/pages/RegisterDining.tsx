import { useEffect, useRef, useState } from 'react'
import { ScanLine } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'

const MIN_SCAN_LENGTH = 6
const MAX_GAP_MS = 60

export function RegisterDining() {
  const [studentId, setStudentId] = useState('')
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [scanMessage, setScanMessage] = useState('Esperando lectura del carnet...')
  const lastKeyAtRef = useRef(0)
  const bufferRef    = useRef('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return

      const now     = Date.now()
      const elapsed = now - lastKeyAtRef.current

      if (elapsed > MAX_GAP_MS) {
        bufferRef.current = ''
      }

      if (event.key === 'Enter') {
        const scannedValue = bufferRef.current.trim()
        if (scannedValue.length >= MIN_SCAN_LENGTH) {
          setStudentId(scannedValue)
          setScanStatus('success')
          setScanMessage(`Carnet leído correctamente: ${scannedValue}`)
        } else if (scannedValue.length > 0) {
          setScanStatus('error')
          setScanMessage(`Código muy corto (${scannedValue.length} caracteres). Mínimo ${MIN_SCAN_LENGTH}.`)
        }
        bufferRef.current    = ''
        lastKeyAtRef.current = now
        return
      }

      if (event.key.length === 1) {
        bufferRef.current    += event.key
        lastKeyAtRef.current  = now
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div>
      <PageHeader
        title="Registrar Comedor"
        subtitle="Pasa el carnet por el lector de código de barras"
      />

      <div className="mx-auto max-w-lg">
        <Card variant="outlined" padding="lg">
          <div className="flex flex-col items-center gap-6">
            {/* Ícono de escáner */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ScanLine size={40} />
            </div>

            <div className="w-full space-y-3">
              <Input
                id="student-id"
                label="Carnet / Cédula"
                placeholder="Escanea o escribe el carnet"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                fullWidth
              />

              {/* Estado del escaneo */}
              <div className="flex items-center gap-2">
                {scanStatus === 'idle' && (
                  <Badge variant="neutral">{scanMessage}</Badge>
                )}
                {scanStatus === 'success' && (
                  <Badge variant="success">{scanMessage}</Badge>
                )}
                {scanStatus === 'error' && (
                  <Badge variant="danger">{scanMessage}</Badge>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-slate-400">
              El lector enviará el código y presionará Enter automáticamente.
              El campo se llena solo al detectar el escaneo.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
