import { HEX_COLOR_REGEX } from '../../lib/validators'

/** How a tag looks as a badge (tinted background in the tag's color). */
export default function TagPill({ name, color }: { name: string; color: string | null | undefined }) {
  const valid = color && HEX_COLOR_REGEX.test(color)
  // expand #abc → #aabbcc so we can append an alpha for the tint
  const hex = valid ? (color.length === 4 ? `#${[...color.slice(1)].map((c) => c + c).join('')}` : color) : null
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={
        hex
          ? { backgroundColor: `${hex}1a`, borderColor: `${hex}55`, color: hex }
          : { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', color: '#374151' }
      }
    >
      {name || 'Tag preview'}
    </span>
  )
}
