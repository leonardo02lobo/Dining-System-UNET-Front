import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: ReactNode
}

function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'shadow-md',
    elevated: 'shadow-lg',
    outlined: 'border border-slate-200 shadow-none',
  } as const

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-5 sm:p-9',
  } as const

  const classes = [
    'overflow-hidden rounded-2xl bg-white',
    variantClasses[variant],
    paddingClasses[padding],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

function CardHeader({ title, subtitle, action, children, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={['mb-5 flex items-start justify-between gap-4 border-b border-slate-200 pb-5', className ?? ''].join(' ')}
      {...props}
    >
      {(title || subtitle) ? (
        <div className="min-w-0 flex-1">
          {title && <h2 className="text-lg font-bold leading-tight text-slate-900">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      ) : children}
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className ?? ''} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['mt-5 flex items-center gap-3 border-t border-slate-200 pt-5', className ?? ''].join(' ')} {...props}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export { Card }
