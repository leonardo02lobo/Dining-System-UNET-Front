import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { emailTemplateApi, type EmailTemplateKey } from '../api/emailTemplate'
import { notify } from '../utils/toast'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Spinner } from './ui/Spinner'

/**
 * Valores de ejemplo para la previsualización (aproxima el render del backend).
 * Cubre la unión de los marcadores de todas las plantillas; los que no aplican a la
 * plantilla abierta simplemente no aparecen en su lista.
 */
const PREVIEW_VALUES: Record<string, string> = {
  '{nombre}':              'Juan Pérez',
  '{cedula}':              'V-12345678',
  '{motivo}':              'Uso indebido del comedor',
  '{descripcion}':         'Se coló en la fila reiteradamente',
  '{fecha_inicio}':        '01/07/2026',
  '{fecha_fin}':           '15/07/2026',
  '{fecha_levantamiento}': '15/07/2026',
}

/** Sustituye los marcadores soportados por valores de ejemplo (réplica aproximada
 *  del render del backend: reemplazo literal, tolerante a llaves sueltas). */
export function renderPreview(text: string, placeholders: string[]): string {
  let out = text
  for (const token of placeholders) {
    const value = PREVIEW_VALUES[token] ?? `«${token.slice(1, -1)}»`
    out = out.split(token).join(value)
  }
  return out
}

/** Marcadores con forma {...} presentes en el texto que no son soportados. */
export function unsupportedMarkers(text: string, placeholders: string[]): string[] {
  const found = text.match(/\{[^}]+\}/g) ?? []
  const supported = new Set(placeholders)
  return [...new Set(found.filter((m) => !supported.has(m)))]
}

interface EmailTemplateEditorProps {
  /** Clave de la plantilla en el backend. Determina el juego de marcadores. */
  templateKey: EmailTemplateKey
  /** Descripción de cuándo se envía este correo, mostrada sobre el editor. */
  description: string
}

/**
 * Editor de una plantilla de correo, parametrizado por clave. Se extrajo de
 * `EmailTemplatePage` cuando dejó de haber una sola plantilla: duplicar el editor
 * habría duplicado también el detector de marcadores no soportados y la
 * previsualización, que son la parte con lógica.
 *
 * La lista de marcadores viene siempre del servidor; cablearla aquí la dejaría
 * desalineada en cuanto el contrato cambie.
 */
export function EmailTemplateEditor({ templateKey, description }: EmailTemplateEditorProps) {
  const [subject,      setSubject]      = useState('')
  const [body,         setBody]         = useState('')
  const [placeholders, setPlaceholders] = useState<string[]>([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const tpl = await emailTemplateApi.get(templateKey)
        // Una respuesta tardía de la pestaña anterior no debe pisar la actual.
        if (cancelled) return
        setSubject(tpl.subject)
        setBody(tpl.body)
        setPlaceholders(tpl.placeholders ?? [])
      } catch (err: any) {
        if (!cancelled) notify.error(err.message ?? 'Error al cargar la plantilla')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [templateKey])

  function insertPlaceholder(token: string) {
    setBody((prev) => (prev.endsWith(' ') || prev === '' ? prev : prev + ' ') + token)
  }

  const unknownMarkers = unsupportedMarkers(`${subject}\n${body}`, placeholders)

  async function handleSave() {
    if (!subject.trim() || !body.trim()) {
      notify.error('El asunto y el cuerpo no pueden estar vacíos.')
      return
    }
    setSaving(true)
    try {
      await emailTemplateApi.update(templateKey, { subject, body })
      notify.success('Plantilla guardada correctamente.')
    } catch (err: any) {
      notify.error(err.message ?? 'Error al guardar la plantilla')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">{description}</p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`tpl-subject-${templateKey}`} className="text-[13px] font-semibold text-slate-900">
          Asunto
        </label>
        <Input
          id={`tpl-subject-${templateKey}`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          fullWidth
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`tpl-body-${templateKey}`} className="text-[13px] font-semibold text-slate-900">
          Cuerpo del mensaje
        </label>
        <textarea
          id={`tpl-body-${templateKey}`}
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
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Asunto</p>
          <p className="mb-4 text-sm font-medium text-slate-800">
            {renderPreview(subject, placeholders) || '—'}
          </p>
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Cuerpo</p>
          <div className="whitespace-pre-wrap text-sm text-slate-700">
            {renderPreview(body, placeholders) || '—'}
          </div>
        </div>
        <span className="text-xs text-slate-500">
          Aproximación con datos de ejemplo; el envío real usa los datos de la sanción.
        </span>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <Button
          variant="primary"
          leftIcon={<Save size={15} />}
          loading={saving}
          onClick={handleSave}
        >
          Guardar plantilla
        </Button>
      </div>
    </div>
  )
}
