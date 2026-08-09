import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
  /**
   * Al cambiar de valor se descarta el error y se vuelve a intentar el render.
   * Se le pasa la ruta actual: sin esto, una pantalla que reventó dejaría el aviso
   * puesto para siempre y ni el menú serviría para salir de ahí.
   */
  resetKey?: string
  /** Etiqueta del ámbito que protege; solo se usa en el registro de consola. */
  scope?: string
}

interface ErrorBoundaryState {
  error: Error | null
  resetKey?: string
}

/**
 * Frontera de error de React.
 *
 * Sin una, cualquier excepción durante el render desmonta el árbol entero y en un
 * build de producción no queda rastro en la pantalla: el usuario ve una página
 * completamente en blanco y no hay nada que le diga qué pasó. Con esta, el fallo
 * queda acotado al ámbito que envuelve —el área de contenido, no la aplicación—,
 * se puede reintentar, y el error sale por consola para poder diagnosticarlo.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (state.resetKey !== props.resetKey) {
      return { error: null, resetKey: props.resetKey }
    }
    return null
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.scope ? `:${this.props.scope}` : ''}]`, error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state

    if (!error) return this.props.children

    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center p-4" role="alert">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-red-200 bg-white p-6 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="mt-0.5 flex-shrink-0 text-red-600" />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900">
                No se pudo mostrar esta pantalla
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Ocurrió un error inesperado al cargar la vista. Puede reintentar o elegir otra
                opción del menú; su sesión sigue abierta.
              </p>
              <p className="mt-3 break-words rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                {error.message || 'Error desconocido'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<RotateCcw size={14} />}
                  onClick={this.handleRetry}
                >
                  Reintentar
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                  Recargar la página
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
