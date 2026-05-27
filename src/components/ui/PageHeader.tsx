import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumb?: string
  className?: string
}

export function PageHeader({ title, subtitle, actions, breadcrumb, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-6 flex items-start justify-between border-b border-slate-200 pb-4 ${className}`}>
      <div className="flex flex-col gap-0.5">
        {breadcrumb && (
          <p className="text-xs text-slate-400 uppercase tracking-wide">{breadcrumb}</p>
        )}
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
