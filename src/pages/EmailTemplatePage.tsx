import { useEffect, useState } from 'react'
import { Save, Search, Mail } from 'lucide-react'
import { emailTemplateApi, emailSettingsApi } from '../api/emailTemplate'
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

// Valores de ejemplo para la previsualización (aproxima el render del backend).
const PREVIEW_VALUES: Record<string, string> = {
  '{nombre}':       'Juan Pérez',
  '{cedula}':       'V-12345678',
  '{motivo}':       'Uso indebido del comedor',
  '{descripcion}':  'Se coló en la fila reiteradamente',
  '{fecha_inicio}': '01/07/2026',
  '{fecha_fin}':    '15/07/2026',
}

/** Sustituye los marcadores soportados por valores de ejemplo (réplica aproximada
 *  del render del backend: reemplazo literal, tolerante a llaves sueltas). */
function renderPreview(text: string, placeholders: string[]): string {
  let out = text
  for (const token of placeholders) {
    const value = PREVIEW_VALUES[token] ?? `«${token.slice(1, -1)}»`
    out = out.split(token).join(value)
  }
  return out
}

/** Marcadores con forma {...} presentes en el texto que no son soportados. */
function unsupportedMarkers(text: string, placeholders: string[]): string[] {
  const found = text.match(/\{[^}]+\}/g) ?? []
  const supported = new Set(placeholders)
  return [...new Set(found.filter((m) => !supported.has(m)))]
}

export function EmailTemplatePage() {
  // ── Plantilla del correo ──────────────────────────────────────────
  const [subject,      setSubject]      = useState('')
  const [body,         setBody]         = useState('')
  const [placeholders, setPlaceholders] = useState<string[]>([])
  const [loadingTpl,   setLoadingTpl]   = useState(true)
  const [savingTpl,    setSavingTpl]    = useState(false)

  // ── Configuración del emisor y CC del correo (#5) ─────────────────
  const [fromName,     setFromName]     = useState('')
  const [fromAddress,  setFromAddress]  = useState('')
  const [cc,           setCc]           = useState('')
  const [loadingCfg,   setLoadingCfg]   = useState(true)
  const [savingCfg,    setSavingCfg]    = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const cfg = await emailSettingsApi.get()
        setFromName(cfg.from_name ?? '')
        setFromAddress(cfg.from_address ?? '')
        setCc(cfg.cc ?? '')
      } catch (err: any) {
        notify.error(err.message ?? 'Error al cargar la configuración del correo')
      } finally {
        setLoadingCfg(false)
      }
    })()
  }, [])

  async function handleSaveSettings() {
    if (!fromName.trim() || !fromAddress.trim()) {
      notify.error('El nombre y el correo del emisor son obligatorios.')
      return
    }
    setSavingCfg(true)
    try {
      const saved = await emailSettingsApi.update({
        from_name: fromName.trim(),
        from_address: fromAddress.trim(),
        cc: cc.trim() || null,
      })
      setFromName(saved.from_name ?? '')
      setFromAddress(saved.from_address ?? '')
      setCc(saved.cc ?? '')
      notify.success('Configuración del correo guardada correctamente.')
    } catch (err: any) {
      notify.error(err.message ?? 'Error al guardar la configuración del correo')
    } finally {
      setSavingCfg(false)
    }
  }

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

  const unknownMarkers = unsupportedMarkers(`${subject}\n${body}`, placeholders)

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

      {/* ── Configuración del emisor y CC (#5) ───────────────────── */}
      <Card variant="outlined" padding="lg" className="mb-6">
        <p className="mb-4 text-sm font-semibold text-slate-700">Configuración del correo</p>

        {loadingCfg ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nombre del emisor"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Comedor UNET"
                fullWidth
              />
              <Input
                label="Correo del emisor"
                type="email"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="comedor@unet.edu.ve"
                fullWidth
              />
            </div>
            <Input
              label="Copias (CC)"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="correo1@unet.edu.ve, correo2@unet.edu.ve"
              hint="Separa varias direcciones con comas. Déjalo vacío si no quieres copias."
              fullWidth
            />
            <div className="flex justify-end">
              <Button leftIcon={<Save size={16} />} loading={savingCfg} onClick={handleSaveSettings}>
                Guardar configuración
              </Button>
            </div>
          </div>
        )}
      </Card>

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

            {unknownMarkers.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Marcadores no soportados (se enviarán tal cual, sin sustituir):{' '}
                <span className="font-mono">{unknownMarkers.join(', ')}</span>
              </div>
            )}

            {/* Previsualización con valores de ejemplo (aproximada). */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-slate-900">Previsualización</span>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Asunto</p>
                <p className="mb-4 text-sm font-medium text-slate-800">
                  {renderPreview(subject, placeholders) || '—'}
                </p>
                <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Cuerpo</p>
                <div className="whitespace-pre-wrap text-sm text-slate-700">
                  {renderPreview(body, placeholders) || '—'}
                </div>
              </div>
              <span className="text-xs text-slate-400">
                Aproximación con datos de ejemplo; el envío real usa los datos de la sanción.
              </span>
            </div>

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
