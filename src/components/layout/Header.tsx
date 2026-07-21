import { memo, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LogoUnet } from "../icons/LogoUnet";
import { LogoDecanato } from "../icons/LogoDecanato";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:  'Super Administrador',
  ADMIN:        'Administrador',
  TAQUILLERO:   'Taquillero',
  ACCESO_DIRECTO: 'Acceso Directo',
}

interface Props {
  isLogin?: boolean;
  /** Si se provee, muestra el botón de menú (hamburguesa) en móvil. */
  onMenuClick?: () => void;
}
function HeaderComponent({isLogin, onMenuClick}: Props) {
  const [date, setDate] = useState(new Date())
  useEffect(() => {
    const id = window.setInterval(() => setDate(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  const { user } = useAuth()
  const styles = isLogin
    ? "flex-shrink-0 border-b bg-gradient-to-b from-[#03216A] via-[#7D8EB7] to-[#EBEFF4] p-2 sm:p-4"
    : "flex-shrink-0 border-b bg-gradient-to-b from-[#03216A] to-[#7D8EB7] p-2 sm:p-4"
  return (
    <header className={styles}>
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="flex-shrink-0 rounded-md p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          )}
          <LogoUnet className={`h-14 w-14 flex-shrink-0 object-contain sm:h-24 sm:w-24 ${isLogin ? 'lg:h-16 lg:w-16' : 'lg:h-36 lg:w-36'}`} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-bold leading-tight text-slate-800 sm:text-xl lg:text-2xl">
              UNIVERSIDAD NACIONAL EXPERIMENTAL DEL TÁCHIRA
            </span>
            <span className="text-xs font-bold leading-tight text-slate-800 sm:text-base lg:text-xl">
              VICERRECTORADO ACADÉMICO
            </span>
            <span className="text-xs font-bold leading-tight text-slate-800 sm:text-base lg:text-xl">
              DECANATO DE DESARROLLO ESTUDIANTIL
            </span>
          </div>
        </div>
        <div className="hidden flex-shrink-0 flex-col items-end gap-1 md:flex">
          <LogoDecanato className={`h-20 w-48 object-contain ${isLogin ? 'lg:h-16 lg:w-40' : 'lg:h-36 lg:w-96'}`} />
          <span className="text-[10px] text-slate-500">Decanato</span>
        </div>
      </div>
      {
        isLogin && (
          <div className="flex items-center justify-end gap-1 p-2 text-xs font-bold sm:p-3 sm:text-sm">
            <span>
              Hola, {user?.name ?? '...'} · {user ? ROLE_LABEL[user.role.name] ?? user.role.name : ''} ·{' '}
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </span>
          </div>
        )
      }
    </header>
  )
}

export const Header = memo(HeaderComponent)
