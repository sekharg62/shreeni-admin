import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../../lib/cn'

type CopyCellProps = {
  /** The text that gets copied (defaults to the visible text). */
  value: string
  /** Optional label to show instead of the raw value. */
  label?: string
  className?: string
}

export default function CopyCell({ value, label, className }: CopyCellProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Fallback for insecure contexts / older browsers
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Click to copy"
      className={cn(
        'group inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-gray-100',
        className,
      )}
    >
      <span className="truncate">{label ?? value}</span>
      {copied ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
          <Check className="h-3.5 w-3.5" />
          Copied!
        </span>
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  )
}
