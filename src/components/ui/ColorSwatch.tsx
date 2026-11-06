import { cn } from '../../lib/cn'

/** A small round color preview. Shows a dashed ring when there's no color. */
export default function ColorSwatch({
  color,
  size = 'md',
  className,
}: {
  color: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5'
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block shrink-0 rounded-full',
        dim,
        color ? 'ring-1 ring-black/10' : 'border border-dashed border-gray-300',
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    />
  )
}
