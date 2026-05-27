import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({ size = 'md', className = '', label = 'Cargando...' }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} role="status">
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      <span className="sr-only">{label}</span>
    </span>
  )
}
