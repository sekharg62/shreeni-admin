import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  id,
  type = 'text',
  className,
  ...props
}: InputProps) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && show ? 'text' : type

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex h-10 items-center gap-2 rounded-lg border bg-white px-3 transition-colors focus-within:ring-2',
          error
            ? 'border-red-400 focus-within:ring-red-100'
            : 'border-gray-300 focus-within:border-gray-900 focus-within:ring-gray-900/10',
        )}
      >
        {leftIcon && <span className="text-gray-400">{leftIcon}</span>}
        <input
          id={id}
          type={inputType}
          className={cn(
            'h-full w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="text-gray-400 transition-colors hover:text-gray-700"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  )
}
