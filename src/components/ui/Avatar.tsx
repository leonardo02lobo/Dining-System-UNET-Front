interface AvatarProps {
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'rounded'
  className?: string
}

const sizeClasses = {
  sm:  'h-8 w-8 text-xs',
  md:  'h-10 w-10 text-sm',
  lg:  'h-14 w-14 text-base',
  xl:  'h-24 w-24 text-2xl',
}

const shapeClasses = {
  circle:  'rounded-full',
  rounded: 'rounded-lg',
}

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, size = 'md', shape = 'circle', className = '' }: AvatarProps) {
  return (
    <div
      className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden bg-slate-200 ${sizeClasses[size]} ${shapeClasses[shape]} ${className}`}
      title={name}
    >
      {/* Imagen sin src — placeholder visual */}
      <img
        alt={name ?? 'Usuario'}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Fallback con iniciales */}
      <span className="select-none font-semibold text-slate-500">
        {getInitials(name)}
      </span>
    </div>
  )
}
