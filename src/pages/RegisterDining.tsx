import { useEffect, useRef, useState } from 'react'
import { Input } from '../components/ui/Input'

const MIN_SCAN_LENGTH = 6
const MAX_GAP_MS = 60

export function RegisterDining() {
    const [studentId, setStudentId] = useState('')
    const [scanStatus, setScanStatus] = useState('Esperando lectura del carnet...')
    const lastKeyAtRef = useRef(0)
    const bufferRef = useRef('')

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.altKey || event.metaKey) return

            const now = Date.now()
            const elapsed = now - lastKeyAtRef.current

            if (elapsed > MAX_GAP_MS) {
                bufferRef.current = ''
            }

            if (event.key === 'Enter') {
                const scannedValue = bufferRef.current.trim()
                if (scannedValue.length >= MIN_SCAN_LENGTH) {
                    setStudentId(scannedValue)
                    setScanStatus(`Carnet leído: ${scannedValue}`)
                }
                bufferRef.current = ''
                lastKeyAtRef.current = now
                return
            }

            if (event.key.length === 1) {
                bufferRef.current += event.key
                lastKeyAtRef.current = now
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    return (
        <div className="space-y-6">
            <span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
                Registro de comedor
            </span>

            <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-slate-100">Lectura de carnet</h2>
                <p className="text-sm text-slate-300">
                    Pasa el carnet por el lector. Cuando el lector envíe el código y Enter, el campo se llena
                    automáticamente.
                </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <Input
                    id="student-id"
                    label="Carnet"
                    placeholder="Escanea o escribe el carnet"
                    value={studentId}
                    onChange={(event) => setStudentId(event.target.value)}
                    fullWidth
                />

                <p className="mt-3 text-sm text-emerald-200">{scanStatus}</p>
            </section>
        </div>
    )
}