interface AvatarProps {
  name?: string
  src?: string
  shape?: 'circle' | 'rounded' | 'square'
  className?: string
}

const shapeClasses = {
  circle:  'rounded-full',
  rounded: 'rounded-lg',
  square: 'rounded-none',
}

export function Avatar({ name, src, shape = 'circle', className = '' }: AvatarProps) {
  return (
    <div
      className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden bg-slate-200 h-80 w-80 text-4xl ${shapeClasses[shape]} ${className}`}
      title={name}
    >
      {src ? (
        <img alt={name ?? 'Usuario'} src={src} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="select-none font-semibold text-slate-500">{name ? name[0].toUpperCase() : '?'}</span>
      )}
    </div>
  )
}
