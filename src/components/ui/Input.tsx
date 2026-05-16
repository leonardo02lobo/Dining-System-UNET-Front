import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './Input.module.css'

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
      styles.wrapper,
      fullWidth ? styles.fullWidth : '',
    ]
      .filter(Boolean)
      .join(' ')

    const inputClass = [
      styles.input,
      error ? styles.hasError : '',
      leftIcon ? styles.withLeftIcon : '',
      isPassword ? styles.withRightIcon : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={wrapperClass}>
        {label && (
          <label className={styles.label} htmlFor={id}>
            {label}
          </label>
        )}

        <div className={styles.inputWrapper}>
          {leftIcon && (
            <span className={styles.leftIcon}>{leftIcon}</span>
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
              className={styles.togglePassword}
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {error && (
          <span id={`${id}-error`} className={styles.error} role="alert">
            {error}
          </span>
        )}

        {hint && !error && (
          <span id={`${id}-hint`} className={styles.hint}>
            {hint}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
