import { Search } from 'lucide-react'
import { forwardRef, useCallback, useEffect, useRef, type InputHTMLAttributes } from 'react'
import { Spinner } from './Spinner'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
  debounceMs?: number
  loading?: boolean
  fullWidth?: boolean
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, debounceMs = 0, loading = false, fullWidth = false, className = '', onChange, ...props }, ref) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e)
        if (!onSearch) return
        if (timerRef.current) clearTimeout(timerRef.current)
        if (debounceMs > 0) {
          timerRef.current = setTimeout(() => onSearch(e.target.value), debounceMs)
        } else {
          onSearch(e.target.value)
        }
      },
      [onChange, onSearch, debounceMs]
    )

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

    return (
      <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? <Spinner size="sm" /> : <Search size={16} />}
        </span>
        <input
          ref={ref}
          type="text"
          className={[
            'h-10 rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
            fullWidth ? 'w-full' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          onChange={handleChange}
          {...props}
        />
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
