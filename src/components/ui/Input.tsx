import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, fullWidth = false, type, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    const wrapperClass = [
      'flex flex-col gap-1.5',
      fullWidth ? 'w-full' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const inputClass = [
      'h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60',
      error ? 'border-red-600 focus:border-red-600 focus:ring-red-500/15' : '',
      leftIcon ? 'pl-10' : '',
      isPassword ? 'pr-10' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={wrapperClass}>
        {label && (
          <label className="select-none text-[13px] font-semibold text-slate-900" htmlFor={id}>
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            type={inputType}
            className={inputClass}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {error && (
          <span id={`${id}-error`} className="flex items-center gap-1 text-xs text-red-600" role="alert">
            {error}
          </span>
        )}

        {hint && !error && (
          <span id={`${id}-hint`} className="text-xs text-slate-500">
            {hint}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
