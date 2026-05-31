import type { ReactNode } from 'react'

interface SummaryStatCardProps {
  icon: ReactNode
  label: string
  value: string | number
}

export function SummaryStatCard({ icon, label, value }: SummaryStatCardProps) {
  return (
    <div className="flex h-[54px] items-center gap-3 rounded-[10px] bg-white px-2">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-slate-700">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-slate-800">{label}</p>
        <p className="text-base font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
