import { useEffect, useState } from 'react'
import { Save, Search, Mail } from 'lucide-react'
import { emailTemplateApi } from '../api/emailTemplate'
import { accesoDirectoApi } from '../api/acceso_directo'
import type { AccesoDirecto } from '../types/acceso_directo'
import { normalizeCedula } from '../utils/cedula'
import { notify } from '../utils/toast'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'

export function EmailTemplatePage() {
  // ── Plantilla del correo ──────────────────────────────────────────
  const [subject,      setSubject]      = useState('')
  const [body,         setBody]         = useState('')
  const [placeholders, setPlaceholders] = useState<string[]>([])
  const [loadingTpl,   setLoadingTpl]   = useState(true)
  const [savingTpl,    setSavingTpl]    = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const tpl = await emailTemplateApi.getSanction()
        setSubject(tpl.subject)
        setBody(tpl.body)
        setPlaceholders(tpl.placeholders ?? [])
      } catch (err: any) {
        notify.error(err.message ?? 'Error al cargar la plantilla')
      } finally {
        setLoadingTpl(false)
      }
    })()
  }, [])

  function insertPlaceholder(token: string) {
    setBody((prev) => (prev.endsWith(' ') || prev === '' ? prev : prev + ' ') + token)
  }

  async function handleSaveTemplate() {
    if (!subject.trim() || !body.trim()) {
      notify.error('El asunto y el cuerpo no pueden estar vacíos.')
      return
    }
    setSavingTpl(true)
    try {
      await emailTemplateApi.updateSanction({ subject, body })
      notify.success('Plantilla guardada correctamente.')
    } catch (err: any) {
      notify.error(err.message ?? 'Error al guardar la plantilla')
    } finally {
      setSavingTpl(false)
    }
  }

  // ── Correo del beneficiario a suspender ───────────────────────────
  const [cedula,      setCedula]      = useState('')
  const [searching,   setSearching]   = useState(false)
  const [person,      setPerson]      = useState<AccesoDirecto | null>(null)
  const [email,       setEmail]       = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  async function handleSearchPerson() {
    const clean = normalizeCedula(cedula)
    if (!clean) return
    setSearching(true)
    setPerson(null)
    try {
      const ad = await accesoDirectoApi.lookup(clean)
      setPerson(ad)
      setEmail(ad.email ?? '')
    } catch (err: any) {
      const msg = err?.status === 404
        ? 'No se encontró un acceso directo con esa cédula.'
        : (err?.message ?? 'Error al buscar la persona')
      notify.error(msg)
    } finally {
      setSearching(false)
    }
  }

  async function handleSaveEmail() {
    if (!person) return
    setSavingEmail(true)
    try {
      const updated = await accesoDirectoApi.update(person.id, { email: email.trim() || undefined })
      setPerson(updated)
      notify.success(`Correo actualizado para ${updated.first_name} ${updated.last_name}.`)
    } catch (err: any) {
      const msg = err?.status === 422
        ? 'El correo no tiene un formato válido.'
        : (err?.message ?? 'Error al guardar el correo')
      notify.error(msg)
    } finally {
      setSavingEmail(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Plantilla de Correo de Sanción"
        subtitle="Edita el correo automático de suspensión y gestiona el correo de la persona a suspender"
      />

      {/* ── Editor de plantilla ──────────────────────────────────── */}
      <Card variant="outlined" padding="lg" className="mb-6">
        <p className="mb-4 text-sm font-semibold text-slate-700">Plantilla del correo</p>

        {loadingTpl ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tpl-subject" className="text-[13px] font-semibold text-slate-900">
                Asunto
              </label>
              <Input
                id="tpl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="tpl-body" className="text-[13px] font-semibold text-slate-900">
                Cuerpo del mensaje
              </label>
              <textarea
                id="tpl-body"
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full resize-y rounded-md border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              />
            </div>

            {placeholders.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Marcadores disponibles (clic para insertar):</span>
                {placeholders.map((token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => insertPlaceholder(token)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    {token}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button
                variant="primary"
                leftIcon={<Save size={15} />}
                loading={savingTpl}
                onClick={handleSaveTemplate}
              >
                Guardar plantilla
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Correo del beneficiario a suspender ──────────────────── */}
      <Card variant="outlined" padding="lg">
        <p className="mb-1 text-sm font-semibold text-slate-700">Correo de la persona a suspender</p>
        <p className="mb-4 text-xs text-slate-500">
          Busca por cédula y registra o corrige el correo del acceso directo para que reciba la notificación de sanción.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 240 }}>
            <label htmlFor="ad-cedula" className="text-[13px] font-semibold text-slate-900">Cédula</label>
            <Input
              id="ad-cedula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSearchPerson() }}
              leftIcon={<Search size={16} />}
              placeholder="Ej. V12345678"
              fullWidth
            />
          </div>
          <Button variant="secondary" loading={searching} onClick={handleSearchPerson}>
            Buscar
          </Button>
        </div>

        {person && (
          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-500">Persona:</span>
              <span className="text-sm font-semibold text-slate-900">
                {person.first_name} {person.last_name}
              </span>
              <Badge variant="neutral">C.I. {person.document_id}</Badge>
              <Badge variant={person.status === 'SUSPENDED' ? 'danger' : 'success'}>
                {person.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 260 }}>
                <label htmlFor="ad-email" className="text-[13px] font-semibold text-slate-900">
                  Correo electrónico
                </label>
                <Input
                  id="ad-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail size={16} />}
                  placeholder="correo@dominio.com"
                  fullWidth
                />
              </div>
              <Button
                variant="primary"
                leftIcon={<Save size={15} />}
                loading={savingEmail}
                onClick={handleSaveEmail}
              >
                Guardar correo
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
