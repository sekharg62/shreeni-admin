import { useId, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
}

export default function Checkbox({
  label,
  id,
  className,
  checked,
  ...props
}: CheckboxProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <label
      htmlFor={inputId}
      className="inline-flex cursor-pointer items-center gap-2 select-none"
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            'h-5 w-5 rounded-md border border-gray-300 bg-white transition-colors peer-checked:border-gray-900 peer-checked:bg-gray-900 peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900/20',
            className,
          )}
        />
        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
      </span>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}
