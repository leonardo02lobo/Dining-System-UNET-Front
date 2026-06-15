import { useState } from "react";
import { Smile } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:  'Super Administrador',
  ADMIN:        'Administrador',
  TAQUILLERO:   'Taquillero',
  BENEFICIARIO: 'Beneficiario',
}

interface Props {
  isLogin?: boolean;
}
export function Header({isLogin}: Props) {
  const [date] = useState(new Date())
  const { user } = useAuth()
  const styles = isLogin
    ? "flex-shrink-0 border-b bg-gradient-to-b from-[#03216A] via-[#7D8EB7] to-[#EBEFF4] p-4"
    : "flex-shrink-0 border-b bg-gradient-to-b from-[#03216A] to-[#7D8EB7] p-4"
  return (
    <header className={styles}>
      <div className="flex items-center justify-between px-6 py-3 bg-white rounded-2xl">
        <div className="flex items-center gap-4">
          <img
            src="assets/logo-unet.png"
            alt="UNET"
            className="h-36 w-36 object-contain"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold leading-tight text-slate-800">
              UNIVERSIDAD NACIONAL EXPERIMENTAL DEL TÁCHIRA
            </span>
            <span className="text-xl font-bold leading-tight text-slate-800">
              VICERRECTORADO ACADEMICO
            </span>
            <span className="text-xl font-bold leading-tight text-slate-800">
              DECANATO DE DESARROLLO ESTUDIANTIL
            </span>
          </div>
        </div>
        <div className="hidden flex-col items-end gap-1 md:flex">
          <img
            src="assets/LOGO DECANATO.png"
            alt="Decanato de Orlando Student"
            className="h-36 w-96 object-contain"
          />
          <span className="text-[10px] text-slate-400">Decanato</span>
        </div>
      </div>
      {
        isLogin && (
          <div className="flex flex-row gap-1 font-bold justify-end p-3 text-xl sm:text-sm">
            <span>Hola {user?.name ?? '...'}</span>
            <Smile size={24} className="text-slate-600" />
            <span>, Bienvenid@ a la sección para {user ? ROLE_LABEL[user.role.name] ?? user.role.name : ''} - </span>
            <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
          </div>
        )
      }
    </header>
  )
}
