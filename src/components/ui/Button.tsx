import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary:
      'bg-blue-600 text-white shadow-[0_2px_6px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:shadow-[0_4px_12px_rgba(37,99,235,0.35)] active:bg-blue-800',
    secondary:
      'border-2 border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  } as const

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-7 text-[15px]',
  } as const

  const classes = [
    'relative inline-flex items-center justify-center gap-2 rounded-md border border-transparent font-semibold whitespace-nowrap outline-none transition duration-200 ease-in-out focus-visible:ring-4 focus-visible:ring-blue-500/25 active:translate-y-px disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    loading ? 'cursor-not-allowed opacity-75' : '',
    disabled && !loading ? 'cursor-not-allowed opacity-45' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  )
}
