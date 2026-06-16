import { logoDecanatoDataUri } from './logoDecanatoData'

export function LogoDecanato({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoDecanatoDataUri}
      alt="Decanato de Desarrollo Estudiantil"
      className={className}
    />
  )
}
