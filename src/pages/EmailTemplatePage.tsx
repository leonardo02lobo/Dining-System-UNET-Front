import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { emailSettingsApi, type EmailTemplateKey } from '../api/emailTemplate'
import { notify } from '../utils/toast'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { EmailTemplateEditor } from '../components/EmailTemplateEditor'

/** Pestañas del editor: una por clave de plantilla del backend. */
const TABS: { key: EmailTemplateKey; label: string; description: string }[] = [
  {
    key: 'sanction',
    label: 'Suspensión',
    description: 'Correo automático que se envía al usuario cuando se le suspende el acceso al comedor.',
  },
  {
    key: 'sanction_lift',
    label: 'Levantamiento de suspensión',
    description: 'Correo automático que se envía al usuario cuando se levanta su suspensión.',
  },
]

export function EmailTemplatePage() {
  // Pestaña activa. Cada una monta su propio editor, que carga su plantilla y su
  // juego de marcadores por clave.
  const [tab, setTab] = useState<EmailTemplateKey>('sanction')

  // ── Configuración del emisor y CC del correo (#5) ─────────────────
  // Es global a todos los correos, así que vive fuera de las pestañas: repetirla en
  // cada una sugeriría que se puede configurar un emisor distinto por plantilla.
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

  return (
    <div>
      <PageHeader
        title="Plantillas de Correo"
        subtitle="Edita los correos automáticos de suspensión y de levantamiento de suspensión"
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

      {/* ── Plantillas, una por pestaña ──────────────────────────── */}
      <Card variant="outlined" padding="lg" className="mb-6">
        <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-200">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={tab === key ? 'page' : undefined}
              className={[
                '-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition',
                tab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {TABS.filter((t) => t.key === tab).map(({ key, description }) => (
          // `key` fuerza el remontaje al cambiar de pestaña: cada plantilla arranca
          // con su propio contenido en lugar de heredar el texto de la anterior.
          <EmailTemplateEditor key={key} templateKey={key} description={description} />
        ))}
      </Card>
    </div>
  )
}
